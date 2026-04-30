import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword, generateTokens } from '@/lib/auth';
import { rateLimit } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting (Prevents heavy brute force/DDoS)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 10, 900000)) { // 10 attempts per 15 minutes
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
    }

    // 2. Extract payload, including the rememberMe flag from the frontend
    const { email, password, rememberMe = false } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await dbConnect();

    // 3. Find User
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Always return generic error to prevent email enumeration
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 4. Check Account Lockout Status
    if (user.lockUntil && user.lockUntil > new Date()) {
      const lockMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account temporarily locked. Try again in ${lockMinutes} minutes.` }, 
        { status: 403 }
      );
    }

    //Ensure user has password
    if (!user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials. If you signed up with a social provider, please use that to log in.' }, 
        { status: 401 });
    }

    // 5. Verify Password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
      }
      
      await user.save();
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 6. Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // 7. Generate Tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // 8. Create Response Object
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 200 });

    // 9. Attach Native Cookies
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Access token is always short-lived
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    // Refresh token lifespan depends on the "Remember Me" checkbox
    const refreshTokenMaxAge = rememberMe 
      ? 30 * 24 * 60 * 60 // 30 days
      : 24 * 60 * 60;     // 1 day

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: refreshTokenMaxAge,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, generateTokens } from '@/lib/auth';
import { validateEmail, validatePassword, sanitizeInput, rateLimit } from '@/lib/utils';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 5, 900000)) { // 5 requests per 15 minutes
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { name, email, password, phone } = await req.json();

    // 2. Basic Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
    }

    // 3. M-Pesa Phone Normalization (CRITICAL for Daraja API)
    let normalizedPhone = undefined;
    if (phone) {
      // Remove all spaces and dashes
      const sanitizedPhone = sanitizeInput(phone).replace(/[\s-]/g, '');
      
      // Ensure it's a valid Kenyan number, then format to 254...
      if (/^(?:254|\+254|0)?(7|1)\d{8}$/.test(sanitizedPhone)) {
         normalizedPhone = sanitizedPhone.replace(/^(?:\+254|0)?/, '254');
      } else {
         return NextResponse.json({ error: 'Invalid Kenyan phone number format' }, { status: 400 });
      }
    }

    await dbConnect();

    // 4. Check existing user (Email OR Phone)
    const existingUserQuery = normalizedPhone 
      ? { $or: [{ email: email.toLowerCase() }, { phone: normalizedPhone }] }
      : { email: email.toLowerCase() };
      
    // .lean() makes the query faster by returning a plain object
    const existing = await User.findOne(existingUserQuery).lean();
    
    if (existing) {
      if (existing.email === email.toLowerCase()) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Phone number is already registered to another account' }, { status: 409 });
    }

    // 5. Create user
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name: sanitizeInput(name),
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: normalizedPhone,
    });

    // 6. Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // 7 Create the response first, then attach cookies to it natively
    const response = NextResponse.json({
      message: 'Account created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 201 });

    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // 8. Send welcome email (fire-and-forget)
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    // 9. Return the response with the cookies attached
    return response;

  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during signup' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateTokens } from '@/lib/auth';
import { rateLimit } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!rateLimit(ip, 10, 900000)) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
    }

    const { email, password, rememberMe = false } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.partner.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const lockMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account temporarily locked. Try again in ${lockMinutes} minutes.` },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      const loginAttempts = user.loginAttempts + 1;
      await prisma.partner.update({
        where: { id: user.id },
        data: {
          loginAttempts,
          lockUntil:
            loginAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : user.lockUntil,
        },
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await prisma.partner.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockUntil: null, lastLogin: new Date() },
    });

    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: { _id: user.id, name: user.name, email: user.email, role: user.role },
      },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    const refreshTokenMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

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

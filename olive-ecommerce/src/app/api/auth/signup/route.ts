import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateTokens } from '@/lib/auth';
import { validateEmail, validatePassword, sanitizeInput, rateLimit } from '@/lib/utils';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!rateLimit(ip, 5, 900000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { name, email, password, phone } = await req.json();

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

    const normalizedPhone = phone ? sanitizeInput(phone).replace(/[\s-]/g, '') : undefined;

    const existing = await prisma.partner.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.email === email.toLowerCase()) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
      }
      return NextResponse.json(
        { error: 'Phone number is already registered to another account' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.partner.create({
      data: {
        name: sanitizeInput(name),
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: normalizedPhone,
      },
    });

    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        user: { _id: user.id, name: user.name, email: user.email, role: user.role },
      },
      { status: 201 }
    );

    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    sendWelcomeEmail(user.email, user.name).catch(console.error);

    return response;
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during signup' }, { status: 500 });
  }
}

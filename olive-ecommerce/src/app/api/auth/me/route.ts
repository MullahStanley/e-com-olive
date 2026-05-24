import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUser = await getAuthUser();

    if (!authUser?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.partner.findUnique({
      where: { id: authUser.userId },
      select: { id: true, name: true, email: true, role: true, phone: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User profile no longer exists' }, { status: 404 });
    }

    return NextResponse.json(
      {
        user: {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone ?? undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while verifying your session' },
      { status: 500 }
    );
  }
}

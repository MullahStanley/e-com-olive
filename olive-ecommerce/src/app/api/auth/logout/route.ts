import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 1. Create the response object first
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === 'production';

    // 2. "Delete" the access token by setting maxAge to 0
    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 0, // This tells the browser to instantly delete it
      path: '/',
    });

    // 3. "Delete" the refresh token
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    // 4. Return the modified response
    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during logout' },
      { status: 500 }
    );
  }
}
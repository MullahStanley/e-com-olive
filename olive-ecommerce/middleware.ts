import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Ensure the secret is available and encoded for the Edge runtime
const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname, search } = request.nextUrl;

  // Preserve the full URL (including query strings like ?step=2) for the redirect
  const currentPath = encodeURIComponent(`${pathname}${search}`);

  const isAdminRoute = pathname.startsWith('/admin');
  const isProtectedRoute = pathname.startsWith('/checkout') || pathname.startsWith('/orders');

  // 1. If no token is present, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL(`/login?redirect=${currentPath}`, request.url));
  }

  try {
    // 2. Verify token using 'jose' (Edge-compatible)
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    
    const { payload } = await jwtVerify(token, secretKey);

    // 3. Admin Route Protection
    if (isAdminRoute && payload.role !== 'admin') {
      // User is authenticated, but not an admin. Send them to the homepage.
      return NextResponse.redirect(new URL('/', request.url));
    }

    // If verification passes and roles are correct, proceed!
    return NextResponse.next();

  } catch (error) {
    // 4. Token is invalid or expired
    // Clear the bad cookie by expiring it, and force a new login
    const response = NextResponse.redirect(new URL(`/login?redirect=${currentPath}`, request.url));
    response.cookies.set('accessToken', '', { maxAge: 0 });
    response.cookies.set('refreshToken', '', { maxAge: 0 });
    return response;
  }
}

// Keep your matcher as-is; it's perfectly configured
export const config = {
  matcher: ['/admin/:path*', '/checkout/:path*', '/orders/:path*'],
};
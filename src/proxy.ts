import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /dashboard routes and /admin routes (except /admin/login)
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';

  if (isDashboardRoute || isAdminRoute) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.set('admin_token', '', { path: '/', maxAge: 0 });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/dashboard', '/admin/:path*'],
};

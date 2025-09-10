import { NextResponse } from 'next/server';
import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    const isLoggedIn = !!token;
    const userRole = token?.role;

    // CORS headers for API routes
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response;
    }

    // Redirect logic for authenticated users
    if (isLoggedIn && pathname === '/') {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      if (userRole === 'seller') {
        return NextResponse.redirect(new URL('/seller/dashboard', req.url));
      }
    }

    // Role-based access control
    if (isLoggedIn && userRole === 'admin' && pathname.startsWith('/seller')) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    if (isLoggedIn && userRole === 'seller' && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/seller/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow API routes without authentication check here
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return true;
        }
        return !!token;
      },
    },
  }
);

// Optimize matcher for better performance
export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/seller/:path*',
    '/api/:path*',
  ],
};
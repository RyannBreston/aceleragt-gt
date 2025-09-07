import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import type { NextRequest } from 'next/server';

export default withAuth(
  // `withAuth` aprimora o seu `Request` com o token do utilizador.
  function middleware(req: NextRequest & { nextauth: { token: { role?: string | null } } }) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    const isLoggedIn = !!token;
    const userRole = token?.role;

    // Se o utilizador for admin e tentar aceder a uma rota de vendedor, redireciona para o dashboard de admin
    if (isLoggedIn && userRole === 'admin' && pathname.startsWith('/seller')) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    // Se o utilizador for vendedor e tentar aceder a uma rota de admin, redireciona para o dashboard de vendedor
    if (isLoggedIn && userRole === 'seller' && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/seller/dashboard', req.url));
    }

    // Se o utilizador não estiver logado e tentar aceder a uma rota protegida,
    // o `withAuth` já o redireciona para a página de login definida nas `authOptions`.
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Retorna true se o token existir (utilizador logado)
    },
  }
);

// Define quais as rotas que serão protegidas pelo middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/seller/:path*',
  ],
};
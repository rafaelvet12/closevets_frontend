import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Coloque aqui a sua lógica de verificação de token/sessão se houver
  const token = request.cookies.get('token')?.value; // Exemplo de cookie

  // Se for a rota de login ou páginas públicas, deixa passar
  const url = request.nextUrl.pathname;
  if (url.startsWith('/login') || url.startsWith('/api')) {
    return NextResponse.next();
  }

  // Exemplo básico de proteção
  // if (!token && url.startsWith('/dashboard')) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  return NextResponse.next();
}

// Configuração crucial para o Next.js não quebrar os túneis e arquivos internos:
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - hmr (WebSocket / Hot Module Replacement)
     */
    '/((?!_next/static|_next/image|_next/hmr|favicon.ico).*)',
  ],
};
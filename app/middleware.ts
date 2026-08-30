import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Coloque aqui a sua lógica de verificação de token/sessão se houver
  const token = request.cookies.get('token')?.value; // Exemplo de cookie

  // Se for a rota de login (raiz) ou páginas públicas, deixa passar
  const url = request.nextUrl.pathname;
  if (url === '/' || url.startsWith('/api')) {
    return NextResponse.next();
  }

  // Proteção real hoje é feita no layout.tsx (client-side, via localStorage),
  // já que o token não fica salvo em cookie. Se migrar para cookie no futuro,
  // pode reativar a checagem abaixo:
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
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy d'authentification global (Next.js 16 — remplace middleware.ts).
 * - Redirige vers la page de connexion si l'utilisateur n'est pas connecté.
 * - L'API extension (/api/extension) est protégée via token, pas via session.
 * - Proxy tourne en Node.js runtime (par défaut en v16) → Prisma/pg compatibles.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Routes publiques exclues de la protection
  const publicPaths = ['/', '/api/auth', '/api/extension']
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  const session = await auth()
  const isLoggedIn = !!session?.user?.id

  if (!isPublicPath && !isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Si connecté et sur la page de connexion → rediriger vers le dashboard
  if (pathname === '/' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { locales, defaultLocale } from './i18n'

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip ALL processing for static files and API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Skip auth for login/auth/public pages (prevent redirect loop)
  const isPublicPage = /^\/(th|en)\/(login|auth)/.test(pathname) ||
                       pathname === '/login' ||
                       pathname === '/th' ||
                       pathname === '/en' ||
                       pathname.startsWith('/demo')

  if (isPublicPage) {
    return NextResponse.next()
  }

  // For protected routes, run updateSession (handles auth + role redirect)
  return await updateSession(request)
}

export const config = {
  matcher: ['/', '/(th|en)/:path*', '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)']
}

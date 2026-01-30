import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export default async function middleware(request: NextRequest) {
  // Update the Supabase session
  return await updateSession(request)
}

export const config = {
  // Match only internationalized pathnames and exclude internal Next.js paths
  matcher: ['/', '/(th|en)/:path*', '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}

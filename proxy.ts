import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { createClient } from './lib/supabase/server'
import { locales, defaultLocale } from './i18n'

// Role-based route access control
const ROUTE_PERMISSIONS = {
  '/clinic/staff': ['clinic_owner', 'clinic_admin'],
  '/clinic/inventory': ['clinic_owner', 'clinic_admin', 'clinic_staff'],
  '/clinic/treatments': ['clinic_owner', 'clinic_admin', 'clinic_staff'],
  '/clinic/settings': ['clinic_owner'],
  '/sales': ['clinic_owner', 'sales_staff'],
  '/sales/analysis': ['sales_staff'],
  '/sales/leads': ['clinic_owner', 'sales_staff'],
  '/sales/proposals': ['clinic_owner', 'sales_staff'],
}

// i18n: ตรวจสอบว่า locale ถูกต้อง
function getLocale(request: NextRequest): string {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split('/');
  const locale = segments[1];

  if (locales.includes(locale as any)) {
    return locale;
  }
  return defaultLocale;
}

export default async function proxy(request: NextRequest) {
  // First, update the Supabase session
  const response = await updateSession(request)
  
  // Skip role check for public routes, API routes, and assets
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/demo') ||
    pathname.includes('.') ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/th' ||
    pathname === '/en'
  ) {
    return response
  }

  // Extract route pattern (remove locale prefix)
  const routePattern = pathname.replace(/^\/(?:th|en)/, '') || '/'
  
  // Check if this route requires specific permissions
  const requiredRoles = Object.entries(ROUTE_PERMISSIONS).find(([route]) => 
    routePattern.startsWith(route)
  )?.[1]

  if (!requiredRoles) {
    return response // No specific permissions required
  }

  try {
    // Get user session and role
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // Redirect to login if not authenticated
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Get user's clinic role
    const { data: staffData } = await supabase
      .from('clinic_staff')
      .select('role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    const userRole = staffData?.role || 'customer'

    // Check if user has required role
    if (!requiredRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      let redirectPath = '/demo' // Default fallback
      
      if (userRole === 'sales_staff') {
        redirectPath = '/sales'
      } else if (['clinic_owner', 'clinic_admin', 'clinic_staff'].includes(userRole)) {
        redirectPath = '/clinic'
      }

      const redirectUrl = new URL(redirectPath, request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('Middleware role check error:', error)
    // On error, redirect to login
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  // Match only internationalized pathnames and exclude internal Next.js paths
  matcher: ['/', '/(th|en)/:path*', '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}

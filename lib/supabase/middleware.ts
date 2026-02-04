import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define route access rules (matching the logic from layout.tsx)
const ROUTE_ACCESS_RULES = {
  '/admin': ['super_admin'],
  '/clinic': ['clinic_owner', 'clinic_admin', 'clinic_staff'],
  '/sales': ['sales_staff'],
  '/beautician': ['clinic_staff'],
  '/customer': ['customer', 'premium_customer', 'free_customer', 'free_user'],
  // Shared routes with cross-role access
  '/shared/chat': ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff', 'customer', 'premium_customer', 'free_customer', 'free_user'],
  '/clinic/pos': ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff'],
  '/clinic/appointments': ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff', 'customer', 'premium_customer', 'free_customer', 'free_user'],
  '/clinic/chat': ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff', 'customer', 'premium_customer', 'free_customer', 'free_user']
};

// Get user role from database
async function getUserRole(supabase: any, userId: string): Promise<string | null> {
  try {
    // First check users table for role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (userData?.role === 'super_admin') {
      return 'super_admin';
    }
    
    // Then check clinic_staff for clinic roles
    const { data: staffData } = await supabase
      .from('clinic_staff')
      .select('role')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .single();
    
    return staffData?.role || userData?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

// Check if user has access to specific route
function hasRouteAccess(pathname: string, userRole: string): boolean {
  // Remove locale prefix for matching
  const routePath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');
  
  // Check specific route rules first (more specific routes first)
  const sortedRoutes = Object.keys(ROUTE_ACCESS_RULES).sort((a, b) => b.length - a.length);
  
  for (const route of sortedRoutes) {
    if (routePath.startsWith(route)) {
      return ROUTE_ACCESS_RULES[route as keyof typeof ROUTE_ACCESS_RULES].includes(userRole);
    }
  }
  
  // Default: allow access if no specific rule found
  return true;
}

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set({ name, value, ...options }))
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake can make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = pathname.startsWith('/login') || 
                       pathname.startsWith('/auth') ||
                       pathname === '/' ||
                       pathname.match(/^\/[a-z]{2}\/(login|auth)/) || // locale-prefixed auth routes
                       pathname.startsWith('/api/auth') ||
                       pathname.startsWith('/_next') ||
                       pathname.startsWith('/favicon') ||
                       pathname.startsWith('/api/') || // Allow API routes
                       pathname.match(/^\/[a-z]{2}$/) || // Allow bare locale routes like /th
                       pathname.startsWith('/static/');

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    // Extract locale from pathname
    const localeMatch = pathname.match(/^\/(\w{2})(\/.*)?$/);
    const locale = localeMatch ? localeMatch[1] : 'th';
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  // Skip role checks for unauthenticated users or public routes
  if (!user || isPublicRoute) {
    return supabaseResponse;
  }

  // Get user role and check route access
  const userRole = await getUserRole(supabase, user.id);
  
  if (!userRole) {
    // User has no role assigned, redirect to login
    const url = request.nextUrl.clone();
    const localeMatch = pathname.match(/^\/(\w{2})(\/.*)?$/);
    const locale = localeMatch ? localeMatch[1] : 'th';
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  // Check if user has access to the requested route
  if (!hasRouteAccess(pathname, userRole)) {
    const url = request.nextUrl.clone();
    const localeMatch = pathname.match(/^\/(\w{2})(\/.*)?$/);
    const locale = localeMatch ? localeMatch[1] : 'th';
    
    // Redirect to appropriate dashboard based on role
    switch (userRole) {
      case 'super_admin':
        url.pathname = `/${locale}/admin`;
        break;
      case 'clinic_owner':
      case 'clinic_admin':
      case 'clinic_staff':
        url.pathname = `/${locale}/clinic`;
        break;
      case 'sales_staff':
        url.pathname = `/${locale}/sales`;
        break;
      case 'customer':
      case 'premium_customer':
      case 'free_customer':
      case 'free_user':
        url.pathname = `/${locale}/customer`;
        break;
      default:
        url.pathname = `/${locale}/login`;
    }
    
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally: return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

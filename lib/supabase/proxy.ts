// lib/supabase/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => 
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user claims
  const { data: claims } = await supabase.auth.getClaims()
  const user = claims?.claims

  // Path checks
  const isPublicPath = 
    request.nextUrl.pathname.startsWith('/signin') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname === '/'

  // 1. Redirect non-authenticated users to signin (except public paths)
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // 2. Check admin access for /admin routes
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    try {
      // Get user profile with admin role check
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.sub) // user.sub is the user ID
        .single()

      // If no profile or not admin, redirect to home
      if (error || !profile || profile.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/home'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('Admin check error:', error)
      // If error, redirect to home for safety
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }
  }

  // 3. If user is logged in and tries to access signin, redirect to home
  if (user && request.nextUrl.pathname.startsWith('/signin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
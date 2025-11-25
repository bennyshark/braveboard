import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"
import { createServer } from "http"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = await createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value}) => {
          request.cookies.set(name, value)
        })
        },
      },
    }
  )

  const {data: { user }} = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const publicRouths = ['/sign-in', '/', '/auth/callback']
  const isPublicRouth = publicRouths.includes(pathname)

  if (isPublicRouth && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }
  if (!isPublicRouth && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
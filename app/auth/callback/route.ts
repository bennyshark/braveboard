import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  let next = searchParams.get('next') ?? '/'
  
  if (!next.startsWith('/')) {
    next = '/'
  }

  // Handle OAuth errors (including Auth Hook rejections)
  if (error) {
    const errorMessage = errorDescription || error
    return NextResponse.redirect(
      `${origin}/sign-in?error=auth_failed&message=${encodeURIComponent(errorMessage)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      // Handle Auth Hook rejection or other exchange errors
      return NextResponse.redirect(
        `${origin}/sign-in?error=auth_failed&message=${encodeURIComponent(exchangeError.message)}`
      )
    }
    
    // Success - proceed with redirect
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
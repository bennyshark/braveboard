// app/auth/callback/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (!code) {
    // No code means something went wrong with OAuth
    return NextResponse.redirect(new URL("/signin?error=1", requestUrl.origin))
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) throw error

    // Check if it's a firstasia.edu.ph account
    const email = data.user?.email
    
    if (email && !email.endsWith("@firstasia.edu.ph")) {
      // Sign out the user
      await supabase.auth.signOut()
      
      // Redirect to signin with error
      return NextResponse.redirect(new URL("/signin?error=1", requestUrl.origin))
    }

    // Success - redirect to home
    return NextResponse.redirect(new URL("/home", requestUrl.origin))

  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(new URL("/signin?error=1", requestUrl.origin))
  }
}
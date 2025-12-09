// app/auth/callback/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  try {
    // If there's no code, it means user tried to access callback directly
    // or something went wrong with OAuth flow
    if (!code) {
      return NextResponse.redirect(
        new URL("/signin?error=Please+use+your+@firstasia.edu.ph+account", requestUrl.origin)
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Auth error:", error)
      return NextResponse.redirect(
        new URL("/signin?error=Authentication+failed.+Please+try+again", requestUrl.origin)
      )
    }

    const email = data.user?.email
    
    // Check if it's a firstasia.edu.ph account
    if (email && !email.endsWith("@firstasia.edu.ph")) {
      // Sign out the user
      await supabase.auth.signOut()
      
      // Redirect to signin with error message
      return NextResponse.redirect(
        new URL("/signin?error=Please+use+your+@firstasia.edu.ph+account", requestUrl.origin)
      )
    }

    // Success - redirect to home
    return NextResponse.redirect(new URL("/", requestUrl.origin))

  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(
      new URL("/signin?error=Please+use+your+@firstasia.edu.ph+account", requestUrl.origin)
    )
  }
}
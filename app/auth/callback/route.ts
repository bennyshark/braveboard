// app/auth/callback/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/signin?error=1", requestUrl.origin))
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) throw error

    // Check if it's a firstasia.edu.ph account
    const email = data.user?.email
    
    if (email && !email.endsWith("@firstasia.edu.ph")) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL("/signin?error=1", requestUrl.origin))
    }

    // Sync profile data on login
    if (data.user) {
      // Check if profile exists for this email
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle()
      
      if (existingProfile) {
        // Update existing profile with user id
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            id: data.user.id,
            updated_at: new Date().toISOString()
          })
          .eq("email", email)
        
        if (updateError) {
          console.error("Profile update error:", updateError)
        }
      } else {
        // Create new profile for user
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email: data.user.email,
            role: "user"
          })
        
        if (insertError) {
          console.error("Profile creation error:", insertError)
        }
      }
    }

    // Success - redirect to home
    return NextResponse.redirect(new URL("/home", requestUrl.origin))

  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(new URL("/signin?error=1", requestUrl.origin))
  }
}
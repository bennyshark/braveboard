"use client"

import { createClient } from "@/lib/supabase/client"

export default function SignInPage() {
  const supabase = createClient()

  async function signInWithGoogle() {
    const origin = window.location.origin

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <button
        onClick={signInWithGoogle}
        className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
      >
        Sign in with Google
      </button>
    </div>
  )
}

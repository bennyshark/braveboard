// app/signin/page.tsx
"use client"

import { createClient } from "@/lib/supabase/client"
import { Chrome } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

// Create a separate component for the main content
function SignInContent() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get error from URL query parameter
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError("Please use your @firstasia.edu.ph account")
    }
  }, [searchParams])

  async function signInWithGoogle() {
    setIsLoading(true)
    setError(null) // Clear any previous errors
    
    const origin = window.location.origin
    
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account' // This forces Google to show account selection every time
          }
        }
      })
    } catch (err) {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Braveboard</h1>
          <p className="text-gray-600 mt-2">for the Bravehearts</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold">Sign in to continue</h2>
          </div>

          {/* Sign In Button */}
          <button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Chrome className="h-5 w-5" />
                Sign in with Google
              </>
            )}
          </button>

          {/* Error Message - shown only when there's an error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 text-center">
                {error}
              </p>
              <p className="text-xs text-red-700 text-center mt-1">
                Click the button above to try again with a different account.
              </p>
            </div>
          )}

          {/* Instructional text - shown only when no error */}
          {!error && (
            <div className="mt-4 text-sm text-gray-600">
              <p className="text-center">
                Please use your <strong>@firstasia.edu.ph</strong> institutional account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-5 w-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
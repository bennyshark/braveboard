"use client"

import { signInWithGoogle } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

function Page() {
    const searchParams = useSearchParams()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        const error = searchParams.get('error')
        const message = searchParams.get('message')
        
        if (error === 'auth_failed') {
            // Show custom message or default
            if (message?.includes('firstasia.edu.ph') || message?.includes('email')) {
                setErrorMessage('Access denied. Please sign in with your @firstasia.edu.ph email address.')
            } else {
                setErrorMessage(message || 'Authentication failed. Please try again.')
            }
        }
    }, [searchParams])

    async function handleSignIn() {
        setErrorMessage(null) // Clear any previous errors
        const { url } = await signInWithGoogle("/home")

        if (url) {
            window.location.href = url
        }
    }

    return (
        <div className="h-screen w-full flex items-center justify-center">
            <div className="flex items-center justify-center px-4">
                <div className="w-full bg-white space-y-2 px-4 py-10 sm:w-96 sm:px-8">
                    <header className="text-center pb-4">
                        <h1 className="mt-4 text-2xl font-medium tracking-tight text-black">
                            Sign in to BraveBoard
                        </h1>
                    </header>

                    {errorMessage && (
                        <div className="rounded-md bg-red-50 border border-red-200 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{errorMessage}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <form action={handleSignIn}>
                            <Button
                                className="flex w-full items-center justify-center gap-x-3"
                                variant="outline"
                                type="submit"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 16 16"
                                    aria-hidden
                                    className="size-4"
                                >
                                    <g clipPath="url(#google-clip)">
                                        <path
                                            fill="currentColor"
                                            d="M8.32 7.28v2.187h5.227c-.16 1.226-.57 2.124-1.192 2.755-.764.765-1.955 1.6-4.035 1.6-3.218 0-5.733-2.595-5.733-5.813 0-3.218 2.515-5.814 5.733-5.814 1.733 0 3.005.685 3.938 1.565l1.538-1.538C12.498.96 10.756 0 8.32 0 3.91 0 .205 3.591.205 8s3.706 8 8.115 8c2.382 0 4.178-.782 5.582-2.24 1.44-1.44 1.893-3.475 1.893-5.111 0-.507-.035-.978-.115-1.369H8.32Z"
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="google-clip">
                                            <path fill="#fff" d="M0 0h16v16H0z" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                Continue with Google
                            </Button>
                        </form>
                        
                        <p className="text-xs text-center text-gray-500 mt-4">
                            Only @firstasia.edu.ph email addresses are allowed
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Page
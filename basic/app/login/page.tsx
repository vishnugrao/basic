"use client"

import { signInWithGoogle } from "./actions"
import { useTransition } from "react"
import Image from "next/image"

export default function LoginPage() {
    const [isPending, startTransition] = useTransition()

    const handleGoogleSignIn = () => {
        startTransition(async () => {
            await signInWithGoogle()
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F1] px-4">
            <div className="flex flex-col items-center justify-center">
                <div className="flex justify-center mb-8">
                    <Image
                        src="/loginpagelogocropped.png"
                        alt="basic. logo"
                        width={900}
                        height={340}
                        className="w-900 h-340 drop-shadow-lg object-contain"
                        priority
                    />
                </div>
                <div className="w-full max-w-[450px]">
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                            Welcome to basic.
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Sign in with your Google account to continue
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-10 relative">
                        {isPending && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4285f4] rounded-full animate-spin"></div>
                                    <p className="text-gray-600 text-sm font-medium">
                                        Signing you in...
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex flex-col items-center space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-medium text-gray-900 mb-2">
                                    Sign in to your account
                                </h2>
                                <p className="text-gray-600">
                                    One click authentication with Google
                                </p>
                            </div>

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={isPending}
                                className="w-full flex items-center justify-center px-4 py-4 text-lg font-medium text-gray-700 
                                        bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 
                                        focus:ring-[#4285f4] disabled:bg-gray-50 
                                        disabled:cursor-not-allowed transition-colors
                                        shadow-sm relative"
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Continue with Google
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-base text-gray-500">
                        By continuing, you agree to our{' '}
                        <a href="" className="text-gray-700 hover:text-gray-900 transition-colors">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="" className="text-gray-700 hover:text-gray-900 transition-colors">
                            Privacy Policy
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
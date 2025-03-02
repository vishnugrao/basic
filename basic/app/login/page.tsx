"use client"

import { login, signup } from "./actions"
import { useState } from "react"
import Script from "next/script"

export default function LoginPage() {
    const [isLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)

    return (
        <>
            <Script src="https://accounts.google.com/gsi/client" />
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F1] px-4">
                <div className="w-full max-w-[400px]">
                    <div className="mb-8 text-center">
                        <h1 className="text-[32px] font-semibold text-gray-900">
                            {isSignUp ? 'Create account' : 'Welcome back'}
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {isSignUp ? 'Get started with your account' : 'Sign in to continue'}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-8">
                        <form className="space-y-5">
                            {isSignUp && (
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-gray-700 mb-1.5"
                                    >
                                        Username
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="name"
                                        required
                                        disabled={isLoading}
                                        placeholder="Vishnu Rao"
                                        className="w-full px-4 py-3 text-gray-900 border border-gray-200 
                                                rounded-xl focus:outline-none focus:ring-2 
                                                focus:ring-[#B1454A] focus:ring-opacity-20 
                                                focus:border-[#B1454A] disabled:bg-gray-50
                                                disabled:cursor-not-allowed transition-colors
                                                placeholder:text-gray-400"
                                    />
                                </div>
                            )}

                            <div>
                                <label 
                                    htmlFor="email" 
                                    className="block text-sm font-medium text-gray-700 mb-1.5"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    disabled={isLoading}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-3 text-gray-900 border border-gray-200 
                                             rounded-xl focus:outline-none focus:ring-2 
                                             focus:ring-[#B1454A] focus:ring-opacity-20 
                                             focus:border-[#B1454A] disabled:bg-gray-50
                                             disabled:cursor-not-allowed transition-colors
                                             placeholder:text-gray-400"
                                />
                            </div>

                            <div>
                                <label 
                                    htmlFor="password" 
                                    className="block text-sm font-medium text-gray-700 mb-1.5"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 text-gray-900 border border-gray-200 
                                             rounded-xl focus:outline-none focus:ring-2 
                                             focus:ring-[#B1454A] focus:ring-opacity-20 
                                             focus:border-[#B1454A] disabled:bg-gray-50
                                             disabled:cursor-not-allowed transition-colors"
                                />
                            </div>

                            {!isSignUp && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        className="text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                formAction={isSignUp ? signup : login}
                                disabled={isLoading}
                                className="w-full px-4 py-3 text-base font-medium text-white 
                                         bg-[#B1454A] rounded-xl hover:bg-[#9A3C40] 
                                         focus:outline-none focus:ring-2 focus:ring-offset-2 
                                         focus:ring-[#B1454A] disabled:bg-opacity-70 
                                         disabled:cursor-not-allowed transition-colors
                                         shadow-sm mt-2"
                            >
                                {isSignUp ? 'Create account' : 'Sign in'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                {isSignUp 
                                    ? 'Already have an account? Sign in' 
                                    : "Don't have an account? Create one"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        By continuing, you agree to our{' '}
                        <a href="#" className="text-gray-700 hover:text-gray-900">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-gray-700 hover:text-gray-900">
                            Privacy Policy
                        </a>
                    </div>
                </div>
            </div>
        </>
    )
}
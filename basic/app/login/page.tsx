"use client"

import { login, signup } from "./actions"
import { useState } from "react"
import Script from "next/script"
import Image from "next/image"

export default function LoginPage() {
    const [isLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    return (
        <>
            <Script src="https://accounts.google.com/gsi/client" />
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
                                {isSignUp ? 'Create account' : 'Welcome back'}
                            </h1>
                            <p className="text-gray-600 text-lg">
                                {isSignUp ? 'Get started with your account' : 'Sign in to continue'}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-10">
                            <form className="space-y-6">
                                {isSignUp && (
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="block text-lg font-medium text-gray-700 mb-2"
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
                                            className="w-full px-4 py-4 text-lg text-gray-900 border border-gray-200 
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
                                        className="block text-lg font-medium text-gray-700 mb-2"
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
                                        className="w-full px-4 py-4 text-lg text-gray-900 border border-gray-200 
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
                                        className="block text-lg font-medium text-gray-700 mb-2"
                                    >
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            disabled={isLoading}
                                            className="w-full px-4 py-4 text-lg text-gray-900 border border-gray-200 
                                                    rounded-xl focus:outline-none focus:ring-2 
                                                    focus:ring-[#B1454A] focus:ring-opacity-20 
                                                    focus:border-[#B1454A] disabled:bg-gray-50
                                                    disabled:cursor-not-allowed transition-colors pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 
                                                    text-gray-500 hover:text-gray-700 transition-colors
                                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                </div>

                                {!isSignUp && (
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            className="text-lg text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    formAction={isSignUp ? signup : login}
                                    disabled={isLoading}
                                    className="w-full px-4 py-4 text-lg font-medium text-white 
                                            bg-[#B1454A] rounded-xl hover:bg-[#9A3C40] 
                                            focus:outline-none focus:ring-2 focus:ring-offset-2 
                                            focus:ring-[#B1454A] disabled:bg-opacity-70 
                                            disabled:cursor-not-allowed transition-colors
                                            shadow-sm mt-4"
                                >
                                    {isSignUp ? 'Create account' : 'Sign in'}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-lg text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    {isSignUp 
                                        ? 'Already have an account? Sign in' 
                                        : "Don't have an account? Create one"}
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
        </>
    )
}
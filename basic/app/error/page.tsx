'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ErrorPage() {
    const searchParams = useSearchParams()
    const error = searchParams?.get('error')
    const description = searchParams?.get('error_description')
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F1] px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        Something went wrong
                    </h1>
                    
                    <p className="text-gray-600 mb-6">
                        We encountered an error while processing your request.
                    </p>
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                            <h3 className="text-sm font-medium text-red-800 mb-1">Error Details:</h3>
                            <p className="text-sm text-red-700 mb-2">Type: {error}</p>
                            {description && (
                                <p className="text-sm text-red-700">Description: {description}</p>
                            )}
                        </div>
                    )}
                    
                    <div className="space-y-3">
                        <Link 
                            href="/login"
                            className="w-full px-4 py-3 text-lg font-medium text-white bg-[#B1454A] rounded-xl hover:bg-[#9A3C40] transition-colors block"
                        >
                            Back to Login
                        </Link>
                        
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full px-4 py-3 text-lg font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-6">
                        If this problem persists, please contact support.
                    </p>
                </div>
            </div>
        </div>
    )
}
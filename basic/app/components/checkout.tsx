'use client'

import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutProps {
    clientSecret: string;
    onClose: () => void;
}

export default function Checkout({ clientSecret, onClose }: CheckoutProps) {
    console.log('🔵 [STRIPE CHECKOUT] Rendering checkout component with client secret:', clientSecret ? 'present' : 'missing')
    
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        console.error('❌ [STRIPE CHECKOUT] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined')
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-red-600 mb-4">Configuration Error</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Stripe configuration is missing. Please check your environment variables.
                        </p>
                        <button
                            onClick={onClose}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Complete Payment</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
                <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret }}
                >
                    <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
            </div>
        </div>
    )
}
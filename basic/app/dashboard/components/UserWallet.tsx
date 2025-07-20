'use client'

import { useState } from 'react'
import type { UserWallet } from '@/types/types'
import { fetchClientSecret } from '@/app/actions/stripe'
import Checkout from '@/app/components/checkout'

interface UserWalletProps {
    wallet: UserWallet;
}

export default function UserWallet({ wallet }: UserWalletProps) {
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)

    const handleTopUp = async (amount: number) => {
        try {
            console.log('🔵 [STRIPE CLIENT] Starting top up process for amount:', amount)
            setIsLoading(true)
            
            const secret = await fetchClientSecret(amount)
            console.log('✅ [STRIPE CLIENT] Client secret received successfully')
            
            setClientSecret(secret)
            setIsCheckoutOpen(true)
        } catch (error) {
            console.error('❌ [STRIPE CLIENT] Error creating checkout session:', error)
            // You might want to show a toast notification here
            alert(`Payment error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCheckoutClose = () => {
        console.log('🔵 [STRIPE CLIENT] Closing checkout modal')
        setIsCheckoutOpen(false)
        setClientSecret(null)
        // Refresh wallet data after successful payment
        window.location.reload()
    }

    const balance = wallet.amount_paid - wallet.amount_used

    return (
        <div className="flex-1">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between">
                    <p className="text-2xl">Wallet Balance:&nbsp;${balance.toFixed(2)}</p>
                    <p className="text-2xl">Requests Made:&nbsp;{wallet.requests_made}</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <p className="text-2xl">Top up options:&nbsp;</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleTopUp(2)}
                            disabled={isLoading}
                            className={`border-2 border-current rounded-lg cursor-pointer text-2xl px-3 py-1 transition-colors ${
                                isLoading 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-[#B1454A] hover:text-white'
                            }`}
                        >
                            {isLoading ? 'Processing...' : '$2'}
                        </button>
                        <button
                            onClick={() => handleTopUp(5)}
                            disabled={isLoading}
                            className={`border-2 border-current rounded-lg cursor-pointer text-2xl px-3 py-1 transition-colors ${
                                isLoading 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-[#B1454A] hover:text-white'
                            }`}
                        >
                            {isLoading ? 'Processing...' : '$5'}
                        </button>
                        <button
                            onClick={() => handleTopUp(10)}
                            disabled={isLoading}
                            className={`border-2 border-current rounded-lg cursor-pointer text-2xl px-3 py-1 transition-colors ${
                                isLoading 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-[#B1454A] hover:text-white'
                            }`}
                        >
                            {isLoading ? 'Processing...' : '$10'}
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsInfoDialogOpen(true)}
                            className="text-2xl border-2 border-current rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-[#B1454A] hover:text-white transition-colors"
                            title="Learn more about API costs"
                        >
                            i
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Dialog */}
            {isInfoDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md mx-4 border-4 border-current">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-bold">API Request Costs</h3>
                            <button
                                onClick={() => setIsInfoDialogOpen(false)}
                                className="text-2xl border-2 border-current rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-[#B1454A] hover:text-white transition-colors"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-4 text-lg">
                            <p>
                                Each API request to generate recipes and meal plans incurs a cost. 
                                Your wallet balance covers these expenses.
                            </p>
                            <div className="space-y-2">
                                <p><strong>Cost breakdown:</strong></p>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>Recipe generation: ~$0.03 per request</li>
                                </ul>
                            </div>
                            <p>
                                <strong>Current balance:</strong> ${balance.toFixed(2)}<br/>
                                <strong>Requests made:</strong> {wallet.requests_made}
                            </p>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsInfoDialogOpen(false)}
                                className="border-2 border-current rounded-lg cursor-pointer text-xl px-4 py-2 hover:bg-[#B1454A] hover:text-white transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCheckoutOpen && clientSecret && (
                <Checkout 
                    clientSecret={clientSecret}
                    onClose={handleCheckoutClose}
                />
            )}
        </div>
    )
} 
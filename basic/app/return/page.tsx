import { redirect } from 'next/navigation'

import { handlePaymentSuccess } from '@/app/actions/stripe'

// Explicitly mark this route as dynamic to handle searchParams Promise
export const dynamic = 'force-dynamic'

export default async function Return({ searchParams }: { searchParams: Promise<{ session_id: string }> }) {
    try {
        console.log('🔵 [STRIPE RETURN] Processing payment return')
        
        const { session_id } = await searchParams
        console.log('🔵 [STRIPE RETURN] Session ID:', session_id)

        if (!session_id) {
            console.error('❌ [STRIPE RETURN] No session_id provided')
            throw new Error('Please provide a valid session_id (`cs_live_...`)')
        }

        console.log('🔵 [STRIPE RETURN] Handling payment success for session:', session_id)
        const session = await handlePaymentSuccess(session_id)
        console.log('✅ [STRIPE RETURN] Payment processed successfully:', {
            id: session.id,
            status: session.status,
            payment_status: session.payment_status
        })

        if (session.status === 'open') {
            console.log('🔵 [STRIPE RETURN] Session is open, redirecting to home')
            return redirect('/')
        }

        if (session.status === 'complete') {
            console.log('✅ [STRIPE RETURN] Session is complete, showing success page')
            return (
                <section id="success" className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
                        <p className="text-lg mb-4">
                            We appreciate your business! A confirmation email will be sent to{' '}
                            {session.customer_details?.email}. If you have any questions, please email{' '}
                        </p>
                        <a href="mailto:vishnugrao@gmail.com" className="text-blue-600 hover:underline">vishnugrao@gmail.com</a>
                        <div className="mt-6">
                            <a href="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                Return to Dashboard
                            </a>
                        </div>
                    </div>
                </section>
            )
        }

        console.log('⚠️ [STRIPE RETURN] Unexpected session status:', session.status)
        return (
            <section className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-yellow-600 mb-4">Payment Processing</h1>
                    <p className="text-lg mb-4">
                        Your payment is being processed. Please wait...
                    </p>
                    <div className="mt-6">
                        <a href="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                            Return to Dashboard
                        </a>
                    </div>
                </div>
            </section>
        )
    } catch (error) {
        console.error('❌ [STRIPE RETURN] Error processing payment return:', error)
        return (
            <section className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Error</h1>
                    <p className="text-lg mb-4">
                        There was an error processing your payment. Please try again or contact support.
                    </p>
                    <div className="mt-6">
                        <a href="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                            Return to Dashboard
                        </a>
                    </div>
                </div>
            </section>
        )
    }
}
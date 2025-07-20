'use server'

import { headers } from 'next/headers'
import { stripe } from '@/app/lib/stripe'
import { createClient } from '@/utils/supabase/server'

export async function fetchClientSecret(amount: number) {
    try {
        console.log('🔵 [STRIPE] Starting fetchClientSecret with amount:', amount)
        
        const origin = (await headers()).get('origin')
        console.log('🔵 [STRIPE] Origin:', origin)
        
        const supabase = await createClient()
        console.log('🔵 [STRIPE] Supabase client created')
        
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
            console.error('❌ [STRIPE] Auth error:', authError)
            throw new Error(`Authentication error: ${authError.message}`)
        }
        
        if (!user) {
            console.error('❌ [STRIPE] User not authenticated')
            throw new Error('User not authenticated')
        }
        
        console.log('🔵 [STRIPE] User authenticated:', user.id)

        // Create Checkout Sessions from body params.
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `API Credits - $${amount}`,
                            description: `Top up your wallet with $${amount} for API requests`
                        },
                        unit_amount: amount * 100, // Convert to cents
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            return_url: `${origin}/return?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                user_id: user.id,
                amount: amount.toString()
            }
        })

        console.log('✅ [STRIPE] Checkout session created successfully:', session.id)
        return session.client_secret
    } catch (error) {
        console.error('❌ [STRIPE] Error in fetchClientSecret:', error)
        throw error
    }
}

export async function handlePaymentSuccess(sessionId: string) {
    try {
        console.log('🔵 [STRIPE] Starting handlePaymentSuccess with sessionId:', sessionId)
        
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items', 'payment_intent']
        })
        
        console.log('🔵 [STRIPE] Session retrieved:', {
            id: session.id,
            status: session.status,
            payment_status: session.payment_status
        })

        if (session.payment_status === 'paid') {
            console.log('🔵 [STRIPE] Payment is paid, updating wallet')
            
            const supabase = await createClient()
            const amount = parseInt(session.metadata?.amount || '0')
            const userId = session.metadata?.user_id

            console.log('🔵 [STRIPE] Payment details:', { amount, userId })

            if (userId && amount > 0) {
                // Get current wallet
                const { data: wallet, error: walletError } = await supabase
                    .from('Wallets')
                    .select('*')
                    .eq('user_id', userId)
                    .single()

                if (walletError) {
                    console.error('❌ [STRIPE] Error fetching wallet:', walletError)
                    throw new Error(`Failed to fetch wallet: ${walletError.message}`)
                }

                if (wallet) {
                    console.log('🔵 [STRIPE] Current wallet:', wallet)
                    
                    // Update wallet with new payment
                    const { error: updateError } = await supabase
                        .from('Wallets')
                        .update({
                            amount_paid: wallet.amount_paid + amount,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', userId)

                    if (updateError) {
                        console.error('❌ [STRIPE] Error updating wallet:', updateError)
                        throw new Error(`Failed to update wallet: ${updateError.message}`)
                    }

                    console.log('✅ [STRIPE] Wallet updated successfully')
                } else {
                    console.error('❌ [STRIPE] Wallet not found for user:', userId)
                    throw new Error('Wallet not found')
                }
            } else {
                console.error('❌ [STRIPE] Invalid payment data:', { userId, amount })
                throw new Error('Invalid payment data')
            }
        } else {
            console.log('⚠️ [STRIPE] Payment not completed, status:', session.payment_status)
        }

        return session
    } catch (error) {
        console.error('❌ [STRIPE] Error in handlePaymentSuccess:', error)
        throw error
    }
}
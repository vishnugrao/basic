import 'server-only'

import Stripe from 'stripe'

// Validate Stripe configuration
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
    console.error('❌ [STRIPE] STRIPE_SECRET_KEY is not defined in environment variables')
    throw new Error('STRIPE_SECRET_KEY is required but not provided')
}

console.log('🔵 [STRIPE] Initializing Stripe with secret key:', stripeSecretKey.substring(0, 10) + '...')

export const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-06-30.basil',
})

console.log('✅ [STRIPE] Stripe client initialized successfully')
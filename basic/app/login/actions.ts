'use server'

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export async function signInWithGoogle() {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        }
    })
    
    if (error) {
        console.error('❌ [GOOGLE_AUTH] OAuth initiation error:', {
            message: error.message,
            status: error.status,
            name: error.name,
            cause: error.cause
        })
        redirect(`/error?error=${encodeURIComponent(error.name || 'GoogleAuthError')}&error_description=${encodeURIComponent(error.message)}`)
    }
    
    if (data.url) {
        redirect(data.url)
    }
}

// Keep the old functions for backward compatibility, but they'll just redirect to OAuth
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function login(_formData: FormData) {
    console.log('🔵 [LOGIN] Redirecting to Google OAuth (email/password login deprecated)')
    await signInWithGoogle()
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function signup(_formData: FormData) {
    console.log('🔵 [SIGNUP] Redirecting to Google OAuth (email/password signup deprecated)')
    await signInWithGoogle()
}
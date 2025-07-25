'use server'

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export async function signOut(): Promise<void> {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
        console.error('❌ [SIGN_OUT] Error signing out:', error)
        redirect('/error?error=SignOutError&error_description=Failed to sign out')
    }

    console.log('✅ [SIGN_OUT] User signed out successfully')
    revalidatePath('/', 'layout')
    redirect('/login')
} 
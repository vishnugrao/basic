'use server'

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

interface GoogleSignInResponse {
    credential: string;
}

export async function handleSignInWithGoogle(response: GoogleSignInResponse): Promise<void> {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
    })

    if (error) {
        redirect('/error')
    }

    revalidatePath('/', 'layout')
    redirect('/')
} 
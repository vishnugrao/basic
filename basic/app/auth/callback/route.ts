import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { handleAuthCallback } from '@/app/login/actions'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
            // Handle the callback logic (creating user records if needed)
            await handleAuthCallback()
            return
        }
    }

    // Return the user to an error page with instructions
    redirect('/error?error=AuthCallbackFailed&error_description=Failed to authenticate with Google')
} 
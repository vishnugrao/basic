'use server'

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { v4 as uuidv4 } from 'uuid'

export async function signInWithGoogle() {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
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

export async function handleAuthCallback() {
    const supabase = await createClient()
    
    try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            console.error('❌ [AUTH_CALLBACK] Error getting user:', userError)
            redirect('/error?error=AuthCallbackError&error_description=Failed to get user data')
        }
        
        console.log('✅ [AUTH_CALLBACK] User authenticated:', user.id)
        
        // Check if this is a new user by looking in our Users table
        const { data: existingUser, error: checkError } = await supabase
            .from('Users')
            .select('id')
            .eq('id', user.id)
            .single()
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error('❌ [AUTH_CALLBACK] Error checking existing user:', checkError)
            redirect('/error?error=DatabaseError&error_description=Failed to check user status')
        }
        
        // If user doesn't exist in our database, create all necessary records
        if (!existingUser) {
            console.log('🔵 [AUTH_CALLBACK] New user detected, creating database records...')
            
            const uid = user.id
            const name = user.user_metadata?.full_name || user.user_metadata?.name || 'User'
            const email = user.email || ''
            
            // Create user record
            const { error: userCreateError } = await supabase.from('Users').insert({
                id: uid,
                name: name,
                email: email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_sign_in_at: new Date().toISOString(),
                height: 173,
                weight: 83,
                gender: 'Female',
                age: 22
            })
            
            if (userCreateError) {
                console.error('❌ [AUTH_CALLBACK] Error creating user:', userCreateError)
                redirect('/error?error=DatabaseError&error_description=Failed to create user record')
            }
            
            // Create goals record
            const { error: goalsError } = await supabase.from('Goals').insert({
                id: uuidv4(),
                user_id: uid,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                goal: 'Bulk',
                diet: 'Vegetarian',
                lacto_ovo: 'Dairy Only', 
                activity_level: 1.55
            })
            
            if (goalsError) {
                console.error('❌ [AUTH_CALLBACK] Error creating goals:', goalsError)
                redirect('/error?error=DatabaseError&error_description=Failed to create goals record')
            }
            
            // Create meal plan record
            const { error: mealPlanError } = await supabase.from('MealPlan').insert({
                id: uuidv4(),
                user_id: uid,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                cuisines: ['Mediterranean', 'Japanese', 'Mexican']
            })
            
            if (mealPlanError) {
                console.error('❌ [AUTH_CALLBACK] Error creating meal plan:', mealPlanError)
                redirect('/error?error=DatabaseError&error_description=Failed to create meal plan record')
            }
            
            // Create search set record
            const { error: searchSetError } = await supabase.from('SearchSet').insert({
                id: uuidv4(),
                user_id: uid,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                searchSet: ["Afghan", "African", "American", "Argentine", "Armenian", "Asian", "Austrian", "Bangladeshi", "Barbeque", "Belgian", "Brazilian", "British", "Cajun", "Caribbean", "Chinese", "Colombian", "Cuban", "Czech", "Danish", "Dutch", "Eastern European", "Egyptian", "Ethiopian", "Filipino", "French", "German", "Greek", "Gujarati", "Hawaiian", "Himalayan", "Hungarian", "Indian", "Indonesian", "Irish", "Israeli", "Italian", "Jamaican", "Japanese", "Jewish", "Korean", "Lebanese", "Mediterranean", "Mexican", "Middle Eastern", "Mongolian", "Moroccan", "Nepalese", "New American", "Nigerian", "Northern European", "Peruvian", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Salvadoran", "Scandinavian", "Scottish", "Seafood", "Southeast Asian", "Southern", "Spanish", "Sri Lankan", "Swedish", "Swiss", "Syrian", "Taiwanese", "Thai", "Turkish", "Ukrainian", "Vegan", "Vegetarian", "Vietnamese"]
            })
            
            if (searchSetError) {
                console.error('❌ [AUTH_CALLBACK] Error creating search set:', searchSetError)
                redirect('/error?error=DatabaseError&error_description=Failed to create search set record')
            }
            
            // Create wallet record
            const { error: walletError } = await supabase.from('Wallets').insert({
                id: uuidv4(),
                user_id: uid,
                amount_paid: 2,
                amount_used: 0,
                requests_made: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            
            if (walletError) {
                console.error('❌ [AUTH_CALLBACK] Error creating wallet:', walletError)
                redirect('/error?error=DatabaseError&error_description=Failed to create wallet record')
            }
            
            console.log('✅ [AUTH_CALLBACK] All database records created successfully for new user')
        } else {
            console.log('✅ [AUTH_CALLBACK] Existing user login')
        }
        
        // Revalidate and redirect to dashboard
        revalidatePath('/dashboard', 'layout')
        redirect('/dashboard')
        
    } catch (error) {
        console.error('❌ [AUTH_CALLBACK] Unexpected error:', error)
        redirect('/error?error=UnexpectedError&error_description=An unexpected error occurred during authentication')
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
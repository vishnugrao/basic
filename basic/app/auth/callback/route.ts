import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    console.log('🔵 [AUTH_CALLBACK] Callback route accessed')
    console.log('🔵 [AUTH_CALLBACK] Search params:', Object.fromEntries(searchParams.entries()))
    console.log('🔵 [AUTH_CALLBACK] Code present:', !!code)
    
    // Helper function to create proper redirect URLs
    const createRedirectUrl = (path: string) => {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        if (!siteUrl) {
            console.error('❌ [AUTH_CALLBACK] NEXT_PUBLIC_SITE_URL not set, using request.url')
        }
        console.log('🔵 [AUTH_CALLBACK] Redirecting to:', `${siteUrl || request.url}${path}`)
        return new URL(path, siteUrl || request.url)
    }

    if (code) {
        console.log('🔵 [AUTH_CALLBACK] Processing OAuth code:', code.substring(0, 8) + '...')
        const supabase = await createClient()
        
        // Check if user is already authenticated before trying to exchange code
        const { data: { user: existingUser } } = await supabase.auth.getUser()
        if (existingUser) {
            console.log('✅ [AUTH_CALLBACK] User already authenticated, redirecting to dashboard')
            return NextResponse.redirect(createRedirectUrl('/dashboard'))
        }
        
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
            console.error('❌ [AUTH_CALLBACK] Code exchange failed:', {
                message: error.message,
                status: error.status,
                name: error.name,
                cause: error.cause
            })
            return NextResponse.redirect(createRedirectUrl(`/error?error=CodeExchangeFailed&error_description=${encodeURIComponent(error.message)}`))
        }
        
        console.log('✅ [AUTH_CALLBACK] Code exchange successful')
        
        if (!error) {
            try {
                // Get the current user
                const { data: { user }, error: userError } = await supabase.auth.getUser()
                
                if (userError || !user) {
                    console.error('❌ [AUTH_CALLBACK] Error getting user:', userError)
                    return NextResponse.redirect(createRedirectUrl('/error?error=AuthCallbackError&error_description=Failed to get user data'))
                }
                
                console.log('✅ [AUTH_CALLBACK] User authenticated:', user.id)
                
                // Check if this is a new user by looking in our Users table (check both id and email)
                const { data: existingUser, error: checkError } = await supabase
                    .from('Users')
                    .select('id, email')
                    .or(`id.eq.${user.id},email.eq.${user.email}`)
                    .single()
                
                if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
                    console.error('❌ [AUTH_CALLBACK] Error checking existing user:', checkError)
                    return NextResponse.redirect(createRedirectUrl('/error?error=DatabaseError&error_description=Failed to check user status'))
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
                        // If it's a duplicate error, treat as existing user instead of failing
                        if (userCreateError.code === '23505') {
                            console.log('🔵 [AUTH_CALLBACK] User already exists (duplicate key), treating as existing user')
                        } else {
                            return NextResponse.redirect(createRedirectUrl('/error?error=DatabaseError&error_description=Failed to create user record'))
                        }
                    } else {
                        // Only create other records if user creation was successful
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
                            return NextResponse.redirect(createRedirectUrl('/error?error=DatabaseError&error_description=Failed to create goals record'))
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
                            return NextResponse.redirect(createRedirectUrl('/error?error=DatabaseError&error_description=Failed to create meal plan record'))
                        }
                        
                        // Create search set record
                        const { error: searchSetError } = await supabase.from('SearchSet').insert({
                            id: uuidv4(),
                            user_id: uid,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            searchSet: ["Afghan", "African", "American", "Argentine", "Armenian", "Asian", "Austrian", "Bangladeshi", "Barbeque", "Belgian", "Brazilian", "British", "Cajun", "Caribbean", "Chinese", "Colombian", "Cuban", "Czech", "Danish", "Dutch", "Eastern European", "Egyptian", "Ethiopian", "Filipino", "French", "German", "Greek", "Gujarati", "Hawaiian", "Himalayan", "Hungarian", "Indian", "Indonesian", "Irish", "Israeli", "Italian", "Jamaican", "Japanese", "Jewish", "Korean", "Lebanese", "Mediterranean", "Mexican", "Middle Eastern", "Mongolian", "Moroccan", "Nepalese", "New American", "Nigerian", "Northern European", "North Indian", "Peruvian", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Salvadoran", "Scandinavian", "Scottish", "Seafood", "Southeast Asian", "Southern", "South Indian", "Spanish", "Sri Lankan", "Swedish", "Swiss", "Syrian", "Taiwanese", "Thai", "Turkish", "Ukrainian", "Vegan", "Vegetarian", "Vietnamese"]
                        })
                        
                        if (searchSetError) {
                            console.error('❌ [AUTH_CALLBACK] Error creating search set:', searchSetError)
                            return NextResponse.redirect(createRedirectUrl('/error?error=DatabaseError&error_description=Failed to create search set record'))
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
                            return NextResponse.redirect(createRedirectUrl('/error?error=DatabaseError&error_description=Failed to create wallet record'))
                        }
                        
                        console.log('✅ [AUTH_CALLBACK] All database records created successfully for new user')
                    }
                } else {
                    console.log('✅ [AUTH_CALLBACK] Existing user login')
                }
                
                // Redirect to dashboard
                return NextResponse.redirect(createRedirectUrl('/dashboard'))
                
            } catch (error) {
                console.error('❌ [AUTH_CALLBACK] Unexpected error:', error)
                return NextResponse.redirect(createRedirectUrl('/error?error=UnexpectedError&error_description=An unexpected error occurred during authentication'))
            }
        }
    }

    // Return the user to an error page with instructions
    console.error('❌ [AUTH_CALLBACK] No code provided or auth flow failed')
    return NextResponse.redirect(createRedirectUrl('/error?error=AuthCallbackFailed&error_description=Failed to authenticate with Google'))
} 
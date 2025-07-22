'use server'

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { v4 as uuidv4 } from 'uuid'

export async function login(formData:FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect ('/error')
    }

    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { data: authData, error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/error')
    }

    if (!authData.user) {
        redirect('/error')
    }

    const uid = authData.user.id

    const { error: error2 } = await supabase.from('Users').insert({
        id: uid,
        name: data.name,
        email: data.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        height: 173,
        weight: 83,
        gender: 'Female',
        age: 22
    })

    if (error2) {
        console.log(error2)
        redirect('/error')
    }

    const {error: error3} = await supabase.from('Goals').insert({
        id: uuidv4(),
        user_id: uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        goal: 'Bulk',
        diet: 'Vegetarian',
        lacto_ovo: 'Dairy Only', 
        activity_level: 1.55
    })
    
    if (error3) {
        console.log(error3)
        redirect('/error')
    }


    const {error: error4} = await supabase.from('MealPlan').insert({
        id: uuidv4(),
        user_id: uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cuisines: ['Mediterranean', 'Japanese', 'Mexican']
    })

    if (error4) {
        console.log(error4)
        redirect('/error')
    }

    const {error: error5} = await supabase.from('SearchSet').insert({
        id: uuidv4(),
        user_id: uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        searchSet: ["Afghan", "African", "American", "Argentine", "Armenian", "Asian", "Austrian", "Bangladeshi", "Barbeque", "Belgian", "Brazilian", "British", "Cajun", "Caribbean", "Chinese", "Colombian", "Cuban", "Czech", "Danish", "Dutch", "Eastern European", "Egyptian", "Ethiopian", "Filipino", "French", "German", "Greek", "Gujarati", "Hawaiian", "Himalayan", "Hungarian", "Indian", "Indonesian", "Irish", "Israeli", "Italian", "Jamaican", "Japanese", "Jewish", "Korean", "Lebanese", "Mediterranean", "Mexican", "Middle Eastern", "Mongolian", "Moroccan", "Nepalese", "New American", "Nigerian", "Northern European", "Peruvian", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Salvadoran", "Scandinavian", "Scottish", "Seafood", "Southeast Asian", "Southern", "Spanish", "Sri Lankan", "Swedish", "Swiss", "Syrian", "Taiwanese", "Thai", "Turkish", "Ukrainian", "Vegan", "Vegetarian", "Vietnamese"]
    })

    if (error5) {
        console.log(error5)
        redirect('/error')
    }

    console.log('🔵 [SIGNUP] Creating wallet for user:', uid)
    
    const {error: error6} = await supabase.from('Wallets').insert({
        id: uuidv4(),
        user_id: uid,
        amount_paid: 2,
        amount_used: 0,
        requests_made: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    })

    if (error6) {
        console.error('❌ [SIGNUP] Error creating wallet:', error6)
        redirect('/error')
    }
    
    console.log('✅ [SIGNUP] Wallet created successfully')

    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
}
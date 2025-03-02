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

    revalidatePath('/', 'layout')
    redirect('/')
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

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/error')
    }

    const uid = uuidv4()

    const { error: error2 } = await supabase.from('Users').insert({
        id: uid,
        name: data.name,
        email: data.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        height: 0,
        weight: 0,
        gender: 'unknown',
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
        goal: 'unknown',
        diet: 'unknown',
        lacto_ovo: 'unknown'
    })
    
    if (error3) {
        console.log(error3)
        redirect('/error')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
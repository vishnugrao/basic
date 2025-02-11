'use server'

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function getUserDetails(email: string) {
    const supabase = await createClient()

    const { data, error } = await supabase.from('Users').select('*').eq('email', email).single()

    if (error || !data) {
        redirect('/login')
    }

    return data;
}

export async function updateUserDetails(userDetails: {
    gender: string;
    height: number;
    weight: number;
    updated_at: string;
    email: string;
}) {
    userDetails.updated_at = new Date().toISOString();
    const supabase = await createClient()

    const { error } = await supabase.from('Users').update(userDetails).eq('email', userDetails.email)

    if (error) {
        console.error(error)
    }
}
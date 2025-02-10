'use server'

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function getUserDetails() {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
        redirect('/login')
    }

    return data.user
}
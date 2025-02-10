'use-client'

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

import UserDetails from "./components/UserDetails";

export default async function PrivatePage() {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
        redirect('/login')
    }

    return (
        <>
            <div className="p-10 flex">
                <p className="flex-auto text-2xl">Hello {data.user.email}</p>
                <UserDetails/>
            </div>
            
        </>
    )
}
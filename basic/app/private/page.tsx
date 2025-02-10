'use-client'

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export default async function PrivatePage() {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
        redirect('/login')
    }

    return (
        <>
            <p className="p-10 text-2xl">Hello {data.user.email}</p>
            <div>
                <p className="pl-10 text-xl">I am </p>
            </div>
        </>
    )
}
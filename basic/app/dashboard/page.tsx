import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

import UserDetails from "./components/UserDetails";
import { getUserDetails } from "./actions";
import { User } from "@/types/types";

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
        redirect('/login')
    }

    const userDetails: User = await getUserDetails(data.user.email as string)

    return (
        <>
            <section className="p-10 flex">
                <p className="flex-auto text-2xl">Hello {userDetails.name}</p>
                <UserDetails userDetails={userDetails}/>
            </section>
            
        </>
    )
}
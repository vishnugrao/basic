import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function RerollPage() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
        redirect('/login')
    }

    // Redirect to the main dashboard with cuisine page (reroll mode will be available via toggle)
    redirect('/dashboard?page=cuisines&mode=reroll')
} 
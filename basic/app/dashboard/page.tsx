import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUserDetails, getGoalDetails, getMealPlan, getSearchSet} from "./actions";
import DashboardClient from "./components/DashboardClient";

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
        redirect('/login')
    }

    const userDetails = await getUserDetails(data.user.email as string)
    const goalDetails = await getGoalDetails(userDetails.id)
    const mealPlan = await getMealPlan(userDetails.id)
    const searchSet = await getSearchSet(userDetails.id)

    return (
        <DashboardClient 
            initialUserDetails={userDetails}
            initialGoalDetails={goalDetails}
            initialMealPlan={mealPlan}
            searchSet={searchSet}
        />
    )
}
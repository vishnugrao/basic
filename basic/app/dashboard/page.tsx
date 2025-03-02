import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

import UserDetails from "./components/UserDetails";
import { getUserDetails, getGoalDetails, getMealPlan } from "./actions";
import { User, Goal, MealPlan } from "@/types/types";
import GoalDetails from "./components/GoalDetails";
import MealPlanner from "./components/MealPlanner";

export default async function DashboardPage() {

    const supabase = await createClient()

    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
        redirect('/login')
    }

    const userDetails: User = await getUserDetails(data.user.email as string)
    const goalDetails: Goal = await getGoalDetails(userDetails.id)
    const mealPlan: MealPlan = await getMealPlan(userDetails.id)

    return (
        <>
            <section className="px-10 pt-10 pb-5 flex">
                <p className="flex-auto text-2xl">Hello {userDetails.name}</p>
                <UserDetails userDetails={userDetails}/>
            </section>
            <section className="px-10 flex">
                <p className="flex-auto"></p>
                <GoalDetails goalDetails={goalDetails} userId={userDetails.id} />
            </section>
            <section className="p-10 flex-col">
                <p className="flex-auto text-2xl pb-10">Meal Plan</p>
                <MealPlanner mealPlan={mealPlan} userId={userDetails.id} />
            </section>
            
        </>
    )
}
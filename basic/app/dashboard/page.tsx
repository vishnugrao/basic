import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUserDetails, getGoalDetails, getMealPlan, getSearchSet, getRecipes, getIngredients, getPreprocessing, getSteps, getWallet} from "./actions";
import DashboardClient from "./components/DashboardClient";
import { isLocalhost, LOCALHOST_BYPASS_EMAIL } from "@/utils/environment";

export default async function DashboardPage() {
    let userEmail: string;

    // Use hardcoded email on localhost for development
    if (isLocalhost()) {
        console.log('🟡 [DASHBOARD] Localhost detected - using bypass email:', LOCALHOST_BYPASS_EMAIL)
        userEmail = LOCALHOST_BYPASS_EMAIL;
    } else {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.getUser()

        if (error || !data?.user) {
            redirect('/login')
        }

        userEmail = data.user.email as string;
    }

    const userDetails = await getUserDetails(userEmail)
    const goalDetails = await getGoalDetails(userDetails.id)
    const mealPlan = await getMealPlan(userDetails.id)
    const searchSet = await getSearchSet(userDetails.id)
    const recipes = await getRecipes(userDetails.id);
    const ingredients = await getIngredients(userDetails.id);
    const preprocessing = await getPreprocessing(userDetails.id);
    const steps = await getSteps(userDetails.id);
    const wallet = await getWallet(userDetails.id);

    return (
        <DashboardClient 
            initialUserDetails={userDetails}
            initialGoalDetails={goalDetails}
            initialMealPlan={mealPlan}
            searchSet={searchSet}
            initialRecipesDetails={recipes}
            initialIngredientDetails={ingredients}
            initialPreprocessingDetails={preprocessing}
            initialStepsDetails={steps}
            initialWallet={wallet}
        />
    )
}
'use server'

import { Recipe } from "@/types/types";
import { createClient } from "@/utils/supabase/server";
import { UUID } from "crypto";
import { redirect } from "next/navigation";

export async function insertRecipes(recipe: Recipe) {
    const supabase = await createClient()

    const { error } = await supabase.from('Recipes').upsert(recipe);

    if (error) {
        // redirect('/error')
        console.log(error)
    }
}

export async function getUserDetails(email: string) {
    const supabase = await createClient()

    const { data, error } = await supabase.from('Users').select('*').eq('email', email).single()

    if (error || !data) {
        redirect('/login')
    }

    return data;
}

export async function getGoalDetails(user_id: UUID) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('Goals').select('*').eq('user_id', user_id).single()

    if (error || !data) {
        redirect('/error')
    }

    return data;
}

export async function getMealPlan(user_id: UUID) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('MealPlan').select('*').eq('user_id', user_id).single()

    if (error || !data) {
        redirect('/error')
    }

    return data;
}

export async function getSearchSet(user_id: UUID) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('SearchSet').select('*').eq('user_id', user_id).single()

    if (error || !data) {
        redirect('/error')
    }
    
    return data;
}

export async function getRecipes(user_id: UUID) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('Recipes').select('*').eq('user_id', user_id)

    if (error) {
        redirect('/error')
    }

    return data;
}

export async function getIngredients(user_id: UUID) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('Ingredients').select('*').eq('user_id', user_id)

    if (error) {
        redirect('/error')
    }

    return data;
}

export async function getPreprocessing(user_id: UUID) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('Preprocessing').select('*').eq('user_id', user_id)

    if (error) {
        redirect('/error')
    }

    return data;
}

export async function getSteps(user_id: UUID) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('Steps').select('*').eq('user_id', user_id)

    if (error) {
        redirect('/error')
    }

    return data;
}

export async function updateUserDetails(userDetails: {
    gender: string;
    height: number;
    weight: number;
    age: number;
    updated_at: string;
    email: string;
}) {
    const supabase = await createClient()

    const { error } = await supabase.from('Users').update(userDetails).eq('email', userDetails.email)

    if (error) {
        console.error(error)
    }
}

export async function updateUserName(userDetails: {
    name: string,
    updated_at: string,
    user_id: string
}) {
    const supabase = await createClient()

    const { error } = await supabase.from('Users').update(userDetails).eq('id', userDetails.user_id)

    if (error) {
        console.error(error)
    }
}

export async function updateGoalDetails(goalDetails : {
    goal: string,
    diet: string,
    lacto_ovo: string,
    activity_level: number,
    updated_at: string,
    user_id: UUID
}) {

    const supabase = await createClient()

    const { error } = await supabase.from('Goals').update(goalDetails).eq('user_id', goalDetails.user_id)

    if (error) {
        console.error(error)
    }
    
}

export async function updateMealPlanner(mealPlan: {
    cuisines: string[],
    updated_at: string,
    user_id: UUID
}) {
    const supabase = await createClient()

    const { error } = await supabase.from('MealPlan').update(mealPlan).eq('user_id', mealPlan.user_id)

    if (error) {
        console.error(error)
    }
}

export async function updateRecipes(recipeDetails: {
    recipe_name: string,
    cuisine: string, 
    protein: number,
    fat: number, 
    user_id: UUID,
    recipe_id: UUID,
    updated_at: string
}) {
    const supabase = await createClient()

    const { error } = await supabase.from('Recipes').update(recipeDetails).eq('user_id', recipeDetails.user_id).eq('recipe_id', recipeDetails.recipe_id);

    if (error) {
        console.error(error)
    }
}

export async function updateIngredients(ingredientDetails: {
    purchased: boolean,
    user_id: UUID,
    recipe_id: UUID, 
    updated_at: string
}) {
    const supabase = await createClient()

    const { error } = await supabase.from('Ingredients').update(ingredientDetails).eq('user_id', ingredientDetails.user_id).eq('recipe_id', ingredientDetails.recipe_id);

    if (error) {
        console.error(error)
    }
}

export async function updateIngredientsById(ingredientDetails: {
    purchased: boolean,
    user_id: UUID,
    id: UUID, 
    updated_at: string
}) {
    const supabase = await createClient()

    const { error } = await supabase.from('Ingredients').update(ingredientDetails).eq('user_id', ingredientDetails.user_id).eq('id', ingredientDetails.id);

    if (error) {
        console.error(error)
    }
}

export async function updateMultipleIngredients(ingredients: Array<{
    purchased: boolean,
    user_id: UUID,
    id: UUID, 
    updated_at: string
}>) {
    const supabase = await createClient()
    const updatePromises = ingredients.map(async (ingredient) => {
        const { error } = await supabase
            .from('Ingredients')
            .update({
                purchased: ingredient.purchased,
                updated_at: ingredient.updated_at
            })
            .eq('id', ingredient.id)
            .eq('user_id', ingredient.user_id);

        if (error) {
            console.log('Error updating ingredient:', error);
        }
        return { success: !error, error };
    });

    const results = await Promise.all(updatePromises);
    const errors = results.filter(result => !result.success);
    
    if (errors.length > 0) {
        console.log(`Completed with ${errors.length} errors out of ${ingredients.length} ingredients`);
    } else {
        console.log('updateMultipleIngredients completed successfully');
    }
}

export async function deleteRecipes(user_id: UUID, recipe_id: UUID) {
    const supabase = await createClient();
    const { error } = await supabase.from('Recipes').delete().eq('user_id', user_id).eq('id', recipe_id);

    if (error) {
        redirect('/error');        
    }
}

export async function getWallet(user_id: UUID) {
    try {
        console.log('🔵 [WALLET] Fetching wallet for user:', user_id)
        
        const supabase = await createClient()
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
            console.error('❌ [WALLET] Auth error:', authError)
            throw new Error(`Authentication error: ${authError.message}`)
        }
        
        if (!user) {
            console.error('❌ [WALLET] User not authenticated')
            throw new Error('User not authenticated')
        }
        
        console.log('🔵 [WALLET] User authenticated:', user.id)
        
        const { data, error } = await supabase.from('Wallets').select('*').eq('user_id', user_id).single()

        if (error) {
            console.error('❌ [WALLET] Error fetching wallet:', error)
            throw new Error(`Failed to fetch wallet: ${error.message}`)
        }

        if (!data) {
            console.error('❌ [WALLET] No wallet found for user:', user_id)
            throw new Error('Wallet not found')
        }

        console.log('✅ [WALLET] Wallet fetched successfully:', data)
        return data
    } catch (error) {
        console.error('❌ [WALLET] Error in getWallet:', error)
        redirect('/error')
    }
}

export async function updateWallet(walletDetails: {
    amount_paid: number;
    amount_used: number;
    requests_made: number;
    updated_at: string;
    user_id: UUID;
}) {
    try {
        console.log('🔵 [WALLET] Updating wallet for user:', walletDetails.user_id, walletDetails)
        
        const supabase = await createClient()
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
            console.error('❌ [WALLET] Auth error:', authError)
            throw new Error(`Authentication error: ${authError.message}`)
        }
        
        if (!user) {
            console.error('❌ [WALLET] User not authenticated')
            throw new Error('User not authenticated')
        }
        
        console.log('🔵 [WALLET] User authenticated:', user.id)
        
        const { error } = await supabase.from('Wallets').update(walletDetails).eq('user_id', walletDetails.user_id)

        if (error) {
            console.error('❌ [WALLET] Error updating wallet:', error)
            throw new Error(`Failed to update wallet: ${error.message}`)
        }

        console.log('✅ [WALLET] Wallet updated successfully')
    } catch (error) {
        console.error('❌ [WALLET] Error in updateWallet:', error)
        throw error
    }
}
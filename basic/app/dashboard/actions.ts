'use server'

import { Recipe, Ingredient, Preprocessing } from "@/types/types";
import { createClient } from "@/utils/supabase/server";
import { UUID } from "crypto";
import { redirect } from "next/navigation";
import { User } from "@/types/types";

export async function insertRecipes(recipe: Recipe) {
    const supabase = await createClient()

    const { error } = await supabase.from('Recipes').upsert(recipe);

    if (error) {
        // redirect('/error')
        console.log(error)
    }
}

// Batch update for Recipes using upsert + delete orphans pattern
export async function updateMultipleRecipes(user_id: UUID, recipes: Recipe[]) {
    const supabase = await createClient();
    try {
        console.log('[RECIPES] Starting upsert operation for user:', user_id);
        
        // Ensure updated_at is set for all recipes
        const recipesWithTimestamps = recipes.map(recipe => ({
            ...recipe,
            updated_at: new Date().toISOString()
        }));
        
        // Get recipe IDs that should exist
        const validRecipeIds = [...new Set(recipes.map(recipe => recipe.id))];
        console.log('[RECIPES] Valid recipe IDs:', validRecipeIds);

        // Insert/update all recipes
        const { error: upsertError } = await supabase
            .from('Recipes')
            .upsert(recipesWithTimestamps, { onConflict: 'id' });

        if (upsertError) {
            console.log('[RECIPES] Error upserting recipes:', upsertError);
            throw new Error(`Failed to upsert recipes: ${upsertError.message}`);
        }

        // Delete orphaned recipes (those belonging to this user but not in our list)
        if (validRecipeIds.length > 0) {
            const { error: deleteError } = await supabase
                .from('Recipes')
                .delete()
                .eq('user_id', user_id)
                .not('id', 'in', `(${validRecipeIds.join(',')})`);

            if (deleteError) {
                console.log('[RECIPES] Error deleting orphaned recipes:', deleteError);
                throw new Error(`Failed to delete orphaned recipes: ${deleteError.message}`);
            }
        } else {
            // If no valid recipes, delete all for this user
            const { error: deleteError } = await supabase
                .from('Recipes')
                .delete()
                .eq('user_id', user_id);

            if (deleteError) {
                console.log('[RECIPES] Error deleting all recipes:', deleteError);
                throw new Error(`Failed to delete all recipes: ${deleteError.message}`);
            }
        }

        console.log('[RECIPES] updateMultipleRecipes completed successfully');
    } catch (error) {
        console.log('[RECIPES] Error in updateMultipleRecipes:', error);
        throw error;
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
    const { data, error } = await supabase.from('Recipes').select('*').eq('user_id', user_id).order('cook_date', { ascending: true })

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

export async function updateUserDetails(userDetails: User) {
    const supabase = await createClient()

    try {
        const { error } = await supabase.from('Users').update({
            name: userDetails.name,
            gender: userDetails.gender,
            height: userDetails.height,
            weight: userDetails.weight,
            age: userDetails.age,
            updated_at: userDetails.updated_at
        }).eq('id', userDetails.id)

        if (error) {
            console.error('❌ [UPDATE_USER] Error updating user:', error)
            return { error: 'Failed to update user details' }
        }

        console.log('✅ [UPDATE_USER] Successfully updated user details')
        return { success: true }
    } catch (error) {
        console.error('❌ [UPDATE_USER] Unexpected error:', error)
        return { error: 'An unexpected error occurred while updating user' }
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

export async function updateMultipleIngredients(user_id: UUID, ingredients: Ingredient[]) {
    const supabase = await createClient();
    try {
        console.log('[INGREDIENTS] Starting upsert operation for user:', user_id);
        
        // Ensure created_at is set for all ingredients
        const ingredientsWithTimestamps = ingredients.map(ingredient => ({
            ...ingredient,
            created_at: ingredient.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));
        
        // Get recipe IDs that should exist
        const validRecipeIds = [...new Set(ingredients.map(ing => ing.recipe_id))];
        console.log('[INGREDIENTS] Valid recipe IDs:', validRecipeIds);

        // Insert/update all ingredients
        const { error: upsertError } = await supabase
            .from('Ingredients')
            .upsert(ingredientsWithTimestamps, { onConflict: 'id' });

        if (upsertError) {
            console.log('[INGREDIENTS] Error upserting ingredients:', upsertError);
            throw new Error(`Failed to upsert ingredients: ${upsertError.message}`);
        }

        // Delete orphaned ingredients (those belonging to recipe IDs not in our list)
        if (validRecipeIds.length > 0) {
            const { error: deleteError } = await supabase
                .from('Ingredients')
                .delete()
                .eq('user_id', user_id)
                .not('recipe_id', 'in', `(${validRecipeIds.join(',')})`);

            if (deleteError) {
                console.log('[INGREDIENTS] Error deleting orphaned ingredients:', deleteError);
                throw new Error(`Failed to delete orphaned ingredients: ${deleteError.message}`);
            }
        }

        console.log('[INGREDIENTS] updateMultipleIngredients completed successfully');
    } catch (error) {
        console.log('[INGREDIENTS] Error in updateMultipleIngredients:', error);
        throw error;
    }
}

// Batch update for Steps using upsert + delete orphans pattern
export async function updateMultipleSteps(user_id: UUID, steps: Array<{
    id: UUID,
    user_id: UUID,
    recipe_id: UUID,
    step_number: number,
    instruction: string,
    duration: number,
    indicator: string,
    updated_at: string
}>) {
    const supabase = await createClient();
    try {
        console.log('[STEPS] Starting upsert operation for user:', user_id);
        
        // Ensure updated_at is set for all steps
        const stepsWithTimestamps = steps.map(step => ({
            ...step,
            updated_at: new Date().toISOString()
        }));
        
        // Get recipe IDs that should exist
        const validRecipeIds = [...new Set(steps.map(step => step.recipe_id))];
        console.log('[STEPS] Valid recipe IDs:', validRecipeIds);

        // Insert/update all steps
        const { error: upsertError } = await supabase
            .from('Steps')
            .upsert(stepsWithTimestamps, { onConflict: 'id' });

        if (upsertError) {
            console.log('[STEPS] Error upserting steps:', upsertError);
            throw new Error(`Failed to upsert steps: ${upsertError.message}`);
        }

        // Delete orphaned steps (those belonging to recipe IDs not in our list)
        if (validRecipeIds.length > 0) {
            const { error: deleteError } = await supabase
                .from('Steps')
                .delete()
                .eq('user_id', user_id)
                .not('recipe_id', 'in', `(${validRecipeIds.join(',')})`);

            if (deleteError) {
                console.log('[STEPS] Error deleting orphaned steps:', deleteError);
                throw new Error(`Failed to delete orphaned steps: ${deleteError.message}`);
            }
        }

        console.log('[STEPS] updateMultipleSteps completed successfully');
    } catch (error) {
        console.log('[STEPS] Error in updateMultipleSteps:', error);
        throw error;
    }
}

// Optimized update for specific preprocessing items (avoids delete/insert all)
export async function updateSpecificPreprocessing(user_id: UUID, operation: string, ingredient: string, specific: string, completed: boolean) {
    const supabase = await createClient();
    try {
        console.log('[PREPROCESSING] Updating specific preprocessing items:', { operation, ingredient, specific, completed });
        
        const { error } = await supabase
            .from('Preprocessing')
            .update({ 
                completed,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user_id)
            .eq('operation', operation)
            .eq('ingredient_name', ingredient)
            .eq('specific', specific);

        if (error) {
            console.log('[PREPROCESSING] Error updating specific preprocessing:', error);
            throw new Error(`Failed to update preprocessing: ${error.message}`);
        }

        console.log('[PREPROCESSING] updateSpecificPreprocessing completed successfully');
    } catch (error) {
        console.log('[PREPROCESSING] Error in updateSpecificPreprocessing:', error);
        throw error;
    }
}

// Batch update for PreProcessing using upsert + delete orphans pattern
export async function updateMultiplePreprocessing(user_id: UUID, preprocessing: Preprocessing[]) {
    const supabase = await createClient();
    try {
        console.log('[PREPROCESSING] Starting upsert operation for user:', user_id);
        
        // Ensure created_at is set for all preprocessing
        const preprocessingWithTimestamps = preprocessing.map(prep => ({
            ...prep,
            created_at: prep.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));
        
        // Get recipe IDs that should exist
        const validRecipeIds = [...new Set(preprocessing.map(prep => prep.recipe_id))];
        console.log('[PREPROCESSING] Valid recipe IDs:', validRecipeIds);

        // Insert/update all preprocessing
        const { error: upsertError } = await supabase
            .from('Preprocessing')
            .upsert(preprocessingWithTimestamps, { onConflict: 'id' });

        if (upsertError) {
            console.log('[PREPROCESSING] Error upserting preprocessing:', upsertError);
            throw new Error(`Failed to upsert preprocessing: ${upsertError.message}`);
        }

        // Delete orphaned preprocessing (those belonging to recipe IDs not in our list)
        if (validRecipeIds.length > 0) {
            const { error: deleteError } = await supabase
                .from('Preprocessing')
                .delete()
                .eq('user_id', user_id)
                .not('recipe_id', 'in', `(${validRecipeIds.join(',')})`);

            if (deleteError) {
                console.log('[PREPROCESSING] Error deleting orphaned preprocessing:', deleteError);
                throw new Error(`Failed to delete orphaned preprocessing: ${deleteError.message}`);
            }
        }

        console.log('[PREPROCESSING] updateMultiplePreprocessing completed successfully');
    } catch (error) {
        console.log('[PREPROCESSING] Error in updateMultiplePreprocessing:', error);
        throw error;
    }
}

export async function deleteRecipes(user_id: UUID, recipe_id: UUID) {
    const supabase = await createClient();
    const { error } = await supabase.from('Recipes').delete().eq('user_id', user_id).eq('id', recipe_id);

    if (error) {
        redirect('/error');        
    }
}

// Delete ingredients for specific recipe IDs
export async function deleteIngredientsForRecipes(user_id: UUID, recipe_ids: UUID[]) {
    const supabase = await createClient();
    
    for (const recipe_id of recipe_ids) {
        const { error } = await supabase
            .from('Ingredients')
            .delete()
            .eq('user_id', user_id)
            .eq('recipe_id', recipe_id);

        if (error) {
            console.error(`Error deleting ingredients for recipe ${recipe_id}:`, error);
            throw new Error(`Failed to delete ingredients: ${error.message}`);
        }
    }
}

// Delete preprocessing for specific recipe IDs
export async function deletePreprocessingForRecipes(user_id: UUID, recipe_ids: UUID[]) {
    const supabase = await createClient();
    
    for (const recipe_id of recipe_ids) {
        const { error } = await supabase
            .from('Preprocessing')
            .delete()
            .eq('user_id', user_id)
            .eq('recipe_id', recipe_id);

        if (error) {
            console.error(`Error deleting preprocessing for recipe ${recipe_id}:`, error);
            throw new Error(`Failed to delete preprocessing: ${error.message}`);
        }
    }
}

// Delete steps for specific recipe IDs
export async function deleteStepsForRecipes(user_id: UUID, recipe_ids: UUID[]) {
    const supabase = await createClient();
    
    for (const recipe_id of recipe_ids) {
        const { error } = await supabase
            .from('Steps')
            .delete()
            .eq('user_id', user_id)
            .eq('recipe_id', recipe_id);

        if (error) {
            console.error(`Error deleting steps for recipe ${recipe_id}:`, error);
            throw new Error(`Failed to delete steps: ${error.message}`);
        }
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

export async function deleteAccount() {
    const supabase = await createClient()
    
    try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            console.error('❌ [DELETE_ACCOUNT] Error getting user:', userError)
            return { error: 'Failed to get user data' }
        }
        
        const userId = user.id
        console.log('🔵 [DELETE_ACCOUNT] Deleting all data for user:', userId)
        
        // Delete all user data in the correct order (respecting foreign key constraints)
        const deleteOperations = [
            supabase.from('Steps').delete().eq('user_id', userId),
            supabase.from('Preprocessing').delete().eq('user_id', userId),
            supabase.from('Ingredients').delete().eq('user_id', userId),
            supabase.from('Recipes').delete().eq('user_id', userId),
            supabase.from('Wallets').delete().eq('user_id', userId),
            supabase.from('SearchSet').delete().eq('user_id', userId),
            supabase.from('MealPlan').delete().eq('user_id', userId),
            supabase.from('Goals').delete().eq('user_id', userId),
            supabase.from('Users').delete().eq('id', userId)
        ]
        
        // Execute all delete operations and check for errors
        for (const operation of deleteOperations) {
            const { error } = await operation
            if (error) {
                console.error('❌ [DELETE_ACCOUNT] Error during deletion:', error)
                return { error: 'Failed to delete account data' }
            }
        }
        
        // Sign out the user
        const { error: signOutError } = await supabase.auth.signOut()
        
        if (signOutError) {
            console.error('❌ [DELETE_ACCOUNT] Error signing out:', signOutError)
            return { error: 'Account deleted but failed to sign out' }
        }
        
        console.log('✅ [DELETE_ACCOUNT] Successfully deleted all user data')
        return { success: true }
        
    } catch (error) {
        console.error('❌ [DELETE_ACCOUNT] Unexpected error:', error)
        return { error: 'An unexpected error occurred while deleting account' }
    }
}

export async function signOutUser() {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
        console.error('❌ [SIGN_OUT] Error signing out:', error)
        redirect('/error?error=SignOutError&error_description=Failed to sign out')
    }

    console.log('✅ [SIGN_OUT] User signed out successfully')
    redirect('/login')
}
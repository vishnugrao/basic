'use client'

import { useState } from "react";
import UserDetails from "./UserDetails";
import GoalDetails from "./GoalDetails";
import MealPlanner from "./MealPlanner";
import QuantitativeNutrition from "./QuantitativeNutrition";
import { User, Goal, MealPlan, SearchSet, Recipe, RecipeWithData, Ingredient, Preprocessing, Step, UserWallet as UserWalletType } from "@/types/types";
import { updateUserDetails, updateGoalDetails, updateMealPlanner, deleteRecipes, updateMultipleRecipes, updateMultipleIngredients, updateMultiplePreprocessing, updateSpecificPreprocessing, updateMultipleSteps, updateWallet, deleteIngredientsForRecipes, deletePreprocessingForRecipes, deleteStepsForRecipes, getWallet, signOutUser, deleteAccount, updateUserName } from "../actions";
import InlineInput from "./InlineInput";

export default function DashboardClient({ 
    initialUserDetails,
    initialGoalDetails,
    initialMealPlan,
    searchSet,
    initialRecipesDetails,
    initialIngredientDetails,
    initialPreprocessingDetails,
    initialStepsDetails,
    initialWallet
}: {
    initialUserDetails: User,
    initialGoalDetails: Goal,
    initialMealPlan: MealPlan,
    searchSet: SearchSet,
    initialRecipesDetails: Recipe[],
    initialIngredientDetails: Ingredient[],
    initialPreprocessingDetails: Preprocessing[],
    initialStepsDetails: Step[],
    initialWallet: UserWalletType
}) {
    
    const [userDetails, setUserDetails] = useState<User>(initialUserDetails);
    const [heightUnit, setHeightUnit] = useState("cm");
    const [weightUnit, setWeightUnit] = useState("kg");

    const [goalDetails, setGoalDetails] = useState<Goal>(initialGoalDetails);
    const [activityLevel, setActivityLevel] = useState<string>(() => {
        const activityLevels = {
            1.2: "Sedentary",
            1.375: "Light",
            1.55: "Moderate",
            1.725: "Very",
            1.9: "Extra"
        };
        return activityLevels[initialGoalDetails.activity_level as keyof typeof activityLevels] || "Moderate";
    });

    const [mealPlan, setMealPlan] = useState<MealPlan>(initialMealPlan);
    const [isCuisineSearchOpen, setIsCuisineSearchOpen] = useState(false);

    const [recipesDetails, setRecipesDetails] = useState<Recipe[]>(initialRecipesDetails);
    const [ingredientsDetails, setIngredientsDetails] = useState<Ingredient[]>(initialIngredientDetails);
    const [preprocessingDetails, setPreprocessingDetails] = useState<Preprocessing[]>(initialPreprocessingDetails);
    const [stepsDetails, setStepsDetails] = useState<Step[]>(initialStepsDetails);
    const [wallet, setWallet] = useState<UserWalletType>(initialWallet);
    
    const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);

    // Function to update wallet when recipes are generated
    const handleWalletUpdate = async (cost: number, requestsMade: number) => {
        const updatedWallet = {
            ...wallet,
            amount_used: wallet.amount_used + cost,
            requests_made: wallet.requests_made + requestsMade,
            updated_at: new Date().toISOString()
        };
        
        setWallet(updatedWallet);
        await updateWallet(updatedWallet);
    };

    // Function to refresh wallet data from server (for AJAX updates after payments)
    const handleWalletRefresh = async () => {
        try {
            console.log('🔵 [WALLET REFRESH] Fetching fresh wallet data via AJAX')
            const freshWalletData = await getWallet(userDetails.id);
            setWallet(freshWalletData);
            console.log('✅ [WALLET REFRESH] Wallet data refreshed successfully:', freshWalletData)
        } catch (error) {
            console.error('❌ [WALLET REFRESH] Error refreshing wallet data:', error)
            throw error; // Re-throw to allow UserWallet to handle fallback
        }
    };

    const handleUserUpdate = async (updates: Partial<User>) => {
        const updatedUser = { ...userDetails, ...updates, updated_at: new Date().toISOString() };
        setUserDetails(updatedUser);
        await updateUserDetails(updatedUser);
    };

    const handleUsernameUpdate = async (newName: string) => {
        const updatedUser = { ...userDetails, name: newName, updated_at: new Date().toISOString() };
        setUserDetails(updatedUser);
        await updateUserName({
            name: newName,
            updated_at: new Date().toISOString(),
            user_id: userDetails.id
        });
    };

    const handleSignOut = async () => {
        if (confirm('Are you sure you want to sign out?')) {
            await signOutUser();
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.')) {
            if (confirm('This will permanently delete all your recipes, meal plans, and account data. Are you absolutely sure?')) {
                await deleteAccount();
            }
        }
    };

    const handleGoalUpdate = async (updates: Partial<Goal>) => {
        const activity_level_conversion: {[id: string]: number} = {
            "Sedentary": 1.2,
            "Light": 1.375, 
            "Moderate": 1.55,
            "Very": 1.725,
            "Extra": 1.9
        };

        const updatedGoal = { 
            ...goalDetails, 
            ...updates, 
            activity_level: updates.activity_level || activity_level_conversion[activityLevel],
            updated_at: new Date().toISOString() 
        };
        setGoalDetails(updatedGoal);
        await updateGoalDetails(updatedGoal);
    };

    const handleMealPlanUpdate = async (updates: Partial<MealPlan>) => {
        const updatedMealPlan = { ...mealPlan, ...updates, updated_at: new Date().toISOString() };
        setMealPlan(updatedMealPlan);
        await updateMealPlanner(updatedMealPlan);
    };

    const handleRecipesAppend = async (addition: RecipeWithData) => {
        setRecipesDetails(currentRecipes => {
            const newRecipes = currentRecipes.length === 0 ? [addition] : [...currentRecipes, addition];
            return newRecipes;
        });
        
        // Also update the related data arrays when a new recipe is added
        if (addition.ingredients && addition.ingredients.length > 0) {
            setIngredientsDetails(currentIngredients => [...currentIngredients, ...addition.ingredients!]);
        }
        if (addition.preprocessing && addition.preprocessing.length > 0) {
            setPreprocessingDetails(currentPreprocessing => [...currentPreprocessing, ...addition.preprocessing!]);
        }
        if (addition.steps && addition.steps.length > 0) {
            setStepsDetails(currentSteps => [...currentSteps, ...addition.steps!]);
        }
    }

    const handleRecipesUpdateAll = async (updates: Recipe[]) => {
        try {
            // Use the new batch update function that handles upsert + delete orphans
            await updateMultipleRecipes(userDetails.id, updates);
            
            // Update local state
            setRecipesDetails(updates);
            console.log('Recipes database update completed successfully');
        } catch (error) {
            console.error('Error updating recipes:', error);
        }
    }

    const handleRecipesSelectiveDelete = async (recipesToDelete: Recipe[]) => {
        try {
            // Step 1: Delete selected recipes and their data
            const recipeIdsToDelete = recipesToDelete.map(recipe => recipe.id);
            
            // Delete recipes first
            await Promise.all(recipesToDelete.map(recipe =>
                deleteRecipes(recipe.user_id, recipe.id)
            ));
            
            // Delete associated data
            if (recipeIdsToDelete.length > 0) {
                await deleteIngredientsForRecipes(userDetails.id, recipeIdsToDelete);
                await deletePreprocessingForRecipes(userDetails.id, recipeIdsToDelete);
                await deleteStepsForRecipes(userDetails.id, recipeIdsToDelete);
            }

            // Step 2: Update state to remove deleted recipes and their data
            setRecipesDetails(prev => prev.filter(recipe => !recipeIdsToDelete.includes(recipe.id)));
            setIngredientsDetails(prev => prev.filter(ing => !recipeIdsToDelete.includes(ing.recipe_id)));
            setPreprocessingDetails(prev => prev.filter(prep => !recipeIdsToDelete.includes(prep.recipe_id)));
            setStepsDetails(prev => prev.filter(step => !recipeIdsToDelete.includes(step.recipe_id)));
        } catch (error) {
            console.error('Error in selective recipe delete:', error);
            throw error;
        }
    }

    const handleIngredientsUpdate = async (updates: Ingredient[]) => {
        try {
            await updateMultipleIngredients(userDetails.id, updates.map(ingredient => ({
                purchased: ingredient.purchased,
                user_id: ingredient.user_id,
                id: ingredient.id,
                recipe_id: ingredient.recipe_id,
                name: ingredient.name,
                amount: ingredient.amount,
                metric: ingredient.metric,
                created_at: ingredient.created_at,
                updated_at: new Date().toISOString()
            })));
            setIngredientsDetails(updates);
            console.log('Database update completed successfully');
        } catch (error) {
            console.error('Error updating ingredients:', error);
        }
    }; 

    const handlePreprocessingUpdate = async (updates: Preprocessing[]) => {
        try {
            await updateMultiplePreprocessing(userDetails.id, updates.map(preprocessing => ({
                id: preprocessing.id,
                user_id: preprocessing.user_id,
                recipe_id: preprocessing.recipe_id,
                ingredient_id: preprocessing.ingredient_id,
                ingredient_name: preprocessing.ingredient_name || '',
                operation: preprocessing.operation,
                specific: preprocessing.specific,
                instruction: preprocessing.instruction,
                completed: preprocessing.completed ?? false,
                updated_at: new Date().toISOString(),
                created_at: preprocessing.created_at || new Date().toISOString()
            })));
            setPreprocessingDetails(updates);
            console.log('Preprocessing database update completed successfully');
        } catch (error) {
            console.error('Error updating preprocessing:', error);
        }
    }

    // Optimized preprocessing update for specific items
    const handleSpecificPreprocessingUpdate = async (operation: string, ingredient: string, specific: string, completed: boolean) => {
        try {
            await updateSpecificPreprocessing(userDetails.id, operation, ingredient, specific, completed);
            
            // Update local state to reflect the change
            setPreprocessingDetails(prevPreprocessing => 
                prevPreprocessing.map(prep => {
                    if (prep.operation === operation && 
                        prep.ingredient_name === ingredient && 
                        prep.specific === specific) {
                        return { ...prep, completed };
                    }
                    return prep;
                })
            );
            console.log('Specific preprocessing database update completed successfully');
        } catch (error) {
            console.error('Error updating specific preprocessing:', error);
        }
    }

    const handleStepsUpdate = async (updates: Step[]) => {
        try {
            await updateMultipleSteps(userDetails.id, updates.map(step => ({
                id: step.id,
                user_id: step.user_id,
                recipe_id: step.recipe_id,
                step_number: step.step_number,
                instruction: step.instruction,
                duration: step.duration,
                indicator: step.indicator,
                updated_at: new Date().toISOString()
            })));
            setStepsDetails(updates);
            console.log('Steps database update completed successfully');
        } catch (error) {
            console.error('Error updating steps:', error);
        }
    }

    return (
        <div className="flex flex-col">
            <div className="px-10 pt-10 pb-5 flex">
                <div className="flex-auto flex items-center">
                    <span className="text-2xl mr-2">Hello</span>
                    <div className="text-2xl">
                        <InlineInput 
                            text={userDetails.name} 
                            onSetText={handleUsernameUpdate} 
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4 mr-4">
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Sign Out
                    </button>
                    <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete Account
                    </button>
                </div>
                <UserDetails 
                    userDetails={userDetails}
                    heightUnit={heightUnit}
                    weightUnit={weightUnit}
                    setHeightUnit={setHeightUnit}
                    setWeightUnit={setWeightUnit}
                    onUpdate={handleUserUpdate}
                />
            </div>
            <div className="px-10 flex">
                <p className="flex-auto"></p>
                <GoalDetails 
                    goalDetails={goalDetails}
                    activityLevel={activityLevel}
                    setActivityLevel={setActivityLevel}
                    onUpdate={handleGoalUpdate}
                />
            </div>
            <div className="flex p-10 flex-col">
                <p className="flex flex-auto text-2xl pb-10">Meal Plan</p>
                <MealPlanner 
                    mealPlan={mealPlan}
                    searchSet={searchSet}
                    wallet={wallet}
                    isCuisineSearchOpen={isCuisineSearchOpen}
                    setIsCuisineSearchOpen={setIsCuisineSearchOpen}
                    onUpdate={handleMealPlanUpdate}
                    onWalletRefresh={handleWalletRefresh}
                />
            </div>
            <div className="p-10 pt-20">
                <QuantitativeNutrition 
                    userDetails={userDetails} 
                    goalDetails={goalDetails}
                    mealPlan={mealPlan}
                    searchSet={searchSet}
                    recipesDetails={recipesDetails}
                    ingredientsDetails={ingredientsDetails}
                    preprocessingDetails={preprocessingDetails}
                    stepsDetails={stepsDetails}
                    onAppend={handleRecipesAppend}
                    onUpdateAll={handleRecipesUpdateAll}
                    onSelectiveDelete={handleRecipesSelectiveDelete}
                    isShoppingListOpen={isShoppingListOpen}
                    setIsShoppingListOpen={setIsShoppingListOpen}
                    onUpdateShoppingList={handleIngredientsUpdate}
                    onUpdatePreprocessing={handlePreprocessingUpdate}
                    onUpdateSpecificPreprocessing={handleSpecificPreprocessingUpdate}
                    onUpdateSteps={handleStepsUpdate}
                    onWalletUpdate={handleWalletUpdate}
                    wallet={wallet}
                />
            </div>
        </div>
    );
} 
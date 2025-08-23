'use client'

import { Goal, Ingredient, MealPlan, Recipe, RecipeWithData, User, Preprocessing, Step, UserWallet } from "@/types/types";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import ShoppingList from "./ShoppingList";
import PreprocessingList from "./PreprocessingList";
import RecipeDisplay from "./RecipeDisplay";
import CuisineInput from "./CuisineInput";
import BubbleInput from "./BubbleInput";

// Simple mutex implementation for JavaScript
class Mutex {
    private queue: Array<() => void> = [];
    private locked = false;

    async lock(): Promise<void> {
        return new Promise((resolve) => {
            if (this.locked) {
                this.queue.push(resolve);
            } else {
                this.locked = true;
                resolve();
            }
        });
    }

    unlock(): void {
        if (this.queue.length > 0) {
            const next = this.queue.shift()!;
            next();
        } else {
            this.locked = false;
        }
    }
}

// Create skeleton recipe for loading state
const createSkeletonRecipe = (index: number, cookDate: Date, userId: string): Recipe => ({
    id: `00000000-0000-0000-0000-skeleton${index.toString().padStart(6, '0')}-${Date.now()}` as `${string}-${string}-${string}-${string}-${string}`,
    user_id: userId as `${string}-${string}-${string}-${string}-${string}`,
    recipe_name: `Generating recipe ${index + 1}...`,
    cook_date: cookDate,
    cuisine: 'Loading...',
    protein: 0,
    fat: 0,
    calories: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
});

export default function QuantitativeNutrition(props: {
    userDetails: User,
    goalDetails: Goal, 
    mealPlan: MealPlan, 
    searchSet: { searchSet: string[] },
    recipesDetails: Recipe[], 
    ingredientsDetails: Ingredient[], 
    preprocessingDetails: Preprocessing[], 
    stepsDetails: Step[], 
    onUpdateAll: (updates: Recipe[]) => Promise<void>, 
    onAppend: (addition: RecipeWithData) => Promise<void>, 
    onSelectiveDelete: (recipesToDelete: Recipe[]) => Promise<void>,
    isShoppingListOpen: boolean, 
    setIsShoppingListOpen: Dispatch<SetStateAction<boolean>>, 
    onUpdateShoppingList: (updates: Ingredient[]) => Promise<void>, 
    onUpdatePreprocessing: (updates: Preprocessing[]) => Promise<void>, 
    onUpdateSpecificPreprocessing?: (operation: string, ingredient: string, specific: string, completed: boolean) => Promise<void>,
    onUpdateSteps: (updates: Step[]) => Promise<void>,
    onWalletUpdate: (cost: number, requestsMade: number) => Promise<void>,
    wallet: UserWallet
}) {
    const { userDetails, goalDetails, mealPlan, searchSet, recipesDetails, 
        ingredientsDetails, preprocessingDetails, stepsDetails, 
        isShoppingListOpen, setIsShoppingListOpen, onUpdateShoppingList, 
        onUpdatePreprocessing, onUpdateSpecificPreprocessing, onUpdateSteps, onWalletUpdate, wallet, onSelectiveDelete } = props;
    
    // Local state for optimized operations
    const [localRecipes, setLocalRecipes] = useState<Recipe[]>(recipesDetails);
    const [localIngredients, setLocalIngredients] = useState<Ingredient[]>(ingredientsDetails);
    const [localPreprocessing, setLocalPreprocessing] = useState<Preprocessing[]>(preprocessingDetails);
    const [localSteps, setLocalSteps] = useState<Step[]>(stepsDetails);
    const [stateMutex] = useState(new Mutex());
    
    // Sync local state with props when they change from external sources
    useEffect(() => {
        setLocalRecipes(recipesDetails);
    }, [recipesDetails]);
    
    useEffect(() => {
        setLocalIngredients(ingredientsDetails);
    }, [ingredientsDetails]);
    
    useEffect(() => {
        setLocalPreprocessing(preprocessingDetails);
    }, [preprocessingDetails]);
    
    useEffect(() => {
        setLocalSteps(stepsDetails);
    }, [stepsDetails]);

    const [tdee, setTDEE] = useState(0);
    const [offset, setOffset] = useState(0);
    const [protein, setProtein] = useState(0);
    const [fat, setFat] = useState(0);
    const [dailyBreakfastCalories, setDailyBreakfastCalories] = useState(0);
    const [dailyBreakfastProtein, setDailyBreakfastProtein] = useState(0);
    const [dailyBreakfastFat, setDailyBreakfastFat] = useState(0);
    const dailySnackCalories = 300;
    const [isLoading, setIsLoading] = useState(false);
    const [customCuisine, setCustomCuisine] = useState("...");
    const [isPreprocessingOpen, setIsPreprocessingOpen] = useState(false);
    const [loadingRecipes, setLoadingRecipes] = useState<boolean[]>([false, false, false, false]);
    const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set());
    const [isInsufficientBalanceOpen, setIsInsufficientBalanceOpen] = useState(false);
    const [requiredAmount, setRequiredAmount] = useState(0);
    const [isCuisinePopupOpen, setIsCuisinePopupOpen] = useState(false);
    const [selectedRerollCuisines, setSelectedRerollCuisines] = useState<string[]>(mealPlan.cuisines);

    // Current balance
    const currentBalance = wallet.amount_paid - wallet.amount_used;

    // Check if user has sufficient balance for an operation
    const checkBalance = (requiredCost: number): boolean => {
        return currentBalance >= requiredCost;
    };

    // Show insufficient balance popup
    const showInsufficientBalancePopup = (cost: number) => {
        setRequiredAmount(cost);
        setIsInsufficientBalanceOpen(true);
    };







    const toggleShoppingList = () => {
        setIsShoppingListOpen(!isShoppingListOpen);
    }

    const closeShoppingList = async () => {
        setIsShoppingListOpen(false);
        // The overall list is now managed separately from individual recipe data
    }

    // Toggle all instances of an ingredient across all recipes
    const toggleAllInstances = async (name: string, metric: string, purchased: boolean) => {
        const updatedIngredients = localIngredients.map(ingredient => {
            if (ingredient.name.toLowerCase() === name.toLowerCase() && ingredient.metric === metric) {
                return { ...ingredient, purchased };
            }
            return ingredient;
        });
        
        setLocalIngredients(updatedIngredients);
        await onUpdateShoppingList(updatedIngredients);
    }

    // Toggle all instances of a preprocessing step across all recipes
    const toggleAllPreprocessingInstances = async (operation: string, ingredient: string, specific: string, completed: boolean) => {
        // Use optimized specific update if available, otherwise fall back to bulk update
        if (onUpdateSpecificPreprocessing) {
            await onUpdateSpecificPreprocessing(operation, ingredient, specific, completed);
        } else {
            const updatedPreprocessing = localPreprocessing.map(prep => {
                if (prep.operation === operation && prep.ingredient_name === ingredient && prep.specific === specific) {
                    return { ...prep, completed };
                }
                return prep;
            });
            
            setLocalPreprocessing(updatedPreprocessing);
            await onUpdatePreprocessing(updatedPreprocessing);
        }
    }

    const togglePreprocessing = () => {
        setIsPreprocessingOpen(!isPreprocessingOpen);
    }

    const closePreprocessingList = async () => {
        setIsPreprocessingOpen(false);
        // The overall list is now managed separately from individual recipe data
        console.log('onUpdatePreprocessing completed');
    }

    // Aggregate shopping list logic - track purchased amounts and only mark as purchased when ALL instances are purchased
    const aggregateShoppingList = (allIngredients: Ingredient[]): Ingredient[] => {
        const aggregated: { [key: string]: Ingredient[] } = {};
        
        // Group ingredients by name and metric
        allIngredients.forEach(ingredient => {
            const key = `${ingredient.name.toLowerCase()}-${ingredient.metric}`;
            if (!aggregated[key]) {
                aggregated[key] = [];
            }
            aggregated[key].push(ingredient);
        });

        // Create aggregated list with purchased amount tracking
        const result: Ingredient[] = [];
        Object.values(aggregated).forEach(group => {
            const allPurchased = group.every(ing => ing.purchased);
            const totalAmount = group.reduce((sum, ing) => sum + ing.amount, 0);
            const purchasedAmount = group.reduce((sum, ing) => sum + (ing.purchased ? ing.amount : 0), 0);
            
            // Use the first ingredient as template, but sum amounts and track purchased amounts
            const aggregatedIngredient: Ingredient = {
                ...group[0],
                amount: totalAmount,
                purchased: allPurchased,
                // Add a custom property to track purchased amount for display
                purchasedAmount: purchasedAmount
            } as Ingredient & { purchasedAmount: number };
            
            result.push(aggregatedIngredient);
        });

        return result;
    };

    // Aggregate preprocessing logic - only mark as completed when ALL instances are completed
    const aggregatePreprocessingList = (allPreprocessing: Preprocessing[]): Preprocessing[] => {
        const aggregated: { [key: string]: Preprocessing[] } = {};
        
        // Group preprocessing by operation and instruction
        allPreprocessing.forEach(prep => {
            const key = `${prep.operation}-${prep.instruction}-${prep.specific}`;
            if (!aggregated[key]) {
                aggregated[key] = [];
            }
            aggregated[key].push(prep);
        });

        // Create aggregated list with "all or nothing" logic and completion tracking
        const result: Preprocessing[] = [];
        Object.values(aggregated).forEach(group => {
            const allCompleted = group.every(prep => prep.completed);
            const completedCount = group.filter(prep => prep.completed).length;
            const totalCount = group.length;
            
            // Use the first preprocessing as template, but check all completed and add tracking info
            const aggregatedPreprocessing: Preprocessing = {
                ...group[0],
                completed: allCompleted,
                completedCount: completedCount,
                totalCount: totalCount,
                ids: group.map(prep => prep.id),
                recipe_ids: group.map(prep => prep.recipe_id)
            };
            
            result.push(aggregatedPreprocessing);
        });

        return result;
    };

    // Update individual recipe data (keep as individual items)
    const updateIndividualRecipeData = async (updatedIngredients: Ingredient[], updatedPreprocessing: Preprocessing[]) => {
        setLocalIngredients(updatedIngredients);
        setLocalPreprocessing(updatedPreprocessing);
        await onUpdateShoppingList(updatedIngredients);
        await onUpdatePreprocessing(updatedPreprocessing);
    };

    // Update overall shopping list based on individual recipe states
    const updateOverallShoppingList = async () => {
        // The overall list is now updated automatically by passing aggregated data to the components
        // No need to manually update since the components receive aggregated data directly
    };

    // Update overall preprocessing list based on individual recipe states
    const updateOverallPreprocessingList = async () => {
        // The overall list is now updated automatically by passing aggregated data to the components
        // No need to manually update since the components receive aggregated data directly
    };

    // Sync individual recipe updates with overall state
    const syncIndividualRecipeUpdate = async (updatedIngredients: Ingredient[], updatedPreprocessing: Preprocessing[]) => {
        // Update the individual recipe data (keep as individual items)
        await updateIndividualRecipeData(updatedIngredients, updatedPreprocessing);
        
        // Note: The overall lists will be updated automatically when the individual data changes
        // since they are derived from the individual recipe data
    };

    useEffect(() =>  {
        const bmrConstant = userDetails.gender == "Male" ? 5 : -161;
        const basalMetabolicRate = 10 * userDetails.weight + 6.25 * userDetails.height - 5 * userDetails.age + bmrConstant;
        setTDEE(Math.round(basalMetabolicRate * goalDetails.activity_level / 50) * 50);
    }, [userDetails.gender, userDetails.weight, userDetails.height, userDetails.age, goalDetails.activity_level])

    useEffect(() => {
        if (goalDetails.goal == "Bulk") {
            setOffset(0.15 * tdee);
            setProtein(Math.min(Math.round(1.9 * userDetails.weight), userDetails.height + 20));
            setFat(Math.round((0.25 * (tdee + offset)) / 9));
        }
        if (goalDetails.goal == "Shred") {
            setOffset(-0.2 * tdee);
            setProtein(Math.min(Math.round(2.1 * userDetails.weight), userDetails.height + 20));
            setFat(Math.round((0.21 * (tdee + offset)) / 9));
        }
        if (goalDetails.goal == "Recomp") {
            setOffset(0);
            setProtein(Math.min(Math.round(1.9 * userDetails.weight), userDetails.height + 20));
            setFat(Math.round((0.23 * (tdee + offset))/9));
        }
    }, [goalDetails.goal, tdee, userDetails.weight, offset, userDetails.height])

    useEffect(() => {
        setDailyBreakfastCalories(Math.round(0.2 * (tdee + offset - dailySnackCalories)));
        setDailyBreakfastProtein(Math.round(0.1 * (protein)));
        setDailyBreakfastFat(Math.round(0.2 * (fat)));
    }, [tdee, offset, protein, fat])

    // Get cuisines to use for recipe generation
    const getCuisinesForGeneration = (): string[] => {
        if (customCuisine && customCuisine !== "..." && customCuisine.trim() !== "") {
            const trimmedCuisine = customCuisine.trim();
            if (mealPlan.cuisines.includes(trimmedCuisine)) {
                return [trimmedCuisine];
            }
        }
        // Return top 4 cuisines if available, else all
        return mealPlan.cuisines.slice(0, 4);
    };

    // Toggle recipe selection
    const toggleRecipeSelection = (index: number) => {
        setSelectedRecipes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // Select all recipes
    const selectAllRecipes = () => {
        setSelectedRecipes(new Set(localRecipes.map((_, index) => index)));
    };

    // Deselect all recipes
    const deselectAllRecipes = () => {
        setSelectedRecipes(new Set());
    };

    // Generate single recipe for optimized rollRecipes
    const generateSingleRecipeOptimized = async (
        index: number,
        targetCalories: number, 
        targetProtein: number, 
        targetFat: number, 
        cookDate: Date,
        existingRecipeNames: Recipe[],
        cuisinesToUse?: string[]
    ): Promise<{ recipe: Recipe, ingredients: Ingredient[], preprocessing: Preprocessing[], steps: Step[] }> => {
        try {
            const response = await fetch('/api/recipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userDetails,
                    goalDetails,
                    cuisines: cuisinesToUse || getCuisinesForGeneration(),
                    existingRecipes: existingRecipeNames,
                    calorieTarget: targetCalories,
                    proteinTarget: targetProtein,
                    fatTarget: targetFat,
                    cookDate: cookDate,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate recipe');
            }

            const data = await response.json();
            const recipe = data.recipe;
            const ingredients = data.ingredients || [];
            const preprocessing = data.preprocessing || [];
            const steps = data.steps || [];

            console.log(`🌟 [RECIPE ${index + 1}] API Response received:`, {
                recipeId: recipe?.id,
                recipeName: recipe?.recipe_name,
                ingredientsCount: ingredients.length,
                preprocessingCount: preprocessing.length,
                stepsCount: steps.length
            });

            if (!recipe || typeof recipe !== 'object') {
                throw new Error('Invalid recipe data received');
            }

            // Ensure proper recipe IDs on related data
            const ingredientsWithRecipeId = ingredients.map((ing: Ingredient) => ({ ...ing, recipe_id: recipe.id }));
            const preprocessingWithRecipeId = preprocessing.map((prep: Preprocessing) => ({ ...prep, recipe_id: recipe.id }));
            const stepsWithRecipeId = steps.map((step: Step) => ({ ...step, recipe_id: recipe.id }));

            // Lock state and append to local state
            console.log(`🔒 [RECIPE ${index + 1}] Attempting to acquire mutex...`);
            await stateMutex.lock();
            console.log(`✅ [RECIPE ${index + 1}] Mutex acquired, updating state...`);
            try {
                console.log(`🔄 [RECIPE ${index + 1}] Adding to local state:`, {
                    recipeId: recipe.id,
                    ingredientsCount: ingredientsWithRecipeId.length,
                    preprocessingCount: preprocessingWithRecipeId.length,
                    stepsCount: stepsWithRecipeId.length
                });

                setLocalRecipes(prev => {
                    const newRecipes = [...prev];
                    newRecipes[index] = recipe;
                    console.log(`🔄 [RECIPE ${index + 1}] setLocalRecipes called`);
                    return newRecipes;
                });
                setLocalIngredients(prev => {
                    const newIngredients = [...prev, ...ingredientsWithRecipeId];
                    console.log(`🔄 [RECIPE ${index + 1}] Local ingredients count after update:`, newIngredients.length);
                    return newIngredients;
                });
                setLocalPreprocessing(prev => {
                    const newPreprocessing = [...prev, ...preprocessingWithRecipeId];
                    console.log(`🔄 [RECIPE ${index + 1}] Local preprocessing count after update:`, newPreprocessing.length);
                    return newPreprocessing;
                });
                setLocalSteps(prev => {
                    const newSteps = [...prev, ...stepsWithRecipeId];
                    console.log(`🔄 [RECIPE ${index + 1}] Local steps count after update:`, newSteps.length);
                    return newSteps;
                });
                
                // Update loading state for this specific recipe
                setLoadingRecipes(prev => {
                    const newState = [...prev];
                    newState[index] = false;
                    return newState;
                });
                console.log(`✅ [RECIPE ${index + 1}] All state updates called successfully`);
            } finally {
                console.log(`🔓 [RECIPE ${index + 1}] Releasing mutex...`);
                stateMutex.unlock();
                console.log(`✅ [RECIPE ${index + 1}] Mutex released`);
            }

            return { recipe, ingredients: ingredientsWithRecipeId, preprocessing: preprocessingWithRecipeId, steps: stepsWithRecipeId };
        } catch (error) {
            // Update loading state for this specific recipe even on error
            setLoadingRecipes(prev => {
                const newState = [...prev];
                newState[index] = false;
                return newState;
            });
            console.error(`Error generating recipe ${index + 1}:`, error);
            throw error;
        }
    };





    const rollRecipes = async (targetCalories: number, targetProtein: number, targetFat: number) => {
        console.log('🎲 [ROLLRECIPES] Starting rollRecipes function', { targetCalories, targetProtein, targetFat });
        const requiredCost = 0.12; // A full meal plan costs 12 cents
        if (!checkBalance(requiredCost)) {
            showInsufficientBalancePopup(requiredCost);
            return;
        }

        console.log('💰 [ROLLRECIPES] Balance check passed, starting generation');
        setIsLoading(true);
        setLoadingRecipes([true, true, true, true]);

        try {
            // Clear local state immediately when button is pressed
            console.log('🗑️ [ROLLRECIPES] Clearing local state...');
            setLocalRecipes([]);
            setLocalIngredients([]);
            setLocalPreprocessing([]);
            setLocalSteps([]);
            console.log('🗑️ [ROLLRECIPES] Local state cleared');

            if (!mealPlan?.cuisines) {
                throw new Error('Meal plan or cuisines not available');
            }

            // Calculate unique cook dates to preserve order
            const baseDates = [
                new Date(new Date().setDate(new Date().getDate() + 1)), // Sunday cook
                new Date(new Date().setDate(new Date().getDate() + 1)), // Sunday cook  
                new Date(new Date().setDate(new Date().getDate() + 4)), // Wednesday cook
                new Date(new Date().setDate(new Date().getDate() + 5))  // Thursday cook
            ];
            
            // Add unique time offsets to preserve order within same cooking day
            const cookDates = baseDates.map((date, index) => {
                const uniqueDate = new Date(date);
                uniqueDate.setMinutes(uniqueDate.getMinutes() + index); // Add minutes offset for ordering
                return uniqueDate;
            });

            const mealTypes: [number, number, number, Date][] = [
                // Sunday cook - Lunch M,T,W
                [Math.round(3 * 0.5 * targetCalories), Math.round(3 * 0.6 * targetProtein), Math.round(3 * 0.5 * targetFat), cookDates[0]], 
                // Sunday cook - Dinner S,M,T,W
                [Math.round(4 * 0.5 * targetCalories), Math.round(4 * 0.6 * targetProtein), Math.round(4 * 0.5 * targetFat), cookDates[1]], 
                // Wednesday cook - Lunch T,F,S,S
                [Math.round(3 * 0.3 * targetCalories), Math.round(3 * 0.3 * targetProtein), Math.round(3 * 0.3 * targetFat), cookDates[2]], 
                // Thursday cook - Dinner T,F,S
                [Math.round(4 * 0.3 * targetCalories), Math.round(4 * 0.3 * targetProtein), Math.round(4 * 0.3 * targetFat), cookDates[3]]
            ];

            // Initialize local recipes array with skeleton recipes
            const skeletonRecipes = cookDates.map((date, index) => 
                createSkeletonRecipe(index, date, userDetails.id)
            );
            console.log('🦴 [ROLLRECIPES] Setting skeleton recipes:', skeletonRecipes.length);
            setLocalRecipes(skeletonRecipes);
            console.log('🦴 [ROLLRECIPES] Skeleton recipes set');

            const existingRecipeNames: Recipe[] = [];

            // Generate 4 recipes in parallel, one on each thread
            const recipePromises = mealTypes.map(async (mealType, index) => {
                return generateSingleRecipeOptimized(
                    index,
                    mealType[0],
                    mealType[1], 
                    mealType[2],
                    mealType[3],
                    existingRecipeNames
                );
            });

            // Await all threads to finish and collect the generated recipe data
            console.log('⏳ [ROLLRECIPES] Waiting for all recipe generation threads to complete...');
            const generatedRecipeResults = await Promise.all(recipePromises);
            console.log('✅ [ROLLRECIPES] All recipe generation threads completed');
            console.log('🔍 [ROLLRECIPES] Generated recipe results:', generatedRecipeResults.map(result => ({
                recipeId: result?.recipe?.id,
                recipeName: result?.recipe?.recipe_name,
                ingredientsCount: result?.ingredients?.length || 0,
                preprocessingCount: result?.preprocessing?.length || 0,
                stepsCount: result?.steps?.length || 0
            })));
            
            // Build commit arrays directly from the returned data instead of relying on local state
            console.log('💾 [ROLLRECIPES] Building commit arrays from generated results...');
            const recipesToCommit = generatedRecipeResults
                .filter(result => result && result.recipe && result.recipe.id)
                .map(result => result.recipe);
            
            const ingredientsToCommit = generatedRecipeResults
                .filter(result => result && result.ingredients)
                .flatMap(result => result.ingredients);
                
            const preprocessingToCommit = generatedRecipeResults
                .filter(result => result && result.preprocessing)
                .flatMap(result => result.preprocessing);
                
            const stepsToCommit = generatedRecipeResults
                .filter(result => result && result.steps)
                .flatMap(result => result.steps);
                
            console.log('🔍 [ROLLRECIPES] Commit arrays built:', {
                recipesCount: recipesToCommit.length,
                ingredientsCount: ingredientsToCommit.length,
                preprocessingCount: preprocessingToCommit.length,
                stepsCount: stepsToCommit.length
            });

            // Since we built arrays directly from generated results, they should already be valid (no skeleton recipes)
            console.log('🔍 [ROLLRECIPES] Final recipes to commit:', recipesToCommit.map(r => ({ id: r.id, name: r.recipe_name })));
            const validRecipes = recipesToCommit;
            const validIngredients = ingredientsToCommit;
            const validPreprocessing = preprocessingToCommit;  
            const validSteps = stepsToCommit;

            console.log('📊 [ROLLRECIPES] Committing to database:', {
                recipesCount: validRecipes.length,
                ingredientsCount: validIngredients.length,
                preprocessingCount: validPreprocessing.length,
                stepsCount: validSteps.length
            });

            // Atomic commit: Insert new recipes and keep track of recipe-id, then remove everything except those tracked recipe ids
            await props.onUpdateAll(validRecipes);
            await onUpdateShoppingList(validIngredients);
            await onUpdatePreprocessing(validPreprocessing);
            await onUpdateSteps(validSteps);
            
            // Update local state to reflect the committed data (in case state updates from threads didn't propagate)
            console.log('🔄 [ROLLRECIPES] Updating local state to match committed data...');
            setLocalRecipes(validRecipes);
            setLocalIngredients(validIngredients);
            setLocalPreprocessing(validPreprocessing);
            setLocalSteps(validSteps);
            
            // Update wallet after successful generation (4 recipes = 12 cents)
            await onWalletUpdate(0.12, 4);
            
            console.log('✅ [ROLLRECIPES] Successfully generated new meal plan and committed to database!');
        } catch (error) {
            console.error('❌ [ROLLRECIPES]', error instanceof Error ? error.message : 'Failed to generate meal plan');
            console.error('❌ [ROLLRECIPES] Full error:', error);
        } finally {
            setIsLoading(false);
        }
    };



    const rerollSelectedRecipes = async () => {
        if (selectedRecipes.size === 0) {
            // No recipes selected, nothing to reroll
            return;
        }

        // Check balance before proceeding (selected recipes * 5 cents each)
        const requiredCost = selectedRecipes.size * 0.05;
        if (!checkBalance(requiredCost)) {
            showInsufficientBalancePopup(requiredCost);
            return;
        }

        // Get selected indices and clear selection
        const selectedIndices = Array.from(selectedRecipes);
        setSelectedRecipes(new Set()); // Clear selection immediately

        setIsLoading(true);
        const loadingStates = [...loadingRecipes];
        selectedIndices.forEach(index => {
            loadingStates[index] = true;
        });
        setLoadingRecipes(loadingStates);

        try {
            // Get IDs from the ORIGINAL recipesDetails (not local state) to ensure accuracy
            const selectedRecipeIds = selectedIndices.map(index => recipesDetails[index]?.id).filter(Boolean) as string[];
            const originalCookDates = selectedIndices.map(index => localRecipes[index]?.cook_date).filter((date): date is Date => Boolean(date));
            const recipesToDelete = selectedIndices.map(index => recipesDetails[index]).filter(Boolean);
            
            console.log('🔄 [REROLLSELECTED] Selected recipe IDs to remove data for:', selectedRecipeIds);
            console.log('🔄 [REROLLSELECTED] Current local ingredients count:', localIngredients.length);
            console.log('🔄 [REROLLSELECTED] Current local steps count:', localSteps.length);
            console.log('🔄 [REROLLSELECTED] Current local preprocessing count:', localPreprocessing.length);
            
            // Immediately replace selected recipes with skeleton recipes (maintain array structure)
            setLocalRecipes(prev => {
                const newRecipes = [...prev];
                selectedIndices.forEach((index, i) => {
                    const skeletonRecipe = createSkeletonRecipe(index, originalCookDates[i], userDetails.id);
                    newRecipes[index] = skeletonRecipe;
                });
                return newRecipes;
            });
            
            // Remove related data ONLY for the selected recipes (using original recipe IDs)
            setLocalIngredients(prev => {
                const filtered = prev.filter(ing => !selectedRecipeIds.includes(ing.recipe_id));
                console.log('🔄 [REROLLSELECTED] Filtered ingredients count:', filtered.length, 'removed:', prev.length - filtered.length);
                return filtered;
            });
            setLocalPreprocessing(prev => {
                const filtered = prev.filter(prep => !selectedRecipeIds.includes(prep.recipe_id));
                console.log('🔄 [REROLLSELECTED] Filtered preprocessing count:', filtered.length, 'removed:', prev.length - filtered.length);
                return filtered;
            });
            setLocalSteps(prev => {
                const filtered = prev.filter(step => !selectedRecipeIds.includes(step.recipe_id));
                console.log('🔄 [REROLLSELECTED] Filtered steps count:', filtered.length, 'removed:', prev.length - filtered.length);
                return filtered;
            });

            // Calculate nutritional targets for selected recipes
            const mealTypes: [number, number, number][] = [
                // Sunday cook - Lunch M,T,W
                [Math.round(3 * 0.5 * (tdee + offset - dailySnackCalories - dailyBreakfastCalories)), Math.round(3 * 0.6 * (protein - dailyBreakfastProtein)), Math.round(3 * 0.5 * (fat - dailyBreakfastFat))], 
                // Sunday cook - Dinner S,M,T,W
                [Math.round(4 * 0.5 * (tdee + offset - dailySnackCalories - dailyBreakfastCalories)), Math.round(4 * 0.6 * (protein - dailyBreakfastProtein)), Math.round(4 * 0.5 * (fat - dailyBreakfastFat))], 
                // Wednesday cook - Lunch T,F,S,S
                [Math.round(3 * 0.3 * (tdee + offset - dailySnackCalories - dailyBreakfastCalories)), Math.round(3 * 0.3 * (protein - dailyBreakfastProtein)), Math.round(3 * 0.3 * (fat - dailyBreakfastFat))],
                // Thursday cook - Dinner T,F,S
                [Math.round(4 * 0.3 * (tdee + offset - dailySnackCalories - dailyBreakfastCalories)), Math.round(4 * 0.3 * (protein - dailyBreakfastProtein)), Math.round(4 * 0.3 * (fat - dailyBreakfastFat))]
            ];

            // Use selected reroll cuisines for reroll
            let cuisinesToUse = selectedRerollCuisines.length > 0 ? selectedRerollCuisines : mealPlan.cuisines.slice(0, 4);
            console.log('🍜 [REROLLSELECTED] Cuisine selection details:', {
                selectedRerollCuisines: selectedRerollCuisines,
                selectedRerollCuisinesLength: selectedRerollCuisines.length,
                mealPlanCuisines: mealPlan.cuisines,
                finalCuisinesToUse: cuisinesToUse,
                willUseFallback: selectedRerollCuisines.length === 0
            });
            
            // Ensure cuisines are properly set - this should never be empty
            if (cuisinesToUse.length === 0) {
                console.warn('🍜 [REROLLSELECTED] WARNING: No cuisines available, using default');
                cuisinesToUse = ['Italian']; // Fallback to prevent empty cuisine array
            }

            // Clear historical dishes - pass empty array to prioritize cuisine selection over avoiding duplicates
            // This ensures the API focuses on the selected cuisines rather than avoiding similar recipes
            const existingRecipeNames: Recipe[] = [];

            // Generate single recipe for reroll with index management
            const generateSingleRecipeForRerollWithIndex = async (
                originalIndex: number,
                targetCalories: number, 
                targetProtein: number, 
                targetFat: number, 
                cookDate: Date,
                existingRecipeNames: Recipe[],
                cuisinesToUse?: string[]
            ) => {
                try {
                    const cuisinesToSend = cuisinesToUse || getCuisinesForGeneration();
                    console.log(`🍜 [REROLL INDEX ${originalIndex}] Sending cuisines to API:`, cuisinesToSend);
                    console.log(`🍜 [REROLL INDEX ${originalIndex}] Existing recipes count:`, existingRecipeNames.length);
                    console.log(`🍜 [REROLL INDEX ${originalIndex}] API Request payload:`, {
                        cuisines: cuisinesToSend,
                        existingRecipesCount: existingRecipeNames.length,
                        calorieTarget: targetCalories,
                        proteinTarget: targetProtein,
                        fatTarget: targetFat,
                        cookDate: cookDate
                    });
                    
                    const response = await fetch('/api/recipe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userDetails,
                            goalDetails,
                            cuisines: cuisinesToSend,
                            existingRecipes: existingRecipeNames,
                            calorieTarget: targetCalories,
                            proteinTarget: targetProtein,
                            fatTarget: targetFat,
                            cookDate: cookDate,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to generate recipe');
                    }

                    const data = await response.json();
                    const recipe = data.recipe;
                    const ingredients = data.ingredients || [];
                    const preprocessing = data.preprocessing || [];
                    const steps = data.steps || [];

                    console.log(`🌟 [REROLL INDEX ${originalIndex}] API Response received:`, {
                        recipeId: recipe?.id,
                        recipeName: recipe?.recipe_name,
                        recipeCuisine: recipe?.cuisine,
                        ingredientsCount: ingredients.length,
                        preprocessingCount: preprocessing.length,
                        stepsCount: steps.length
                    });
                    
                    console.log(`🔍 [REROLL INDEX ${originalIndex}] Full API response data:`, data);
                    console.log(`🔍 [REROLL INDEX ${originalIndex}] Recipe object:`, recipe);
                    
                    // Verify cuisine match
                    if (recipe?.cuisine && cuisinesToSend.length > 0) {
                        const cuisineMatch = cuisinesToSend.some(cuisine => 
                            recipe.cuisine.toLowerCase().includes(cuisine.toLowerCase()) ||
                            cuisine.toLowerCase().includes(recipe.cuisine.toLowerCase())
                        );
                        console.log(`🍜 [REROLL INDEX ${originalIndex}] Cuisine verification:`, {
                            requestedCuisines: cuisinesToSend,
                            receivedCuisine: recipe.cuisine,
                            isMatch: cuisineMatch
                        });
                    }

                    if (!recipe || typeof recipe !== 'object') {
                        console.error(`❌ [REROLL INDEX ${originalIndex}] Invalid recipe data:`, recipe);
                        throw new Error('Invalid recipe data received');
                    }
                    
                    if (!recipe.id || typeof recipe.id !== 'string') {
                        console.error(`❌ [REROLL INDEX ${originalIndex}] Invalid recipe ID:`, recipe.id);
                        throw new Error('Recipe ID is missing or invalid');
                    }

                    // Ensure proper recipe IDs on related data
                    const ingredientsWithRecipeId = ingredients.map((ing: Ingredient) => ({ ...ing, recipe_id: recipe.id }));
                    const preprocessingWithRecipeId = preprocessing.map((prep: Preprocessing) => ({ ...prep, recipe_id: recipe.id }));
                    const stepsWithRecipeId = steps.map((step: Step) => ({ ...step, recipe_id: recipe.id }));

                                         // Lock state and replace skeleton recipe at original index
                     console.log(`🔒 [REROLL INDEX ${originalIndex}] Attempting to acquire mutex...`);
                     await stateMutex.lock();
                     console.log(`✅ [REROLL INDEX ${originalIndex}] Mutex acquired, updating state...`);
                     try {
                         console.log(`🔄 [REROLL INDEX ${originalIndex}] Replacing skeleton at index ${originalIndex}`);
                         
                                                  // Replace the skeleton recipe at the original index
                        setLocalRecipes(prevRecipes => {
                            const newRecipes = [...prevRecipes];
                            console.log(`🔄 [REROLL INDEX ${originalIndex}] BEFORE replacement - Recipe at index ${originalIndex}:`, {
                                id: prevRecipes[originalIndex]?.id,
                                name: prevRecipes[originalIndex]?.recipe_name
                            });
                            newRecipes[originalIndex] = recipe;
                            console.log(`🔄 [REROLL INDEX ${originalIndex}] AFTER replacement - Recipe at index ${originalIndex}:`, {
                                id: recipe.id,
                                name: recipe.recipe_name
                            });
                            return newRecipes;
                        });
                         
                         setLocalIngredients(prev => {
                             const newIngredients = [...prev, ...ingredientsWithRecipeId];
                             console.log(`🔄 [REROLL INDEX ${originalIndex}] Added ${ingredientsWithRecipeId.length} ingredients`);
                             return newIngredients;
                         });
                         
                         setLocalPreprocessing(prev => {
                             const newPreprocessing = [...prev, ...preprocessingWithRecipeId];
                             console.log(`🔄 [REROLL INDEX ${originalIndex}] Added ${preprocessingWithRecipeId.length} preprocessing items`);
                             return newPreprocessing;
                         });
                         
                         setLocalSteps(prev => {
                             const newSteps = [...prev, ...stepsWithRecipeId];
                             console.log(`🔄 [REROLL INDEX ${originalIndex}] Added ${stepsWithRecipeId.length} steps`);
                             return newSteps;
                         });
                         
                         // Update loading state for the original index
                         setLoadingRecipes(prev => {
                             const newState = [...prev];
                             newState[originalIndex] = false;
                             return newState;
                         });
                         
                         console.log(`✅ [REROLL INDEX ${originalIndex}] State updates completed successfully`);
                     } finally {
                         console.log(`🔓 [REROLL INDEX ${originalIndex}] Releasing mutex...`);
                         stateMutex.unlock();
                         console.log(`✅ [REROLL INDEX ${originalIndex}] Mutex released`);
                     }

                    return { recipe, ingredients: ingredientsWithRecipeId, preprocessing: preprocessingWithRecipeId, steps: stepsWithRecipeId };
                                 } catch (error) {
                     // Update loading state even on error
                     setLoadingRecipes(prev => {
                         const newState = [...prev];
                         newState[originalIndex] = false;
                         return newState;
                     });
                     console.error(`Error generating recipe for original index ${originalIndex}:`, error);
                     console.error(`❌ [REROLL INDEX ${originalIndex}] SKELETON RECIPE NOT REPLACED DUE TO ERROR - This will be filtered out during commit!`);
                     throw error;
                 }
            };

            // Spawn separate threads for each recipe to be generated
            const recipePromises = selectedIndices.map(async (originalIndex, i) => {
                const originalCookDate = originalCookDates[i];
                const mealType = mealTypes[originalIndex];
                
                return generateSingleRecipeForRerollWithIndex(
                    originalIndex,
                    mealType[0],
                    mealType[1],
                    mealType[2],
                    originalCookDate,
                    existingRecipeNames,
                    cuisinesToUse
                );
            });

            // Wait for all recipes to complete
            const rerollResults = await Promise.all(recipePromises);
            
            // Collect all data from the reroll promises (this is the COMPLETE data)
            const newRecipes = rerollResults.map(result => result.recipe);
            const newIngredients = rerollResults.flatMap(result => result.ingredients);
            const newPreprocessing = rerollResults.flatMap(result => result.preprocessing);
            const newSteps = rerollResults.flatMap(result => result.steps);
            
            console.log('📊 [REROLLSELECTED] Collected reroll data:', {
                newRecipesCount: newRecipes.length,
                newIngredientsCount: newIngredients.length,
                newPreprocessingCount: newPreprocessing.length,
                newStepsCount: newSteps.length
            });

            // Delete original recipes from database now that new ones are ready
            await onSelectiveDelete(recipesToDelete);

            // Wait for all state updates to be applied
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Build the final state from the actual collected data instead of relying on local state
            // Combine the remaining unselected recipes with the new recipes from API responses
            const originalSelectedRecipeIds = new Set(selectedIndices.map(index => recipesDetails[index]?.id).filter(Boolean));
            
            // Get unselected recipes from current local state
            await stateMutex.lock();
            let unselectedRecipes: Recipe[];
            let unselectedIngredients: Ingredient[];
            let unselectedPreprocessing: Preprocessing[];
            let unselectedSteps: Step[];
            
            try {
                unselectedRecipes = localRecipes.filter(recipe => 
                    !originalSelectedRecipeIds.has(recipe.id) && 
                    !recipe.id.startsWith('00000000-0000-0000-0000-skeleton')
                );
                
                const unselectedRecipeIds = unselectedRecipes.map(r => r.id);
                unselectedIngredients = localIngredients.filter(ing => unselectedRecipeIds.includes(ing.recipe_id));
                unselectedPreprocessing = localPreprocessing.filter(prep => unselectedRecipeIds.includes(prep.recipe_id));
                unselectedSteps = localSteps.filter(step => unselectedRecipeIds.includes(step.recipe_id));
            } finally {
                stateMutex.unlock();
            }

            // Build final arrays preserving original order by reconstructing the complete arrays
            const finalRecipes: Recipe[] = [];
            const finalIngredients: Ingredient[] = [];
            const finalPreprocessing: Preprocessing[] = [];
            const finalSteps: Step[] = [];

            // Build recipe array preserving original order
            for (let i = 0; i < 4; i++) { // Assuming 4 recipe slots
                if (selectedIndices.includes(i)) {
                    // This slot was selected for reroll - find the corresponding new recipe
                    const correspondingNewRecipe = newRecipes[selectedIndices.indexOf(i)];
                    if (correspondingNewRecipe) {
                        finalRecipes[i] = correspondingNewRecipe;
                        
                        // Add related data for this new recipe
                        const recipeIngredients = newIngredients.filter(ing => ing.recipe_id === correspondingNewRecipe.id);
                        const recipePreprocessing = newPreprocessing.filter(prep => prep.recipe_id === correspondingNewRecipe.id);
                        const recipeSteps = newSteps.filter(step => step.recipe_id === correspondingNewRecipe.id);
                        
                        finalIngredients.push(...recipeIngredients);
                        finalPreprocessing.push(...recipePreprocessing);
                        finalSteps.push(...recipeSteps);
                    }
                } else {
                    // This slot was not selected - find the corresponding unselected recipe
                    const originalRecipe = localRecipes[i];
                    if (originalRecipe && !originalRecipe.id.startsWith('00000000-0000-0000-0000-skeleton')) {
                        finalRecipes[i] = originalRecipe;
                        
                        // Add related data for this unselected recipe
                        const recipeIngredients = unselectedIngredients.filter(ing => ing.recipe_id === originalRecipe.id);
                        const recipePreprocessing = unselectedPreprocessing.filter(prep => prep.recipe_id === originalRecipe.id);
                        const recipeSteps = unselectedSteps.filter(step => step.recipe_id === originalRecipe.id);
                        
                        finalIngredients.push(...recipeIngredients);
                        finalPreprocessing.push(...recipePreprocessing);
                        finalSteps.push(...recipeSteps);
                    }
                }
            }

            // Filter out any undefined slots and flatten
            const validFinalRecipes = finalRecipes.filter(Boolean);

            console.log('📊 [REROLLSELECTED] Final state building details:', {
                selectedIndices: selectedIndices,
                originalSelectedRecipeIds: Array.from(originalSelectedRecipeIds),
                unselectedRecipesCount: unselectedRecipes.length,
                unselectedRecipeIds: unselectedRecipes.map(r => r.id),
                newRecipesCount: newRecipes.length,
                newRecipeIds: newRecipes.map(r => r.id),
                finalRecipesCount: validFinalRecipes.length,
                finalRecipeIds: validFinalRecipes.map(r => r.id),
                preservedOrder: finalRecipes.map((r, i) => `${i}: ${r?.id || 'empty'}`)
            });

            console.log('📊 [REROLLSELECTED] Complete final state for DB commit:', {
                finalRecipesCount: validFinalRecipes.length,
                finalIngredientsCount: finalIngredients.length,
                finalPreprocessingCount: finalPreprocessing.length,
                finalStepsCount: finalSteps.length,
                recipeIds: validFinalRecipes.map(r => r.id)
            });

            // Update local state immediately with the final state to avoid temporary 0 counts
            setLocalRecipes(validFinalRecipes);
            setLocalIngredients(finalIngredients);
            setLocalPreprocessing(finalPreprocessing);
            setLocalSteps(finalSteps);

            // Commit the local recipes state to the DB atomically (drop all db entries and replace with the local state)
            console.log('💾 [REROLLSELECTED] Committing final state to database atomically...');
            await props.onUpdateAll(validFinalRecipes);
            await onUpdateShoppingList(finalIngredients);
            await onUpdatePreprocessing(finalPreprocessing);
            await onUpdateSteps(finalSteps);

            // Update wallet after all recipes are completed
            await onWalletUpdate(selectedIndices.length * 0.05, selectedIndices.length);
            
            setCustomCuisine("...");
            setSelectedRerollCuisines(mealPlan.cuisines);
            
            console.log('✅ [REROLLSELECTED] Successfully rerolled selected recipes and committed to database!');
        } catch (error) {
            console.error('❌ [REROLLSELECTED]', error instanceof Error ? error.message : 'Failed to reroll selected recipes');
            console.error('❌ [REROLLSELECTED] Full error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex">
                <div className="flex w-1/3 flex-col gap-4">
                    <p className="text-2xl">Total Daily Energy Expenditure (TDEE):&nbsp;{tdee}</p>
                    <p className="text-2xl">Daily Target:&nbsp;{tdee + offset}</p>
                    <p className="text-2xl">Protein Target:&nbsp;{protein}g</p>
                    <p className="text-2xl">Fat Target:&nbsp;{fat}g</p>
                </div>
                <div className="flex-auto"></div>
                <div className="flex w-1/3 flex-col gap-4">
                    <p className="text-2xl">Daily Snack :D :&nbsp;{dailySnackCalories}</p>
                    <p className="text-2xl">Daily Breakfast Calories:&nbsp;{dailyBreakfastCalories}</p>
                    <p className="text-2xl">Daily Breakfast Protein:&nbsp;{dailyBreakfastProtein}g</p>
                    <p className="text-2xl">Daily Breakfast Fat:&nbsp;{dailyBreakfastFat}g</p>
                </div>
                <div className="flex-auto"></div>
            </div>    
            {localRecipes.length === 0 && !isLoading && (
                <div className="flex min-h-[800px] items-center justify-center">
                    <div
                        onClick={() => {
                            rollRecipes(
                                tdee + offset - dailySnackCalories - dailyBreakfastCalories,
                                protein - dailyBreakfastProtein,
                                fat - dailyBreakfastFat)
                        }}
                        className={`border-4 border-current rounded-xl cursor-pointer text-2xl w-fit ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-disabled={isLoading}
                    >
                        <p>&nbsp;{isLoading ? 'Generating meal plan...' : 'Generate a meal plan!'}&nbsp;</p>
                    </div>
                </div>
            )}
            {(isLoading || localRecipes.length > 0) && (
                <div className="flex flex-col gap-4 pt-20">
                    {/* First row: Cuisine selection, recipe selection, and reroll selected */}
                    <div className="flex items-start w-full gap-4 mb-4">
                        <div className="flex items-baseline text-2xl w-1/3 gap-4">
                            <div className="min-w-[225px] whitespace-nowrap">Selected cuisines:&nbsp;&nbsp;</div>
                            <BubbleInput
                                currentPreferences={selectedRerollCuisines}
                                limitPreferences={4}
                            />
                            <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit ml-4"
                                onClick={() => setIsCuisinePopupOpen(true)}
                            >
                                <span>&nbsp;Change&nbsp;</span>
                            </div>
                            {isCuisinePopupOpen && (
                                                            <CuisineInput
                                cuisineSet={selectedRerollCuisines}
                                searchSet={searchSet.searchSet}
                                closeCuisineSearch={(cuisines) => {
                                    // Ensure we always have at least the default meal plan cuisines
                                    const finalCuisines = cuisines.length > 0 ? cuisines : mealPlan.cuisines.slice(0, 4);
                                    setSelectedRerollCuisines(finalCuisines);
                                    setCustomCuisine(finalCuisines.length > 0 ? finalCuisines[0] : "...");
                                    setIsCuisinePopupOpen(false);
                                    console.log('🍜 [CUISINE UPDATE] Selected reroll cuisines updated to:', finalCuisines);
                                }}
                            />
                            )}
                        </div>
                        <div className="flex-auto"></div>
                        <div className="flex gap-4 items-center ml-auto whitespace-nowrap">
                            <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                                onClick={selectAllRecipes}
                            >
                                <span>&nbsp;Select All&nbsp;</span>
                            </div>
                            <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                                onClick={deselectAllRecipes}
                            >
                                <span>&nbsp;Deselect All&nbsp;</span>
                            </div>
                            <span className="text-xl text-gray-600">
                                Selected: {selectedRecipes.size} of {localRecipes.length} recipes
                            </span>
                            <button
                                className={`border-4 border-current rounded-xl cursor-pointer text-2xl w-fit ml-4 ${isLoading || selectedRecipes.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => {
                                    if (!isLoading && selectedRecipes.size > 0) {
                                        rerollSelectedRecipes();
                                    }
                                }}
                                aria-disabled={isLoading || selectedRecipes.size === 0}
                            >
                                <span>&nbsp;Re-roll Selected ({selectedRecipes.size})&nbsp;</span>
                            </button>
                        </div>
                    </div>

                    {/* Second row: Shopping list, preprocessing, and reroll all */}
                    <div className="flex gap-4">
                        <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                            onClick={toggleShoppingList}
                        >
                            <p>&nbsp;Shopping List&nbsp;</p>
                        </div>
                        {isShoppingListOpen && <ShoppingList closeShoppingList={closeShoppingList} ingredients={aggregateShoppingList(localIngredients)} onToggleAllInstances={toggleAllInstances} />}
                        <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                            onClick={togglePreprocessing}
                        >
                            <p>&nbsp;Preprocessing&nbsp;</p>
                        </div>
                        {isPreprocessingOpen && <PreprocessingList closePreprocessingList={closePreprocessingList} preprocessing={aggregatePreprocessingList(localPreprocessing)} onToggleAllPreprocessingInstances={toggleAllPreprocessingInstances} />}
                        <div className="flex-auto"></div>
                        <div 
                            className={`border-4 border-current rounded-xl cursor-pointer text-2xl w-fit ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                                if (!isLoading) {
                                    console.log('Re-rolling all recipes');
                                    rollRecipes(
                                        tdee + offset - dailySnackCalories - dailyBreakfastCalories, 
                                        protein - dailyBreakfastProtein, 
                                        fat - dailyBreakfastFat);
                                    // setIsShoppingListOpen(true);
                                }
                            }}
                            aria-disabled={isLoading}
                        >
                            <p>&nbsp;Re-roll All&nbsp;</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        {/* Placeholders removed - using skeleton recipes in local state instead */}
                        {/* Show actual recipes (including skeleton recipes during loading) */}
                        {localRecipes.map((recipe, index) => {
                            // Skip rendering if recipe is undefined or invalid
                            if (!recipe || !recipe.id) {
                                return null;
                            }
                            
                            return (
                                <RecipeDisplay 
                                    key={recipe.id} 
                                    recipe={recipe} 
                                    ingredients={localIngredients} 
                                    preprocessing={localPreprocessing} 
                                    steps={localSteps} 
                                    recipesDetails={localRecipes} 
                                    onUpdatePreprocessing={onUpdatePreprocessing} 
                                    onUpdateSteps={onUpdateSteps} 
                                    onUpdateShoppingList={onUpdateShoppingList}
                                    onUpdateOverallShoppingList={updateOverallShoppingList}
                                    onUpdateOverallPreprocessingList={updateOverallPreprocessingList}
                                    onSyncIndividualRecipeUpdate={syncIndividualRecipeUpdate}
                                    isSelected={selectedRecipes.has(index)}
                                    onToggleSelection={() => toggleRecipeSelection(index)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Insufficient Balance Dialog */}
            {isInsufficientBalanceOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md mx-4 border-4 border-current">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-bold">Insufficient Balance</h3>
                            <button
                                onClick={() => setIsInsufficientBalanceOpen(false)}
                                className="text-2xl border-2 border-current rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-[#B1454A] hover:text-white transition-colors"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-4 text-lg">
                            <p>
                                You don&apos;t have enough balance to perform this operation.
                            </p>
                            <div className="space-y-2">
                                <p><strong>Required amount:</strong> ${requiredAmount.toFixed(2)}</p>
                                <p><strong>Current balance:</strong> ${currentBalance.toFixed(2)}</p>
                            </div>
                            <p>
                                Please top up your wallet to continue generating recipes.
                            </p>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsInsufficientBalanceOpen(false)}
                                className="border-2 border-current rounded-lg cursor-pointer text-xl px-4 py-2 hover:bg-[#B1454A] hover:text-white transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
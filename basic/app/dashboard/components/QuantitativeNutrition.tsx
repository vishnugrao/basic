'use client'

import { Goal, Ingredient, MealPlan, Recipe, RecipeWithData, User, Preprocessing, Step, UserWallet } from "@/types/types";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import ShoppingList from "./ShoppingList";
import PreprocessingList from "./PreprocessingList";
import RecipeDisplay from "./RecipeDisplay";
import CuisineInput from "./CuisineInput";
import BubbleInput from "./BubbleInput";

// Placeholder component for loading recipes
const RecipePlaceholder = ({ index }: { index: number }) => (
    <div className="relative border-2 border-gray-200 rounded-xl p-6 bg-white">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#B1454A] rounded-full animate-spin"></div>
                <p className="text-gray-600 text-sm font-medium">
                    Generating recipe {index + 1}...
                </p>
            </div>
        </div>
        <div className="opacity-50">
            <h3 className="text-xl font-semibold mb-4">Recipe Placeholder</h3>
            <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
        </div>
    </div>
);

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

    // Calculate current balance
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
        const updatedIngredients = ingredientsDetails.map(ingredient => {
            if (ingredient.name.toLowerCase() === name.toLowerCase() && ingredient.metric === metric) {
                return { ...ingredient, purchased };
            }
            return ingredient;
        });
        
        await onUpdateShoppingList(updatedIngredients);
    }

    // Toggle all instances of a preprocessing step across all recipes
    const toggleAllPreprocessingInstances = async (operation: string, ingredient: string, specific: string, completed: boolean) => {
        // Use optimized specific update if available, otherwise fall back to bulk update
        if (onUpdateSpecificPreprocessing) {
            await onUpdateSpecificPreprocessing(operation, ingredient, specific, completed);
        } else {
            const updatedPreprocessing = preprocessingDetails.map(prep => {
                if (prep.operation === operation && prep.ingredient_name === ingredient && prep.specific === specific) {
                    return { ...prep, completed };
                }
                return prep;
            });
            
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
        setSelectedRecipes(new Set(recipesDetails.map((_, index) => index)));
    };

    // Deselect all recipes
    const deselectAllRecipes = () => {
        setSelectedRecipes(new Set());
    };

    const generateSingleRecipe = async (
        index: number,
        targetCalories: number, 
        targetProtein: number, 
        targetFat: number, 
        cookDate: Date,
        existingRecipeNames: Recipe[],
        existingIngredients: Ingredient[],
        existingPreprocessing: Preprocessing[],
        existingSteps: Step[],
        cuisinesToUse?: string[]
    ) => {
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
            const ingredients = data.ingredients;
            const preprocessing = data.preprocessing;
            const steps = data.steps;

            if (!recipe || typeof recipe !== 'object') {
                throw new Error('Invalid recipe data received');
            }

            existingRecipeNames.push(recipe);
            existingIngredients.push(ingredients);
            existingPreprocessing.push(preprocessing);
            existingSteps.push(steps);

            // Generate ingredients
            if (ingredients && Array.isArray(ingredients)) {
                await fetch('/api/ingredient', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ingredients,
                    }),
                });
            }

            // Generate preprocessing
            if (preprocessing && Array.isArray(preprocessing)) {
                await fetch('/api/preprocessing', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        preprocessing,
                    }),
                });
            }

            // Generate steps
            if (steps && Array.isArray(steps)) {
                await fetch('/api/step', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        steps,
                    }),
                });
            }

            await props.onAppend({ ...recipe, ingredients, preprocessing, steps });
            return { ...recipe, ingredients, preprocessing, steps };
        } catch (error) {
            console.error(`Error generating recipe ${index + 1}:`, error);
            throw error;
        }
    };

    const rollRecipes = async (targetCalories: number, targetProtein: number, targetFat: number) => {
        const requiredCost = 0.12; // A full meal plan costs 12 cents
        if (!checkBalance(requiredCost)) {
            showInsufficientBalancePopup(requiredCost);
            return;
        }

        setIsLoading(true);
        setLoadingRecipes([true, true, true, true]);

        try {
            await props.onUpdateAll([]);
            await onUpdateShoppingList([]);
            await onUpdatePreprocessing([]);
            await onUpdateSteps([]);

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

            const existingRecipeNames: Recipe[] = [];
            const existingIngredients: Ingredient[] = [];
            const existingPreprocessing: Preprocessing[] = [];
            const existingSteps: Step[] = [];

            // Spawn parallel threads for each recipe
            const recipePromises = mealTypes.map(async (mealType, index) => {
                try {
                    const { recipe, ingredients, preprocessing, steps } = await generateSingleRecipe(
                        index,
                        mealType[0],
                        mealType[1], 
                        mealType[2],
                        mealType[3],
                        existingRecipeNames,
                        existingIngredients,
                        existingPreprocessing,
                        existingSteps
                    );

                    // Update loading state for this specific recipe
                    setLoadingRecipes(prev => {
                        const newState = [...prev];
                        newState[index] = false;
                        return newState;
                    });
                    
                    return { recipe, ingredients, preprocessing, steps };
                } catch (error) {
                    // Update loading state for this specific recipe even on error
                    setLoadingRecipes(prev => {
                        const newState = [...prev];
                        newState[index] = false;
                        return newState;
                    });
                    throw error;
                }
            });

            // Wait for all recipes to complete
            await Promise.all(recipePromises);
            
            // Update wallet after successful generation (4 recipes = 12 cents)
            await onWalletUpdate(0.12, 4);
            
            console.log('Successfully generated new meal plan!');
        } catch (error) {
            console.error(error instanceof Error ? error.message : 'Failed to generate meal plan');
            console.error('Error generating recipes:', error);
        } finally {
            setIsLoading(false);
        }
    };



    const rerollSelectedRecipes = async () => {
        if (selectedRecipes.size === 0) {
            // No recipes selected, nothing to reroll
            return;
        }

        // Check balance before proceeding (selected recipes * 3 cents each)
        const requiredCost = selectedRecipes.size * 0.03;
        if (!checkBalance(requiredCost)) {
            showInsufficientBalancePopup(requiredCost);
            return;
        }

        // Clear selection immediately to prevent index shifting issues
        const selectedIndices = Array.from(selectedRecipes);
        setSelectedRecipes(new Set());

        setIsLoading(true);
        const loadingStates = [...loadingRecipes];
        selectedIndices.forEach(index => {
            loadingStates[index] = true;
        });
        setLoadingRecipes(loadingStates);

        try {
            // Preserve original cook dates from existing recipes
            const originalCookDates = selectedIndices.map(index => recipesDetails[index].cook_date);
            
            // First, delete the selected recipes from the database
            const recipesToDelete = selectedIndices.map(index => recipesDetails[index]).filter(Boolean);
            await onSelectiveDelete(recipesToDelete);

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
            const cuisinesToUse = selectedRerollCuisines.length > 0 ? selectedRerollCuisines : mealPlan.cuisines.slice(0, 4);

            // Build existing recipe names for context (excluding selected ones)
            const existingRecipeNames: Recipe[] = recipesDetails.filter((_, index) => !selectedIndices.includes(index));
            
            const newRecipesData = new Map();

            // Generate each recipe's data individually, preserving original order and cook dates
            for (let i = 0; i < selectedIndices.length; i++) {
                const index = selectedIndices[i];
                const originalCookDate = originalCookDates[i];
                
                try {
                    const mealType = mealTypes[index];
                    
                    // Call the recipe API to generate data only
                    const response = await fetch('/api/recipe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userDetails,
                            goalDetails,
                            cuisines: cuisinesToUse,
                            existingRecipes: existingRecipeNames,
                            calorieTarget: mealType[0],
                            proteinTarget: mealType[1],
                            fatTarget: mealType[2],
                            cookDate: originalCookDate, // Use the original cook date to preserve order
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

                    if (!recipe || typeof recipe !== 'object') {
                        throw new Error('Invalid recipe data received');
                    }

                    existingRecipeNames.push(recipe);
                    newRecipesData.set(index, { recipe, ingredients, preprocessing, steps });

                    // Save new recipe data to database individually
                    await fetch('/api/ingredient', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ingredients }),
                    });

                    await fetch('/api/preprocessing', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ preprocessing }),
                    });

                    await fetch('/api/step', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ steps }),
                    });

                    // Update loading state for this specific recipe
                    setLoadingRecipes(prev => {
                        const newState = [...prev];
                        newState[index] = false;
                        return newState;
                    });
                    
                } catch (error) {
                    setLoadingRecipes(prev => {
                        const newState = [...prev];
                        newState[index] = false;
                        return newState;
                    });
                    throw error;
                }
            }

            // Build new arrays maintaining order - replace selected indices with new data
            const newRecipes = [...recipesDetails];
            const newIngredients: Ingredient[] = [];
            const newPreprocessing: Preprocessing[] = [];
            const newSteps: Step[] = [];

            // First, remove old data for selected recipes
            const selectedRecipeIds = selectedIndices.map(index => recipesDetails[index].id);
            
            // Filter out ingredients, preprocessing, and steps for selected recipes
            ingredientsDetails.forEach(ingredient => {
                if (!selectedRecipeIds.includes(ingredient.recipe_id)) {
                    newIngredients.push(ingredient);
                }
            });
            
            preprocessingDetails.forEach(prep => {
                if (!selectedRecipeIds.includes(prep.recipe_id)) {
                    newPreprocessing.push(prep);
                }
            });
            
            stepsDetails.forEach(step => {
                if (!selectedRecipeIds.includes(step.recipe_id)) {
                    newSteps.push(step);
                }
            });

            // Replace recipes at their original indices and add new data
            selectedIndices.forEach(index => {
                const recipeData = newRecipesData.get(index);
                if (recipeData) {
                    const { recipe, ingredients, preprocessing, steps } = recipeData;
                    
                    // Replace recipe at original index
                    newRecipes[index] = recipe;
                    
                    // Add new ingredients
                    newIngredients.push(...ingredients);
                    
                    // Add new preprocessing with corrected ingredient_id references
                    const correctedPreprocessing = preprocessing.map((prep: Preprocessing) => {
                        // Find the corresponding ingredient in our ingredients array
                        const matchingIngredient = ingredients.find((ing: Ingredient) => 
                            ing.name.toLowerCase() === prep.ingredient_name?.toLowerCase()
                        );
                        return {
                            ...prep,
                            ingredient_id: matchingIngredient?.id || prep.ingredient_id
                        };
                    });
                    newPreprocessing.push(...correctedPreprocessing);
                    
                    // Add new steps
                    newSteps.push(...steps);
                }
            });

            // Update wallet first
            await onWalletUpdate(selectedIndices.length * 0.03, selectedIndices.length);
            
            // Update the component state with the new data
            // This preserves the order and positions without needing a page reload
            console.log('Successfully rerolled selected recipes! Updating component state...');
            await props.onUpdateAll(newRecipes);
            await onUpdateShoppingList(newIngredients);
            await onUpdatePreprocessing(newPreprocessing);
            await onUpdateSteps(newSteps);
            
            // Reset UI state after successful reroll
            setCustomCuisine("...");
            setSelectedRerollCuisines(mealPlan.cuisines);
        } catch (error) {
            console.error(error instanceof Error ? error.message : 'Failed to reroll selected recipes');
            console.error('Error rerolling selected recipes:', error);
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
            {recipesDetails.length === 0 && !isLoading && (
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
            {(isLoading || recipesDetails.length > 0) && (
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
                                        setSelectedRerollCuisines(cuisines.length > 0 ? cuisines : []);
                                        setCustomCuisine(cuisines.length > 0 ? cuisines[0] : "...");
                                        setIsCuisinePopupOpen(false);
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
                                Selected: {selectedRecipes.size} of {recipesDetails.length} recipes
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
                        {isShoppingListOpen && <ShoppingList closeShoppingList={closeShoppingList} ingredients={aggregateShoppingList(ingredientsDetails)} onToggleAllInstances={toggleAllInstances} />}
                        <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                            onClick={togglePreprocessing}
                        >
                            <p>&nbsp;Preprocessing&nbsp;</p>
                        </div>
                        {isPreprocessingOpen && <PreprocessingList closePreprocessingList={closePreprocessingList} preprocessing={aggregatePreprocessingList(preprocessingDetails)} onToggleAllPreprocessingInstances={toggleAllPreprocessingInstances} />}
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
                        {/* Show placeholders while loading */}
                        {isLoading && loadingRecipes.map((isLoading, index) => 
                            isLoading && <RecipePlaceholder key={`placeholder-${index}`} index={index} />
                        )}
                        {/* Show actual recipes */}
                        {recipesDetails.map((recipe, index) => (
                            <RecipeDisplay 
                                key={recipe.id} 
                                recipe={recipe} 
                                ingredients={ingredientsDetails} 
                                preprocessing={preprocessingDetails} 
                                steps={stepsDetails} 
                                recipesDetails={recipesDetails} 
                                onUpdatePreprocessing={onUpdatePreprocessing} 
                                onUpdateSteps={onUpdateSteps} 
                                onUpdateShoppingList={onUpdateShoppingList}
                                onUpdateOverallShoppingList={updateOverallShoppingList}
                                onUpdateOverallPreprocessingList={updateOverallPreprocessingList}
                                onSyncIndividualRecipeUpdate={syncIndividualRecipeUpdate}
                                isSelected={selectedRecipes.has(index)}
                                onToggleSelection={() => toggleRecipeSelection(index)}
                            />
                        ))}
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
'use client'

import { Goal, Ingredient, MealPlan, Recipe, RecipeWithData, User, Preprocessing, Step, UserWallet } from "@/types/types";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import ShoppingList from "./ShoppingList";
import PreprocessingList from "./PreprocessingList";
import RecipeDisplay from "./RecipeDisplay";
import CuisineInput from "./CuisineInput";
import BubbleInput from "./BubbleInput";
import { useRouter } from "next/navigation";
import RerollSelectionModal from "./RerollSelectionModal";

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
    const router = useRouter();
    const { userDetails, goalDetails, mealPlan, searchSet, recipesDetails, 
        ingredientsDetails, preprocessingDetails, stepsDetails, 
        isShoppingListOpen, setIsShoppingListOpen, onUpdateShoppingList, 
        onUpdatePreprocessing, onUpdateSpecificPreprocessing, onUpdateSteps, onWalletUpdate, wallet } = props;
    
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loadingRecipes, setLoadingRecipes] = useState<boolean[]>([false, false, false, false]);
    const [isInsufficientBalanceOpen, setIsInsufficientBalanceOpen] = useState(false);
    const [requiredAmount, setRequiredAmount] = useState(0);
    const [isCuisinePopupOpen, setIsCuisinePopupOpen] = useState(false);
    const [selectedRerollCuisines, setSelectedRerollCuisines] = useState<string[]>(mealPlan.cuisines);
    
    // Mobile recipe tabs state
    const [activeRecipeTab, setActiveRecipeTab] = useState(0);
    
    // Reroll modal state
    const [isRerollModalOpen, setIsRerollModalOpen] = useState(false);
    const [rerollMode, setRerollMode] = useState<'selected' | 'all'>('selected');

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

    // Handle reroll confirmation from modal
    const handleRerollConfirm = async (selectedRecipeIds: string[]) => {
        if (selectedRecipeIds.length === 0) return;
        
        // Check balance before proceeding
        const requiredCost = selectedRecipeIds.length * 0.03;
        if (!checkBalance(requiredCost)) {
            showInsufficientBalancePopup(requiredCost);
            return;
        }

        if (rerollMode === 'all') {
            // Reroll all recipes
            rollRecipes(
                tdee + offset - dailySnackCalories - dailyBreakfastCalories, 
                protein - dailyBreakfastProtein, 
                fat - dailyBreakfastFat
            );
        } else {
            // Navigate to reroll page for selected recipes
            router.push('/dashboard/reroll');
        }
    };

    // Commit collected data to database atomically
    const commitCollectedDataToDatabase = async (
        recipes: Recipe[], 
        ingredients: Ingredient[], 
        preprocessing: Preprocessing[], 
        steps: Step[], 
        clearFirst: boolean = false
    ) => {
        try {
            // Filter out skeleton recipes before committing
            const validRecipes = recipes.filter(recipe => 
                !recipe.id.startsWith('00000000-0000-0000-0000-skeleton')
            );

            // Get all recipe IDs that should exist in the database
            const validRecipeIds = validRecipes.map(recipe => recipe.id);

            console.log('📊 [COMMIT] Collected data before filtering:');
            console.log('📊 [COMMIT] Valid recipe IDs:', validRecipeIds);
            console.log('📊 [COMMIT] Collected ingredients count:', ingredients.length);
            console.log('📊 [COMMIT] Collected preprocessing count:', preprocessing.length);
            console.log('📊 [COMMIT] Collected steps count:', steps.length);

            // Filter ingredients, preprocessing, and steps to only include those for valid recipes
            const validIngredients = ingredients.filter(ingredient => 
                validRecipeIds.includes(ingredient.recipe_id)
            );
            const validPreprocessing = preprocessing.filter(prep => 
                validRecipeIds.includes(prep.recipe_id)
            );
            const validSteps = steps.filter(step => 
                validRecipeIds.includes(step.recipe_id)
            );

            console.log('📊 [COMMIT] After filtering:');
            console.log('📊 [COMMIT] Valid ingredients count:', validIngredients.length);
            console.log('📊 [COMMIT] Valid preprocessing count:', validPreprocessing.length);
            console.log('📊 [COMMIT] Valid steps count:', validSteps.length);

            // Insert all collected data to DB
            await props.onUpdateAll(validRecipes);
            await onUpdateShoppingList(validIngredients);
            await onUpdatePreprocessing(validPreprocessing);
            await onUpdateSteps(validSteps);

            // Update local state with the committed data
            setLocalRecipes(validRecipes);
            setLocalIngredients(validIngredients);
            setLocalPreprocessing(validPreprocessing);
            setLocalSteps(validSteps);

            if (clearFirst) {
                console.log('✅ [COMMIT] Committed full state with recipe IDs:', validRecipeIds);
            }
        } catch (error) {
            console.error('❌ [COMMIT] Error committing collected data to database:', error);
            throw error;
        }
    };

    // Smart commit that inserts entire local state with orphan cleanup
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const commitCollectedDataToDatabaseSmart = async (
        recipes: Recipe[], 
        ingredients: Ingredient[], 
        preprocessing: Preprocessing[], 
        steps: Step[]
    ) => {
        try {
            // Filter out skeleton recipes before committing
            const validRecipes = recipes.filter(recipe => 
                !recipe.id.startsWith('00000000-0000-0000-0000-skeleton')
            );

            console.log('📊 [SMART COMMIT] Starting smart commit with fresh local state');
            console.log('📊 [SMART COMMIT] Final recipe IDs:', validRecipes.map(r => r.id));

            // Filter ingredients, preprocessing, and steps to only include those for valid recipes
            const validRecipeIds = validRecipes.map(recipe => recipe.id);
            const validIngredients = ingredients.filter(ingredient => 
                validRecipeIds.includes(ingredient.recipe_id)
            );
            const validPreprocessing = preprocessing.filter(prep => 
                validRecipeIds.includes(prep.recipe_id)
            );
            const validSteps = steps.filter(step => 
                validRecipeIds.includes(step.recipe_id)
            );

            console.log('📊 [SMART COMMIT] Committing complete final state:', {
                recipesCount: validRecipes.length,
                ingredientsCount: validIngredients.length,
                preprocessingCount: validPreprocessing.length,
                stepsCount: validSteps.length,
                finalRecipeIds: validRecipeIds
            });

            // Insert/update all data to DB (this will handle existing vs new recipe logic in the backend)
            // The backend should handle: if recipe_id exists, update; if not, insert
            // Then delete orphans not in the final validRecipeIds list
            await props.onUpdateAll(validRecipes);
            await onUpdateShoppingList(validIngredients);
            await onUpdatePreprocessing(validPreprocessing);
            await onUpdateSteps(validSteps);

            // Update local state with the committed data
            setLocalRecipes(validRecipes);
            setLocalIngredients(validIngredients);
            setLocalPreprocessing(validPreprocessing);
            setLocalSteps(validSteps);

            console.log('✅ [SMART COMMIT] Smart commit completed with final recipe IDs:', validRecipeIds);
        } catch (error) {
            console.error('❌ [SMART COMMIT] Error in smart commit:', error);
            throw error;
        }
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

            // Await all threads to finish and collect the data
            console.log('⏳ [ROLLRECIPES] All recipe promises completed');
            const recipeResults = await Promise.all(recipePromises);
            
            // Collect all data from the promises
            const allRecipes = recipeResults.map(result => result.recipe);
            const allIngredients = recipeResults.flatMap(result => result.ingredients);
            const allPreprocessing = recipeResults.flatMap(result => result.preprocessing);
            const allSteps = recipeResults.flatMap(result => result.steps);
            
            console.log('📊 [ROLLRECIPES] Collected data from promises:', {
                recipesCount: allRecipes.length,
                ingredientsCount: allIngredients.length,
                preprocessingCount: allPreprocessing.length,
                stepsCount: allSteps.length
            });
            
            // Commit the collected data to the DB atomically (clear first since this is a full reset)
            await commitCollectedDataToDatabase(allRecipes, allIngredients, allPreprocessing, allSteps, true);
            
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





    return (
        <>
            {/* Nutrition Stats - Mobile First */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-0">
                <div className="flex flex-col gap-2 md:w-1/3">
                    <p className="text-lg md:text-2xl">Total Daily Energy Expenditure (TDEE):&nbsp;{tdee}</p>
                    <p className="text-lg md:text-2xl">Daily Target:&nbsp;{tdee + offset}</p>
                    <p className="text-lg md:text-2xl">Protein Target:&nbsp;{protein}g</p>
                    <p className="text-lg md:text-2xl">Fat Target:&nbsp;{fat}g</p>
                </div>
                <div className="flex-auto"></div>
                <div className="flex flex-col gap-2 md:w-1/3">
                    <p className="text-lg md:text-2xl">Daily Snack :D :&nbsp;{dailySnackCalories}</p>
                    <p className="text-lg md:text-2xl">Daily Breakfast Calories:&nbsp;{dailyBreakfastCalories}</p>
                    <p className="text-lg md:text-2xl">Daily Breakfast Protein:&nbsp;{dailyBreakfastProtein}g</p>
                    <p className="text-lg md:text-2xl">Daily Breakfast Fat:&nbsp;{dailyBreakfastFat}g</p>
                </div>
                <div className="flex-auto"></div>
            </div>    
            
            {/* No Recipes State */}
            {localRecipes.length === 0 && !isLoading && (
                <div className="flex min-h-[400px] md:min-h-[800px] items-center justify-center">
                    <div
                        onClick={() => {
                            rollRecipes(
                                tdee + offset - dailySnackCalories - dailyBreakfastCalories,
                                protein - dailyBreakfastProtein,
                                fat - dailyBreakfastFat)
                        }}
                        className={`border-4 border-current rounded-xl cursor-pointer text-xl md:text-2xl w-fit ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-disabled={isLoading}
                    >
                        <p>&nbsp;{isLoading ? 'Generating meal plan...' : 'Generate a meal plan!'}&nbsp;</p>
                    </div>
                </div>
            )}
            
            {/* Recipes Section */}
            {(isLoading || localRecipes.length > 0) && (
                <div className="flex flex-col gap-4 pt-10 md:pt-20">
                    {/* Controls Section - Mobile First */}
                    <div className="space-y-4">
                        {/* Mobile Layout */}
                        <div className="flex flex-col md:hidden space-y-4">
                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                                <div className="border-4 border-current rounded-xl cursor-pointer text-lg w-fit"
                                    onClick={toggleShoppingList}
                                >
                                    <p>&nbsp;Shopping List&nbsp;</p>
                                </div>
                                <div className="border-4 border-current rounded-xl cursor-pointer text-lg w-fit"
                                    onClick={togglePreprocessing}
                                >
                                    <p>&nbsp;Preprocessing&nbsp;</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setRerollMode('selected');
                                        setIsRerollModalOpen(true);
                                    }}
                                    className="border-4 border-current rounded-xl cursor-pointer text-lg w-fit"
                                >
                                    <span>&nbsp;Reroll Selected&nbsp;</span>
                                </button>
                                <div 
                                    className={`border-4 border-current rounded-xl cursor-pointer text-lg w-fit ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => {
                                        if (!isLoading) {
                                            setRerollMode('all');
                                            setIsRerollModalOpen(true);
                                        }
                                    }}
                                    aria-disabled={isLoading}
                                >
                                    <p>&nbsp;Re-roll All&nbsp;</p>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Layout - Keep original structure */}
                        <div className="hidden md:block">
                            {/* First row: Cuisine selection and navigation */}
                            <div className="flex items-start w-full gap-4 mb-4">
                                <div className="flex items-baseline text-2xl w-1/3 gap-4">
                                    <div className="min-w-[225px] whitespace-nowrap">Selected cuisines:&nbsp;&nbsp;</div>
                                    <BubbleInput
                                        currentPreferences={selectedRerollCuisines}
                                        limitPreferences={4}
                                    />
                                    <div className="border md:border-4 border-current rounded-md md:rounded-xl cursor-pointer text-sm md:text-2xl w-fit ml-4"
                                        onClick={() => setIsCuisinePopupOpen(true)}
                                    >
                                        <span className="px-2 py-0.5 md:px-3 md:py-1">Change</span>
                                    </div>
                                    {isCuisinePopupOpen && (
                                        <CuisineInput
                                            cuisineSet={selectedRerollCuisines}
                                            searchSet={searchSet.searchSet}
                                            closeCuisineSearch={(cuisines) => {
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
                                    <button
                                        onClick={() => {
                                            setRerollMode('selected');
                                            setIsRerollModalOpen(true);
                                        }}
                                        className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                                    >
                                        <span>&nbsp;Reroll Selected&nbsp;</span>
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
                                <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                                    onClick={togglePreprocessing}
                                >
                                    <p>&nbsp;Preprocessing&nbsp;</p>
                                </div>
                                <div className="flex-auto"></div>
                                <div 
                                    className={`border-4 border-current rounded-xl cursor-pointer text-2xl w-fit ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => {
                                        if (!isLoading) {
                                            setRerollMode('all');
                                            setIsRerollModalOpen(true);
                                        }
                                    }}
                                    aria-disabled={isLoading}
                                >
                                    <p>&nbsp;Re-roll All&nbsp;</p>
                                </div>
                            </div>
                        </div>

                        {/* Shopping List and Preprocessing Popups */}
                        {isShoppingListOpen && <ShoppingList closeShoppingList={closeShoppingList} ingredients={aggregateShoppingList(localIngredients)} onToggleAllInstances={toggleAllInstances} />}
                        {isPreprocessingOpen && <PreprocessingList closePreprocessingList={closePreprocessingList} preprocessing={aggregatePreprocessingList(localPreprocessing)} onToggleAllPreprocessingInstances={toggleAllPreprocessingInstances} />}
                    </div>

                    {/* Recipe Display Section */}
                    <div className="space-y-4">
                        {/* Mobile Recipe Tabs */}
                        <div className="md:hidden">
                            {localRecipes.length > 0 && (
                                <>
                                    {/* Tab Navigation */}
                                    <div className="flex overflow-x-auto gap-1 mb-4 border-b-4 border-current pb-2">
                                        {localRecipes.map((recipe, index) => (
                                            <button
                                                key={recipe.id || index}
                                                onClick={() => setActiveRecipeTab(index)}
                                                className={`flex-shrink-0 px-4 py-2 border-4 border-current rounded-lg text-lg font-medium transition-colors ${
                                                    activeRecipeTab === index 
                                                        ? 'bg-current text-white' 
                                                        : 'bg-white text-current hover:bg-gray-100'
                                                }`}
                                            >
                                                Recipe {index + 1}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Active Recipe Content */}
                                    {localRecipes[activeRecipeTab] && (
                                        <div className="border-4 border-current rounded-xl p-4">
                                            <RecipeDisplay 
                                                key={localRecipes[activeRecipeTab].id} 
                                                recipe={localRecipes[activeRecipeTab]} 
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
                                                isSelected={false}
                                                onToggleSelection={() => {}}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Desktop Recipe Grid */}
                        <div className="hidden md:block">
                            <div className="flex flex-col gap-4">
                                {localRecipes.map((recipe) => {
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
                                            isSelected={false}
                                            onToggleSelection={() => {}}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Insufficient Balance Dialog */}
            {isInsufficientBalanceOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full border-4 border-current">
                        <div className="flex justify-between items-start mb-4 p-6 pb-0">
                            <h3 className="text-2xl font-bold">Insufficient Balance</h3>
                            <button
                                onClick={() => setIsInsufficientBalanceOpen(false)}
                                className="text-2xl border-2 border-current rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-[#B1454A] hover:text-white transition-colors"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-4 text-lg p-6">
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
                        <div className="p-6 pt-0 flex justify-end">
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

            {/* Reroll Selection Modal */}
            <RerollSelectionModal
                isOpen={isRerollModalOpen}
                recipes={localRecipes}
                mode={rerollMode}
                onClose={() => setIsRerollModalOpen(false)}
                onConfirm={handleRerollConfirm}
            />
        </>
    );
}
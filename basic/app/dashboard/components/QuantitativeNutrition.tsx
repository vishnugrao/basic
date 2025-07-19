'use client'

import { Goal, Ingredient, MealPlan, Recipe, User, Preprocessing, Step } from "@/types/types";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import InlineInput from "./InlineInput";
import ShoppingList from "./ShoppingList";
import PreprocessingList from "./PreprocessingList";
import RecipeDisplay from "./RecipeDisplay";

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
    recipesDetails: Recipe[], 
    ingredientsDetails: Ingredient[], 
    preprocessingDetails: Preprocessing[], 
    stepsDetails: Step[], 
    onUpdateAll: (updates: Recipe[]) => Promise<void>, 
    onAppend: (addition: Recipe) => Promise<void>, isShoppingListOpen: boolean, setIsShoppingListOpen: Dispatch<SetStateAction<boolean>>, onUpdateShoppingList: (updates: Ingredient[]) => Promise<void>, onUpdatePreprocessing: (updates: Preprocessing[]) => Promise<void>, onUpdateSteps: (updates: Step[]) => Promise<void>
}) {
    const { userDetails, goalDetails, mealPlan, recipesDetails, 
        ingredientsDetails, preprocessingDetails, stepsDetails, 
        isShoppingListOpen, setIsShoppingListOpen, onUpdateShoppingList, 
        onUpdatePreprocessing, onUpdateSteps } = props;
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
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [preprocessing, setPreprocessing] = useState<Preprocessing[]>([]);
    const [steps, setSteps] = useState<Step[]>([]);

    const toggleShoppingList = () => {
        setIsShoppingListOpen(!isShoppingListOpen);
    }

    const closeShoppingList = async (ingredients: Ingredient[]) => {
        setIsShoppingListOpen(false);
        await onUpdateShoppingList(ingredients);
    }

    const togglePreprocessing = () => {
        setIsPreprocessingOpen(!isPreprocessingOpen);
    }

    const closePreprocessingList = async (preprocessing: Preprocessing[]) => {
        setIsPreprocessingOpen(false);
        await onUpdatePreprocessing(preprocessing);
        console.log('onUpdatePreprocessing completed');
    }

    useEffect(() => {
        setRecipes(recipesDetails);
        setIngredients(ingredientsDetails);
        setPreprocessing(preprocessingDetails);
        setSteps(stepsDetails);
    }, [recipesDetails, ingredientsDetails, preprocessingDetails, stepsDetails])
    
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

    const generateSingleRecipe = async (
        index: number,
        targetCalories: number, 
        targetProtein: number, 
        targetFat: number, 
        cookDate: Date,
        existingRecipeNames: string[]
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
                    cuisines: mealPlan.cuisines,
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

            console.log(recipe);
            console.log(ingredients);
            console.log(preprocessing);
            console.log(steps);

            if (!recipe || typeof recipe !== 'object') {
                throw new Error('Invalid recipe data received');
            }

            existingRecipeNames.push(recipe.recipe_name);

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
        setIsLoading(true);
        setLoadingRecipes([true, true, true, true]);

        try {
            await props.onUpdateAll([]);

            if (!mealPlan?.cuisines) {
                throw new Error('Meal plan or cuisines not available');
            }

            const mealTypes: [number, number, number, Date][] = [
                // Sunday cook - Lunch M,T,W
                [Math.round(3 * 0.5 * targetCalories), Math.round(3 * 0.6 * targetProtein), Math.round(3 * 0.5 * targetFat), new Date(new Date().setDate(new Date().getDate() + 1))], 
                // Sunday cook - Dinner S,M,T,W
                [Math.round(4 * 0.5 * targetCalories), Math.round(4 * 0.6 * targetProtein), Math.round(4 * 0.5 * targetFat), new Date(new Date().setDate(new Date().getDate() + 1))], 
                // Wednesday cook - Lunch T,F,S,S
                [Math.round(3 * 0.3 * targetCalories), Math.round(3 * 0.3 * targetProtein), Math.round(3 * 0.3 * targetFat), new Date(new Date().setDate(new Date().getDate() + 4))], 
                // Thursday cook - Dinner T,F,S
                [Math.round(4 * 0.3 * targetCalories), Math.round(4 * 0.3 * targetProtein), Math.round(4 * 0.3 * targetFat), new Date(new Date().setDate(new Date().getDate() + 5))]
            ];

            const existingRecipeNames: string[] = [];

            // Spawn parallel threads for each recipe
            const recipePromises = mealTypes.map(async (mealType, index) => {
                try {
                    const { recipe, ingredients, preprocessing, steps } = await generateSingleRecipe(
                        index,
                        mealType[0],
                        mealType[1], 
                        mealType[2],
                        mealType[3],
                        existingRecipeNames
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
                    <div className="flex gap-4">
                        <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                            onClick={toggleShoppingList}
                        >
                            <p>&nbsp;Shopping List&nbsp;</p>
                        </div>
                        {isShoppingListOpen && <ShoppingList closeShoppingList={closeShoppingList} ingredients={ingredientsDetails} />}
                        <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                            onClick={togglePreprocessing}
                        >
                            <p>&nbsp;Preprocessing&nbsp;</p>
                        </div>
                        {isPreprocessingOpen && <PreprocessingList closePreprocessingList={closePreprocessingList} preprocessing={preprocessingDetails} />}
                        <div className="flex-auto"></div>
                        <div className="flex w-1/2 gap-4">
                            <div className="flex">
                                <p className="text-2xl">Cuisine (Selected):&nbsp;</p>
                                <div className="flex items-baseline text-2xl">
                                    <InlineInput
                                        text={String(customCuisine)}
                                        onSetText={(text: string) => { setCustomCuisine(text)}}
                                    />
                                </div>
                            </div>
                            <div className="flex-auto"></div>
                            <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit">
                                <p>&nbsp;Re-roll Selected&nbsp;</p>
                            </div>
                            <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                                onClick={() => {
                                    console.log('Re-rolling all recipes');
                                    rollRecipes(
                                        tdee + offset - dailySnackCalories - dailyBreakfastCalories, 
                                        protein - dailyBreakfastProtein, 
                                        fat - dailyBreakfastFat);
                                    // setIsShoppingListOpen(true);
                                }}
                            >
                                <p>&nbsp;Re-roll All&nbsp;</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        {/* Show placeholders while loading */}
                        {isLoading && loadingRecipes.map((isLoading, index) => 
                            isLoading && <RecipePlaceholder key={`placeholder-${index}`} index={index} />
                        )}
                        {/* Show actual recipes */}
                        {recipes.map((recipe, index) => (
                            <RecipeDisplay key={index} recipe={recipe} ingredients={ingredients} preprocessing={preprocessing} steps={steps} recipesDetails={recipes} onUpdatePreprocessing={onUpdatePreprocessing} onUpdateSteps={onUpdateSteps} onUpdateShoppingList={onUpdateShoppingList} />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
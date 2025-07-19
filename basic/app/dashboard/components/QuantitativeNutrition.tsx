'use client'

import { Goal, Ingredient, MealPlan, Recipe, User } from "@/types/types";
import { UUID } from "crypto";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import InlineInput from "./InlineInput";
import ShoppingList from "./ShoppingList";

export default function QuantitativeNutrition(props: {
    userDetails: User, goalDetails: Goal, mealPlan: MealPlan, recipesDetails: Recipe[], ingredientsDetails: Ingredient[], onUpdateAll: (updates: Recipe[]) => Promise<void>, onAppend: (addition: Recipe) => Promise<void>, isShoppingListOpen: boolean, setIsShoppingListOpen: Dispatch<SetStateAction<boolean>>, onUpdateShoppingList: (updates: Ingredient[]) => Promise<void>
}) {
    const { userDetails } = props;
    const { goalDetails } = props;
    const { mealPlan } = props;
    const { recipesDetails } = props;
    const { isShoppingListOpen } = props;
    const { setIsShoppingListOpen } = props;
    const { onUpdateShoppingList } = props;
    const { ingredientsDetails } = props;
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

    const toggleShoppingList = () => {
        setIsShoppingListOpen(!isShoppingListOpen);
    }

    const closeShoppingList = async (ingredients: Ingredient[]) => {
        console.log('closeShoppingList called with:', ingredients);
        setIsShoppingListOpen(false);
        await onUpdateShoppingList(ingredients);
        console.log('onUpdateShoppingList completed');
    }

    useEffect(() => {

    }, [recipesDetails])
    
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

    const rollRecipes = async (targetCalories: number, targetProtein: number, targetFat: number) => {
        setIsLoading(true);
        try {

            await props.onUpdateAll([]);

            if (!mealPlan?.cuisines) {
                throw new Error('Meal plan or cuisines not available');
            }

            const mealTypes = [
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

            for (const mealType of mealTypes) {
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
                        calorieTarget: mealType[0],
                        proteinTarget: mealType[1],
                        fatTarget: mealType[2],
                        cookDate: mealType[3],
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to generate recipe');
                }

                const data = await response.json();
                const recipe = data.recipe;

                if (!recipe || typeof recipe !== 'object') {
                    throw new Error('Invalid recipe data received');
                }

                const rid: UUID = recipe.id;
                existingRecipeNames.push(recipe.recipe_name);

                const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
                for (const ingredient of ingredients) {
                    await fetch('/api/ingredient', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_id: userDetails.id,
                            recipe_id: rid,
                            ...ingredient,
                            purchased: false,
                        }),
                    });
                }

                const preprocessing = Array.isArray(recipe.preprocessing) ? recipe.preprocessing : [];
                for (const prep of preprocessing) {
                    await fetch('/api/preprocessing', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_id: userDetails.id,
                            recipe_id: rid,
                            ...prep,
                        }),
                    });
                }

                const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
                for (const step of steps) {
                    await fetch('/api/step', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_id: userDetails.id,
                            recipe_id: rid,
                            ...step,
                        }),
                    });
                }

                await props.onAppend(recipe);
            }
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
            {recipesDetails.length === 0 && (
                <div className="flex min-h-[800px] items-center justify-center">
                    <div
                        onClick={() => {
                            rollRecipes(
                                tdee + offset - dailySnackCalories - dailyBreakfastCalories,
                                protein - dailyBreakfastProtein,
                                fat - dailyBreakfastFat)
                        }}
                        className={`${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        aria-disabled={isLoading}
                    >
                        <p className="text-2xl border-4 border-current rounded-xl whitespace-nowrap">
                            &nbsp;{isLoading ? 'Generating meal plan...' : 'Generate a meal plan!'}&nbsp;
                        </p>
                    </div>
                </div>
            )}
            {recipesDetails.length > 0 && (
                <div className="flex flex-col gap-4 pt-20">
                    <div className="flex gap-4">
                        <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                            onClick={toggleShoppingList}
                        >
                            <p>&nbsp;Shopping List&nbsp;</p>
                        </div>
                        {isShoppingListOpen && <ShoppingList closeShoppingList={closeShoppingList} ingredients={ingredientsDetails} />}
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
                        {recipesDetails.map((recipe, index) => (
                            <div key={index}>
                                <p className="text-2xl">{recipe.recipe_name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
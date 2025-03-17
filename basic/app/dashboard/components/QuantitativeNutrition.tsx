'use client'

import { Goal, MealPlan, Recipe, User } from "@/types/types";
import { UUID } from "crypto";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid'
import InlineInput from "./InlineInput";

export default function QuantitativeNutrition(props: { userDetails: User, goalDetails: Goal, mealPlan: MealPlan, recipesDetails: Recipe[], onUpdate: (updates: Recipe[]) => Promise<void> }) {
    const { userDetails } = props;
    const { goalDetails } = props;
    const { mealPlan } = props;
    const { recipesDetails } = props;
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
            if (!mealPlan?.cuisines) {
                throw new Error('Meal plan or cuisines not available');
            }

            const mealTypes = [
                [3 * 0.5 * targetCalories, 3 * 0.6 * targetProtein, 3 * 0.5 * targetFat], 
                [4 * 0.5 * targetCalories, 4 * 0.6 * targetProtein, 4 * 0.5 * targetFat], 
                [3 * 0.3 * targetCalories, 3 * 0.3 * targetProtein, 3 * 0.3 * targetFat], 
                [4 * 0.3 * targetCalories, 4 * 0.3 * targetProtein, 4 * 0.3 * targetFat]];
            const newRecipes: Recipe[] = [];

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
                        existingRecipes: newRecipes,
                        calorieTarget: targetCalories,
                        proteinTarget: targetProtein,
                        fatTarget: targetFat,
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

                newRecipes.push({
                    id: uuidv4() as UUID,
                    user_id: userDetails.id,
                    recipe_name: `${mealType} - ${recipe.name}`,
                    cuisine: recipe.cuisine,
                    protein: recipe.nutritional_info.protein,
                    fat: recipe.nutritional_info.fat,
                    calories: recipe.nutritional_info.calories,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });

                const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
                for (const ingredient of ingredients) {
                    await fetch('/api/ingredient', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_id: userDetails.id,
                            recipe_id: newRecipes[newRecipes.length - 1].id,
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
                            recipe_id: newRecipes[newRecipes.length - 1].id,
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
                            recipe_id: newRecipes[newRecipes.length - 1].id,
                            ...step,
                        }),
                    });
                }
            }

            await props.onUpdate(newRecipes);
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
                        >
                            <p>&nbsp;Shopping List&nbsp;</p>
                        </div>
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
                                onClick={() => { rollRecipes(
                                    tdee + offset - dailySnackCalories - dailyBreakfastCalories, 
                                    protein - dailyBreakfastProtein, 
                                    fat - dailyBreakfastFat) 
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
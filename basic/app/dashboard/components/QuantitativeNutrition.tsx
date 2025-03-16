'use client'

import { Goal, MealPlan, Recipe, User } from "@/types/types";
import { UUID } from "crypto";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid'

export default function QuantitativeNutrition(props: { userDetails: User, goalDetails: Goal, mealPlan: MealPlan, recipesDetails: Recipe[], onUpdate: (updates: Recipe[]) => Promise<void> }) {
    const { userDetails } = props;
    const { goalDetails } = props;
    const { mealPlan } = props;
    const { recipesDetails } = props;
    const [tdee, setTDEE] = useState(0);
    const [offset, setOffset] = useState(0);
    const [protein, setProtein] = useState(0);
    const [fat, setFat] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
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

    const rerollRecipes = async () => {
        setIsLoading(true);
        try {
            if (!mealPlan?.cuisines) {
                throw new Error('Meal plan or cuisines not available');
            }

            const mealTypes = ["Lunch 1", "Lunch 2", "Dinner 1", "Dinner 2"];
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
                        existingRecipes: newRecipes
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to generate recipe');
                }

                const data = await response.json();
                const recipe = data.recipe;

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

                // Insert ingredients
                for (const ingredient of recipe.ingredients) {
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

                // Insert preprocessing steps
                for (const prep of recipe.preprocessing) {
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

                // Insert cooking steps
                for (const step of recipe.steps) {
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
            <div className="flex w-1/3 flex-col gap-4">
                <p className="text-2xl">Total Daily Energy Expenditure (TDEE):&nbsp;{tdee}</p>
                <p className="text-2xl">Daily Target:&nbsp;{tdee + offset}</p>
                <p className="text-2xl">Protein Target:&nbsp;{protein}g</p>
                <p className="text-2xl">Fat Target:&nbsp;{fat}g</p>
            </div>
            <div className="flex min-h-[800px] items-center justify-center">
                {recipesDetails.length === 0 && (
                    <div
                        onClick={rerollRecipes}
                        className={`${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        aria-disabled={isLoading}
                    >
                        <p className="text-2xl border-4 border-current rounded-xl whitespace-nowrap">
                            &nbsp;{isLoading ? 'Generating meal plan...' : 'Generate a meal plan!'}&nbsp;
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
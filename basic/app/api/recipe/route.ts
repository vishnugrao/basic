import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { Recipe, Goal, User } from '@/types/types';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { UUID } from 'crypto';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { userDetails, goalDetails, cuisines, existingRecipes } = await req.json();
        
        const prompt = constructPrompt(userDetails, goalDetails, cuisines, existingRecipes);
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-2024-08-06",
            messages: [
                {
                    role: "system",
                    content: "You are a culinary expert and nutritionist. Generate recipes following the provided guidelines and format the output as structured JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" }
        });

        const generatedRecipe = JSON.parse(completion.choices[0].message.content!);

        // 1. Insert the recipe first
        const { data: recipeData, error: recipeError } = await supabase
            .from('Recipes')
            .insert({
                id: uuidv4() as UUID,
                user_id: userDetails.id,
                recipe_name: generatedRecipe.recipe.name,
                cuisine: generatedRecipe.recipe.cuisine,
                protein: generatedRecipe.recipe.nutritional_info.protein,
                fat: generatedRecipe.recipe.nutritional_info.fat,
                calories: generatedRecipe.recipe.nutritional_info.calories,
                cook_date: new Date().toISOString()
            })
            .select()
            .single();

        if (recipeError) {
            console.error('Error creating recipe:', { error: recipeError });
            throw recipeError;
        }

        const recipeId = recipeData.id;

        // 2. Insert ingredients
        for (const ingredient of generatedRecipe.recipe.ingredients) {
            const { error: ingredientError } = await supabase
                .from('Ingredients')
                .insert({
                    id: uuidv4() as UUID,
                    user_id: userDetails.id,
                    recipe_id: recipeId,
                    name: ingredient.name,
                    amount: ingredient.amount,
                    metric: ingredient.metric,
                    purchased: false,
                });

            if (ingredientError) {
                console.error('Error creating ingredient:', { error: ingredientError });
                throw ingredientError;
            }
        }

        // 3. Insert preprocessing steps
        for (const prep of generatedRecipe.recipe.preprocessing) {
            const { error: prepError } = await supabase
                .from('Preprocessing')
                .insert({
                    id: uuidv4() as UUID,
                    user_id: userDetails.id,
                    recipe_id: recipeId,
                    operation: prep.operation,
                    specific: prep.specific,
                    instruction: prep.instruction
                });

            if (prepError) {
                console.error('Error creating preprocessing step:', { error: prepError });
                throw prepError;
            }
        }

        // 4. Insert cooking steps
        for (const step of generatedRecipe.recipe.steps) {
            const { error: stepError } = await supabase
                .from('Steps')
                .insert({
                    id: uuidv4() as UUID,
                    user_id: userDetails.id,
                    recipe_id: recipeId,
                    step_number: step.step_number,
                    instruction: step.instruction,
                    duration: step.duration,
                    indicator: step.indicator
                });

            if (stepError) {
                console.error('Error creating step:', { error: stepError });
                throw stepError;
            }
        }

        return NextResponse.json({
            message: 'Recipe and all related data created successfully',
            recipe: {
                name: recipeData.recipe_name,
                cuisine: recipeData.cuisine,
                nutritional_info: {
                    protein: recipeData.protein,
                    fat: recipeData.fat,
                    calories: recipeData.calories
                }
            }
        });
    } catch (error) {
        console.error('Error in recipe creation process:', { error });
        return NextResponse.json({ error: 'Failed to process recipe' }, { status: 500 });
    }
}

function constructPrompt(userDetails: User, goalDetails: Goal, cuisines: string[], existingRecipes: Recipe[]) {
    const weeklyCalories = calculateWeeklyCalories(userDetails, goalDetails);
    const weeklyProtein = calculateWeeklyProtein(userDetails, goalDetails);
    const weeklyFat = calculateWeeklyFat(weeklyCalories, goalDetails);
    
    // Subtract existing recipes' nutritional values
    let remainingCalories = weeklyCalories;
    let remainingProtein = weeklyProtein;
    let remainingFat = weeklyFat;
    
    existingRecipes.forEach(recipe => {
        const recipeDays = getRecipeDays(recipe.recipe_name);
        remainingCalories -= recipe.calories * recipeDays;
        remainingProtein -= recipe.protein * recipeDays;
        remainingFat -= recipe.fat * recipeDays;
    });

    return `Generate a recipe following these guidelines:

Plate Construction:
- 50% vegetables and fruits (no potatoes)
- 25% whole grains
- 25% protein (fish, poultry, beans, nuts preferred)
- Healthy plant oils in moderation
- Avoid processed foods

Nutritional Targets (Remaining for the week):
- Calories: ${remainingCalories}
- Protein: ${remainingProtein}g
- Fat: ${remainingFat}g

Selected Cuisine: ${cuisines[Math.floor(Math.random() * 4)]}
Selected Diet: ${goalDetails.diet}
Selected Lacto-Ovo: ${goalDetails.lacto_ovo}

For preprocessing, the operation should be an action that the preprocessing can be grouped by, and the specific should provide a more specific keyword for the action.

Please provide the recipe in the following JSON structure:
{
    "recipe": {
        "name": string,
        "cuisine": string,
        "nutritional_info": {
            "protein": number,
            "fat": number,
            "calories": number
        },
        "ingredients": [
            {
                "name": string,
                "amount": number,
                "metric": string
            }
        ],
        "preprocessing": [
            {
                "operation": string,
                "specific": string,
                "instruction": string
            }
        ],
        "steps": [
            {
                "step_number": number,
                "instruction": string,
                "duration": number,
                "indicator": string
            }
        ]
    }
}`;
}

function calculateWeeklyCalories(user: User, goal: Goal): number {
    const bmrConstant = user.gender === "Male" ? 5 : -161;
    const basalMetabolicRate = 10 * user.weight + 6.25 * user.height - 5 * user.age + bmrConstant;
    const tdee = Math.round(basalMetabolicRate * goal.activity_level / 50) * 50;
    
    let dailyCalories = tdee;
    if (goal.goal === "Bulk") dailyCalories *= 1.15;
    else if (goal.goal === "Shred") dailyCalories *= 0.8;
    
    return dailyCalories * 7;
}

function calculateWeeklyProtein(user: User, goal: Goal): number {
    let proteinMultiplier = 1.9;
    if (goal.goal === "Bulk") proteinMultiplier = 1.8;
    else if (goal.goal === "Shred") proteinMultiplier = 2.0;
    
    const dailyProtein = Math.min(Math.round(proteinMultiplier * user.weight), user.height + 20);
    return dailyProtein * 7;
}

function calculateWeeklyFat(weeklyCalories: number, goal: Goal): number {
    let fatPercentage = 0.225;
    if (goal.goal === "Bulk") fatPercentage = 0.25;
    else if (goal.goal === "Shred") fatPercentage = 0.20;
    
    return Math.round((fatPercentage * weeklyCalories) / 9);
}

function getRecipeDays(recipeName: string): number {
    if (recipeName.includes("Lunch 1")) return 3; // M, T, W
    if (recipeName.includes("Lunch 2")) return 4; // T, F, S, S
    if (recipeName.includes("Dinner 1")) return 4; // S, M, T, W
    if (recipeName.includes("Dinner 2")) return 3; // T, F, S
    return 0;
} 
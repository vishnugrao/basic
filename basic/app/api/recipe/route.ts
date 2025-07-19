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
        const { 
            userDetails, 
            goalDetails, 
            cuisines, 
            existingRecipes, 
            calorieTarget,
            proteinTarget,
            fatTarget,
            cookDate
        } = await req.json();
        
        const prompt = constructPrompt(userDetails, goalDetails, cuisines, existingRecipes, calorieTarget, proteinTarget, fatTarget);
        console.log(prompt.slice(0, 200));
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-2024-08-06",
            messages: [
                {
                    role: "system",
                    content: "You are a culinary expert and nutritionist. Do not use any fancy words, keep the titles clear and concise. Generate recipes following the provided guidelines and format the output as structured JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" }
        });

        const generatedRecipe = JSON.parse(completion.choices[0].message.content!);

        // Generate UUIDs for all entities
        const recipeId = uuidv4() as UUID;
        const ingredientsData = generatedRecipe.recipe.ingredients.map((ingredient: { name: string; amount: number; metric: string }) => ({
            id: uuidv4() as UUID,
            user_id: userDetails.id,
            recipe_id: recipeId,
            name: ingredient.name,
            amount: ingredient.amount,
            metric: ingredient.metric,
            purchased: false,
        }));

        const preprocessingData = generatedRecipe.recipe.preprocessing.map((prep: { operation: string; specific: string; instruction: string }) => ({
            id: uuidv4() as UUID,
            user_id: userDetails.id,
            recipe_id: recipeId,
            operation: prep.operation,
            specific: prep.specific,
            instruction: prep.instruction
        }));

        const stepsData = generatedRecipe.recipe.steps.map((step: { step_number: number; instruction: string; duration: number; indicator: string }) => ({
            id: uuidv4() as UUID,
            user_id: userDetails.id,
            recipe_id: recipeId,
            step_number: step.step_number,
            instruction: step.instruction,
            duration: step.duration,
            indicator: step.indicator
        }));

        // Use a transaction to ensure all operations succeed or fail together
        const { data: recipeData, error: recipeError } = await supabase
            .from('Recipes')
            .insert({
                id: recipeId,
                user_id: userDetails.id,
                recipe_name: generatedRecipe.recipe.name,
                cuisine: generatedRecipe.recipe.cuisine,
                protein: generatedRecipe.recipe.nutritional_info.protein,
                fat: generatedRecipe.recipe.nutritional_info.fat,
                calories: generatedRecipe.recipe.nutritional_info.calories,
                cook_date: cookDate
            })
            .select()
            .single();

        if (recipeError) {
            console.error('Error creating recipe:', { error: recipeError });
            throw recipeError;
        }

        return NextResponse.json({
            message: 'Recipe and all related data created successfully',
            recipe: {
                id: recipeData.id,
                user_id: userDetails.id,
                recipe_name: recipeData.recipe_name,
                cook_date: cookDate,
                cuisine: recipeData.cuisine,
                protein: recipeData.protein,
                fat: recipeData.fat,
                calories: recipeData.calories,
                created_at: recipeData.created_at,
                updated_at: recipeData.updated_at,
            },
            ingredients: ingredientsData,
            preprocessing: preprocessingData,
            steps: stepsData
        });
    } catch (error) {
        console.error('Error in recipe creation process:', { error });
        return NextResponse.json({ error: 'Failed to process recipe' }, { status: 500 });
    }
}

function constructPrompt(userDetails: User, goalDetails: Goal, cuisines: string[], existingRecipes: Recipe[], calorieTarget: number, proteinTarget: number, fatTarget: number) {

    return `Generate a nutritious, healthy and tasty recipe following these guidelines:

Plate Construction:
- 50% vegetables and fruits (no potatoes)
- 25% whole grains
- 25% protein (fish, poultry, beans, nuts preferred)
- Healthy plant oils in moderation
- Avoid processed foods

Nutritional Targets (Make sure the recipe has approximately these macros):
- Calories: ${calorieTarget}
- Protein: ${proteinTarget}g
- Fat: ${fatTarget}g

Allocate the calories towards making the dish nutritious and tasty.

Selected Cuisine: ${cuisines[Math.floor(Math.random() * 4)]}
Selected Diet: ${goalDetails.diet}
Selected Lacto-Ovo: ${goalDetails.lacto_ovo}

For preprocessing, the operation should be an action that the preprocessing can be grouped by, and the specific should provide a more specific keyword for the action.
Keep the operations and specific as consistent as possible because they will be used for grouping as keywords.
Preprocessing should include all the actions that can take place before starting to cook the meal, that will make the cooking process itself, faster. Preprocessing should also include steps such as marinating and the required duration.

Only pick preprocessing operation and specific pairs from the following exhaustive list:

Washing and Cleaning
operation: wash, specific: rinse
operation: wash, specific: scrub
operation: wash, specific: soak
operation: wash, specific: brush
operation: cut, specific: julienne
operation: cut, specific: brunoise
operation: cut, specific: dice
operation: cut, specific: slice
operation: cut, specific: chiffonade
operation: cut, specific: batonnet
operation: cut, specific: mince
operation: cut, specific: shred
operation: cut, specific: cube

operation: peel, specific: remove
operation: peel, specific: score
operation: trim, specific: fat
operation: trim, specific: gristle
operation: trim, specific: de-stem
operation: trim, specific: de-seed
operation: trim, specific: core

operation: marinade, specific: submerge-short
operation: marinade, specific: submerge-long
operation: marinade, specific: rub
operation: marinade, specific: brine

operation: soak, specific: water
operation: soak, specific: brine
operation: soak, specific: vinegar
operation: soak, specific: overnight
operation: soak, specific: rehydrate

operation: blanch, specific: boiling
operation: blanch, specific: steaming
operation: blanch, specific: nuts

operation: defrost, specific: refrigerator
operation: defrost, specific: coldwater
operation: defrost, specific: microwave

operation: tenderize, specific: pound
operation: tenderize, specific: enzymatic
operation: tenderize, specific: score

operation: season, specific: salt
operation: season, specific: spice-rub
operation: season, specific: herb-infuse

operation: parboil, specific: brief-boil
operation: parboil, specific: simmer

operation: devein, specific: remove
operation: deshell, specific: remove

operation: fillet, specific: debone
operation: fillet, specific: skin

operation: clean, specific: brush-off
operation: trim, specific: stem

operation: sift, specific: flour
operation: cream, specific: butter

operation: rinse, specific: grains
operation: soak, specific: overnight

If possible, generate recipes other than: ${existingRecipes.map((value) => value.recipe_name + ", ")}.

While indicating duration in the steps, ensure that the estimate is accurate, or longer than necessary. 
When cooking meat, ensure the meat is not undercooked to prevent sickness.

When indicating the amounts of Ingredients, only use either grams (g) or milliliters (ml) as metrics.

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
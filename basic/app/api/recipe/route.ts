import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { Recipe, Goal, User } from '@/types/types';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { UUID } from 'crypto';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Vector store ID for cookbook collection - "Cooking Knowledge Base" from OpenAI platform
const COOKBOOK_VECTOR_STORE_ID = process.env.COOKBOOK_VECTOR_STORE_ID || 'vs_68a9b54c1670819194d8ce90e254c42f';

// Type definitions for vector store search results
interface VectorStoreSearchContent {
    type: string;
    text: string;
}

interface VectorStoreSearchResult {
    file_id: string;
    filename: string;
    score: number;
    content: VectorStoreSearchContent[];
}

interface VectorStoreSearchResponse {
    data: VectorStoreSearchResult[];
    has_more: boolean;
}

// Define the JSON schema for Structured Outputs
const recipeSchema = {
    type: "json_schema" as const,
    json_schema: {
        name: "recipe_schema",
        schema: {
            type: "object",
            properties: {
                recipe: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "The name of the recipe"
                        },
                        cuisine: {
                            type: "string",
                            description: "The cuisine type of the recipe"
                        },
                        nutritional_info: {
                            type: "object",
                            properties: {
                                protein: {
                                    type: "number",
                                    description: "Protein content in grams"
                                },
                                fat: {
                                    type: "number",
                                    description: "Fat content in grams"
                                },
                                calories: {
                                    type: "number",
                                    description: "Total calories"
                                }
                            },
                            required: ["protein", "fat", "calories"],
                            additionalProperties: false
                        },
                        ingredients: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        description: "Name of the ingredient"
                                    },
                                    amount: {
                                        type: "number",
                                        description: "Amount of the ingredient"
                                    },
                                    metric: {
                                        type: "string",
                                        description: "Unit of measurement (g or ml)"
                                    }
                                },
                                required: ["name", "amount", "metric"],
                                additionalProperties: false
                            }
                        },
                        preprocessing: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    operation: {
                                        type: "string",
                                        description: "The preprocessing operation"
                                    },
                                    specific: {
                                        type: "string",
                                        description: "Specific keyword for the operation"
                                    },
                                    instruction: {
                                        type: "string",
                                        description: "Detailed instruction for the preprocessing step"
                                    },
                                    ingredient_name: {
                                        type: "string",
                                        description: "Name of the ingredient this preprocessing applies to"
                                    }
                                },
                                required: ["operation", "specific", "instruction", "ingredient_name"],
                                additionalProperties: false
                            }
                        },
                        steps: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    step_number: {
                                        type: "integer",
                                        description: "The step number in the recipe"
                                    },
                                    instruction: {
                                        type: "string",
                                        description: "The cooking instruction for this step"
                                    },
                                    duration: {
                                        type: "number",
                                        description: "Duration in minutes for this step"
                                    },
                                    indicator: {
                                        type: "string",
                                        description: "Visual or other indicator for when this step is complete"
                                    }
                                },
                                required: ["step_number", "instruction", "duration", "indicator"],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["name", "cuisine", "nutritional_info", "ingredients", "preprocessing", "steps"],
                    additionalProperties: false
                }
            },
            required: ["recipe"],
            additionalProperties: false
        }
    }
};

// Function to generate an optimal search query using babbage-002
async function generateSearchQuery(userDetails: User, goalDetails: Goal, cuisines: string[], calorieTarget: number, proteinTarget: number, fatTarget: number): Promise<string> {
    try {
        const queryPrompt = `Based on the following user requirements, generate a concise search query to find relevant recipes and cooking techniques from professional cookbooks, with emphasis on flavor development and cuisine-specific methods:

User Details:
- Diet: ${goalDetails.diet}
- Lacto-Ovo: ${goalDetails.lacto_ovo}
- Preferred Cuisines: ${cuisines.join(', ')}

Nutritional Targets:
- Calories: ${calorieTarget}
- Protein: ${proteinTarget}g
- Fat: ${fatTarget}g

Generate a focused search query that prioritizes finding:
1. Flavor profiles, taste balancing, and seasoning techniques specific to ${cuisines.join(' and ')} cuisine
2. Traditional cooking methods and techniques characteristic of ${cuisines.join(' and ')} cooking style
3. Spice combinations, aromatics, and flavor-building techniques from ${cuisines.join(' and ')} culinary traditions
4. Heat application methods, timing, and temperature control specific to ${cuisines.join(' and ')} cuisine
5. Ingredient treatment and preparation methods that enhance flavor in ${cuisines.join(' and ')} cooking

Focus the search on capturing the authentic cooking philosophy and flavor development approach of ${cuisines.join(' and ')} cuisine.

Output only the search query, no additional text.`;

        const completion = await openai.chat.completions.create({
            model: "babbage-002",
            messages: [
                {
                    role: "user",
                    content: queryPrompt
                }
            ],
            max_tokens: 100,
            temperature: 0.7
        });

        return completion.choices[0].message.content?.trim() || `${goalDetails.diet} ${cuisines.join(' ')} recipes cooking techniques`;
    } catch (error) {
        console.error('Error generating search query:', error);
        // Fallback query
        return `${goalDetails.diet} ${cuisines.join(' ')} recipes cooking techniques nutritional ${calorieTarget} calories`;
    }
}

// Function to search the cookbook vector store
async function searchCookbookVectorStore(query: string): Promise<string> {
    try {
        const response = await fetch(`https://api.openai.com/v1/vector_stores/${COOKBOOK_VECTOR_STORE_ID}/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                max_num_results: 10,
                rewrite_query: true
            })
        });

        if (!response.ok) {
            throw new Error(`Vector store search failed: ${response.statusText}`);
        }

        const searchResults: VectorStoreSearchResponse = await response.json();
        
        // Extract and combine relevant content from search results
        const retrievedContent = searchResults.data
            .map((result: VectorStoreSearchResult) => {
                const content = result.content
                    .map((c: VectorStoreSearchContent) => c.type === 'text' ? c.text : '')
                    .join(' ');
                return `From "${result.filename}":\n${content}`;
            })
            .join('\n\n');

        return retrievedContent;
    } catch (error) {
        console.error('Error searching vector store:', error);
        return ''; // Return empty string if search fails
    }
}

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
        
        // RAG: Generate optimal search query using babbage-002
        console.log('Generating search query for cookbook RAG...');
        const searchQuery = await generateSearchQuery(userDetails, goalDetails, cuisines, calorieTarget, proteinTarget, fatTarget);
        console.log('Generated search query:', searchQuery);

        // RAG: Search cookbook vector store
        console.log('Searching cookbook vector store...');
        const cookbookContext = await searchCookbookVectorStore(searchQuery);
        console.log('Retrieved cookbook content length:', cookbookContext.length);

        // Construct enhanced prompt with cookbook context
        const prompt = constructPrompt(userDetails, goalDetails, cuisines, existingRecipes, calorieTarget, proteinTarget, fatTarget, cookbookContext);
        console.log(prompt.slice(0, 200));
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1",
            messages: [
                {
                    role: "system",
                    content: "You are a culinary expert and nutritionist. Do not use any fancy words, keep the titles clear and concise. Generate recipes following the provided guidelines."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: recipeSchema
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

        const preprocessingData = generatedRecipe.recipe.preprocessing.map((prep: { operation: string; specific: string; instruction: string; ingredient_name: string }) => {
            // Find the corresponding ingredient to get its ID
            const ingredient = ingredientsData.find((ing: { name: string; amount: number; metric: string; id: UUID; user_id: UUID; recipe_id: UUID; purchased: boolean }) => ing.name.toLowerCase() === prep.ingredient_name.toLowerCase());
            return {
                id: uuidv4() as UUID,
                user_id: userDetails.id,
                recipe_id: recipeId,
                ingredient_id: ingredient?.id || null,
                ingredient_name: prep.ingredient_name,
                operation: prep.operation,
                specific: prep.specific,
                instruction: prep.instruction,
                completed: false
            };
        });

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

function constructPrompt(userDetails: User, goalDetails: Goal, cuisines: string[], existingRecipes: Recipe[], calorieTarget: number, proteinTarget: number, fatTarget: number, cookbookContext?: string) {

    const contextSection = cookbookContext ? `
Professional Cookbook Guidance:
The following excerpts from professional cookbooks provide relevant techniques and insights for your recipe:

${cookbookContext}

Use the above cookbook knowledge as inspiration and guidance for creating your recipe, incorporating professional techniques and flavor combinations where appropriate.

---

` : '';

    return `${contextSection}Generate a nutritious, healthy and tasty recipe following these guidelines:

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
Each preprocessing item must be associated with a specific ingredient from the ingredients list using the ingredient_name field. The ingredient_name should exactly match one of the ingredient names in the ingredients list. This ensures proper grouping and organization of preprocessing tasks.

Only pick preprocessing operation and specific pairs from the following exhaustive list:

operation: wash, specific: brush
operation: wash, specific: scrub
operation: wash, specific: rinse

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
operation: trim, specific: stem

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

operation: sift, specific: powder

operation: cream, specific: butter

If possible, generate recipes other than: ${existingRecipes.map((value) => value.recipe_name + ", ")}.

While indicating duration in the steps, ensure that the estimate is accurate, or longer than necessary. 
When cooking meat, ensure the meat is not undercooked to prevent sickness.

When indicating the amounts of Ingredients, only use either grams (g) or milliliters (ml) as metrics.
When naming the ingredients, only use nouns in singular form.
Only use the provided preprocessing operations and specific.

Please provide the recipe following the specified structure.`;
}
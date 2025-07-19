import { Ingredient, Preprocessing, Recipe, Step } from "@/types/types";
import { useEffect, useState } from "react";

export default function RecipeDisplay(props: { 
    recipe: Recipe, 
    ingredients: Ingredient[], 
    preprocessing: Preprocessing[], 
    steps: Step[], 
    recipesDetails: Recipe[],
    onUpdatePreprocessing: (updates: Preprocessing[]) => Promise<void>, 
    onUpdateSteps: (updates: Step[]) => Promise<void>,
    onUpdateShoppingList: (updates: Ingredient[]) => Promise<void>
}) {
    const { recipe, ingredients, preprocessing, steps, onUpdateSteps, onUpdateShoppingList, onUpdatePreprocessing } = props;
    const [recipeData, setRecipeData] = useState<Recipe | null>(recipe);
    const [ingredientsData, setIngredientsData] = useState<Ingredient[]>(ingredients || []);
    const [stepsData, setStepsData] = useState<Step[]>(steps || []);
    const [preprocessingData, setPreprocessingData] = useState<Preprocessing[]>(preprocessing || []);
    const [ingredientsVisible, setIngredientsVisible] = useState(false);
    const [preprocessingVisible, setPreprocessingVisible] = useState(false);

    useEffect(() => {
        setRecipeData(recipe);
        setIngredientsData(ingredients || []);
        setStepsData(steps || []);
        setPreprocessingData(preprocessing || []);
    }, [recipe, ingredients, preprocessing, steps]);

    // Filter ingredients for this specific recipe
    const recipeIngredients = ingredientsData.filter(ingredient => ingredient.recipe_id === recipe.id);

    // Filter steps for this specific recipe
    const recipeSteps = stepsData.filter(step => step.recipe_id === recipe.id);

    // Filter preprocessing for this specific recipe
    const recipePreprocessing = preprocessingData.filter(prep => prep.recipe_id === recipe.id);

    const handleIngredientToggle = async (ingredient: Ingredient) => {
        const updatedIngredients = ingredientsData.map(ing => 
            ing.id === ingredient.id ? { ...ing, purchased: !ing.purchased } : ing
        );
        setIngredientsData(updatedIngredients);
        await onUpdateShoppingList(updatedIngredients);
    };

    const handleStepsUpdate = async (updates: Step[]) => {
        setStepsData(updates);
        await onUpdateSteps(updates);
    }

    const handlePreprocessingUpdate = async (updates: Preprocessing[]) => {
        setPreprocessingData(updates);
        await onUpdatePreprocessing(updates);
    }

    return (
        <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border-4 border-current">
            {/* Recipe Title with Buttons */}
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold text-[#B1454A]">{recipeData?.recipe_name}</h2>
                <button 
                    onClick={() => setIngredientsVisible(!ingredientsVisible)}
                    className="border-4 border-current rounded-xl cursor-pointer text-2xl px-4 py-2"
                >
                    {ingredientsVisible ? 'Hide' : 'Show'} Ingredients
                </button>
                <button 
                    onClick={() => setPreprocessingVisible(!preprocessingVisible)}
                    className="border-4 border-current rounded-xl cursor-pointer text-2xl px-4 py-2"
                >
                    {preprocessingVisible ? 'Hide' : 'Show'} Preprocessing
                </button>
            </div>

            {/* Ingredients Section - Conditional */}
            {ingredientsVisible && (
                <div className="flex flex-col gap-3">
                    <h3 className="text-2xl font-medium text-[#B1454A]">Ingredients</h3>
                    <div className="flex flex-col gap-2">
                        {recipeIngredients.map((ingredient) => (
                            <div 
                                key={ingredient.id}
                                className="flex flex-row items-center gap-4 cursor-pointer"
                                onClick={() => handleIngredientToggle(ingredient)}
                            >
                                <div className={`border-4 ${ingredient.purchased ? 'border-green-500' : 'border-current'} rounded-xl p-2`}>
                                    <div className={`w-4 h-4 ${ingredient.purchased ? 'bg-green-500' : 'bg-transparent'}`} />
                                </div>
                                <p className={`text-2xl ${ingredient.purchased ? 'line-through text-gray-500' : 'text-[#B1454A]'}`}>
                                    {ingredient.amount} {ingredient.metric} {ingredient.name}
                                </p>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => onUpdateShoppingList(ingredientsData)}
                        className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit px-4 py-2 mt-2"
                    >
                        Update Shopping List
                    </button>
                </div>
            )}

            {/* Preprocessing Section - Conditional */}
            {preprocessingVisible && (
                <div className="flex flex-col gap-3">
                    <h3 className="text-2xl font-medium text-[#B1454A]">Preprocessing</h3>
                    <div className="flex flex-col gap-2">
                        {recipePreprocessing.map((prep) => (
                            <div key={prep.id} className="flex flex-col gap-1">
                                <p className="text-2xl text-[#B1454A]">{prep.instruction}</p>
                                <p className="text-2xl text-gray-600">Operation: {prep.operation}</p>
                                {prep.specific && (
                                    <p className="text-2xl text-gray-600">Specific: {prep.specific}</p>
                                )}
                                {prep.completed !== undefined && (
                                    <p className="text-2xl text-gray-600">Completed: {prep.completed ? 'Yes' : 'No'}</p>
                                )}
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => handlePreprocessingUpdate(preprocessingData)}
                        className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit px-4 py-2 mt-2"
                    >
                        Update Preprocessing
                    </button>
                </div>
            )}

            {/* Steps Section - Always Visible */}
            {recipeSteps.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h3 className="text-2xl font-medium text-[#B1454A]">Instructions</h3>
                    <div className="flex flex-col gap-3">
                        {recipeSteps
                            .sort((a, b) => a.step_number - b.step_number)
                            .map((step) => (
                                <div key={step.id} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-[#B1454A] text-white rounded-full flex items-center justify-center text-2xl font-medium">
                                        {step.step_number}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-2xl text-[#B1454A]">{step.instruction}</p>
                                        {step.duration && (
                                            <p className="text-2xl text-gray-600">Duration: {step.duration} minutes</p>
                                        )}
                                        {step.indicator && (
                                            <p className="text-2xl text-gray-600">Indicator: {step.indicator}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                    <button 
                        onClick={() => handleStepsUpdate(stepsData)}
                        className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit px-4 py-2 mt-2"
                    >
                        Update Steps
                    </button>
                </div>
            )}
        </div>
    );
}
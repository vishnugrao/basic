import { Ingredient, Preprocessing, Recipe, Step } from "@/types/types";
import { useEffect, useState, useMemo } from "react";

export default function RecipeDisplay(props: { 
    recipe: Recipe, 
    ingredients: Ingredient[], 
    preprocessing: Preprocessing[], 
    steps: Step[], 
    recipesDetails: Recipe[],
    onUpdatePreprocessing: (updates: Preprocessing[]) => Promise<void>, 
    onUpdateSteps: (updates: Step[]) => Promise<void>,
    onUpdateShoppingList: (updates: Ingredient[]) => Promise<void>,
    onUpdateOverallShoppingList: () => Promise<void>,
    onUpdateOverallPreprocessingList: () => Promise<void>,
    onSyncIndividualRecipeUpdate: (updatedIngredients: Ingredient[], updatedPreprocessing: Preprocessing[]) => Promise<void>
}) {
    const { recipe, ingredients, preprocessing, steps, onUpdateSteps, onUpdateShoppingList, onUpdatePreprocessing, onUpdateOverallShoppingList, onUpdateOverallPreprocessingList, onSyncIndividualRecipeUpdate } = props;
    const [recipeData, setRecipeData] = useState<Recipe | null>(recipe);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'ingredients' | 'preprocessing'>('ingredients');
    
    // Local state for pending updates
    const [localIngredients, setLocalIngredients] = useState<Ingredient[]>(ingredients);
    const [localPreprocessing, setLocalPreprocessing] = useState<Preprocessing[]>(preprocessing);

    // Reactive data updates when props change
    useEffect(() => {
        setRecipeData(recipe);
    }, [recipe]);

    // Update local state when props change
    useEffect(() => {
        setLocalIngredients(ingredients);
    }, [ingredients]);

    useEffect(() => {
        setLocalPreprocessing(preprocessing);
    }, [preprocessing]);

    // Reactive filtering using useMemo for better performance - now using local state
    const recipeIngredients = useMemo(() => {
        const filtered = localIngredients.filter(ingredient => ingredient.recipe_id === recipe.id);
        console.log(`RecipeDisplay: Filtered ${filtered.length} ingredients for recipe ${recipe.id}`);
        return filtered;
    }, [localIngredients, recipe.id]);

    const recipeSteps = useMemo(() => {
        const filtered = steps.filter(step => step.recipe_id === recipe.id);
        console.log(`RecipeDisplay: Filtered ${filtered.length} steps for recipe ${recipe.id}`);
        return filtered;
    }, [steps, recipe.id]);

    const recipePreprocessing = useMemo(() => {
        const filtered = localPreprocessing.filter(prep => prep.recipe_id === recipe.id);
        console.log(`RecipeDisplay: Filtered ${filtered.length} preprocessing items for recipe ${recipe.id}`);
        return filtered;
    }, [localPreprocessing, recipe.id]);

    // Check if recipe data is still loading (no ingredients or preprocessing yet)
    const isRecipeLoading = useMemo(() => {
        return recipeIngredients.length === 0 && recipePreprocessing.length === 0;
    }, [recipeIngredients.length, recipePreprocessing.length]);

    // Group preprocessing by operation
    const groupedPreprocessing = useMemo(() => {
        const groups: { [key: string]: Preprocessing[] } = {};
        recipePreprocessing.forEach(prep => {
            if (!groups[prep.operation]) {
                groups[prep.operation] = [];
            }
            groups[prep.operation].push(prep);
        });
        return groups;
    }, [recipePreprocessing]);

    const handleIngredientToggle = async (ingredient: Ingredient) => {
        const updatedIngredients = localIngredients.map(ing => 
            ing.id === ingredient.id ? { ...ing, purchased: !ing.purchased } : ing
        );
        setLocalIngredients(updatedIngredients);
        
        // Check if all instances of this ingredient across all recipes have the same state
        const allInstances = ingredients.filter(ing => 
            ing.name.toLowerCase() === ingredient.name.toLowerCase() && 
            ing.metric === ingredient.metric
        );
        
        const allHaveSameState = allInstances.every(ing => ing.purchased === updatedIngredients.find(u => u.id === ing.id)?.purchased);
        
        // Only update overall state if all instances agree
        if (allHaveSameState) {
            await onSyncIndividualRecipeUpdate(updatedIngredients, localPreprocessing);
        } else {
            // Just update the individual recipe data without affecting overall state
            await onUpdateShoppingList(updatedIngredients);
        }
    };

    const handlePreprocessingToggle = async (prep: Preprocessing) => {
        const updatedPreprocessing = localPreprocessing.map(p => 
            p.id === prep.id ? { ...p, completed: !p.completed } : p
        );
        setLocalPreprocessing(updatedPreprocessing);
        
        // Check if all instances of this preprocessing across all recipes have the same state
        const allInstances = preprocessing.filter(p => 
            p.operation === prep.operation && 
            p.instruction === prep.instruction && 
            p.specific === prep.specific
        );
        
        const allHaveSameState = allInstances.every(p => p.completed === updatedPreprocessing.find(u => u.id === p.id)?.completed);
        
        // Only update overall state if all instances agree
        if (allHaveSameState) {
            await onSyncIndividualRecipeUpdate(localIngredients, updatedPreprocessing);
        } else {
            // Just update the individual recipe data without affecting overall state
            await onUpdatePreprocessing(updatedPreprocessing);
        }
    };

    // Update handlers
    const handleUpdateSteps = async () => {
        await onUpdateSteps(steps);
    };

    // Overall update handlers
    const handleUpdateOverallShoppingList = async () => {
        await onUpdateOverallShoppingList();
    };

    const handleUpdateOverallPreprocessingList = async () => {
        await onUpdateOverallPreprocessingList();
    };

    // Handle drawer close with atomic updates - following QuantitativeNutrition pattern
    const closeDrawer = async () => {
        setDrawerOpen(false);
        await onUpdateShoppingList(localIngredients);
        await onUpdatePreprocessing(localPreprocessing);
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border-4 border-current">
            {/* Recipe Title with Buttons */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-[#B1454A]">{recipeData?.recipe_name}</h2>
                <div className="flex gap-4">
                    <div 
                        onClick={() => {
                            if (drawerOpen && activeTab === 'ingredients') {
                                setDrawerOpen(false);
                            } else {
                                setActiveTab('ingredients');
                                setDrawerOpen(true);
                            }
                        }}
                        className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                    >
                        <p>&nbsp;{drawerOpen && activeTab === 'ingredients' ? 'Hide' : 'Show'} Ingredients&nbsp;</p>
                    </div>
                    <div 
                        onClick={() => {
                            if (drawerOpen && activeTab === 'preprocessing') {
                                setDrawerOpen(false);
                            } else {
                                setActiveTab('preprocessing');
                                setDrawerOpen(true);
                            }
                        }}
                        className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                    >
                        <p>&nbsp;{drawerOpen && activeTab === 'preprocessing' ? 'Hide' : 'Show'} Preprocessing&nbsp;</p>
                    </div>
                </div>
            </div>

            {/* Main Content and Sidebar Layout */}
            <div className="flex gap-6">
                {/* Main Content - 50% width */}
                <div className="flex-1">
                    {/* Steps Section - Always Visible */}
                    {isRecipeLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#B1454A] rounded-full animate-spin"></div>
                                <p className="text-gray-600 text-sm font-medium">
                                    Loading instructions...
                                </p>
                            </div>
                        </div>
                    ) : recipeSteps.length > 0 && (
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
                            <div 
                                onClick={handleUpdateSteps}
                                className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit hidden"
                            >
                                <p>&nbsp;Update Steps&nbsp;</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar - 50% width */}
                {drawerOpen && (
                    <div className="w-1/2 border-l-4 border-current pl-6">
                        {/* Tabs */}
                        <div className="flex border-b-4 border-current mb-4">
                            <button
                                onClick={() => setActiveTab('ingredients')}
                                className={`flex-1 p-4 text-2xl font-medium ${
                                    activeTab === 'ingredients' 
                                        ? 'text-[#B1454A] border-b-4 border-[#B1454A]' 
                                        : 'text-gray-500'
                                }`}
                            >
                                Ingredients
                            </button>
                            <button
                                onClick={() => setActiveTab('preprocessing')}
                                className={`flex-1 p-4 text-2xl font-medium ${
                                    activeTab === 'preprocessing' 
                                        ? 'text-[#B1454A] border-b-4 border-[#B1454A]' 
                                        : 'text-gray-500'
                                }`}
                            >
                                Preprocessing
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'ingredients' && (
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-2xl font-medium text-[#B1454A]">Ingredients</h3>
                                    {isRecipeLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#B1454A] rounded-full animate-spin"></div>
                                                <p className="text-gray-600 text-sm font-medium">
                                                    Loading ingredients...
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
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
                                            <div 
                                                onClick={handleUpdateOverallShoppingList}
                                                className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit mt-4"
                                            >
                                                <p>&nbsp;Update Shopping List&nbsp;</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'preprocessing' && (
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-2xl font-medium text-[#B1454A]">Preprocessing</h3>
                                    {isRecipeLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#B1454A] rounded-full animate-spin"></div>
                                                <p className="text-gray-600 text-sm font-medium">
                                                    Loading preprocessing...
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-col gap-4">
                                                {Object.entries(groupedPreprocessing).map(([operation, preps]) => (
                                                    <div key={operation} className="flex flex-col gap-2">
                                                        <h4 className="text-xl font-medium text-[#B1454A] capitalize">{operation}</h4>
                                                        <div className="flex flex-col gap-2 ml-4">
                                                            {preps.map((prep) => (
                                                                <div 
                                                                    key={prep.id}
                                                                    className="flex flex-row items-center gap-4 cursor-pointer"
                                                                    onClick={() => handlePreprocessingToggle(prep)}
                                                                >
                                                                    <div className={`border-4 ${prep.completed ? 'border-green-500' : 'border-current'} rounded-xl p-2`}>
                                                                        <div className={`w-4 h-4 ${prep.completed ? 'bg-green-500' : 'bg-transparent'}`} />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <p className={`text-xl ${prep.completed ? 'line-through text-gray-500' : 'text-[#B1454A]'}`}>
                                                                            {prep.instruction}
                                                                        </p>
                                                                        <p className="text-lg text-gray-600 capitalize">
                                                                            Specific: {prep.specific}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                                                                <div 
                                        onClick={handleUpdateOverallPreprocessingList}
                                        className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit mt-4"
                                    >
                                        <p>&nbsp;Update Preprocessing List&nbsp;</p>
                                    </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Close Button */}
                        <div 
                            onClick={closeDrawer}
                            className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit mt-4"
                        >
                            <p>&nbsp;Close&nbsp;</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
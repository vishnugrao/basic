'use client'

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import MealPlanner from "./MealPlanner";
import QuantitativeNutrition from "./QuantitativeNutrition";
import { User, Goal, MealPlan, SearchSet, Recipe, RecipeWithData, Ingredient, Preprocessing, Step, UserWallet as UserWalletType } from "@/types/types";
import { updateUserDetails, updateGoalDetails, updateMealPlanner, deleteRecipes, updateMultipleRecipes, updateMultipleIngredients, updateMultiplePreprocessing, updateSpecificPreprocessing, updateMultipleSteps, updateWallet, deleteIngredientsForRecipes, deletePreprocessingForRecipes, deleteStepsForRecipes, getWallet, signOutUser, deleteAccount, updateUserName } from "../actions";
import InlineInput from "./InlineInput";
import ToggleInput from "./ToggleInput";
import UserSettingsModal from "./UserSettingsModal";
import UserWallet from "./UserWallet";
import BubbleInput from "./BubbleInput";
import CuisineInput from "./CuisineInput";
import RerollSelectionModal from "./RerollSelectionModal";

type MobilePage = 'user' | 'goals' | 'cuisines' | 'nutrition' | 'recipes' | 'shopping' | 'preprocessing' | 'wallet';

export default function DashboardClient({ 
    initialUserDetails,
    initialGoalDetails,
    initialMealPlan,
    searchSet,
    initialRecipesDetails,
    initialIngredientDetails,
    initialPreprocessingDetails,
    initialStepsDetails,
    initialWallet
}: {
    initialUserDetails: User,
    initialGoalDetails: Goal,
    initialMealPlan: MealPlan,
    searchSet: SearchSet,
    initialRecipesDetails: Recipe[],
    initialIngredientDetails: Ingredient[],
    initialPreprocessingDetails: Preprocessing[],
    initialStepsDetails: Step[],
    initialWallet: UserWalletType
}) {
    
    const [userDetails, setUserDetails] = useState<User>(initialUserDetails);
    const [heightUnit, setHeightUnit] = useState("cm");
    const [weightUnit, setWeightUnit] = useState("kg");

    const [goalDetails, setGoalDetails] = useState<Goal>(initialGoalDetails);
    const [activityLevel, setActivityLevel] = useState<string>(() => {
        const activityLevels = {
            1.2: "Sedentary",
            1.375: "Light",
            1.55: "Moderate",
            1.725: "Very",
            1.9: "Extra"
        };
        return activityLevels[initialGoalDetails.activity_level as keyof typeof activityLevels] || "Moderate";
    });

    const [mealPlan, setMealPlan] = useState<MealPlan>(initialMealPlan);
    const [isCuisineSearchOpen, setIsCuisineSearchOpen] = useState(false);

    const [recipesDetails, setRecipesDetails] = useState<Recipe[]>(initialRecipesDetails);
    const [ingredientsDetails, setIngredientsDetails] = useState<Ingredient[]>(initialIngredientDetails);
    const [preprocessingDetails, setPreprocessingDetails] = useState<Preprocessing[]>(initialPreprocessingDetails);
    const [stepsDetails, setStepsDetails] = useState<Step[]>(initialStepsDetails);
    const [wallet, setWallet] = useState<UserWalletType>(initialWallet);
    
    const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
    const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
    
    // Get URL parameters
    const searchParams = useSearchParams();
    
    // Mobile navigation states
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [currentMobilePage, setCurrentMobilePage] = useState<MobilePage>('nutrition');
    
    // Cuisine/Reroll page state
    const [cuisinePageMode, setCuisinePageMode] = useState<'cuisine' | 'reroll'>('cuisine');
    const [isRerollModalOpen, setIsRerollModalOpen] = useState(false);
    const [rerollMode, setRerollMode] = useState<'selected' | 'all'>('selected');
    const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set());

    // Handle URL parameters
    useEffect(() => {
        const page = searchParams.get('page');
        const mode = searchParams.get('mode');
        
        if (page === 'cuisines') {
            setCurrentMobilePage('cuisines');
            if (mode === 'reroll') {
                setCuisinePageMode('reroll');
            }
        }
    }, [searchParams]);
    
    // Recipe page states
    const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
    const [recipeViewMode, setRecipeViewMode] = useState<'steps' | 'shopping' | 'preprocessing'>('steps');
    const [visibleIndicators, setVisibleIndicators] = useState<Set<string>>(new Set());

    // Toggle indicator visibility for a specific step
    const toggleIndicator = (stepId: string) => {
        setVisibleIndicators(prev => {
            const newSet = new Set(prev);
            if (newSet.has(stepId)) {
                newSet.delete(stepId);
            } else {
                newSet.add(stepId);
            }
            return newSet;
        });
    };

    // Function to update wallet when recipes are generated
    const handleWalletUpdate = async (cost: number, requestsMade: number) => {
        const updatedWallet = {
            ...wallet,
            amount_used: wallet.amount_used + cost,
            requests_made: wallet.requests_made + requestsMade,
            updated_at: new Date().toISOString()
        };
        
        setWallet(updatedWallet);
        await updateWallet(updatedWallet);
    };

    // Function to refresh wallet data from server (for AJAX updates after payments)
    const handleWalletRefresh = async () => {
        try {
            console.log('🔵 [WALLET REFRESH] Fetching fresh wallet data via AJAX')
            const freshWalletData = await getWallet(userDetails.id);
            setWallet(freshWalletData);
            console.log('✅ [WALLET REFRESH] Wallet data refreshed successfully:', freshWalletData)
        } catch (error) {
            console.error('❌ [WALLET REFRESH] Error refreshing wallet data:', error)
            throw error; // Re-throw to allow UserWallet to handle fallback
        }
    };

    const handleUserUpdate = async (updates: Partial<User>) => {
        const updatedUser = { ...userDetails, ...updates, updated_at: new Date().toISOString() };
        setUserDetails(updatedUser);
        await updateUserDetails(updatedUser);
    };

    const handleUsernameUpdate = async (newName: string) => {
        const updatedUser = { ...userDetails, name: newName, updated_at: new Date().toISOString() };
        setUserDetails(updatedUser);
        await updateUserName({
            name: newName,
            updated_at: new Date().toISOString(),
            user_id: userDetails.id
        });
    };

    const handleSignOut = async () => {
        if (confirm('Are you sure you want to sign out?')) {
            await signOutUser();
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.')) {
            if (confirm('This will permanently delete all your recipes, meal plans, and account data. Are you absolutely sure?')) {
                await deleteAccount();
            }
        }
    };

    const handleGoalUpdate = async (updates: Partial<Goal>) => {
        const activity_level_conversion: {[id: string]: number} = {
            "Sedentary": 1.2,
            "Light": 1.375, 
            "Moderate": 1.55,
            "Very": 1.725,
            "Extra": 1.9
        };

        const updatedGoal = { 
            ...goalDetails, 
            ...updates, 
            activity_level: updates.activity_level || activity_level_conversion[activityLevel],
            updated_at: new Date().toISOString() 
        };
        setGoalDetails(updatedGoal);
        await updateGoalDetails(updatedGoal);
    };

    const handleMealPlanUpdate = async (updates: Partial<MealPlan>) => {
        const updatedMealPlan = { ...mealPlan, ...updates, updated_at: new Date().toISOString() };
        setMealPlan(updatedMealPlan);
        await updateMealPlanner(updatedMealPlan);
    };

    const handleRecipesAppend = async (addition: RecipeWithData) => {
        setRecipesDetails(currentRecipes => {
            const newRecipes = currentRecipes.length === 0 ? [addition] : [...currentRecipes, addition];
            return newRecipes;
        });
        
        // Also update the related data arrays when a new recipe is added
        if (addition.ingredients && addition.ingredients.length > 0) {
            setIngredientsDetails(currentIngredients => [...currentIngredients, ...addition.ingredients!]);
        }
        if (addition.preprocessing && addition.preprocessing.length > 0) {
            setPreprocessingDetails(currentPreprocessing => [...currentPreprocessing, ...addition.preprocessing!]);
        }
        if (addition.steps && addition.steps.length > 0) {
            setStepsDetails(currentSteps => [...currentSteps, ...addition.steps!]);
        }
    }

    const handleRecipesUpdateAll = async (updates: Recipe[]) => {
        try {
            // Use the new batch update function that handles upsert + delete orphans
            await updateMultipleRecipes(userDetails.id, updates);
            
            // Update local state
            setRecipesDetails(updates);
            console.log('Recipes database update completed successfully');
        } catch (error) {
            console.error('Error updating recipes:', error);
        }
    }

    const handleRecipesSelectiveDelete = async (recipesToDelete: Recipe[]) => {
        try {
            // Step 1: Delete selected recipes and their data
            const recipeIdsToDelete = recipesToDelete.map(recipe => recipe.id);
            
            // Delete recipes first
            await Promise.all(recipesToDelete.map(recipe =>
                deleteRecipes(recipe.user_id, recipe.id)
            ));
            
            // Delete associated data
            if (recipeIdsToDelete.length > 0) {
                await deleteIngredientsForRecipes(userDetails.id, recipeIdsToDelete);
                await deletePreprocessingForRecipes(userDetails.id, recipeIdsToDelete);
                await deleteStepsForRecipes(userDetails.id, recipeIdsToDelete);
            }

            // Step 2: Update state to remove deleted recipes and their data
            setRecipesDetails(prev => prev.filter(recipe => !recipeIdsToDelete.includes(recipe.id)));
            setIngredientsDetails(prev => prev.filter(ing => !recipeIdsToDelete.includes(ing.recipe_id)));
            setPreprocessingDetails(prev => prev.filter(prep => !recipeIdsToDelete.includes(prep.recipe_id)));
            setStepsDetails(prev => prev.filter(step => !recipeIdsToDelete.includes(step.recipe_id)));
        } catch (error) {
            console.error('Error in selective recipe delete:', error);
            throw error;
        }
    }

    const handleIngredientsUpdate = async (updates: Ingredient[]) => {
        try {
            await updateMultipleIngredients(userDetails.id, updates.map(ingredient => ({
                purchased: ingredient.purchased,
                user_id: ingredient.user_id,
                id: ingredient.id,
                recipe_id: ingredient.recipe_id,
                name: ingredient.name,
                amount: ingredient.amount,
                metric: ingredient.metric,
                created_at: ingredient.created_at,
                updated_at: new Date().toISOString()
            })));
            setIngredientsDetails(updates);
            console.log('Database update completed successfully');
        } catch (error) {
            console.error('Error updating ingredients:', error);
        }
    }; 

    const handlePreprocessingUpdate = async (updates: Preprocessing[]) => {
        try {
            await updateMultiplePreprocessing(userDetails.id, updates.map(preprocessing => ({
                id: preprocessing.id,
                user_id: preprocessing.user_id,
                recipe_id: preprocessing.recipe_id,
                ingredient_id: preprocessing.ingredient_id,
                ingredient_name: preprocessing.ingredient_name || '',
                operation: preprocessing.operation,
                specific: preprocessing.specific,
                instruction: preprocessing.instruction,
                completed: preprocessing.completed ?? false,
                updated_at: new Date().toISOString(),
                created_at: preprocessing.created_at || new Date().toISOString()
            })));
            setPreprocessingDetails(updates);
            console.log('Preprocessing database update completed successfully');
        } catch (error) {
            console.error('Error updating preprocessing:', error);
        }
    }

    // Optimized preprocessing update for specific items
    const handleSpecificPreprocessingUpdate = async (operation: string, ingredient: string, specific: string, completed: boolean) => {
        try {
            await updateSpecificPreprocessing(userDetails.id, operation, ingredient, specific, completed);
            
            // Update local state to reflect the change
            setPreprocessingDetails(prevPreprocessing => 
                prevPreprocessing.map(prep => {
                    if (prep.operation === operation && 
                        prep.ingredient_name === ingredient && 
                        prep.specific === specific) {
                        return { ...prep, completed };
                    }
                    return prep;
                })
            );
            console.log('Specific preprocessing database update completed successfully');
        } catch (error) {
            console.error('Error updating specific preprocessing:', error);
        }
    }

    const handleStepsUpdate = async (updates: Step[]) => {
        try {
            await updateMultipleSteps(userDetails.id, updates.map(step => ({
                id: step.id,
                user_id: step.user_id,
                recipe_id: step.recipe_id,
                step_number: step.step_number,
                instruction: step.instruction,
                duration: step.duration,
                indicator: step.indicator,
                updated_at: new Date().toISOString()
            })));
            setStepsDetails(updates);
            console.log('Steps database update completed successfully');
        } catch (error) {
            console.error('Error updating steps:', error);
        }
    }

    const toggleCuisineSearch = () => {
        setIsCuisineSearchOpen(!isCuisineSearchOpen);
    };

    const closeCuisineSearch = async (cuisines: string[]) => {
        setIsCuisineSearchOpen(false);
        await handleMealPlanUpdate({ cuisines });
    };

    // Reroll functionality
    const toggleRecipeSelection = (index: number) => {
        setSelectedRecipes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const selectAllRecipes = () => {
        const allIndices = recipesDetails.map((_, index) => index);
        setSelectedRecipes(new Set(allIndices));
    };

    const deselectAllRecipes = () => {
        setSelectedRecipes(new Set());
    };

    const handleRerollConfirm = async (selectedRecipeIds: string[]) => {
        if (selectedRecipeIds.length === 0) return;
        
        // Check balance before proceeding
        const requiredCost = selectedRecipeIds.length * 0.03;
        const currentBalance = wallet.amount_paid - wallet.amount_used;
        if (currentBalance < requiredCost) {
            // Handle insufficient balance
            alert(`Insufficient balance. Required: $${requiredCost.toFixed(2)}, Current: $${currentBalance.toFixed(2)}`);
            return;
        }

        // Navigate to reroll mode in cuisine page
        handleRerollNavigation();
    };

    // Mobile menu navigation
    const handleMobileMenuToggle = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handlePageChange = (page: MobilePage) => {
        setCurrentMobilePage(page);
        setIsMobileMenuOpen(false);
    };

    const handleRerollNavigation = () => {
        setCurrentMobilePage('cuisines');
        setCuisinePageMode('reroll');
        setIsMobileMenuOpen(false);
    };

    // Render greeting component
    const renderGreeting = () => (
        <div className="flex items-center mb-6">
            <span className="text-2xl font-medium">Hello</span>
            <div className="text-2xl font-medium ml-2">
                <InlineInput
                    text={userDetails.name}
                    onSetText={handleUsernameUpdate}
                />
            </div>
        </div>
    );

    // Render user details page
    const renderUserDetailsPage = () => (
        <div className="space-y-6">
            {renderGreeting()}
            
            <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b-2 border-current pb-2">Personal Information</h2>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Gender:</span>
                        <div className="text-lg">
                            <ToggleInput 
                                altValues={["Male", "Female"]}
                                valIdx={["Male", "Female"].indexOf(userDetails.gender)}
                                onSetText={(text: string) => handleUserUpdate({ gender: text })} 
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Height:</span>
                        <div className="flex items-center gap-2 text-lg">
                            <InlineInput 
                                text={String(userDetails.height)} 
                                onSetText={(text: string) => handleUserUpdate({ height: Number(text) })} 
                            />
                            <ToggleInput 
                                altValues={["cm", "ft"]} 
                                valIdx={["cm", "ft"].indexOf(heightUnit)}
                                onSetText={setHeightUnit}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Weight:</span>
                        <div className="flex items-center gap-2 text-lg">
                            <InlineInput 
                                text={String(userDetails.weight)} 
                                onSetText={(text: string) => handleUserUpdate({ weight: Number(text) })} 
                            />
                            <ToggleInput 
                                altValues={["kg", "lbs"]} 
                                valIdx={["kg", "lbs"].indexOf(weightUnit)}
                                onSetText={setWeightUnit}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Age:</span>
                        <div className="flex items-center gap-2 text-lg">
                            <InlineInput
                                text={String(userDetails.age)}
                                onSetText={(text: string) => handleUserUpdate({ age: Number(text) })}
                            />
                            <span>yrs</span>
                        </div>
                    </div>
                </div>

                <div className="pt-6 space-y-3">
                    <button
                        onClick={handleSignOut}
                        className="w-full border-2 border-current rounded-lg p-3 text-lg font-medium hover:bg-[#B1454A] hover:text-white transition-colors"
                    >
                        Sign Out
                    </button>
                    <button
                        onClick={handleDeleteAccount}
                        className="w-full border-2 border-red-500 text-red-500 rounded-lg p-3 text-lg font-medium hover:bg-red-500 hover:text-white transition-colors"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );

    // Render goal details page
    const renderGoalDetailsPage = () => (
        <div className="space-y-6">
            {renderGreeting()}
            
            <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b-2 border-current pb-2">Fitness Goals</h2>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Goal:</span>
                        <div className="text-lg">
                            <ToggleInput
                                altValues={["Bulk", "Shred", "Recomp"]}
                                valIdx={["Bulk", "Shred", "Recomp"].indexOf(goalDetails.goal)}
                                onSetText={(text: string) => handleGoalUpdate({ goal: text })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Diet:</span>
                        <div className="text-lg">
                            <ToggleInput
                                altValues={["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Flexitarian", "Macrobiotic"]}
                                valIdx={["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Flexitarian", "Macrobiotic"].indexOf(goalDetails.diet)}
                                onSetText={(text: string) => handleGoalUpdate({ diet: text })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Lacto-Ovo:</span>
                        <div className="text-lg">
                            <ToggleInput
                                altValues={["Dairy only", "Eggs only", "Dairy + Eggs", "No Eggs, No Dairy"]}
                                valIdx={(() => {
                                    const idx = ["Dairy only", "Eggs only", "Dairy + Eggs", "No Eggs, No Dairy"].indexOf(goalDetails.lacto_ovo);
                                    return idx >= 0 ? idx : 0;
                                })()}
                                onSetText={(text: string) => handleGoalUpdate({ lacto_ovo: text })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Activity Level:</span>
                        <div className="text-lg">
                            <ToggleInput
                                altValues={["Sedentary", "Light", "Moderate", "Very", "Extra"]}
                                valIdx={["Sedentary", "Light", "Moderate", "Very", "Extra"].indexOf(activityLevel)}
                                onSetText={(text: string) => {
                                    setActivityLevel(text);
                                    const activity_level_conversion: {[id: string]: number} = {
                                        "Sedentary": 1.2,
                                        "Light": 1.375, 
                                        "Moderate": 1.55,
                                        "Very": 1.725,
                                        "Extra": 1.9
                                    };
                                    handleGoalUpdate({ activity_level: activity_level_conversion[text] });
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render favourite cuisines page with reroll functionality
    const renderCuisinesPage = () => (
        <div className="space-y-6">
            {renderGreeting()}
            
            <div className="space-y-4">
                {/* Dynamic title based on mode */}
                <div className="flex items-center justify-between">
                    <h2 className="text-sm md:text-xl font-semibold border-b-2 border-current pb-2">
                        {cuisinePageMode === 'cuisine' ? 'Favourite Cuisines' : 'Recipe Reroll'}
                    </h2>
                    
                    {/* Mode toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCuisinePageMode('cuisine')}
                            className={`border-4 border-current rounded-xl cursor-pointer text-xs md:text-lg w-fit px-3 py-1 ${
                                cuisinePageMode === 'cuisine' ? 'bg-[#B1454A] text-white' : ''
                            }`}
                        >
                            Cuisines
                        </button>
                        <button
                            onClick={() => setCuisinePageMode('reroll')}
                            className={`border-4 border-current rounded-xl cursor-pointer text-xs md:text-lg w-fit px-3 py-1 ${
                                cuisinePageMode === 'reroll' ? 'bg-[#B1454A] text-white' : ''
                            }`}
                        >
                            Reroll
                        </button>
                    </div>
                </div>
                
                {/* Cuisine Management Mode */}
                {cuisinePageMode === 'cuisine' && (
                    <div className="space-y-4">
                        <div>
                            <span className="text-sm md:text-lg font-medium mb-3 block">Top 4 cuisines:</span>
                            <div className="mb-4">
                                <BubbleInput 
                                    currentPreferences={mealPlan.cuisines} 
                                    limitPreferences={4}
                                />
                            </div>
                            
                            <div
                                onClick={toggleCuisineSearch}
                                className="border-4 border-current rounded-xl cursor-pointer text-sm md:text-lg w-fit px-3 py-1"
                            >
                                <p>Change Cuisines</p>
                            </div>
                            
                            {isCuisineSearchOpen && (
                                <div className="mt-4">
                                    <CuisineInput 
                                        cuisineSet={mealPlan.cuisines} 
                                        searchSet={searchSet.searchSet} 
                                        closeCuisineSearch={closeCuisineSearch} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Recipe Reroll Mode */}
                {cuisinePageMode === 'reroll' && (
                    <div className="space-y-6">
                        {/* Controls Section */}
                        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                            <div className="flex flex-wrap gap-2">
                                <div className="border-4 border-current rounded-xl cursor-pointer text-sm md:text-xl w-fit px-3 py-1"
                                    onClick={selectAllRecipes}
                                >
                                    <span>Select All</span>
                                </div>
                                <div className="border-4 border-current rounded-xl cursor-pointer text-sm md:text-xl w-fit px-3 py-1"
                                    onClick={deselectAllRecipes}
                                >
                                    <span>Deselect All</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                <span className="text-sm md:text-lg text-gray-600">
                                    Selected: {selectedRecipes.size} of {recipesDetails.length} recipes
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        className={`border-4 border-current rounded-xl cursor-pointer text-sm md:text-xl w-fit px-3 py-1 ${selectedRecipes.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => {
                                            if (selectedRecipes.size > 0) {
                                                setRerollMode('selected');
                                                setIsRerollModalOpen(true);
                                            }
                                        }}
                                        disabled={selectedRecipes.size === 0}
                                    >
                                        <span>Re-roll Selected ({selectedRecipes.size})</span>
                                    </button>
                                    <button
                                        className="border-4 border-current rounded-xl cursor-pointer text-sm md:text-xl w-fit px-3 py-1"
                                        onClick={() => {
                                            setRerollMode('all');
                                            setIsRerollModalOpen(true);
                                        }}
                                    >
                                        <span>Re-roll All</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recipes Section */}
                        {recipesDetails.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm md:text-lg font-semibold">Select Recipes to Reroll</h3>
                                <div className="space-y-4">
                                    {recipesDetails.map((recipe, index) => {
                                        if (!recipe || !recipe.id) {
                                            return null;
                                        }
                                        
                                        return (
                                            <div key={recipe.id} className="border-4 border-current rounded-xl p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div 
                                                        className={`border-4 ${selectedRecipes.has(index) ? 'border-green-500 bg-green-500' : 'border-current'} rounded-md w-6 h-6 min-w-6 min-h-6 flex items-center justify-center flex-shrink-0 cursor-pointer`}
                                                        onClick={() => toggleRecipeSelection(index)}
                                                    >
                                                        {selectedRecipes.has(index) && (
                                                            <div className="text-white text-sm font-bold">✓</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm md:text-xl font-bold">{recipe.recipe_name}</h4>
                                                        <p className="text-xs md:text-base text-gray-600">{recipe.cuisine} • {recipe.calories} cal</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* No Recipes Message */}
                        {recipesDetails.length === 0 && (
                            <div className="flex min-h-[200px] items-center justify-center">
                                <div className="text-center space-y-4">
                                    <h3 className="text-lg md:text-2xl font-bold text-gray-600">No Recipes Found</h3>
                                    <p className="text-sm md:text-lg text-gray-500">Generate some recipes first from the nutrition page.</p>
                                    <button
                                        onClick={() => setCurrentMobilePage('nutrition')}
                                        className="border-4 border-current rounded-xl cursor-pointer text-sm md:text-xl w-fit px-4 py-2"
                                    >
                                        <span>Go to Nutrition</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Reroll Modal */}
                <RerollSelectionModal
                    isOpen={isRerollModalOpen}
                    recipes={recipesDetails}
                    mode={rerollMode}
                    onClose={() => setIsRerollModalOpen(false)}
                    onConfirm={handleRerollConfirm}
                />
            </div>
        </div>
    );

    // Render nutrition details page
    const renderNutritionDetailsPage = () => {
        // Calculate nutrition values
        const bmrConstant = userDetails.gender == "Male" ? 5 : -161;
        const basalMetabolicRate = 10 * userDetails.weight + 6.25 * userDetails.height - 5 * userDetails.age + bmrConstant;
        const tdee = Math.round(basalMetabolicRate * goalDetails.activity_level / 50) * 50;
        
        let offset = 0;
        let protein = 0;
        let fat = 0;
        
        if (goalDetails.goal == "Bulk") {
            offset = 0.15 * tdee;
            protein = Math.min(Math.round(1.9 * userDetails.weight), userDetails.height + 20);
            fat = Math.round((0.25 * (tdee + offset)) / 9);
        }
        if (goalDetails.goal == "Shred") {
            offset = -0.2 * tdee;
            protein = Math.min(Math.round(2.1 * userDetails.weight), userDetails.height + 20);
            fat = Math.round((0.21 * (tdee + offset)) / 9);
        }
        if (goalDetails.goal == "Recomp") {
            offset = 0;
            protein = Math.min(Math.round(1.9 * userDetails.weight), userDetails.height + 20);
            fat = Math.round((0.23 * (tdee + offset))/9);
        }
        
        const dailySnackCalories = 300;
        const dailyBreakfastCalories = Math.round(0.2 * (tdee + offset - dailySnackCalories));
        const dailyBreakfastProtein = Math.round(0.1 * (protein));
        const dailyBreakfastFat = Math.round(0.2 * (fat));
        
        return (
            <div className="space-y-6">
                {renderGreeting()}
                
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold border-b-2 border-current pb-2">Nutrition Details</h2>
                    
                    <div className="space-y-4">
                        <div className="border-2 border-current rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-3">Daily Targets</h3>
                            <div className="space-y-2">
                                <p className="text-base"><strong>TDEE:</strong> {tdee}</p>
                                <p className="text-base"><strong>Daily Target:</strong> {tdee + offset}</p>
                                <p className="text-base"><strong>Protein Target:</strong> {protein}g</p>
                                <p className="text-base"><strong>Fat Target:</strong> {fat}g</p>
                            </div>
                        </div>
                        
                        <div className="border-2 border-current rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-3">Meal Breakdown</h3>
                            <div className="space-y-2">
                                <p className="text-base"><strong>Daily Snack:</strong> {dailySnackCalories}</p>
                                <p className="text-base"><strong>Daily Breakfast Calories:</strong> {dailyBreakfastCalories}</p>
                                <p className="text-base"><strong>Daily Breakfast Protein:</strong> {dailyBreakfastProtein}g</p>
                                <p className="text-base"><strong>Daily Breakfast Fat:</strong> {dailyBreakfastFat}g</p>
                            </div>
                        </div>
                        
                        {/* Generate Meal Plan Button - Only show when no recipes */}
                        {recipesDetails.length === 0 && (
                            <div className="pt-4">
                                <button
                                    onClick={() => {
                                        // Navigate to recipes page where the meal plan generation will happen
                                        setCurrentMobilePage('recipes');
                                    }}
                                    className="w-full border-2 border-current rounded-lg p-3 text-lg font-medium hover:bg-[#B1454A] hover:text-white transition-colors"
                                >
                                    Generate Meal Plan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Aggregate shopping list logic
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

    // Aggregate preprocessing logic
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

    // Toggle all instances of an ingredient across all recipes
    const toggleAllInstances = async (name: string, metric: string, purchased: boolean) => {
        const updatedIngredients = ingredientsDetails.map(ingredient => {
            if (ingredient.name.toLowerCase() === name.toLowerCase() && ingredient.metric === metric) {
                return { ...ingredient, purchased };
            }
            return ingredient;
        });
        
        setIngredientsDetails(updatedIngredients);
        await handleIngredientsUpdate(updatedIngredients);
    }

    // Toggle all instances of a preprocessing step across all recipes
    const toggleAllPreprocessingInstances = async (operation: string, ingredient: string, specific: string, completed: boolean) => {
        // Use optimized specific update if available, otherwise fall back to bulk update
        if (handleSpecificPreprocessingUpdate) {
            await handleSpecificPreprocessingUpdate(operation, ingredient, specific, completed);
        } else {
            const updatedPreprocessing = preprocessingDetails.map(prep => {
                if (prep.operation === operation && prep.ingredient_name === ingredient && prep.specific === specific) {
                    return { ...prep, completed };
                }
                return prep;
            });
            
            setPreprocessingDetails(updatedPreprocessing);
            await handlePreprocessingUpdate(updatedPreprocessing);
        }
    }

    // Render updated recipes page (individual recipe switching)
    const renderRecipesPage = () => {
        if (recipesDetails.length === 0) {
            return (
                <div className="space-y-6">
                    {renderGreeting()}
                    
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold border-b-2 border-current pb-2">Recipes</h2>
                        
                        <div className="flex min-h-[300px] items-center justify-center">
                            <QuantitativeNutrition 
                                userDetails={userDetails} 
                                goalDetails={goalDetails}
                                mealPlan={mealPlan}
                                searchSet={searchSet}
                                recipesDetails={recipesDetails}
                                ingredientsDetails={ingredientsDetails}
                                preprocessingDetails={preprocessingDetails}
                                stepsDetails={stepsDetails}
                                onAppend={handleRecipesAppend}
                                onUpdateAll={handleRecipesUpdateAll}
                                onSelectiveDelete={handleRecipesSelectiveDelete}
                                isShoppingListOpen={isShoppingListOpen}
                                setIsShoppingListOpen={setIsShoppingListOpen}
                                onUpdateShoppingList={handleIngredientsUpdate}
                                onUpdatePreprocessing={handlePreprocessingUpdate}
                                onUpdateSpecificPreprocessing={handleSpecificPreprocessingUpdate}
                                onUpdateSteps={handleStepsUpdate}
                                onWalletUpdate={handleWalletUpdate}
                                wallet={wallet}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        const currentRecipe = recipesDetails[selectedRecipeIndex];
        const currentIngredients = ingredientsDetails.filter(ing => ing.recipe_id === currentRecipe.id);
        const currentPreprocessing = preprocessingDetails.filter(prep => prep.recipe_id === currentRecipe.id);
        const currentSteps = stepsDetails.filter(step => step.recipe_id === currentRecipe.id).sort((a, b) => a.step_number - b.step_number);

        return (
            <div className="space-y-6">
                {renderGreeting()}
                
                <div className="space-y-4">
                    <h2 className="text-sm md:text-xl font-semibold border-b-2 border-current pb-2">Recipes</h2>
                    
                    {/* Recipe Navigation */}
                    <div className="space-y-3">
                        <div className="flex overflow-x-auto gap-2 pb-2">
                            {recipesDetails.map((recipe, index) => (
                                <button
                                    key={recipe.id || index}
                                    onClick={() => setSelectedRecipeIndex(index)}
                                    className={`flex-shrink-0 px-4 py-2 border-2 border-current rounded-lg text-base transition-colors ${
                                        selectedRecipeIndex === index 
                                            ? 'bg-[#B1454A] text-white' 
                                            : 'bg-white text-current hover:bg-gray-100'
                                    }`}
                                >
                                    Recipe {index + 1}
                                </button>
                            ))}
                        </div>
                        
                        {/* View Mode Toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRecipeViewMode('steps')}
                                className={`px-4 py-2 border-2 border-current rounded-lg text-xs md:text-base transition-colors ${
                                    recipeViewMode === 'steps' 
                                        ? 'bg-[#B1454A] text-white' 
                                        : 'bg-white text-current hover:bg-gray-100'
                                }`}
                            >
                                Steps
                            </button>
                            <button
                                onClick={() => setRecipeViewMode('shopping')}
                                className={`px-4 py-2 border-2 border-current rounded-lg text-xs md:text-base transition-colors ${
                                    recipeViewMode === 'shopping' 
                                        ? 'bg-[#B1454A] text-white' 
                                        : 'bg-white text-current hover:bg-gray-100'
                                }`}
                            >
                                Shopping
                            </button>
                            <button
                                onClick={() => setRecipeViewMode('preprocessing')}
                                className={`px-4 py-2 border-2 border-current rounded-lg text-xs md:text-base transition-colors ${
                                    recipeViewMode === 'preprocessing' 
                                        ? 'bg-[#B1454A] text-white' 
                                        : 'bg-white text-current hover:bg-gray-100'
                                }`}
                            >
                                Prep
                            </button>
                        </div>
                    </div>
                    
                    {/* Recipe Details */}
                    <div className="border-2 border-current rounded-lg p-4">
                        <h3 className="text-sm md:text-lg font-semibold mb-3">{currentRecipe.recipe_name}</h3>
                        <div className="space-y-2 mb-4">
                            <p className="text-xs md:text-base"><strong>Cuisine:</strong> {currentRecipe.cuisine}</p>
                            <p className="text-xs md:text-base"><strong>Calories:</strong> {currentRecipe.calories}</p>
                            <p className="text-xs md:text-base"><strong>Protein:</strong> {currentRecipe.protein}g</p>
                            <p className="text-xs md:text-base"><strong>Fat:</strong> {currentRecipe.fat}g</p>
                        </div>
                        
                        {/* Content Based on View Mode */}
                        {recipeViewMode === 'steps' && (
                            <div className="space-y-3">
                                <h4 className="text-sm md:text-lg font-medium border-b border-current pb-1">Cooking Steps</h4>
                                {currentSteps.map((step) => (
                                    <div key={step.id} className="border border-gray-300 rounded p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-xs md:text-base">
                                                <span className="hidden md:inline">Step </span>{step.step_number}
                                            </span>
                                            {step.duration && (
                                                <span className="text-xs md:text-sm text-gray-600">{step.duration} min</span>
                                            )}
                                        </div>
                                        <p className="text-xs md:text-base mb-2">{step.instruction}</p>
                                        {step.indicator && (
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={() => toggleIndicator(step.id)}
                                                    className="border-2 border-current rounded-lg cursor-pointer text-xs md:text-sm w-fit px-2 py-1 hover:bg-gray-50 transition-colors"
                                                >
                                                    <span className="font-medium">
                                                        {visibleIndicators.has(step.id) ? 'Hide' : 'Show'} Doneness
                                                    </span>
                                                </button>
                                                {visibleIndicators.has(step.id) && (
                                                    <div className="border-2 border-green-500 rounded-lg text-xs md:text-sm w-fit px-2 py-1 bg-green-50">
                                                                                                                 <span className="text-green-700 font-medium">✓ {step.indicator}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {recipeViewMode === 'shopping' && (
                            <div className="space-y-3">
                                <h4 className="text-lg font-medium border-b border-current pb-1">Ingredients</h4>
                                {currentIngredients.map((ingredient) => (
                                    <div key={ingredient.id} className="flex items-center justify-between border border-gray-300 rounded p-3">
                                        <div>
                                            <span className="text-base font-medium">{ingredient.name}</span>
                                            <span className="text-sm text-gray-600 ml-2">{ingredient.amount} {ingredient.metric}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={ingredient.purchased}
                                            onChange={(e) => {
                                                const updatedIngredients = ingredientsDetails.map(ing => 
                                                    ing.id === ingredient.id ? { ...ing, purchased: e.target.checked } : ing
                                                );
                                                setIngredientsDetails(updatedIngredients);
                                                handleIngredientsUpdate(updatedIngredients);
                                            }}
                                            className="w-5 h-5"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {recipeViewMode === 'preprocessing' && (
                            <div className="space-y-3">
                                <h4 className="text-lg font-medium border-b border-current pb-1">Preparation</h4>
                                {currentPreprocessing.map((prep) => (
                                    <div key={prep.id} className="flex items-center justify-between border border-gray-300 rounded p-3">
                                        <div>
                                            <span className="text-base font-medium">{prep.operation}</span>
                                            <p className="text-sm text-gray-600">{prep.instruction}</p>
                                            <p className="text-sm text-gray-500">{prep.ingredient_name} - {prep.specific}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={prep.completed}
                                            onChange={(e) => {
                                                const updatedPreprocessing = preprocessingDetails.map(p => 
                                                    p.id === prep.id ? { ...p, completed: e.target.checked } : p
                                                );
                                                setPreprocessingDetails(updatedPreprocessing);
                                                handlePreprocessingUpdate(updatedPreprocessing);
                                            }}
                                            className="w-5 h-5"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Render shopping list page
    const renderShoppingListPage = () => (
        <div className="space-y-6">
            {renderGreeting()}
            
            <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b-2 border-current pb-2">Shopping List</h2>
                
                <div className="space-y-3">
                    {aggregateShoppingList(ingredientsDetails).map((ingredient) => {
                        const purchasedAmount = (ingredient as Ingredient & { purchasedAmount?: number }).purchasedAmount || 0;
                        const hasPartialPurchase = purchasedAmount > 0 && purchasedAmount < ingredient.amount;
                        
                        return (
                            <div key={`${ingredient.name}-${ingredient.metric}`} className="flex items-center justify-between border border-gray-300 rounded p-3">
                                <div>
                                    <span className={`text-lg font-medium ${ingredient.purchased ? 'line-through text-gray-500' : ''}`}>
                                        {ingredient.name}
                                    </span>
                                    <p className={`text-sm text-gray-600 ${ingredient.purchased ? 'line-through' : ''}`}>
                                        {ingredient.amount} {ingredient.metric}
                                        {hasPartialPurchase ? ` | ${purchasedAmount} ${ingredient.metric} Purchased` : ''}
                                    </p>
                                </div>
                                <div className={`border-2 ${ingredient.purchased ? 'border-green-500' : 'border-current'} rounded p-1`}>
                                    <input
                                        type="checkbox"
                                        checked={ingredient.purchased}
                                        onChange={(e) => toggleAllInstances(ingredient.name, ingredient.metric, e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                </div>
                            </div>
                        );
                    })}
                    
                    {ingredientsDetails.length === 0 && (
                        <div className="flex min-h-[200px] items-center justify-center">
                            <p className="text-lg text-gray-500">No ingredients yet. Generate some recipes first!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Render preprocessing page
    const renderPreprocessingPage = () => (
        <div className="space-y-6">
            {renderGreeting()}
            
            <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b-2 border-current pb-2">Preprocessing</h2>
                
                <div className="space-y-3">
                    {aggregatePreprocessingList(preprocessingDetails).map((prep) => {
                        const totalCount = (prep as Preprocessing & { totalCount?: number }).totalCount || 1;
                        const completedCount = (prep as Preprocessing & { completedCount?: number }).completedCount || 0;
                        const hasPartialCompletion = completedCount > 0 && completedCount < totalCount;
                        
                        return (
                            <div key={`${prep.operation}-${prep.instruction}-${prep.specific}`} className="border border-gray-300 rounded p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className={`text-lg font-medium ${prep.completed ? 'line-through text-gray-500' : ''}`}>
                                            {prep.operation}
                                        </span>
                                        <p className={`text-base text-gray-700 ${prep.completed ? 'line-through' : ''}`}>
                                            {prep.instruction}
                                        </p>
                                        <p className={`text-sm text-gray-500 ${prep.completed ? 'line-through' : ''}`}>
                                            {prep.ingredient_name} - {prep.specific}
                                            {hasPartialCompletion ? ` | ${completedCount} of ${totalCount} completed` : ''}
                                        </p>
                                    </div>
                                    <div className={`border-2 ${prep.completed ? 'border-green-500' : 'border-current'} rounded p-1`}>
                                        <input
                                            type="checkbox"
                                            checked={prep.completed}
                                            onChange={(e) => toggleAllPreprocessingInstances(prep.operation, prep.ingredient_name || '', prep.specific, e.target.checked)}
                                            className="w-4 h-4"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {preprocessingDetails.length === 0 && (
                        <div className="flex min-h-[200px] items-center justify-center">
                            <p className="text-lg text-gray-500">No preprocessing steps yet. Generate some recipes first!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Render wallet page
    const renderWalletPage = () => (
        <div className="space-y-6">
            {renderGreeting()}
            
            <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b-2 border-current pb-2">Wallet</h2>
                
                <UserWallet 
                    wallet={wallet} 
                    onWalletRefresh={handleWalletRefresh} 
                />
            </div>
        </div>
    );

    // Render current page based on selection
    const renderCurrentPage = () => {
        switch (currentMobilePage) {
            case 'user':
                return renderUserDetailsPage();
            case 'goals':
                return renderGoalDetailsPage();
            case 'cuisines':
                return renderCuisinesPage();
            case 'nutrition':
                return renderNutritionDetailsPage();
            case 'recipes':
                return renderRecipesPage();
            case 'shopping':
                return renderShoppingListPage();
            case 'preprocessing':
                return renderPreprocessingPage();
            case 'wallet':
                return renderWalletPage();
            default:
                return renderNutritionDetailsPage();
        }
    };

    const getPageTitle = () => {
        switch (currentMobilePage) {
            case 'user':
                return 'User Details';
            case 'goals':
                return 'Goals';
            case 'cuisines':
                return cuisinePageMode === 'cuisine' ? 'Cuisines' : 'Recipe Reroll';
            case 'nutrition':
                return 'Nutrition Details';
            case 'recipes':
                return 'Recipes';
            case 'shopping':
                return 'Shopping List';
            case 'preprocessing':
                return 'Preprocessing';
            case 'wallet':
                return 'Wallet';
            default:
                return 'Recipes';
        }
    };

    return (
        <div className="flex flex-col">
            {/* Mobile Layout */}
            <div className="md:hidden">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-current bg-white sticky top-0 z-40">
                    <button
                        onClick={handleMobileMenuToggle}
                        className="text-2xl font-bold"
                    >
                        ☰
                    </button>
                    <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
                    <div className="w-8"> {/* Spacer for centering */}</div>
                </div>

                {/* Mobile Side Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
                        <div className="w-80 h-full bg-white shadow-lg">
                            <div className="p-4 border-b-2 border-current">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">Menu</h2>
                                    <button
                                        onClick={handleMobileMenuToggle}
                                        className="text-2xl font-bold"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                            
                            <nav className="p-4 space-y-3">
                                <button
                                    onClick={() => handlePageChange('user')}
                                    className={`w-full text-left p-3 rounded-lg text-lg font-medium transition-colors ${
                                        currentMobilePage === 'user' 
                                            ? 'bg-[#B1454A] text-white' 
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    User Details
                                </button>
                                
                                <button
                                    onClick={() => handlePageChange('goals')}
                                    className={`w-full text-left p-3 rounded-lg text-lg font-medium transition-colors ${
                                        currentMobilePage === 'goals' 
                                            ? 'bg-[#B1454A] text-white' 
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    Goals
                                </button>
                                
                                <button
                                    onClick={() => handlePageChange('cuisines')}
                                    className={`w-full text-left p-3 rounded-lg text-lg font-medium transition-colors ${
                                        currentMobilePage === 'cuisines' 
                                            ? 'bg-[#B1454A] text-white' 
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    Cuisines
                                </button>
                                
                                <button
                                    onClick={() => handlePageChange('nutrition')}
                                    className={`w-full text-left p-3 rounded-lg text-lg font-medium transition-colors ${
                                        currentMobilePage === 'nutrition' 
                                            ? 'bg-[#B1454A] text-white' 
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    Nutrition
                                </button>

                                <button
                                    onClick={() => handlePageChange('recipes')}
                                    className={`w-full text-left p-3 rounded-lg text-lg font-medium transition-colors ${
                                        currentMobilePage === 'recipes' 
                                            ? 'bg-[#B1454A] text-white' 
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    Recipes
                                </button>
                                
                                <button
                                    onClick={() => handlePageChange('shopping')}
                                    className={`w-full text-left p-3 rounded-lg text-lg font-medium transition-colors ${
                                        currentMobilePage === 'shopping' 
                                            ? 'bg-[#B1454A] text-white' 
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    Shopping List
                                </button>

                                <button
                                    onClick={() => handlePageChange('preprocessing')}
                                    className={`w-full text-left p-3 rounded-lg text-lg font-medium transition-colors ${
                                        currentMobilePage === 'preprocessing' 
                                            ? 'bg-[#B1454A] text-white' 
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    Preprocessing
                                </button>
                                
                                <button
                                    onClick={() => handlePageChange('wallet')}
                                    className={`w-full text-left p-3 rounded-lg text-lg font-medium transition-colors ${
                                        currentMobilePage === 'wallet' 
                                            ? 'bg-[#B1454A] text-white' 
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    Wallet
                                </button>
                            </nav>
                        </div>
                    </div>
                )}

                {/* Mobile Content */}
                <div className="p-4">
                    {renderCurrentPage()}
                </div>
            </div>

            {/* Desktop Layout - Keep original for large screens */}
            <div className="hidden md:block">
                <div className="px-4 md:px-10 pt-6 md:pt-10 pb-4 md:pb-5">
                    {/* Desktop Layout - Keep original for large screens */}
                    <div className="flex">
                        {/* Left half - Username left, Gender & Height right */}
                        <div className="flex flex-1 gap-4 mr-8">
                            <div className="flex items-center">
                                <span className="text-2xl mr-2">Hello</span>
                                <div className="text-2xl">
                                    <InlineInput
                                        text={userDetails.name}
                                        onSetText={handleUsernameUpdate}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex-1"></div>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex items-baseline h-10">
                                    <span className="min-w-[80px] text-2xl">Gender:&nbsp;</span>
                                    <div className="flex items-baseline text-2xl">
                                        <ToggleInput 
                                            altValues={["Male", "Female"]}
                                            valIdx={["Male", "Female"].indexOf(userDetails.gender)}
                                            onSetText={(text: string) => handleUserUpdate({ gender: text })} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex items-baseline h-10">
                                    <span className="min-w-[80px] text-2xl">Height:&nbsp;</span>
                                    <div className="flex items-baseline text-2xl">
                                        <InlineInput 
                                            text={String(userDetails.height)} 
                                            onSetText={(text: string) => handleUserUpdate({ height: Number(text) })} 
                                        />
                                        <span className="text-2xl ml-1">
                                            <ToggleInput 
                                                altValues={["cm", "ft"]} 
                                                valIdx={["cm", "ft"].indexOf(heightUnit)}
                                                onSetText={setHeightUnit}
                                            />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Right half - Weight & Age left, Sign Out & Delete Account right */}
                        <div className="flex w-1/2 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-baseline h-10">
                                    <span className="min-w-[80px] text-2xl">Weight:&nbsp;</span>
                                    <div className="flex items-baseline text-2xl">
                                        <InlineInput 
                                            text={String(userDetails.weight)} 
                                            onSetText={(text: string) => handleUserUpdate({ weight: Number(text) })} 
                                        />
                                        <span className="text-2xl ml-1">
                                            <ToggleInput 
                                                altValues={["kg", "lbs"]} 
                                                valIdx={["kg", "lbs"].indexOf(weightUnit)}
                                                onSetText={setWeightUnit}
                                            />
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-baseline h-10">
                                    <span className="min-w-[60px] text-2xl">Age:&nbsp;</span>
                                    <div className="flex items-baseline text-2xl">
                                        <InlineInput
                                            text={String(userDetails.age)}
                                            onSetText={(text: string) => handleUserUpdate({ age: Number(text) })}
                                        />
                                        <span className="text-2xl ml-1">yrs</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1"></div>
                            
                            <div className="flex items-center gap-4">
                                <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                                    onClick={handleSignOut}
                                >
                                    <p>&nbsp;Sign Out&nbsp;</p>
                                </div>
                                <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                                    onClick={handleDeleteAccount}
                                >
                                    <p>&nbsp;Delete Account&nbsp;</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Desktop Second Row - Hidden on mobile */}
                    <div className="flex px-0 pb-5">
                        {/* Left half - Goal & Diet right aligned */}
                        <div className="flex flex-1 gap-4 justify-end mr-8">
                            <div className="flex-shrink-0">
                                <div className="flex items-baseline h-10">
                                    <span className="min-w-[60px] text-2xl">Goal:&nbsp;</span>
                                    <div className="flex items-baseline text-2xl">
                                        <ToggleInput
                                            altValues={["Bulk", "Shred", "Recomp"]}
                                            valIdx={["Bulk", "Shred", "Recomp"].indexOf(goalDetails.goal)}
                                            onSetText={(text: string) => handleGoalUpdate({ goal: text })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-shrink-0">
                                <div className="flex items-baseline h-10">
                                    <span className="min-w-[60px] text-2xl">Diet:&nbsp;</span>
                                    <div className="flex items-baseline text-2xl">
                                        <ToggleInput
                                            altValues={["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Flexitarian", "Macrobiotic"]}
                                            valIdx={["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Flexitarian", "Macrobiotic"].indexOf(goalDetails.diet)}
                                            onSetText={(text: string) => handleGoalUpdate({ diet: text })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Right half - Lacto-Ovo & Activity left aligned */}
                        <div className="flex w-1/2 gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-baseline h-10">
                                    <span className="min-w-[100px] text-2xl">Lacto-Ovo:&nbsp;</span>
                                    <div className="flex items-baseline text-2xl">
                                        <ToggleInput
                                            altValues={["Dairy only", "Eggs only", "Dairy + Eggs", "No Eggs, No Dairy"]}
                                            valIdx={(() => {
                                                const idx = ["Dairy only", "Eggs only", "Dairy + Eggs", "No Eggs, No Dairy"].indexOf(goalDetails.lacto_ovo);
                                                return idx >= 0 ? idx : 0;
                                            })()}
                                            onSetText={(text: string) => handleGoalUpdate({ lacto_ovo: text })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-shrink-0">
                                <div className="flex items-baseline h-10">
                                    <span className="min-w-[120px] text-2xl">Activity Level:&nbsp;</span>
                                    <div className="flex items-baseline text-2xl">
                                        <ToggleInput
                                            altValues={["Sedentary", "Light", "Moderate", "Very", "Extra"]}
                                            valIdx={["Sedentary", "Light", "Moderate", "Very", "Extra"].indexOf(activityLevel)}
                                            onSetText={(text: string) => {
                                                setActivityLevel(text);
                                                const activity_level_conversion: {[id: string]: number} = {
                                                    "Sedentary": 1.2,
                                                    "Light": 1.375, 
                                                    "Moderate": 1.55,
                                                    "Very": 1.725,
                                                    "Extra": 1.9
                                                };
                                                handleGoalUpdate({ activity_level: activity_level_conversion[text] });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meal Plan Section */}
                <div className="flex p-4 md:p-10 flex-col">
                    <p className="flex flex-auto text-xl md:text-2xl pb-6 md:pb-10">Meal Plan</p>
                    <MealPlanner 
                        mealPlan={mealPlan}
                        searchSet={searchSet}
                        wallet={wallet}
                        isCuisineSearchOpen={isCuisineSearchOpen}
                        setIsCuisineSearchOpen={setIsCuisineSearchOpen}
                        onUpdate={handleMealPlanUpdate}
                        onWalletRefresh={handleWalletRefresh}
                    />
                </div>

                {/* Nutrition Section */}
                <div className="p-4 md:p-10 pt-10 md:pt-20">
                    <QuantitativeNutrition 
                        userDetails={userDetails} 
                        goalDetails={goalDetails}
                        mealPlan={mealPlan}
                        searchSet={searchSet}
                        recipesDetails={recipesDetails}
                        ingredientsDetails={ingredientsDetails}
                        preprocessingDetails={preprocessingDetails}
                        stepsDetails={stepsDetails}
                        onAppend={handleRecipesAppend}
                        onUpdateAll={handleRecipesUpdateAll}
                        onSelectiveDelete={handleRecipesSelectiveDelete}
                        isShoppingListOpen={isShoppingListOpen}
                        setIsShoppingListOpen={setIsShoppingListOpen}
                        onUpdateShoppingList={handleIngredientsUpdate}
                        onUpdatePreprocessing={handlePreprocessingUpdate}
                        onUpdateSpecificPreprocessing={handleSpecificPreprocessingUpdate}
                        onUpdateSteps={handleStepsUpdate}
                        onWalletUpdate={handleWalletUpdate}
                        wallet={wallet}
                    />
                </div>
            </div>

            {/* User Settings Modal */}
            {isUserSettingsOpen && (
                <UserSettingsModal
                    userDetails={userDetails}
                    goalDetails={goalDetails}
                    heightUnit={heightUnit}
                    weightUnit={weightUnit}
                    activityLevel={activityLevel}
                    onUserUpdate={handleUserUpdate}
                    onGoalUpdate={handleGoalUpdate}
                    onClose={() => setIsUserSettingsOpen(false)}
                    setHeightUnit={setHeightUnit}
                    setWeightUnit={setWeightUnit}
                    setActivityLevel={setActivityLevel}
                />
            )}
        </div>
    );
} 
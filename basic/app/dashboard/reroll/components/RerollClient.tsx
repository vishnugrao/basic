'use client'

import { useState } from "react";
import { MealPlan, SearchSet, Recipe, UserWallet as UserWalletType } from "@/types/types";
import CuisineInput from "../../components/CuisineInput";
import BubbleInput from "../../components/BubbleInput";
import { useRouter } from "next/navigation";

export default function RerollClient({ 
    initialMealPlan,
    searchSet,
    initialRecipesDetails,
    initialWallet
}: {
    initialMealPlan: MealPlan,
    searchSet: SearchSet,
    initialRecipesDetails: Recipe[],
    initialWallet: UserWalletType
}) {
    const router = useRouter();
    
    const mealPlan = initialMealPlan;
    const recipesDetails = initialRecipesDetails;
    const wallet = initialWallet;
    
    const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set());
    const [isInsufficientBalanceOpen, setIsInsufficientBalanceOpen] = useState(false);
    const [requiredAmount, setRequiredAmount] = useState(0);
    const [isCuisinePopupOpen, setIsCuisinePopupOpen] = useState(false);
    const [selectedRerollCuisines, setSelectedRerollCuisines] = useState<string[]>(mealPlan.cuisines);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingRecipes, setLoadingRecipes] = useState<boolean[]>([false, false, false, false]);

    // Current balance
    const currentBalance = wallet.amount_paid - wallet.amount_used;

    // Check if user has sufficient balance for an operation
    const checkBalance = (requiredCost: number): boolean => {
        return currentBalance >= requiredCost;
    };

    // Show insufficient balance popup
    const showInsufficientBalancePopup = (cost: number) => {
        setRequiredAmount(cost);
        setIsInsufficientBalanceOpen(true);
    };

    // Toggle recipe selection
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

    // Select all recipes
    const selectAllRecipes = () => {
        const allIndices = recipesDetails.map((_, index) => index);
        setSelectedRecipes(new Set(allIndices));
    };

    // Deselect all recipes
    const deselectAllRecipes = () => {
        setSelectedRecipes(new Set());
    };

    // Placeholder reroll function - this would contain the actual reroll logic
    const rerollSelectedRecipes = async () => {
        if (selectedRecipes.size === 0) {
            return;
        }

        // Check balance before proceeding (selected recipes * 3 cents each)
        const requiredCost = selectedRecipes.size * 0.03;
        if (!checkBalance(requiredCost)) {
            showInsufficientBalancePopup(requiredCost);
            return;
        }

        setIsLoading(true);
        const loadingStates = [...loadingRecipes];
        Array.from(selectedRecipes).forEach(index => {
            loadingStates[index] = true;
        });
        setLoadingRecipes(loadingStates);

        try {
            // Here you would implement the actual reroll logic
            // For now, just simulate loading
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Clear selection and reset loading states
            setSelectedRecipes(new Set());
            setLoadingRecipes([false, false, false, false]);
        } catch (error) {
            console.error('Error rerolling recipes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b-4 border-current p-4 md:p-6">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="border-4 border-current rounded-xl cursor-pointer text-sm md:text-xl w-fit px-3 py-1"
                    >
                        <span>← Back</span>
                    </button>
                    <h1 className="text-lg md:text-3xl font-bold">Recipe Reroll</h1>
                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto p-4 md:p-6">
                {/* Controls Section */}
                <div className="space-y-6 mb-8">
                    {/* Cuisine Selection - Mobile Layout */}
                    <div className="flex flex-col md:hidden space-y-4">
                        <span className="text-sm md:text-lg font-medium">Selected cuisines:</span>
                        <div className="flex items-center gap-2">
                            <BubbleInput
                                currentPreferences={selectedRerollCuisines}
                                limitPreferences={4}
                            />
                            <div className="border-4 border-current rounded-xl cursor-pointer text-sm md:text-lg w-fit flex-shrink-0 px-3 py-1"
                                onClick={() => setIsCuisinePopupOpen(true)}
                            >
                                <span>Change</span>
                            </div>
                        </div>
                    </div>

                    {/* Cuisine Selection - Desktop Layout */}
                    <div className="hidden md:flex items-center gap-4">
                        <span className="text-sm md:text-xl font-medium min-w-[200px]">Selected cuisines:</span>
                        <BubbleInput
                            currentPreferences={selectedRerollCuisines}
                            limitPreferences={4}
                        />
                        <div className="border-4 border-current rounded-xl cursor-pointer text-sm md:text-xl w-fit px-3 py-1"
                            onClick={() => setIsCuisinePopupOpen(true)}
                        >
                            <span>Change</span>
                        </div>
                    </div>

                    {/* Selection Controls */}
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
                                    className={`border-4 border-current rounded-xl cursor-pointer text-sm md:text-xl w-fit px-3 py-1 ${isLoading || selectedRecipes.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => {
                                        if (!isLoading && selectedRecipes.size > 0) {
                                            rerollSelectedRecipes();
                                        }
                                    }}
                                    disabled={isLoading || selectedRecipes.size === 0}
                                >
                                    <span>Re-roll Selected ({selectedRecipes.size})</span>
                                </button>
                                <button
                                    className={`border-4 border-current rounded-xl cursor-pointer text-sm md:text-xl w-fit px-3 py-1 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => {
                                        if (!isLoading) {
                                            selectAllRecipes();
                                            setTimeout(() => rerollSelectedRecipes(), 100);
                                        }
                                    }}
                                    disabled={isLoading}
                                >
                                    <span>Re-roll All</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recipes Section */}
                {recipesDetails.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-sm md:text-xl font-semibold border-b-2 border-current pb-2">Select Recipes to Reroll</h2>
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
                                                <h3 className="text-sm md:text-xl font-bold">{recipe.recipe_name}</h3>
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
                    <div className="flex min-h-[400px] items-center justify-center">
                        <div className="text-center space-y-4">
                            <h2 className="text-lg md:text-2xl font-bold text-gray-600">No Recipes Found</h2>
                            <p className="text-sm md:text-lg text-gray-500">Generate some recipes first from the main dashboard.</p>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="border-4 border-current rounded-xl cursor-pointer text-sm md:text-xl w-fit px-4 py-2"
                            >
                                <span>Go to Dashboard</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Cuisine Popup */}
            {isCuisinePopupOpen && (
                <CuisineInput
                    cuisineSet={selectedRerollCuisines}
                    searchSet={searchSet.searchSet}
                    closeCuisineSearch={(cuisines) => {
                        const finalCuisines = cuisines.length > 0 ? cuisines : mealPlan.cuisines.slice(0, 4);
                        setSelectedRerollCuisines(finalCuisines);
                        setIsCuisinePopupOpen(false);
                        console.log('🍜 [CUISINE UPDATE] Selected reroll cuisines updated to:', finalCuisines);
                    }}
                />
            )}

            {/* Insufficient Balance Dialog */}
            {isInsufficientBalanceOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full border-4 border-current">
                        <div className="flex justify-between items-start mb-4 p-6 pb-0">
                            <h3 className="text-lg md:text-2xl font-bold">Insufficient Balance</h3>
                            <button
                                onClick={() => setIsInsufficientBalanceOpen(false)}
                                className="text-lg md:text-2xl border-2 border-current rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-[#B1454A] hover:text-white transition-colors"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-4 text-sm md:text-lg p-6">
                            <p>
                                You don&apos;t have enough balance to perform this operation.
                            </p>
                            <div className="space-y-2">
                                <p><strong>Required amount:</strong> ${requiredAmount.toFixed(2)}</p>
                                <p><strong>Current balance:</strong> ${currentBalance.toFixed(2)}</p>
                            </div>
                            <p>
                                Please top up your wallet to continue generating recipes.
                            </p>
                        </div>
                        <div className="p-6 pt-0 flex justify-end">
                            <button
                                onClick={() => setIsInsufficientBalanceOpen(false)}
                                className="border-4 border-current rounded-xl cursor-pointer text-sm md:text-xl px-4 py-2 hover:bg-[#B1454A] hover:text-white transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 
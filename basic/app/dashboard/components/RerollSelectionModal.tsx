'use client'

import React, { useState } from 'react';
import { Recipe } from '@/types/types';

interface RerollSelectionModalProps {
    isOpen: boolean;
    recipes: Recipe[];
    mode: 'selected' | 'all';
    onClose: () => void;
    onConfirm: (selectedRecipeIds: string[]) => void;
}

export default function RerollSelectionModal({ 
    isOpen, 
    recipes, 
    mode, 
    onClose, 
    onConfirm 
}: RerollSelectionModalProps) {
    const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(
        mode === 'all' ? new Set(recipes.map(r => r.id)) : new Set()
    );

    if (!isOpen) return null;

    const toggleRecipeSelection = (recipeId: string) => {
        setSelectedRecipes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(recipeId)) {
                newSet.delete(recipeId);
            } else {
                newSet.add(recipeId);
            }
            return newSet;
        });
    };

    const selectAll = () => {
        setSelectedRecipes(new Set(recipes.map(r => r.id)));
    };

    const deselectAll = () => {
        setSelectedRecipes(new Set());
    };

    const handleConfirm = () => {
        onConfirm(Array.from(selectedRecipes));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border-4 border-current">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b-4 border-current">
                    <h2 className="text-lg md:text-2xl font-bold">
                        {mode === 'all' ? 'Reroll All Recipes' : 'Select Recipes to Reroll'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-lg md:text-2xl border-2 border-current rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-[#B1454A] hover:text-white transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Controls */}
                <div className="p-6 border-b-2 border-current">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button
                            onClick={selectAll}
                            className="border-4 border-current rounded-xl cursor-pointer text-sm md:text-lg w-fit px-3 py-1"
                        >
                            <span>Select All</span>
                        </button>
                        <button
                            onClick={deselectAll}
                            className="border-4 border-current rounded-xl cursor-pointer text-sm md:text-lg w-fit px-3 py-1"
                        >
                            <span>Deselect All</span>
                        </button>
                    </div>
                    <p className="text-sm md:text-base text-gray-600">
                        Selected: {selectedRecipes.size} of {recipes.length} recipes
                    </p>
                </div>

                {/* Recipe List */}
                <div className="overflow-y-auto max-h-96 p-6">
                    <div className="space-y-3">
                        {recipes.map((recipe) => (
                            <div 
                                key={recipe.id} 
                                className="flex items-center justify-between p-3 border-2 border-gray-300 rounded-lg hover:border-current transition-colors cursor-pointer"
                                onClick={() => toggleRecipeSelection(recipe.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`border-4 ${selectedRecipes.has(recipe.id) ? 'border-green-500 bg-green-500' : 'border-current'} rounded-md w-6 h-6 min-w-6 min-h-6 flex items-center justify-center flex-shrink-0`}>
                                        {selectedRecipes.has(recipe.id) && (
                                            <div className="text-white text-xs md:text-sm font-bold">✓</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm md:text-lg font-semibold">{recipe.recipe_name}</h3>
                                        <p className="text-xs md:text-sm text-gray-600">{recipe.cuisine} • {recipe.calories} cal</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t-4 border-current flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="border-2 border-current rounded-lg cursor-pointer text-sm md:text-lg px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedRecipes.size === 0}
                        className={`border-4 border-current rounded-xl cursor-pointer text-sm md:text-lg px-4 py-2 hover:bg-[#B1454A] hover:text-white transition-colors ${selectedRecipes.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Reroll Selected ({selectedRecipes.size})
                    </button>
                </div>
            </div>
        </div>
    );
} 
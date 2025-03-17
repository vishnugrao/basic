'use client'

import { Ingredient } from "@/types/types";
import { UUID } from "crypto";
import { useEffect, useState } from "react";

// Extended type for aggregated ingredients that maintains IDs for syncing
interface AggregatedIngredient extends Omit<Ingredient, 'id' | 'recipe_id'> {
    ids: UUID[];
    recipe_ids: UUID[];
}

export default function ShoppingList(props: { closeShoppingList: (ingredients: Ingredient[]) => void, ingredients: Ingredient[] }) {
    const { closeShoppingList, ingredients } = props;
    
    // Maintain original list for state updates
    const [shoppingList, setShoppingList] = useState<Ingredient[]>(ingredients);
    // Aggregated list for display
    const [aggregatedList, setAggregatedList] = useState<AggregatedIngredient[]>([]);

    useEffect(() => {
        // Aggregate ingredients with same name and sum their quantities
        const aggregated = shoppingList.reduce((acc: AggregatedIngredient[], curr) => {
            const existing = acc.find(item => item.name.toLowerCase() === curr.name.toLowerCase());
            if (existing) {
                existing.amount += curr.amount;
                existing.ids.push(curr.id);
                existing.recipe_ids.push(curr.recipe_id);
                // If any instance is purchased, mark all as purchased
                existing.purchased = existing.purchased || curr.purchased;
            } else {
                acc.push({
                    name: curr.name,
                    amount: curr.amount,
                    metric: curr.metric,
                    purchased: curr.purchased,
                    user_id: curr.user_id,
                    created_at: curr.created_at,
                    updated_at: curr.updated_at,
                    ids: [curr.id],
                    recipe_ids: [curr.recipe_id]
                });
            }
            return acc;
        }, []);
        setAggregatedList(aggregated);
    }, [shoppingList]);

    const togglePurchased = (ingredient: AggregatedIngredient) => {
        const newPurchased = !ingredient.purchased;
        // Update all instances of this ingredient in the original list
        const updatedList = shoppingList.map(item => {
            if (ingredient.ids.includes(item.id)) {
                return { ...item, purchased: newPurchased };
            }
            return item;
        });
        setShoppingList(updatedList);
    };

    return (
        <>
            <div className="popup-container"
                onClick={() => {
                    closeShoppingList(shoppingList);
                }}
            >
                <div className="flex flex-col bg-[#F5F5F1] w-2/3 rounded-xl popup p-10 max-h-[1200px] max-w-[1000px] overflow-scroll scrollbar-hide"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}>
                    <div className="flex flex-col gap-4">
                        {aggregatedList.map((ingredient, index) => (
                            <div 
                                key={index}
                                className="flex flex-row items-center gap-4 cursor-pointer"
                                onClick={() => togglePurchased(ingredient)}
                            >
                                <div className={`border-4 ${ingredient.purchased ? 'border-green-500' : 'border-current'} rounded-xl p-2`}>
                                    <div className={`w-4 h-4 ${ingredient.purchased ? 'bg-green-500' : 'bg-transparent'}`} />
                                </div>
                                <p className={`text-2xl ${ingredient.purchased ? 'line-through text-gray-500' : ''}`}>
                                    {ingredient.amount} {ingredient.metric} {ingredient.name}
                                </p>
                            </div>
                        ))}
                        {aggregatedList.length === 0 && (
                            <p className="text-2xl text-gray-500">No ingredients in shopping list</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
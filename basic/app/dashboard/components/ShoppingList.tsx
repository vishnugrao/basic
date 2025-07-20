'use client'

import { Ingredient } from "@/types/types";
import { UUID } from "crypto";
import { useEffect, useState } from "react";

// Extended type for aggregated ingredients that maintains IDs for syncing and includes purchased amount
interface AggregatedIngredient extends Omit<Ingredient, 'id' | 'recipe_id'> {
    ids: UUID[];
    recipe_ids: UUID[];
    purchasedAmount?: number;
}


export default function ShoppingList(props: { 
    closeShoppingList: () => void, 
    ingredients: Ingredient[],
    onToggleAllInstances?: (name: string, metric: string, purchased: boolean) => void
}) {
    const { closeShoppingList, ingredients } = props;
    
    // Use the pre-aggregated ingredients directly
    const [aggregatedList, setAggregatedList] = useState<AggregatedIngredient[]>([]);

    useEffect(() => {
        // Convert the pre-aggregated ingredients to AggregatedIngredient format
        const aggregated = ingredients.map(ingredient => ({
            ...ingredient,
            ids: [ingredient.id], // Since these are already aggregated, we use the single ID
            recipe_ids: [ingredient.recipe_id], // Since these are already aggregated, we use the single recipe_id
            purchasedAmount: (ingredient as Ingredient & { purchasedAmount: number }).purchasedAmount || 0
        } as AggregatedIngredient));
        setAggregatedList(aggregated);
    }, [ingredients]);

    const togglePurchased = (ingredient: AggregatedIngredient) => {
        const newPurchased = !ingredient.purchased;
        
        // Update aggregated list to reflect the change
        setAggregatedList(prev => prev.map(item => {
            if (item.name.toLowerCase() === ingredient.name.toLowerCase() && 
                item.metric === ingredient.metric) {
                // Update purchased amount based on new state
                const newPurchasedAmount = newPurchased ? item.amount : 0;
                return { ...item, purchased: newPurchased, purchasedAmount: newPurchasedAmount };
            }
            return item;
        }));

        // Call the callback to update all individual recipe instances
        if (props.onToggleAllInstances) {
            props.onToggleAllInstances(ingredient.name, ingredient.metric, newPurchased);
        }
    };

    return (
        <>
            <div className="popup-container"
                onClick={async () => {
                    await closeShoppingList();
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
                                    {ingredient.amount} {ingredient.metric} {ingredient.name} {ingredient.purchasedAmount && (ingredient.purchasedAmount > 0 && ingredient.purchasedAmount < ingredient.amount)  ? `| ${ingredient.purchasedAmount} ${ingredient.metric} Purchased` : ''}
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
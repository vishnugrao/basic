'use client'

import { Preprocessing } from "@/types/types";
import { useEffect, useState } from "react";

// Hierarchical grouping structure
interface GroupedPreprocessing {
    [operation: string]: {
        [specific: string]: {
            [ingredient: string]: Preprocessing[]
        }
    }
}

export default function PreprocessingList(props: { 
    closePreprocessingList: () => void, 
    preprocessing: Preprocessing[],
    onToggleAllPreprocessingInstances?: (operation: string, ingredient: string, specific: string, completed: boolean) => void
}) {
    const { closePreprocessingList, preprocessing } = props;
    
    const [groupedPreprocessing, setGroupedPreprocessing] = useState<GroupedPreprocessing>({});

    useEffect(() => {
        // Group preprocessing by operation -> specific -> ingredient
        const grouped: GroupedPreprocessing = {};
        
        preprocessing.forEach(prep => {
            if (!grouped[prep.operation]) {
                grouped[prep.operation] = {};
            }
            if (!grouped[prep.operation][prep.specific]) {
                grouped[prep.operation][prep.specific] = {};
            }
            if (!grouped[prep.operation][prep.specific][prep.ingredient_name!]) {
                grouped[prep.operation][prep.specific][prep.ingredient_name!] = [];
            }
            grouped[prep.operation][prep.specific][prep.ingredient_name!].push(prep);
        });
        
        setGroupedPreprocessing(grouped);
    }, [preprocessing]);

    const toggleCompleted = (operation: string, specific: string, ingredient: string) => {
        // Find all items that match operation, specific, and ingredient
        const matchingItems = preprocessing.filter(prep => 
            prep.operation === operation && 
            prep.specific === specific && 
            prep.ingredient_name === ingredient
        );
        
        if (matchingItems.length === 0) return;
        
        // Determine if all matching items are completed
        const allCompleted = matchingItems.every(item => item.completed);
        const newCompleted = !allCompleted;

        // Call the callback to update all matching instances
        // Since we're matching by ingredient, we'll use the first item's instruction for the callback
        if (props.onToggleAllPreprocessingInstances && matchingItems.length > 0) {
            const firstItem = matchingItems[0];
            props.onToggleAllPreprocessingInstances(operation, firstItem.ingredient_name!, specific, newCompleted);
        }
    };

    return (
        <>
            <div className="popup-container"
                onClick={async () => {
                    await closePreprocessingList();
                }}
            >
                <div className="flex flex-col bg-[#F5F5F1] w-2/3 rounded-xl popup p-10 max-h-[1200px] max-w-[1000px] overflow-scroll scrollbar-hide"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}>
                    <div className="flex flex-col gap-6">
                        {Object.entries(groupedPreprocessing).map(([operation, specificGroups]) => (
                            <div key={operation} className="flex flex-col gap-4">
                                <h2 className="text-2xl font-bold text-[#B1454A] capitalize">{operation}:</h2>
                                
                                {Object.entries(specificGroups).map(([specific, ingredientGroups]) => (
                                    <div key={specific} className="ml-4 flex flex-col gap-3">
                                        <h3 className="text-xl font-semibold text-gray-700 capitalize">{specific}:</h3>
                                        
                                        {Object.entries(ingredientGroups).map(([ingredient, items]) => {
                                            // Since items with same operation, specific, and ingredient are grouped together,
                                            // we can use the first item as representative and count completion
                                            const representativeItem = items[0];
                                            const totalCount = items.length;
                                            const completedCount = items.filter(item => item.completed).length;
                                            const allCompleted = completedCount === totalCount;
                                            
                                            return (
                                                <div 
                                                    key={ingredient}
                                                    className="ml-8 flex flex-row items-center gap-4 cursor-pointer"
                                                    onClick={() => toggleCompleted(representativeItem.operation, representativeItem.specific, representativeItem.ingredient_name!)}
                                                >
                                                    <div className={`border-4 ${allCompleted ? 'border-green-500' : 'border-current'} rounded-xl p-2`}>
                                                        <div className={`w-4 h-4 ${allCompleted ? 'bg-green-500' : 'bg-transparent'}`} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <p className={`text-lg ${allCompleted ? 'line-through text-gray-500' : 'text-[#B1454A]'}`}>
                                                            <span className="font-medium capitalize">{representativeItem.ingredient_name}</span> {representativeItem.instruction}
                                                            {completedCount > 0 && completedCount < totalCount ? ` | ${completedCount} of ${totalCount} completed` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        ))}
                        {Object.keys(groupedPreprocessing).length === 0 && (
                            <p className="text-2xl text-gray-500">No preprocessing tasks</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
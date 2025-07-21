'use client'

import { Preprocessing } from "@/types/types";
import { useCallback, useMemo, useState } from "react"; 

// Hierarchical grouping structure
interface GroupedPreprocessing {
    [operation: string]: {
        [specific: string]: {
            [ingredient: string]: Preprocessing[]
        }
    }
}

// Lookup map for fast access
interface PreprocessingLookup {
    [key: string]: Preprocessing[]
}

export default function PreprocessingList(props: { 
    closePreprocessingList: () => void, 
    preprocessing: Preprocessing[],
    onToggleAllPreprocessingInstances?: (operation: string, ingredient: string, specific: string, completed: boolean) => void
}) {
    const { closePreprocessingList, preprocessing } = props;
    
    // Local state for optimistic updates
    const [localPreprocessing, setLocalPreprocessing] = useState<Preprocessing[]>(preprocessing);

    // Update local state when props change
    useMemo(() => {
        setLocalPreprocessing(preprocessing);
    }, [preprocessing]);

    // Memoized lookup map for O(1) access
    const preprocessingLookup = useMemo((): PreprocessingLookup => {
        const lookup: PreprocessingLookup = {};
        
        localPreprocessing.forEach(prep => {
            const key = `${prep.operation}-${prep.specific}-${prep.ingredient_name}`;
            if (!lookup[key]) {
                lookup[key] = [];
            }
            lookup[key].push(prep);
        });
        
        return lookup;
    }, [localPreprocessing]);

    // Memoized grouped preprocessing (only recalculates when lookup changes)
    const groupedPreprocessing = useMemo((): GroupedPreprocessing => {
        const grouped: GroupedPreprocessing = {};
        
        Object.entries(preprocessingLookup).forEach(([, items]) => {
            const firstItem = items[0];
            const { operation, specific, ingredient_name } = firstItem;
            
            if (!grouped[operation]) {
                grouped[operation] = {};
            }
            if (!grouped[operation][specific]) {
                grouped[operation][specific] = {};
            }
            if (!grouped[operation][specific][ingredient_name!]) {
                grouped[operation][specific][ingredient_name!] = [];
            }
            
            grouped[operation][specific][ingredient_name!] = items;
        });
        
        return grouped;
    }, [preprocessingLookup]);

    // Direct database update function - parent handles optimization
    const updateDatabase = useCallback((operation: string, ingredient: string, specific: string, completed: boolean) => {
        if (props.onToggleAllPreprocessingInstances) {
            props.onToggleAllPreprocessingInstances(operation, ingredient, specific, completed);
        }
    }, [props]);

    // Optimized toggle function with O(1) lookup and optimistic updates
    const toggleCompleted = useCallback((operation: string, specific: string, ingredient: string) => {
        const lookupKey = `${operation}-${specific}-${ingredient}`;
        const matchingItems = preprocessingLookup[lookupKey];
        
        if (!matchingItems || matchingItems.length === 0) return;
        
        // Determine new state
        const allCompleted = matchingItems.every(item => item.completed);
        const newCompleted = !allCompleted;

        // Optimistic update: Update UI immediately
        setLocalPreprocessing(prevPreprocessing => 
            prevPreprocessing.map(prep => {
                if (prep.operation === operation && 
                    prep.specific === specific && 
                    prep.ingredient_name === ingredient) {
                    return { ...prep, completed: newCompleted };
                }
                return prep;
            })
        );

        // Direct database update (parent handles optimization)
        updateDatabase(operation, ingredient, specific, newCompleted);
    }, [preprocessingLookup, updateDatabase]);

    // Memoized completion stats calculation
    const getCompletionStats = useCallback((items: Preprocessing[]) => {
        const totalCount = items.length;
        const completedCount = items.filter(item => item.completed).length;
        const allCompleted = completedCount === totalCount;
        
        return { totalCount, completedCount, allCompleted };
    }, []);

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
                    <div className="flex flex-col gap-4">
                        {Object.entries(groupedPreprocessing).map(([operation, specificGroups]) => (
                            <div key={operation} className="flex flex-col gap-2">
                                <h2 className="text-2xl font-medium text-[#B1454A] capitalize">{operation}</h2>
                                
                                {Object.entries(specificGroups).map(([specific, ingredientGroups]) => (
                                    <div key={specific} className="ml-4 flex flex-col gap-2">
                                        <h3 className="text-2xl font-medium text-[#B1454A] capitalize">{specific}</h3>
                                        
                                        {Object.entries(ingredientGroups).map(([ingredient, items]) => {
                                            const representativeItem = items[0];
                                            const { totalCount, completedCount, allCompleted } = getCompletionStats(items);
                                            
                                            return (
                                                <div 
                                                    key={ingredient}
                                                    className="ml-4 flex flex-row items-center gap-4 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors"
                                                    onClick={() => toggleCompleted(representativeItem.operation, representativeItem.specific, representativeItem.ingredient_name!)}
                                                >
                                                    <div className={`border-4 ${allCompleted ? 'border-green-500' : 'border-current'} rounded-xl p-2 transition-colors`}>
                                                        <div className={`w-4 h-4 ${allCompleted ? 'bg-green-500' : 'bg-transparent'} transition-colors`} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <p className={`text-xl ${allCompleted ? 'line-through text-gray-500' : 'text-[#B1454A]'} transition-colors`}>
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
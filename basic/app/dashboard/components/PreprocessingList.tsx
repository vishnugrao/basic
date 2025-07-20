'use client'

import { Preprocessing } from "@/types/types";
import { useEffect, useState, useMemo } from "react";

export default function PreprocessingList(props: { 
    closePreprocessingList: () => void, 
    preprocessing: Preprocessing[],
    onToggleAllPreprocessingInstances?: (operation: string, instruction: string, specific: string, completed: boolean) => void
}) {
    const { closePreprocessingList, preprocessing } = props;
    
    const [preprocessingList, setPreprocessingList] = useState<Preprocessing[]>(preprocessing);

    useEffect(() => {
        setPreprocessingList(preprocessing);
    }, [preprocessing]);

    const groupedPreprocessing = useMemo(() => {
        // Create hierarchical structure: operation -> specific -> ingredient
        const hierarchicalGroups: { [operation: string]: { [specific: string]: { [ingredientName: string]: Preprocessing[] } } } = {};
        
        preprocessingList.forEach(prep => {
            // Initialize operation level
            if (!hierarchicalGroups[prep.operation]) {
                hierarchicalGroups[prep.operation] = {};
            }
            
            // Initialize specific level
            if (!hierarchicalGroups[prep.operation][prep.specific]) {
                hierarchicalGroups[prep.operation][prep.specific] = {};
            }
            
            // Initialize ingredient level
            const ingredientName = prep.ingredient_name || `ingredient-${prep.ingredient_id}`;
            if (!hierarchicalGroups[prep.operation][prep.specific][ingredientName]) {
                hierarchicalGroups[prep.operation][prep.specific][ingredientName] = [];
            }
            
            // Add preprocessing item to the appropriate group
            hierarchicalGroups[prep.operation][prep.specific][ingredientName].push(prep);
        });
        
        // Process each group to calculate completion status
        Object.entries(hierarchicalGroups).forEach(([, specificGroups]) => {
            Object.entries(specificGroups).forEach(([, ingredientGroups]) => {
                Object.entries(ingredientGroups).forEach(([, group]) => {
                    const allCompleted = group.every(prep => prep.completed);
                    const completedCount = group.filter(prep => prep.completed).length;
                    const totalCount = group.length;
                    
                    // Update the first item in the group with aggregated data
                    if (group.length > 0) {
                        group[0] = {
                            ...group[0],
                            completed: allCompleted,
                            completedCount,
                            totalCount,
                            ids: group.map(prep => prep.id),
                            recipe_ids: group.map(prep => prep.recipe_id)
                        };
                    }
                });
            });
        });
        
        return hierarchicalGroups;
    }, [preprocessingList]);

    const toggleCompleted = (prep: Preprocessing) => {
        const newCompleted = !prep.completed;
        
        // Update aggregated list to reflect the change
        setPreprocessingList(prev => prev.map(item => {
            if (item.instruction === prep.instruction && 
                item.specific === prep.specific &&
                item.operation === prep.operation &&
                item.ingredient_id === prep.ingredient_id) {
                return { ...item, completed: newCompleted };
            }
            return item;
        }));

        // Call the callback to update all individual recipe instances
        if (props.onToggleAllPreprocessingInstances) {
            props.onToggleAllPreprocessingInstances(prep.operation, prep.instruction, prep.specific, newCompleted);
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
                    <div className="flex flex-col gap-4">
                        {/* <h3 className="text-2xl font-medium text-[#B1454A]">Preprocessing</h3> */}
                        <div className="flex flex-col gap-4">
                            {Object.entries(groupedPreprocessing).map(([operation, specificGroups]) => (
                                <div key={operation} className="flex flex-col gap-2">
                                    <h4 className="text-xl font-medium text-[#B1454A] capitalize">{operation}</h4>
                                    <div className="flex flex-col gap-2 ml-4">
                                        {Object.entries(specificGroups).map(([specific, ingredientGroups]) => (
                                            <div key={specific} className="flex flex-col gap-2">
                                                <h5 className="text-lg font-medium text-[#B1454A] capitalize ml-4">{specific}</h5>
                                                <div className="flex flex-col gap-2 ml-8">
                                                    {Object.entries(ingredientGroups).map(([ingredientName, group]) => {
                                                        const prep = group[0]; // Use the first item which has aggregated data
                                                        return (
                                                            <div 
                                                                key={prep.id}
                                                                className="flex flex-row items-center gap-4 cursor-pointer"
                                                                onClick={() => toggleCompleted(prep)}
                                                            >
                                                                <div className={`border-4 ${prep.completed ? 'border-green-500' : 'border-current'} rounded-xl p-2`}>
                                                                    <div className={`w-4 h-4 ${prep.completed ? 'bg-green-500' : 'bg-transparent'}`} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <p className={`text-xl ${prep.completed ? 'line-through text-gray-500' : 'text-[#B1454A]'}`}>
                                                                        <span className="font-medium">{ingredientName}:</span> {prep.instruction} {!prep.completed && prep.completedCount && prep.completedCount > 0 && prep.totalCount && prep.totalCount > 0 && prep.completedCount < prep.totalCount ? `| ${prep.completedCount} of ${prep.totalCount} completed` : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {Object.keys(groupedPreprocessing).length === 0 && (
                            <p className="text-2xl text-gray-500">No preprocessing tasks</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
} 
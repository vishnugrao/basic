'use client'

import { Preprocessing } from "@/types/types";
import { UUID } from "crypto";
import { useEffect, useState } from "react";

// Extended type for aggregated preprocessing that maintains IDs for syncing
interface AggregatedPreprocessing extends Omit<Preprocessing, 'id' | 'recipe_id'> {
    ids: UUID[];
    recipe_ids: UUID[];
    completed: boolean;
}

export default function PreprocessingList(props: { closePreprocessingList: (preprocessing: Preprocessing[]) => void, preprocessing: Preprocessing[] }) {
    const { closePreprocessingList, preprocessing } = props;
    
    // Maintain original list for state updates
    const [preprocessingList, setPreprocessingList] = useState<Preprocessing[]>(preprocessing);
    // Aggregated list for display
    const [aggregatedList, setAggregatedList] = useState<AggregatedPreprocessing[]>([]);

    useEffect(() => {
        // Aggregate preprocessing with same operation and specific
        const aggregated = preprocessingList.reduce((acc: AggregatedPreprocessing[], curr) => {
            const key = `${curr.operation}-${curr.specific}`;
            const existing = acc.find(item => `${item.operation}-${item.specific}` === key);
            if (existing) {
                existing.ids.push(curr.id);
                existing.recipe_ids.push(curr.recipe_id);
                // If any instance is completed, mark all as completed
                existing.completed = existing.completed || curr.completed || false;
            } else {
                acc.push({
                    operation: curr.operation,
                    specific: curr.specific,
                    instruction: curr.instruction,
                    user_id: curr.user_id,
                    created_at: curr.created_at,
                    updated_at: curr.updated_at,
                    ids: [curr.id],
                    recipe_ids: [curr.recipe_id],
                    completed: curr.completed || false
                });
            }
            return acc;
        }, []);
        setAggregatedList(aggregated);
    }, [preprocessingList]);

    const toggleCompleted = (preprocessing: AggregatedPreprocessing) => {
        const newCompleted = !preprocessing.completed;
        // Update all instances of this preprocessing in the original list
        const updatedList = preprocessingList.map(item => {
            if (preprocessing.ids.includes(item.id)) {
                return { ...item, completed: newCompleted };
            }
            return item;
        });
        setPreprocessingList(updatedList);
        setAggregatedList(aggregatedList.map(item => {
            for (const id of preprocessing.ids) {
                if (item.ids.includes(id)) {
                    return { ...item, completed: newCompleted };
                }
            }
            return item;
        }));
    };

    return (
        <>
            <div className="popup-container"
                onClick={async () => {
                    await closePreprocessingList(preprocessingList);
                }}
            >
                <div className="flex flex-col bg-[#F5F5F1] w-2/3 rounded-xl popup p-10 max-h-[1200px] max-w-[1000px] overflow-scroll scrollbar-hide"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}>
                    <div className="flex flex-col gap-4">
                        {aggregatedList.map((preprocessing, index) => (
                            <div 
                                key={index}
                                className="flex flex-row items-center gap-4 cursor-pointer"
                                onClick={() => toggleCompleted(preprocessing)}
                            >
                                <div className={`border-4 ${preprocessing.completed ? 'border-green-500' : 'border-current'} rounded-xl p-2`}>
                                    <div className={`w-4 h-4 ${preprocessing.completed ? 'bg-green-500' : 'bg-transparent'}`} />
                                </div>
                                <div className={`flex flex-col ${preprocessing.completed ? 'line-through text-gray-500' : ''}`}>
                                    <p className="text-xl font-semibold">
                                        {preprocessing.operation}: {preprocessing.specific}
                                    </p>
                                    <p className="text-lg">
                                        {preprocessing.instruction}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {aggregatedList.length === 0 && (
                            <p className="text-2xl text-gray-500">No preprocessing tasks</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
} 
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
        const groups: { [key: string]: Preprocessing[] } = {};
        preprocessingList.forEach(prep => {
            if (!groups[prep.operation]) {
                groups[prep.operation] = [];
            }
            groups[prep.operation].push(prep);
        });
        
        const aggregatedGroups: { [key: string]: Preprocessing[] } = {};
        Object.entries(groups).forEach(([operation, preps]) => {
            const instructionGroups: { [key: string]: Preprocessing[] } = {};
            preps.forEach(prep => {
                const key = `${prep.instruction}-${prep.specific}`;
                if (!instructionGroups[key]) {
                    instructionGroups[key] = [];
                }
                instructionGroups[key].push(prep);
            });
            
            aggregatedGroups[operation] = Object.values(instructionGroups).map(group => {
                const allCompleted = group.every(prep => prep.completed);
                return {
                    ...group[0],
                    completed: allCompleted
                };
            });
        });
        
        return aggregatedGroups;
    }, [preprocessingList]);

    const toggleCompleted = (prep: Preprocessing) => {
        const matchingItems = preprocessingList.filter(item => 
            item.instruction === prep.instruction && 
            item.specific === prep.specific &&
            item.operation === prep.operation
        );
        
        const updatedList = preprocessingList.map(item => {
            if (matchingItems.some(match => match.id === item.id)) {
                return { ...item, completed: !prep.completed };
            }
            return item;
        });
        
        setPreprocessingList(updatedList);

        // Call the callback to update all individual recipe instances
        if (props.onToggleAllPreprocessingInstances) {
            props.onToggleAllPreprocessingInstances(prep.operation, prep.instruction, prep.specific, !prep.completed);
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
                        <h3 className="text-2xl font-medium text-[#B1454A]">Preprocessing</h3>
                        <div className="flex flex-col gap-4">
                            {Object.entries(groupedPreprocessing).map(([operation, preps]) => (
                                <div key={operation} className="flex flex-col gap-2">
                                    <h4 className="text-xl font-medium text-[#B1454A] capitalize">{operation}</h4>
                                    <div className="flex flex-col gap-2 ml-4">
                                        {preps.map((prep) => (
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
                        {Object.keys(groupedPreprocessing).length === 0 && (
                            <p className="text-2xl text-gray-500">No preprocessing tasks</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
} 
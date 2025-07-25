'use client'

import ToggleInput from "./ToggleInput"
import { Goal } from "@/types/types"
import { Dispatch, SetStateAction } from "react"

interface GoalDetailsProps {
    goalDetails: Goal;
    activityLevel: string;
    setActivityLevel: Dispatch<SetStateAction<string>>;
    onUpdate: (updates: Partial<Goal>) => Promise<void>;
}

export default function GoalDetails({ 
    goalDetails,
    activityLevel,
    setActivityLevel,
    onUpdate
}: GoalDetailsProps) {
    return(
        <div className="flex w-full gap-8 justify-center">
            <div className="flex-shrink-0">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[60px] text-2xl">Goal:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <ToggleInput
                            altValues={["Bulk", "Shred", "Recomp"]}
                            valIdx={["Bulk", "Shred", "Recomp"].indexOf(goalDetails.goal)}
                            onSetText={(text: string) => onUpdate({ goal: text })}
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
                            onSetText={(text: string) => onUpdate({ diet: text })}
                        />
                    </div>
                </div>
            </div>

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
                            onSetText={(text: string) => onUpdate({ lacto_ovo: text })}
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
                                onUpdate({ activity_level: activity_level_conversion[text] });
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

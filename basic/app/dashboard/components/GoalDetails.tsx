'use client'

import { useState } from "react"
import ToggleInput from "./ToggleInput"
import { updateGoalDetails } from "../actions"
import { Goal } from "@/types/types"
import { UUID } from "crypto"

export default function GoalDetails(props: {goalDetails: Goal, userId: UUID}) {
    const { goalDetails } = props;
    const { userId } = props;
    const [storedGoal, setStoredGoal] = useState(goalDetails.goal);
    const [storedDiet, setStoredDiet] = useState(goalDetails.diet);
    const [storedLacto_Ovo, setStoredLacto_Ovo] = useState(goalDetails.lacto_ovo);
    const [storedActivity_Level, setStoredActivity_Level] = useState<string>(() => {
        // Convert the initial numeric value to string representation
        const activityLevels = {
            1.2: "Sedentary",
            1.375: "Light",
            1.55: "Moderate",
            1.725: "Very",
            1.9: "Extra"
        };
        return activityLevels[goalDetails.activity_level as keyof typeof activityLevels] || "Moderate";
    });

    const activity_level_conversion: {[id: string]: number} = {
        "Sedentary": 1.2,
        "Light": 1.375, 
        "Moderate": 1.55,
        "Very": 1.725,
        "Extra": 1.9
    }; 

    return(
        <div className="flex w-2/3 gap-4">
            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[60px] text-2xl">Goal:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <ToggleInput
                            altValues={["Bulk", "Shred", "Recomp"]}
                            valIdx={["Bulk", "Shred", "Recomp"].indexOf(storedGoal)}
                            onSetText={(text: string) => {
                                setStoredGoal(text);
                                updateGoalDetails({ goal: String(text), diet: String(storedDiet), lacto_ovo: String(storedLacto_Ovo), activity_level: activity_level_conversion[String(storedActivity_Level)], updated_at: String(new Date().toISOString()), user_id: userId});
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[60px] text-2xl">Diet:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <ToggleInput
                            altValues={["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Flexitarian", "Macrobiotic"]}
                            valIdx={["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Flexitarian", "Macrobiotic"].indexOf(storedDiet)}
                            onSetText={(text: string) => {
                                setStoredDiet(String(text));
                                updateGoalDetails({ goal: String(storedGoal), diet: String(text), lacto_ovo: String(storedLacto_Ovo), activity_level: activity_level_conversion[String(storedActivity_Level)], updated_at: String(new Date().toISOString()), user_id: userId});
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[80px] text-2xl">Lacto-Ovo:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <ToggleInput
                            altValues={["Dairy only", "Eggs only", "Dairy + Eggs", "No Eggs, No Dairy"]}
                            valIdx={(() => {
                                const idx = ["Dairy only", "Eggs only", "Dairy + Eggs", "No Eggs, No Dairy"].indexOf(storedLacto_Ovo);
                                return idx >= 0 ? idx : 0; // Default to first option if not found
                            })()}
                            onSetText={(text: string) => {
                                setStoredLacto_Ovo(text);
                                updateGoalDetails({ goal: String(storedGoal), diet: String(storedDiet), lacto_ovo: String(text), activity_level: activity_level_conversion[String(storedActivity_Level)], updated_at: String(new Date().toISOString()), user_id: userId});
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[80px] text-2xl">Activity Level:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <ToggleInput
                            altValues={["Sedentary", "Light", "Moderate", "Very", "Extra"]}
                            valIdx={["Sedentary", "Light", "Moderate", "Very", "Extra"].indexOf(storedActivity_Level)}
                            onSetText={(text: string) => {
                                setStoredActivity_Level(text);
                                updateGoalDetails({ goal: String(storedGoal), diet: String(storedDiet), lacto_ovo: String(storedLacto_Ovo), activity_level: activity_level_conversion[text], updated_at: String(new Date().toISOString()), user_id: userId });
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )

}

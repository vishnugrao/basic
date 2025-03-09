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

    return(
        <div className="flex w-1/2 gap-4">
            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[60px] text-2xl">Goal:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <ToggleInput
                            altValues={["Bulk", "Shred", "Recomp"]}
                            valIdx={1}
                            onSetText={(text: string) => {
                                setStoredGoal(text);
                                updateGoalDetails({ goal: String(text), diet: String(storedDiet), lacto_ovo: String(storedLacto_Ovo), updated_at: String(new Date().toISOString()), user_id: userId});
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
                            valIdx={1}
                            onSetText={(text: string) => {
                                setStoredDiet(String(text));
                                updateGoalDetails({ goal: String(storedGoal), diet: String(text), lacto_ovo: String(storedLacto_Ovo), updated_at: String(new Date().toISOString()), user_id: userId});
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
                            valIdx={1}
                            onSetText={(text: string) => {
                                setStoredLacto_Ovo(String(text));
                                updateGoalDetails({ goal: String(storedGoal), diet: String(storedDiet), lacto_ovo: String(text), updated_at: String(new Date().toISOString()), user_id: userId});
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )

}

'use client'

import { User, Goal } from "@/types/types";
import { Dispatch, SetStateAction } from "react";
import InlineInput from "./InlineInput";
import ToggleInput from "./ToggleInput";

interface UserSettingsModalProps {
    userDetails: User;
    goalDetails: Goal;
    heightUnit: string;
    weightUnit: string;
    activityLevel: string;
    onUserUpdate: (updates: Partial<User>) => Promise<void>;
    onGoalUpdate: (updates: Partial<Goal>) => Promise<void>;
    onClose: () => void;
    setHeightUnit: Dispatch<SetStateAction<string>>;
    setWeightUnit: Dispatch<SetStateAction<string>>;
    setActivityLevel: Dispatch<SetStateAction<string>>;
}

export default function UserSettingsModal({
    userDetails,
    goalDetails,
    heightUnit,
    weightUnit,
    activityLevel,
    onUserUpdate,
    onGoalUpdate,
    onClose,
    setHeightUnit,
    setWeightUnit,
    setActivityLevel
}: UserSettingsModalProps) {

    const handleGoalUpdateWithActivity = (text: string) => {
        setActivityLevel(text);
        const activity_level_conversion: {[id: string]: number} = {
            "Sedentary": 1.2,
            "Light": 1.375, 
            "Moderate": 1.55,
            "Very": 1.725,
            "Extra": 1.9
        };
        onGoalUpdate({ activity_level: activity_level_conversion[text] });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border-4 border-current">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b-4 border-current p-4 md:p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl md:text-3xl font-bold">Profile & Goals</h2>
                        <button
                            onClick={onClose}
                            className="text-2xl md:text-3xl border-2 border-current rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center cursor-pointer hover:bg-[#B1454A] hover:text-white transition-colors"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 space-y-8">
                    {/* Personal Information Section */}
                    <div className="space-y-6">
                        <h3 className="text-xl md:text-2xl font-semibold border-b-2 border-current pb-2">Personal Information</h3>
                        
                        {/* Mobile Layout - Stack vertically */}
                        <div className="space-y-4 md:hidden">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-lg min-w-[80px]">Gender:</span>
                                    <div className="flex items-baseline text-lg">
                                        <ToggleInput 
                                            altValues={["Male", "Female"]}
                                            valIdx={["Male", "Female"].indexOf(userDetails.gender)}
                                            onSetText={(text: string) => onUserUpdate({ gender: text })} 
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="text-lg min-w-[80px]">Height:</span>
                                    <div className="flex items-baseline text-lg gap-2">
                                        <InlineInput 
                                            text={String(userDetails.height)} 
                                            onSetText={(text: string) => onUserUpdate({ height: Number(text) })} 
                                        />
                                        <ToggleInput 
                                            altValues={["cm", "ft"]} 
                                            valIdx={["cm", "ft"].indexOf(heightUnit)}
                                            onSetText={setHeightUnit}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="text-lg min-w-[80px]">Weight:</span>
                                    <div className="flex items-baseline text-lg gap-2">
                                        <InlineInput 
                                            text={String(userDetails.weight)} 
                                            onSetText={(text: string) => onUserUpdate({ weight: Number(text) })} 
                                        />
                                        <ToggleInput 
                                            altValues={["kg", "lbs"]} 
                                            valIdx={["kg", "lbs"].indexOf(weightUnit)}
                                            onSetText={setWeightUnit}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="text-lg min-w-[80px]">Age:</span>
                                    <div className="flex items-baseline text-lg gap-2">
                                        <InlineInput
                                            text={String(userDetails.age)}
                                            onSetText={(text: string) => onUserUpdate({ age: Number(text) })}
                                        />
                                        <span>yrs</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Layout - Grid */}
                        <div className="hidden md:grid md:grid-cols-2 md:gap-8">
                            <div className="space-y-4">
                                <div className="flex items-baseline gap-4">
                                    <span className="min-w-[80px] text-2xl">Gender:</span>
                                    <div className="flex items-baseline text-2xl">
                                        <ToggleInput 
                                            altValues={["Male", "Female"]}
                                            valIdx={["Male", "Female"].indexOf(userDetails.gender)}
                                            onSetText={(text: string) => onUserUpdate({ gender: text })} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex items-baseline gap-4">
                                    <span className="min-w-[80px] text-2xl">Height:</span>
                                    <div className="flex items-baseline text-2xl gap-2">
                                        <InlineInput 
                                            text={String(userDetails.height)} 
                                            onSetText={(text: string) => onUserUpdate({ height: Number(text) })} 
                                        />
                                        <ToggleInput 
                                            altValues={["cm", "ft"]} 
                                            valIdx={["cm", "ft"].indexOf(heightUnit)}
                                            onSetText={setHeightUnit}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-baseline gap-4">
                                    <span className="min-w-[80px] text-2xl">Weight:</span>
                                    <div className="flex items-baseline text-2xl gap-2">
                                        <InlineInput 
                                            text={String(userDetails.weight)} 
                                            onSetText={(text: string) => onUserUpdate({ weight: Number(text) })} 
                                        />
                                        <ToggleInput 
                                            altValues={["kg", "lbs"]} 
                                            valIdx={["kg", "lbs"].indexOf(weightUnit)}
                                            onSetText={setWeightUnit}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-4">
                                    <span className="min-w-[60px] text-2xl">Age:</span>
                                    <div className="flex items-baseline text-2xl gap-2">
                                        <InlineInput
                                            text={String(userDetails.age)}
                                            onSetText={(text: string) => onUserUpdate({ age: Number(text) })}
                                        />
                                        <span>yrs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Goals & Preferences Section */}
                    <div className="space-y-6">
                        <h3 className="text-xl md:text-2xl font-semibold border-b-2 border-current pb-2">Goals & Preferences</h3>
                        
                        {/* Mobile Layout */}
                        <div className="space-y-4 md:hidden">
                            <div className="flex items-center gap-4">
                                <span className="text-lg min-w-[60px]">Goal:</span>
                                <div className="flex items-baseline text-lg">
                                    <ToggleInput
                                        altValues={["Bulk", "Shred", "Recomp"]}
                                        valIdx={["Bulk", "Shred", "Recomp"].indexOf(goalDetails.goal)}
                                        onSetText={(text: string) => onGoalUpdate({ goal: text })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-lg min-w-[60px]">Diet:</span>
                                <div className="flex items-baseline text-lg">
                                    <ToggleInput
                                        altValues={["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Flexitarian", "Macrobiotic"]}
                                        valIdx={["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Flexitarian", "Macrobiotic"].indexOf(goalDetails.diet)}
                                        onSetText={(text: string) => onGoalUpdate({ diet: text })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-lg">Lacto-Ovo:</span>
                                <div className="flex items-baseline text-lg">
                                    <ToggleInput
                                        altValues={["Dairy only", "Eggs only", "Dairy + Eggs", "No Eggs, No Dairy"]}
                                        valIdx={(() => {
                                            const idx = ["Dairy only", "Eggs only", "Dairy + Eggs", "No Eggs, No Dairy"].indexOf(goalDetails.lacto_ovo);
                                            return idx >= 0 ? idx : 0;
                                        })()}
                                        onSetText={(text: string) => onGoalUpdate({ lacto_ovo: text })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-lg">Activity:</span>
                                <div className="flex items-baseline text-lg">
                                    <ToggleInput
                                        altValues={["Sedentary", "Light", "Moderate", "Very", "Extra"]}
                                        valIdx={["Sedentary", "Light", "Moderate", "Very", "Extra"].indexOf(activityLevel)}
                                        onSetText={handleGoalUpdateWithActivity}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:grid md:grid-cols-2 md:gap-8">
                            <div className="space-y-4">
                                <div className="flex items-baseline gap-4">
                                    <span className="min-w-[60px] text-2xl">Goal:</span>
                                    <div className="flex items-baseline text-2xl">
                                        <ToggleInput
                                            altValues={["Bulk", "Shred", "Recomp"]}
                                            valIdx={["Bulk", "Shred", "Recomp"].indexOf(goalDetails.goal)}
                                            onSetText={(text: string) => onGoalUpdate({ goal: text })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-4">
                                    <span className="min-w-[60px] text-2xl">Diet:</span>
                                    <div className="flex items-baseline text-2xl">
                                        <ToggleInput
                                            altValues={["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Flexitarian", "Macrobiotic"]}
                                            valIdx={["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Flexitarian", "Macrobiotic"].indexOf(goalDetails.diet)}
                                            onSetText={(text: string) => onGoalUpdate({ diet: text })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-baseline gap-4">
                                    <span className="min-w-[100px] text-2xl">Lacto-Ovo:</span>
                                    <div className="flex items-baseline text-2xl">
                                        <ToggleInput
                                            altValues={["Dairy only", "Eggs only", "Dairy + Eggs", "No Eggs, No Dairy"]}
                                            valIdx={(() => {
                                                const idx = ["Dairy only", "Eggs only", "Dairy + Eggs", "No Eggs, No Dairy"].indexOf(goalDetails.lacto_ovo);
                                                return idx >= 0 ? idx : 0;
                                            })()}
                                            onSetText={(text: string) => onGoalUpdate({ lacto_ovo: text })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-4">
                                    <span className="min-w-[120px] text-2xl">Activity Level:</span>
                                    <div className="flex items-baseline text-2xl">
                                        <ToggleInput
                                            altValues={["Sedentary", "Light", "Moderate", "Very", "Extra"]}
                                            valIdx={["Sedentary", "Light", "Moderate", "Very", "Extra"].indexOf(activityLevel)}
                                            onSetText={handleGoalUpdateWithActivity}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t-4 border-current p-4 md:p-6">
                    <div className="flex justify-center">
                        <div className="border-4 border-current rounded-xl cursor-pointer text-xl md:text-2xl w-fit"
                            onClick={onClose}
                        >
                            <p>&nbsp;Save & Close&nbsp;</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 
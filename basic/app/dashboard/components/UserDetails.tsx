'use client'

import InlineInput from "./InlineInput"
import ToggleInput from "./ToggleInput"
import { User } from "@/types/types"
import { Dispatch, SetStateAction } from "react"

interface UserDetailsProps {
    userDetails: User;
    heightUnit: string;
    weightUnit: string;
    setHeightUnit: Dispatch<SetStateAction<string>>;
    setWeightUnit: Dispatch<SetStateAction<string>>;
    onUpdate: (updates: Partial<User>) => Promise<void>;
}

export default function UserDetails({ 
    userDetails, 
    heightUnit, 
    weightUnit,
    setHeightUnit,
    setWeightUnit,
    onUpdate 
}: UserDetailsProps) {
    return (
        <div className="flex w-full gap-6 justify-center">
            <div className="flex-shrink-0">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[80px] text-2xl">Gender:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <ToggleInput 
                            altValues={["Male", "Female"]}
                            valIdx={["Male", "Female"].indexOf(userDetails.gender)}
                            onSetText={(text: string) => onUpdate({ gender: text })} 
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex-shrink-0">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[80px] text-2xl">Height:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <InlineInput 
                            text={String(userDetails.height)} 
                            onSetText={(text: string) => onUpdate({ height: Number(text) })} 
                        />
                        <span className="text-2xl ml-1">
                            <ToggleInput 
                                altValues={["cm", "ft"]} 
                                valIdx={["cm", "ft"].indexOf(heightUnit)}
                                onSetText={setHeightUnit}
                            />
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-auto"></div>
            
            <div className="flex-shrink-0">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[80px] text-2xl">Weight:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <InlineInput 
                            text={String(userDetails.weight)} 
                            onSetText={(text: string) => onUpdate({ weight: Number(text) })} 
                        />
                        <span className="text-2xl ml-1">
                            <ToggleInput 
                                altValues={["kg", "lbs"]} 
                                valIdx={["kg", "lbs"].indexOf(weightUnit)}
                                onSetText={setWeightUnit}
                            />
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[60px] text-2xl">Age:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <InlineInput
                            text={String(userDetails.age)}
                            onSetText={(text: string) => onUpdate({ age: Number(text) })}
                        />
                        <span className="text-2xl ml-1">yrs</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
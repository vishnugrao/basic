'use client'

import { useState } from "react";
import ToggleInput from "./ToggleInput"
import InlineInput from "./InlineInput"
import { updateUserDetails } from "../actions";
import { User } from "@/types/types";

export default function UserDetails(props: {userDetails : User}) {
    const { userDetails } = props;
    const [storedGender, setStoredGender] = useState(userDetails.gender);
    const [storedHeight, setStoredHeight] = useState(userDetails.height);
    const [storedWeight, setStoredWeight] = useState(userDetails.weight);
    const [storedAge, setStoredAge] = useState(userDetails.age);
    const [heightUnit, setHeightUnit] = useState("cm");
    const [weightUnit, setWeightUnit] = useState("kg");

    return (
        <div className="flex w-2/3 gap-4">
            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[80px] text-2xl">Gender:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <ToggleInput 
                            altValues={["Male", "Female"]}
                            valIdx={["Male", "Female"].indexOf(storedGender)}
                            onSetText={(text: string) => {
                                setStoredGender(text);
                                updateUserDetails({ gender: String(text), height: Number(storedHeight), weight: Number(storedWeight), age: Number(storedAge), updated_at: String(new Date().toISOString()), email: String(userDetails.email)});
                            }} 
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[80px] text-2xl">Height:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <InlineInput 
                            text={String(storedHeight)} 
                            onSetText={(text: string) => {
                                setStoredHeight(Number(text));
                                updateUserDetails({ gender: String(storedGender), height: Number(text), weight: Number(storedWeight), age: Number(storedAge), updated_at: String(new Date().toISOString()), email: String(userDetails.email)});
                            }} 
                        />
                        <span className="text-2xl ml-1">
                            <ToggleInput 
                                altValues={["cm", "ft"]} 
                                valIdx={["cm", "ft"].indexOf(heightUnit)}
                                onSetText={(text: string) => setHeightUnit(text)}
                            />
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[80px] text-2xl">Weight:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <InlineInput 
                            text={String(storedWeight)} 
                            onSetText={(text: string) => {
                                setStoredWeight(Number(text));
                                updateUserDetails({ gender: String(storedGender), height: Number(storedHeight), weight: Number(text), age: Number(storedAge), updated_at: String(new Date().toISOString()), email: String(userDetails.email)});
                            }} 
                        />
                        <span className="text-2xl ml-1">
                            <ToggleInput 
                                altValues={["kg", "lbs"]} 
                                valIdx={["kg", "lbs"].indexOf(weightUnit)}
                                onSetText={(text: string) => setWeightUnit(text)}
                            />
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[60px] text-2xl">Age:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <InlineInput
                            text={String(storedAge)}
                            onSetText={(text: string) => {
                                setStoredAge(Number(text));
                                updateUserDetails({ gender: String(storedGender), height: Number(storedHeight), weight: Number(storedWeight), age: Number(text), updated_at: String(new Date().toISOString()), email: String(userDetails.email) });
                            }}
                        />
                        <span className="text-2xl ml-1">yrs</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
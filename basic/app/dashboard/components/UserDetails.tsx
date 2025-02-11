'use client'

import { useState } from "react";
import ToggleInput from "./ToggleInput"
import InlineInput from "./InlineInput"
import { updateUserDetails } from "../actions";

export default function UserDetails(props: { userDetails: any }) {
    const { userDetails } = props;
    const [storedGender, setStoredGender] = useState(userDetails.gender);
    const [storedHeight, setStoredHeight] = useState(userDetails.height);
    const [storedWeight, setStoredWeight] = useState(userDetails.weight);

    return (
        <div className="flex w-1/2 gap-4">
            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[80px] text-2xl">Gender:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <ToggleInput 
                            defaultText="Male" 
                            activeText="Female" 
                            onSetText={(text: string) => {
                                setStoredGender(text);
                                updateUserDetails({gender: text, height: storedHeight, weight: storedWeight, email: userDetails.email});
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
                            text={storedHeight} 
                            onSetText={(text: string) => {
                                setStoredHeight(Number(text));
                                updateUserDetails({gender: storedGender, height: Number(text), weight: storedWeight, email: userDetails.email});
                            }} 
                        />
                        <span className="text-2xl ml-1"><ToggleInput defaultText="cm" activeText="ft" onSetText={() => {}}/></span>
                    </div>
                </div>
            </div>
            
            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[80px] text-2xl">Weight:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <InlineInput 
                            text={storedWeight} 
                            onSetText={(text: string) => {
                                setStoredWeight(Number(text));
                                updateUserDetails({gender: storedGender, height: storedHeight, weight: Number(text), email: userDetails.email});
                            }} 
                        />
                        <span className="text-2xl ml-1"><ToggleInput defaultText="kg" activeText="lbs" onSetText={() => {}}/></span>
                    </div>
                </div>
            </div>
        </div>
    )
}
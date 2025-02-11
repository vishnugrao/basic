'use client'

import { useState } from "react";
import InlineInput from "./InlineInput"

export default function UserDetails() {
    const [storedGender, setStoredGender] = useState("Male");
    const [storedHeight, setStoredHeight] = useState("173");
    const [storedWeight, setStoredWeight] = useState("83");

    return (
        <div className="flex w-1/2 gap-4">
            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[80px] text-2xl">Gender:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <InlineInput 
                            text={storedGender} 
                            onSetText={(text: string) => setStoredGender(text)} 
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
                            onSetText={(text: string) => setStoredHeight(text)} 
                        />
                        <span className="text-2xl ml-1">cm</span>
                    </div>
                </div>
            </div>
            
            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[80px] text-2xl">Weight:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <InlineInput 
                            text={storedWeight} 
                            onSetText={(text: string) => setStoredWeight(text)} 
                        />
                        <span className="text-2xl ml-1">kg</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
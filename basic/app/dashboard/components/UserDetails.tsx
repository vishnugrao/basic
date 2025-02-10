'use client'

import { useState } from "react";
import InlineInput from "./InlineInput"

export default function UserDetails() {

    const [storedGender, setStoredGender] = useState("Male");
    const [storedHeight, setStoredHeight] = useState("173");
    const [storedWeight, setStoredWeight] = useState("83");

    return(
        <div className="flex flex-auto">
            <div className="flex flex-auto text-2xl"><p>Gender:&nbsp;</p><p><InlineInput text={storedGender} onSetText={(text: string) => setStoredGender(text)} /></p></div>
            <div className="flex flex-auto text-2xl"><p>Height:&nbsp;</p><p><InlineInput text={storedHeight} onSetText={(text: string) => setStoredHeight(text)} /></p><p>cm</p></div>
            <div className="flex flex-auto text-2xl"><p>Weight:&nbsp;</p><p><InlineInput text={storedWeight} onSetText={(text: string) => setStoredWeight(text)} /></p><p>kg</p></div>
        </div>
    )
}
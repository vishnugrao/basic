'use client'

import { Goal, User } from "@/types/types";
import { useEffect, useState } from "react";

export default function QuantitativeNutrition(props: {userDetails: User, goalDetails: Goal}) {
    const { userDetails } = props;
    const { goalDetails } = props;
    const [tdee, setTDEE] = useState(0);
    const [offset, setOffset] = useState(0);
    
    useEffect(() =>  {
        const bmrConstant = userDetails.gender == "Male" ? 5 : -161;
        const basalMetabolicRate = 10 * userDetails.weight + 6.25 * userDetails.height - 5 * userDetails.age + bmrConstant;
        setTDEE(Math.round(basalMetabolicRate * goalDetails.activity_level / 50) * 50);
    }, [userDetails.gender, userDetails.weight, userDetails.height, userDetails.age, goalDetails.activity_level])

    useEffect(() => {
        if (goalDetails.goal == "Bulk") {
            setOffset(500);
        }
        if (goalDetails.goal == "Shred") {
            setOffset(-500);
        }
        if (goalDetails.goal == "Recomp") {
            setOffset(0);
        }
    }, [goalDetails.goal])

    return (
        <div className="flex w-1/3 flex-col gap-4">
            <p className="text-2xl">Total Daily Energy Expenditure (TDEE):&nbsp;{tdee}</p>
            <p className="text-2xl">Daily Target:&nbsp;{tdee + offset}</p>
        </div>
    );
}
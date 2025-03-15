'use client'

import { Goal, User } from "@/types/types";
import { useEffect, useState } from "react";

export default function QuantitativeNutrition(props: {userDetails: User, goalDetails: Goal}) {
    const { userDetails } = props;
    const { goalDetails } = props;
    const [tdee, setTDEE] = useState(0);
    const [offset, setOffset] = useState(0);
    const [protein, setProtein] = useState(0);
    const [fat, setFat] = useState(0);
    
    useEffect(() =>  {
        const bmrConstant = userDetails.gender == "Male" ? 5 : -161;
        const basalMetabolicRate = 10 * userDetails.weight + 6.25 * userDetails.height - 5 * userDetails.age + bmrConstant;
        setTDEE(Math.round(basalMetabolicRate * goalDetails.activity_level / 50) * 50);
    }, [userDetails.gender, userDetails.weight, userDetails.height, userDetails.age, goalDetails.activity_level])

    useEffect(() => {
        if (goalDetails.goal == "Bulk") {
            setOffset(0.15 * tdee);
            setProtein(1.8 * userDetails.weight);
            setFat(Math.round((0.25 * (tdee + offset)) / 9));
        }
        if (goalDetails.goal == "Shred") {
            setOffset(-0.2 * tdee);
            setProtein(2 * userDetails.weight);
            setFat(Math.round((0.21 * (tdee + offset)) / 9));
        }
        if (goalDetails.goal == "Recomp") {
            setOffset(0);
            setProtein(1.9 * userDetails.weight);
            setFat(Math.round((0.23 * (tdee + offset))/9));
        }
    }, [goalDetails.goal, tdee, userDetails.weight, offset])

    return (
        <>
            <div className="flex w-1/3 flex-col gap-4">
                <p className="text-2xl">Total Daily Energy Expenditure (TDEE):&nbsp;{tdee}</p>
                <p className="text-2xl">Daily Target:&nbsp;{tdee + offset}</p>
                <p className="text-2xl">Protein Target:&nbsp;{protein}g</p>
                <p className="text-2xl">Fat Target:&nbsp;{fat}g</p>
            </div>
        </>
    );
}
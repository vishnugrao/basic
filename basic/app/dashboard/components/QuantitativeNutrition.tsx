'use client'

import { Goal, Recipe, User } from "@/types/types";
import { useEffect, useState } from "react";

export default function QuantitativeNutrition(props: { userDetails: User, goalDetails: Goal, onUpdate: (updates: Recipe[]) => Promise<void> }) {
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
            setProtein(Math.min(Math.round(1.9 * userDetails.weight), userDetails.height + 20));
            setFat(Math.round((0.25 * (tdee + offset)) / 9));
        }
        if (goalDetails.goal == "Shred") {
            setOffset(-0.2 * tdee);
            setProtein(Math.min(Math.round(2.1 * userDetails.weight), userDetails.height + 20));
            setFat(Math.round((0.21 * (tdee + offset)) / 9));
        }
        if (goalDetails.goal == "Recomp") {
            setOffset(0);
            setProtein(Math.min(Math.round(1.9 * userDetails.weight), userDetails.height + 20));
            setFat(Math.round((0.23 * (tdee + offset))/9));
        }
    }, [goalDetails.goal, tdee, userDetails.weight, offset, userDetails.height])

    return (
        <>
            <div className="flex w-1/3 flex-col gap-4">
                <p className="text-2xl">Total Daily Energy Expenditure (TDEE):&nbsp;{tdee}</p>
                <p className="text-2xl">Daily Target:&nbsp;{tdee + offset}</p>
                <p className="text-2xl">Protein Target:&nbsp;{protein}g</p>
                <p className="text-2xl">Fat Target:&nbsp;{fat}g</p>
            </div>
            <div className="flex pt-4 w-full h-[800px]">
                <div>

                </div>
            </div>
        </>
    );
}
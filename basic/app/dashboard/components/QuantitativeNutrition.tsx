'use client'

import { Goal, User } from "@/types/types";
import { useEffect } from "react";

export default function QuantitativeNutrition(props: {userDetails: User, goalDetails: Goal}) {
    const { userDetails } = props;
    const { goalDetails } = props;
    
    useEffect(() =>  {
        console.log(userDetails);
        console.log(goalDetails);
    }, [userDetails, goalDetails])

    return (
        <div className="flex w-1/3 flex-col gap-4">
            <p className="text-2xl">Total Daily Energy Expenditure (TDEE):&nbsp;{}</p>
            <p className="text-2xl">Daily Target:&nbsp;{}</p>
        </div>
    );
}
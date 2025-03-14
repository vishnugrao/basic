'use client'

import { useState } from "react"
import BubbleInput from "./BubbleInput"
import CuisineInput from "./CuisineInput"
import { MealPlan, SearchSet } from "@/types/types"
import { UUID } from "crypto"
import { updateMealPlanner } from "../actions"


export default function MealPlanner(props: {mealPlan: MealPlan, userId: UUID, searchSet: SearchSet}) {
    const { mealPlan } = props;
    const { userId } = props;
    const [ isCuisineSearchOpen, setIsCuisineSearchOpen] = useState(false);
    const limitPreferences = 3; // set the number of tags displayed on the page
    const [ cuisines, setCuisines ] = useState(mealPlan.cuisines);

    const toggleCuisineSearch = () => {
        setIsCuisineSearchOpen(!isCuisineSearchOpen);
    }

    const closeCuisineSearch = async (cuisines: string[]) => {
        setIsCuisineSearchOpen(false);
        setCuisines(cuisines);
        console.log(cuisines);
        await updateMealPlanner({cuisines: cuisines, updated_at: new Date().toISOString(), user_id: userId});
    }

    return(
        <div className="flex w-1/2 gap-4 flex-wrap">
            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[60px] text-2xl whitespace-nowrap">Cuisine Preferences:&nbsp;&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <BubbleInput 
                            currentPreferences={cuisines} 
                            limitPreferences={limitPreferences}
                        />
                    </div>

                    <div className="flex-auto"></div>
                    
                    <div className="flex items-baseline text-2xl pl-4">
                        <div className="border-4 border-current rounded-xl cursor-pointer text-2xl"
                        onClick={toggleCuisineSearch}
                        >
                            <p>&nbsp;Change&nbsp;</p>
                        </div>
                        {isCuisineSearchOpen && <CuisineInput cuisineSet={cuisines} searchSet={props.searchSet.searchSet} closeCuisineSearch={closeCuisineSearch} />}
                    </div>
                </div>
            </div>
        </div>
    )
}

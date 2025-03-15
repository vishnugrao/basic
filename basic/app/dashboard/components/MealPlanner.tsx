'use client'

import BubbleInput from "./BubbleInput"
import CuisineInput from "./CuisineInput"
import { MealPlan, SearchSet } from "@/types/types"
import { Dispatch, SetStateAction } from "react"

interface MealPlannerProps {
    mealPlan: MealPlan;
    searchSet: SearchSet;
    isCuisineSearchOpen: boolean;
    setIsCuisineSearchOpen: Dispatch<SetStateAction<boolean>>;
    onUpdate: (updates: Partial<MealPlan>) => Promise<void>;
}

export default function MealPlanner({ 
    mealPlan,
    searchSet,
    isCuisineSearchOpen,
    setIsCuisineSearchOpen,
    onUpdate
}: MealPlannerProps) {
    const limitPreferences = 5; // set the number of tags displayed on the page

    const toggleCuisineSearch = () => {
        setIsCuisineSearchOpen(!isCuisineSearchOpen);
    }

    const closeCuisineSearch = async (cuisines: string[]) => {
        setIsCuisineSearchOpen(false);
        onUpdate({ cuisines });
    }

    return(
        <div className="flex w-1/3 gap-4 flex-wrap">
            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <p className="min-w-[200px] text-2xl whitespace-nowrap">Top 5 cuisines:&nbsp;&nbsp;</p>
                    <div className="flex items-baseline text-2xl">
                        <BubbleInput 
                            currentPreferences={mealPlan.cuisines} 
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
                        {isCuisineSearchOpen && <CuisineInput cuisineSet={mealPlan.cuisines} searchSet={searchSet.searchSet} closeCuisineSearch={closeCuisineSearch} />}
                    </div>
                </div>
            </div>
        </div>
    )
}

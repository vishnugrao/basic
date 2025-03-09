'use client'

import { useState } from "react"
import BubbleInput from "./BubbleInput"
import SearchInput from "./SearchInput"
import { updateMealPlanner } from "../actions"
import { MealPlan, SearchSet } from "@/types/types"
import { UUID } from "crypto"

export default function MealPlanner(props: {mealPlan: MealPlan, userId: UUID, searchSet: SearchSet}) {
    const { mealPlan } = props;
    const { searchSet } = props;
    const { userId } = props;
    const [ storedCuisines, setStoredCuisines ] = useState(mealPlan.cuisines);
    const [ isCuisineSearchOpen, setIsCuisineSearchOpen] = useState(false);
    const limitPreferences = 3; // set the number of tags displayed on the page

    const toggleCuisineSearch = () => {
        setIsCuisineSearchOpen(!isCuisineSearchOpen);
    }

    const closeCuisineSearch = () => {
        setIsCuisineSearchOpen(false);
    }

    return(
        <div className="flex w-1/2 gap-4">
            <div className="flex-1">
                <div className="flex items-baseline h-10">
                    <span className="min-w-[60px] text-2xl whitespace-nowrap">Cuisine Preferences:&nbsp;</span>
                    <div className="flex items-baseline text-2xl">
                        <BubbleInput 
                            currentPreferences={mealPlan.cuisines} 
                            limitPreferences={limitPreferences}
                            searchSet={searchSet.searchSet}
                            onSetPreferences={(preferences: string[]) => {
                                setStoredCuisines(preferences.slice(0, limitPreferences));
                                updateMealPlanner({ cuisines: preferences.slice(0, limitPreferences), updated_at: String(new Date().toISOString()), user_id: userId})
                            }}
                            />
                    </div>
                    
                    <div className="flex items-baseline text-2xl pl-2">
                        <div className="inline-text_copy inline-text_copy--active"
                        onClick={toggleCuisineSearch}
                        >
                            Change
                        </div>
                        {isCuisineSearchOpen && <SearchInput cuisineSet={props.mealPlan.cuisines} searchSet={props.searchSet.searchSet} closeCuisineSearch={closeCuisineSearch} />}
                    </div>
                </div>
            </div>
        </div>
    )
}

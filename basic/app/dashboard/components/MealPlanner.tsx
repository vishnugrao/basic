'use client'

import BubbleInput from "./BubbleInput"
import CuisineInput from "./CuisineInput"
import UserWallet from "./UserWallet"
import { MealPlan, SearchSet, UserWallet as UserWalletType } from "@/types/types"
import { Dispatch, SetStateAction } from "react"

interface MealPlannerProps {
    mealPlan: MealPlan;
    searchSet: SearchSet;
    wallet: UserWalletType;
    isCuisineSearchOpen: boolean;
    setIsCuisineSearchOpen: Dispatch<SetStateAction<boolean>>;
    onUpdate: (updates: Partial<MealPlan>) => Promise<void>;
    onWalletRefresh?: () => Promise<void>;
}

export default function MealPlanner({ 
    mealPlan,
    searchSet,
    wallet,
    isCuisineSearchOpen,
    setIsCuisineSearchOpen,
    onUpdate,
    onWalletRefresh
}: MealPlannerProps) {
    const limitPreferences = 4; // set the number of tags displayed on the page

    const toggleCuisineSearch = () => {
        setIsCuisineSearchOpen(!isCuisineSearchOpen);
    }

    const closeCuisineSearch = async (cuisines: string[]) => {
        setIsCuisineSearchOpen(false);
        onUpdate({ cuisines });
    }

    return(
        <div className="flex flex-col md:flex-row gap-4 md:gap-0">
            {/* Mobile Layout - Stack vertically */}
            <div className="flex flex-col md:hidden space-y-4">
                {/* Cuisines Section */}
                <div className="space-y-2">
                    <p className="text-lg whitespace-nowrap font-medium">Top 4 cuisines:</p>
                    <div className="flex items-center gap-2">
                        <BubbleInput 
                            currentPreferences={mealPlan.cuisines} 
                            limitPreferences={limitPreferences}
                        />
                        <div className="border md:border-4 border-current rounded-md md:rounded-xl cursor-pointer text-sm md:text-lg w-fit flex-shrink-0"
                            onClick={toggleCuisineSearch}
                        >
                            <p className="px-2 py-0.5 md:px-4 md:py-2">Change</p>
                        </div>
                    </div>
                    {isCuisineSearchOpen && (
                        <CuisineInput 
                            cuisineSet={mealPlan.cuisines} 
                            searchSet={searchSet.searchSet} 
                            closeCuisineSearch={closeCuisineSearch} 
                        />
                    )}
                </div>

                {/* Wallet Section */}
                <div className="pt-4 border-t border-gray-200">
                    <UserWallet wallet={wallet} onWalletRefresh={onWalletRefresh} />
                </div>
            </div>

            {/* Desktop Layout - Keep original for large screens */}
            <div className="hidden md:flex w-full">
                <div className="flex w-1/3 flex-col gap-4">
                    <div className="flex items-baseline h-10">
                        <p className="min-w-[200px] text-2xl whitespace-nowrap">Top 4 cuisines:&nbsp;&nbsp;</p>
                        <div className="flex items-baseline text-2xl">
                            <BubbleInput 
                                currentPreferences={mealPlan.cuisines} 
                                limitPreferences={limitPreferences}
                            />
                        </div>

                        <div className="flex-auto"></div>
                        
                        <div className="flex items-baseline text-2xl pl-4">
                            <div className="border-4 border-current rounded-xl cursor-pointer text-2xl w-fit"
                            onClick={toggleCuisineSearch}
                            >
                                <p>&nbsp;Change&nbsp;</p>
                            </div>
                            {isCuisineSearchOpen && <CuisineInput cuisineSet={mealPlan.cuisines} searchSet={searchSet.searchSet} closeCuisineSearch={closeCuisineSearch} />}
                        </div>
                    </div>
                </div>
                <div className="flex-auto"></div>
                <div className="flex w-1/3">
                    <UserWallet wallet={wallet} onWalletRefresh={onWalletRefresh} />
                </div>
                <div className="flex-auto"></div>
            </div>
        </div>
    )
}

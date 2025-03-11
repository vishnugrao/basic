import React, { useEffect } from "react";
import SearchInput from "./SearchInput";
import { createSwapy } from "swapy";

export default function CuisineInput(props: {cuisineSet: string[], searchSet: string[], closeCuisineSearch: () => void}) {
    const { searchSet } = props;
    const { cuisineSet } = props;
    const { closeCuisineSearch } = props;
    const displaySet = [];
    const preferenceSet = [];

    const differenceSet = searchSet.filter(cuisine => cuisineSet.indexOf(cuisine) < 0)

    for (let preferenceTagIdx = 0; preferenceTagIdx < cuisineSet.length; preferenceTagIdx++) {
        preferenceSet.push(<div data-swapy-slot={preferenceTagIdx} key={preferenceTagIdx}><p key={preferenceTagIdx} data-swapy-item={preferenceTagIdx} data-swapy-handle className="text-2xl border-4 border-current rounded-xl whitespace-nowrap cursor-pointer">&nbsp;{cuisineSet[preferenceTagIdx]}&nbsp;</p></div>)
    }

    for (let searchTagIdx = 0; searchTagIdx < differenceSet.length; searchTagIdx++){
        displaySet.push(<p key={searchTagIdx} className="text-2xl border-4 border-current rounded-xl whitespace-nowrap">&nbsp;{differenceSet[searchTagIdx]}&nbsp;</p>)
    }

    useEffect(() => {
        const container = document.querySelector('.swapy-container');
        if (!container) return;

        const swapy = createSwapy(container as HTMLElement, {
            animation: 'none'
        });

        swapy.enable(true);

        return () => {
            swapy.enable(false);
        };
    }, []);

    return (
        <div className="popup-container"
            onClick={closeCuisineSearch}
        >
            <div className="flex flex-col bg-[#F5F5F1] w-2/3 rounded-xl popup"
                onClick={(e) => {
                    e.stopPropagation();
                }}>
                <div className="flex flex-row p-10 pb-5">
                    <div className="swapy-container flex gap-4 flex-wrap">
                        {preferenceSet}
                    </div>
                    <div className="flex-auto"></div>
                    <div className="flex items-baseline text-2xl pl-2 gap-4">
                        <div className="inline-text_copy inline-text_copy--active">Remove</div>
                        <div className="inline-text_copy inline-text_copy--active"
                            onClick={() => {

                            }}
                        >
                            Rearrange
                        </div>
                    </div>
                </div>
                {/* Send the differenceSet to searchInput */}
                <SearchInput 
                    text={"Search for a cuisine"}
                    searchSet={differenceSet} />
            </div>
        </div>
        
    )
}
import React, { useState, useCallback } from "react";

export default function SearchInput(props: {cuisineSet: string[], searchSet: string[], closeCuisineSearch: () => void}) {
    const { searchSet } = props;
    const { cuisineSet } = props;
    const { closeCuisineSearch } = props;
    const displaySet = [];
    const preferenceSet = [];

    const differenceSet = searchSet.filter(cuisine => cuisineSet.indexOf(cuisine) < 0)

    for (let preferenceTagIdx = 0; preferenceTagIdx < cuisineSet.length; preferenceTagIdx++) {
        preferenceSet.push(<p key={preferenceTagIdx} className="text-2xl border-4 border-current rounded-xl whitespace-nowrap">&nbsp;{cuisineSet[preferenceTagIdx]}&nbsp;</p>)
    }

    for (let searchTagIdx = 0; searchTagIdx < differenceSet.length; searchTagIdx++){
        displaySet.push(<p key={searchTagIdx} className="text-2xl border-4 border-current rounded-xl whitespace-nowrap">&nbsp;{differenceSet[searchTagIdx]}&nbsp;</p>)
    }

    return (
        <div className="popup-container"
            onClick={closeCuisineSearch}
        >
            <div className="flex flex-col bg-[#F5F5F1] w-1/2 rounded-xl popup"
                onClick={(e) => {
                    e.stopPropagation();
                }}>
                <div className="flex flex-row p-10">
                    <div className="flex gap-4 flex-wrap">
                        {preferenceSet}
                    </div>
                    <div className="flex-auto"></div>
                    <div className="flex items-baseline text-2xl pl-2 gap-4">
                        <div className="inline-text_copy inline-text_copy--active">Remove</div>
                        <div className="inline-text_copy inline-text_copy--active">Rearrange</div>
                    </div>
                </div>
                <div className="p-10">Search Input</div>
                <div className="flex gap-4 flex-wrap p-10">
                    {displaySet}
                </div>
            </div>
        </div>
        
    )
}
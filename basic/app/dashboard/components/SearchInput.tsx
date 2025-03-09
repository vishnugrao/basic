import React, { useState, useCallback } from "react";

export default function SearchInput(props: {searchSet: string[], closeCuisineSearch: () => void}) {
    const { searchSet } = props;
    const { closeCuisineSearch } = props;
    const displaySet = [];

    for (let searchTagIdx = 0; searchTagIdx < searchSet.length; searchTagIdx++){
        displaySet.push(<p key={searchTagIdx} className="text-2xl border-4 border-current rounded-xl whitespace-nowrap">&nbsp;{searchSet[searchTagIdx]}&nbsp;</p>)
    }

    return (
        <div className="popup-container"
            onClick={closeCuisineSearch}
        >
            <div className="flex gap-4 flex-wrap">
                {displaySet}
            </div>
        </div>
        
    )
}
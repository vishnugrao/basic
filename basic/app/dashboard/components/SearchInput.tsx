import React, { useState, useCallback } from "react";

export default function SearchInput(props: {searchSet: string[]}) {
    const { searchSet } = props;
    const displaySet = [];

    for (let searchTagIdx = 0; searchTagIdx < searchSet.length; searchTagIdx++){
        displaySet.push(<p className="text-2xl border-4 border-current rounded-xl whitespace-nowrap">&nbsp;{searchSet[searchTagIdx]}&nbsp;</p>)
    }

    return (
        <div className="flex gap-4 flex-wrap">
            {displaySet}
        </div>
    )
}
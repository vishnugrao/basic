import React, { useState, useCallback } from "react";

export default function BubbleInput(props: {
    currentPreferences: string[];
    limitPreferences: number;
    searchSet: string[];
    onSetPreferences: (preferences: string[]) => void
}) {
    const preferenceElements = [];

    for (let pref = 0; pref < props.limitPreferences; pref++) {
        preferenceElements.push(<p className="text-2xl border-4 border-current rounded-xl">&nbsp;{props.currentPreferences[pref]}&nbsp;</p>)
    }

    return (
        <div className="flex gap-4">
            {preferenceElements}
        </div>
    )
}
import React from "react";

export default function BubbleInput(props: {
    currentPreferences: string[];
    limitPreferences: number;
}) {
    const preferenceElements = [];

    for (let pref = 0; pref < Math.min(props.limitPreferences, props.currentPreferences.length); pref++) {
        preferenceElements.push(<p key={pref} className="text-2xl border-4 border-current rounded-xl whitespace-nowrap">&nbsp;{props.currentPreferences[pref]}&nbsp;</p>)
    }

    return (
        <div className="flex gap-4 flex-wrap">
            {preferenceElements}
        </div>
    )
}
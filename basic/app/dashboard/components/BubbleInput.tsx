import React from "react";

export default function BubbleInput(props: {
    currentPreferences: string[];
    limitPreferences: number;
}) {
    const preferenceElements = [];

    for (let pref = 0; pref < Math.min(props.limitPreferences, props.currentPreferences.length); pref++) {
        const preference = props.currentPreferences[pref];
        preferenceElements.push(
            <p key={preference} className="text-sm md:text-2xl border md:border-4 border-current rounded-md md:rounded-xl whitespace-nowrap px-2 py-0.5 md:px-4 md:py-2">
                {preference}
            </p>
        );
    }

    return (
        <div className="flex gap-2 md:gap-4 flex-wrap">
            {preferenceElements}
        </div>
    );
}
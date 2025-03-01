import React, { useState, useCallback } from "react";

export default function ToggleInput(props: {
    altValues: string[];
    valIdx: number; 
    onSetText: (text: string) => void 
}) {
    const [inputValue, setInputValue] = useState(props.altValues[0]);
    const [arrayIndex, setArrayIndex] = useState(props.valIdx);

    const handleSpanClick = useCallback(() => {
        setArrayIndex((arrayIndex + 1) % props.altValues.length)
        const newValue = props.altValues[arrayIndex]
        setInputValue(newValue);
        props.onSetText(newValue);
    }, [arrayIndex, props]);

    return (
        <span className="inline-text relative">
            <span
                onClick={handleSpanClick}
                className="inline-text_copy inline-text_copy--active cursor-pointer"
            >
                {inputValue}
            </span>
        </span>
    );
}
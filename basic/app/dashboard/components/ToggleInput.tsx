import React, { useState, useCallback } from "react";

export default function ToggleInput(props: { 
    defaultText: string; 
    altValues: string[];
    valIdx: number; 
    onSetText: (text: string) => void 
}) {
    const [inputValue, setInputValue] = useState(props.defaultText);
    const [arrayIndex, setArrayIndex] = useState(props.valIdx);

    const handleSpanClick = useCallback(() => {
        setArrayIndex((arrayIndex + 1) % props.altValues.length)
        const newValue = inputValue === props.defaultText ? props.altValues[arrayIndex] : props.defaultText;
        setInputValue(newValue);
        props.onSetText(newValue);
    }, [inputValue, arrayIndex, props]);

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
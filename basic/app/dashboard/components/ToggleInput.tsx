import React, { useState, useCallback } from "react";

export default function ToggleInput(props: { 
    defaultText: string; 
    activeText: string; 
    onSetText: (text: string) => void 
}) {
    const [inputValue, setInputValue] = useState(props.defaultText);

    const handleSpanClick = useCallback(() => {
        const newValue = inputValue === props.defaultText ? props.activeText : props.defaultText;
        setInputValue(newValue);
        props.onSetText(newValue);
    }, [inputValue, props]);

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
import React, { useState, useCallback, useEffect } from "react";

export default function ToggleInput(props: {
    altValues: string[];
    valIdx: number; 
    onSetText: (text: string) => void 
}) {
    const { valIdx } = props;
    const [arrayIndex, setArrayIndex] = useState(valIdx);

    useEffect(() => {
        setArrayIndex(valIdx);
    }, [valIdx]);

    const handleSpanClick = useCallback(() => {
        const newIndex = (arrayIndex + 1) % props.altValues.length;
        setArrayIndex(newIndex);
        props.onSetText(props.altValues[newIndex]);
    }, [arrayIndex, props]);

    return (
        <span className="inline-text relative">
            <span
                onClick={handleSpanClick}
                className="inline-text_copy inline-text_copy--active cursor-pointer"
            >
                {props.altValues[arrayIndex]}
            </span>
        </span>
    );
}
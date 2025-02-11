import React, {useState, useEffect, useRef, useCallback} from "react";
import useKeyPress from "../hooks/useKeyPress";
import useOnClickOutside from "../hooks/useOnClickOutside";

export default function InlineInput(props: { text: string; onSetText: (text: string) => void }) {
    const [isInputActive, setIsInputActive] = useState(false);
    const [inputValue, setInputValue] = useState(props.text);
    const [inputWidth, setInputWidth] = useState('auto');

    const wrapperRef = useRef<HTMLSpanElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    const enter = useKeyPress('Enter');
    const esc = useKeyPress('Escape');

    const { onSetText } = props;

    useOnClickOutside(wrapperRef, () => {
        if (isInputActive) {
            onSetText(inputValue);
            setIsInputActive(false);
        }
    });

    const onEnter = useCallback(() => {
        if (enter) {
            onSetText(inputValue);
            setIsInputActive(false);
        }       
    }, [enter, inputValue, onSetText]);

    const onEsc = useCallback(() => {
        if (esc) {
            setInputValue(props.text);
            setIsInputActive(false);
        }
    }, [esc, props.text]);

    useEffect(() => {
        if (isInputActive) {
            inputRef.current?.focus();
        }
    }, [isInputActive]);

    useEffect(() => {
        if (isInputActive) {
            onEnter();
            onEsc();
        }
    }, [onEnter, onEsc, isInputActive])

    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    }, [setInputValue]);

    const handleSpanClick = useCallback(() => setIsInputActive(true), [setIsInputActive]);

    // Add function to update input width
    const updateInputWidth = useCallback(() => {
        if (measureRef.current) {
            const width = measureRef.current.offsetWidth;
            setInputWidth(`${width + 1}px`); // Add 8px padding for cursor space
        }
    }, []);

    // Update width when input value changes
    useEffect(() => {
        updateInputWidth();
    }, [inputValue, updateInputWidth]);

    return (
        <span className="inline-text relative" ref={wrapperRef}>
            <span 
                ref={textRef} 
                onClick={handleSpanClick} 
                className={`inline-text_copy inline-text_copy--${!isInputActive ? "active" : "hidden"}`}
            >
                {props.text}
            </span>
            <input
                ref={inputRef}
                style={{ width: inputWidth }}
                value={inputValue}
                onChange={handleInputChange}
                className={`inline-text_input inline-text_input--${isInputActive ? "active" : "hidden"}`}
            />
            <span 
                ref={measureRef}
                aria-hidden="true"
                className="absolute -left-[9999px] -top-[9999px] whitespace-pre"
            >
                {inputValue}
            </span>
        </span>
    );
}
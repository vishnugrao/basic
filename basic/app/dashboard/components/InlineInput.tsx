import React, {useState, useEffect, useRef, useCallback} from "react";
import useKeyPress from "../hooks/useKeyPress";
import useOnClickOutside from "../hooks/useOnClickOutside";

export default function InlineInput(props: { text: string; onSetText: (text: string) => void }) {
    const [isInputActive, setIsInputActive] = useState(false);
    const [inputValue, setInputValue] = useState(props.text);

    const wrapperRef = useRef(null);
    const textRef = useRef(null);
    const inputRef = useRef(null);

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

    return (
        <span className="inline-text" ref={wrapperRef}>
            <span ref={textRef} onClick={handleSpanClick} className={`inline-text_copy inline-text_copy--${!isInputActive ? "active" : "hidden"}`}>
                {props.text}
            </span>
            <input
                ref={inputRef}
                style={{ minWidth: `${Math.ceil(inputValue.length)}ch` }}
                value={inputValue}
                onChange={handleInputChange}
                className={`inline-text_input inline-text_input--${isInputActive ? "active" : "hidden"}`}
            />
        </span>

    );
}
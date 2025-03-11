'use client'

import { JSX, useCallback, useEffect, useRef, useState } from "react"
import useKeyPress from "../hooks/useKeyPress";
import useOnClickOutside from "../hooks/useOnClickOutside";

function computeLevenshteinDistance(word1: string, word2: string): number {
    const distances = new Array(word1.length + 1);
    for (let i = 0; i <= word1.length; i++) {
        distances[i] = new Array(word2.length + 1);
    }

    for (let i = 0; i <= word1.length; i++) {
        distances[i][0] = i;
    }

    for (let j = 0; j <= word2.length; j++) {
        distances[0][j] = j;
    }

    for (let i = 1; i <= word1.length; i++) {
        for (let j = 1; j <= word2.length; j++) {
            if (word1[i - 1] == word2[j - 1]) {
                distances[i][j] = distances[i - 1][j - 1];
            } else {
                distances[i][j] = Math.min(distances[i - 1][j], distances[i][j - 1], distances[i - 1][j - 1]) + 1;
            }
        }
    }

    return distances[word1.length][word2.length];
}

function sortBySimilarity(searchSet: string[], referenceWord: string): string[] {
    const searchCandidateDistances = searchSet.map(searchCandidate => ({
        searchCandidate: searchCandidate,
        distance: computeLevenshteinDistance(searchCandidate, referenceWord)
    }));

    searchCandidateDistances.sort((x, y) => x.distance - y.distance);

    return searchCandidateDistances.map(cd => cd.searchCandidate);
}

export default function SearchInput(props: {text: string, searchSet: string[]}) {
    const [ isInputActive, setIsInputActive ] = useState(false);
    const [ searchValue, setSearchValue ] = useState(props.text);
    const [ searchValueWidth, setSearchValueWidth ] = useState('auto');
    const [ searchSuggestions, setSearchSuggestions ] = useState<JSX.Element[]>([]);

    const wrapperRef = useRef<HTMLSpanElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    const enter = useKeyPress('Enter');
    const esc = useKeyPress('Escape');

    useOnClickOutside(wrapperRef, () => {
        if (isInputActive) {
            setSearchValue("Search for a cuisine");
            setIsInputActive(false);
        }
    });
    const onEnter = useCallback(() => {
        if (enter) {
            setSearchValue(searchValue);
            setIsInputActive(false);
        }
    }, [enter, searchValue]);

    const onEsc = useCallback(() => {
        if (esc) {
            setSearchValue(props.text)
            setIsInputActive(false);
        }
    },  [esc, props.text]);

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
    }, [onEsc, onEnter, isInputActive]);

    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
    }, []);

    const handleSpanClick = useCallback(() => {
        setIsInputActive(true);
        setSearchValue("");
    }, [setIsInputActive]);

    // Add function to update input width
    const updateInputWidth = useCallback(() => {
        if (measureRef.current) {
            const width = measureRef.current.offsetWidth;
            setSearchValueWidth(`${width + 1}px`); // Add 8px padding for cursor space
        }
    }, []);

    const updateSearchSuggestions = useCallback(() => {
        const sortedSuggestions = sortBySimilarity(props.searchSet, searchValue)
            .slice(0, 20)
            .map((suggestion, idx) => (
                <p key={idx} className="text-2xl border-4 border-current rounded-xl whitespace-nowrap">&nbsp;{suggestion}&nbsp;</p>
            ));
        setSearchSuggestions(sortedSuggestions);
        console.log(sortedSuggestions)
    }, [props.searchSet, searchValue]);

    // Update width when search value changes
    useEffect(() => {
        updateInputWidth();
        updateSearchSuggestions();
    }, [searchValue, updateInputWidth, updateSearchSuggestions]);
    
    return (
        <>
            <span className="inline-text relative p-10" ref={wrapperRef}>
                <span
                    ref={textRef}
                    onClick={handleSpanClick}
                    className={`inline-text_copy inline-text_copy--${!isInputActive ? "active" : "hidden"}`}
                >
                    {searchValue}
                </span>
                <input
                    ref={inputRef}
                    style={{ width: searchValueWidth }}
                    value={searchValue}
                    onChange={handleInputChange}
                    className={`inline-text_input inline-text_input--${isInputActive ? "active" : "hidden"}`}
                />
                <span
                    ref={measureRef}
                    aria-hidden="true"
                    className="absolute -left-[9999px] -top-[9999px] whitespace-pre"
                >
                    {searchValue}
                </span>
            </span>
            <div className="flex gap-4 flex-wrap p-10 pt-5">
                {searchSuggestions}
            </div>
        </>
    );
}
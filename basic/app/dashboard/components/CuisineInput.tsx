import React, { useEffect, useMemo, useRef, useState } from "react";
import SearchInput from "./SearchInput";
import { createSwapy, Swapy, SlotItemMapArray, utils } from "swapy";
import { SwapyItem } from "@/types/types";

export default function CuisineInput(props: {cuisineSet: string[], searchSet: string[], closeCuisineSearch: (cuisines: string[]) => void}) {
    const { searchSet } = props;
    const { cuisineSet } = props;
    const { closeCuisineSearch } = props;
    const [nextId, setNextId] = useState(cuisineSet.length);
    const [ rearrangeMode, setRearrangeMode ]  = useState(true);

    // swapy
    const [ cuisines, setCuisines ] = useState<SwapyItem[]>(cuisineSet.map((cuisine, index) => {
        return {
            id: index.toString(),
            cuisine: cuisine
        }
    }))
    const[ slotCuisineMap, setSlotCuisineMap ] = useState<SlotItemMapArray>(utils.initSlotItemMap(cuisines, 'id'))
    console.log(slotCuisineMap);
    const slottedCuisines = useMemo(() => utils.toSlottedItems(cuisines, 'id', slotCuisineMap), [cuisines, slotCuisineMap])
    const swapyRef = useRef<Swapy|null>(null)

    const swapyContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => utils.dynamicSwapy(swapyRef.current, cuisines, 'id', slotCuisineMap, setSlotCuisineMap), [cuisines])

    useEffect(() => {
        if (rearrangeMode) {
            swapyRef.current = createSwapy(swapyContainerRef.current!, {
                manualSwap: true,
            })
        
            swapyRef.current?.onSwap((event) => {
                setSlotCuisineMap(event.newSlotItemMap.asArray)
            })

            return () => {
                swapyRef.current?.destroy()
            }
        }   
    }, [rearrangeMode])

    const addCuisine = (cuisine: string) => {
        const newId = nextId.toString();
        const newCuisine: SwapyItem = {
            id: newId,
            cuisine: cuisine
        }
        const newCuisines = [...cuisines, newCuisine];
        setCuisines(newCuisines);
        const newSlotMap = [...slotCuisineMap, { slot: newId, item: cuisine }];
        setSlotCuisineMap(newSlotMap);
        setNextId(nextId + 1);
    }

    const removeCuisine = (deleteSwapy: SwapyItem) => {
        const newCuisines = cuisines.filter(cuisine => cuisine.id !== deleteSwapy.id);
        setCuisines(newCuisines);
        const newSlotMap = slotCuisineMap.filter(slot => slot.item !== deleteSwapy.cuisine);
        setSlotCuisineMap(newSlotMap);
        setNextId(nextId - 1);
    }

    return (
        <div className="popup-container"
            onClick={() => {
                closeCuisineSearch(
                    slottedCuisines.map(({ item }) => item?.cuisine).filter((cuisine): cuisine is string => cuisine !== undefined)
                );
            }}
        >
            <div className="flex flex-col bg-[#F5F5F1] w-2/3 rounded-xl popup"
                onClick={(e) => {
                    e.stopPropagation();
                }}>
                <div className="flex flex-row p-10 pb-5">
                    <div ref={swapyContainerRef} className="swapy-container">
                        <div className="cuisines flex flex-row gap-4 flex-wrap">
                            {slottedCuisines.map(({slotId, itemId, item}) => (
                                <div data-swapy-slot={slotId} key={slotId}
                                    onClick={() => {
                                        if(!rearrangeMode) {
                                            removeCuisine(item!);
                                        }
                                    }}>
                                    <p key={itemId} data-swapy-item={itemId} data-swapy-handle className="text-2xl border-4 border-current rounded-xl whitespace-nowrap cursor-pointer">
                                        &nbsp;{item?.cuisine}&nbsp;
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-auto"></div>
                    <div className="flex items-baseline text-2xl pl-2 gap-4">
                        <div className={"select-none cursor-pointer"}
                            onClick={() => {
                                if (rearrangeMode) {
                                    setRearrangeMode(false);
                                }
                            }}
                        >
                            <p className={`border-4 ${rearrangeMode ? "border-transparent" : "border-current rounded-xl whitespace-nowrap"}`}>&nbsp;Remove&nbsp;</p>
                        </div>
                        <div className={"select-none"}
                            onClick={() => {
                                if (!rearrangeMode) {
                                    setRearrangeMode(true);
                                }
                            }}
                        >
                            <p className={`border-4 ${rearrangeMode ? "border-current rounded-xl whitespace-nowrap" : "border-transparent"}`}>&nbsp;Rearrange&nbsp;</p>
                        </div>
                    </div>
                </div>
                {/* Send the differenceSet to searchInput */}
                <SearchInput 
                    text={"Search for a cuisine"}
                    searchSet={searchSet.filter(cuisine => (cuisines.map((cuisineItem) => {
                        return cuisineItem.cuisine
                    })).indexOf(cuisine) < 0)}
                    addCuisine={addCuisine} />
            </div>
        </div>
        
    )
}
import { UUID } from "crypto";

export interface User {
    id: UUID, 
    name: string, 
    email: string, 
    created_at: string,
    updated_at: string,
    last_sign_in_at: string,
    height: number,
    weight: number,
    gender: string,
    age: number
}

export interface Goal {
    id: UUID,
    user_id: UUID,
    goal: string,
    diet: string,
    lacto_ovo: string,
    activity_level: number,
}

export interface MealPlan {
    id: UUID,
    user_id: UUID,
    cuisines: string[]
}

export interface SearchSet {
    id: UUID,
    user_id: UUID,
    searchSet: string[]
}

export interface SwapyItem {
    id: string
    cuisine: string
}
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

export interface Recipe {
    id: UUID;
    user_id: UUID;
    recipe_name: string;
    cook_date: Date;
    cuisine: string;
    protein: number;
    fat: number;
    calories: number;
    created_at: string;
    updated_at: string;
}

export interface RecipeWithData extends Recipe {
    ingredients?: Ingredient[];
    preprocessing?: Preprocessing[];
    steps?: Step[];
}

export interface Ingredient {
    id: UUID;
    user_id: UUID;
    recipe_id: UUID;
    name: string;
    amount: number;
    metric: string;
    purchased: boolean;
    created_at: string;
    updated_at: string;
}

export interface Preprocessing {
    id: UUID;
    user_id: UUID;
    recipe_id: UUID;
    operation: string;
    specific: string;
    instruction: string;
    completed?: boolean;
    created_at: string;
    updated_at: string;
}

export interface Step {
    id: UUID;
    user_id: UUID;
    recipe_id: UUID;
    step_number: number;
    instruction: string;
    duration: number;
    indicator: string;
    created_at: string;
    updated_at: string;
}
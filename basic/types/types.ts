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
    gender: string
}
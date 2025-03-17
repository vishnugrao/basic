'use client'

import { useState } from "react";
import UserDetails from "./UserDetails";
import GoalDetails from "./GoalDetails";
import MealPlanner from "./MealPlanner";
import QuantitativeNutrition from "./QuantitativeNutrition";
import { User, Goal, MealPlan, SearchSet, Recipe } from "@/types/types";
import { updateUserDetails, updateGoalDetails, updateMealPlanner, deleteRecipes, insertRecipes } from "../actions";

export default function DashboardClient({ 
    initialUserDetails,
    initialGoalDetails,
    initialMealPlan,
    searchSet,
    initialRecipesDetails,
}: {
    initialUserDetails: User,
    initialGoalDetails: Goal,
    initialMealPlan: MealPlan,
    searchSet: SearchSet,
    initialRecipesDetails: Recipe[],
}) {
    
    const [userDetails, setUserDetails] = useState<User>(initialUserDetails);
    const [heightUnit, setHeightUnit] = useState("cm");
    const [weightUnit, setWeightUnit] = useState("kg");

    const [goalDetails, setGoalDetails] = useState<Goal>(initialGoalDetails);
    const [activityLevel, setActivityLevel] = useState<string>(() => {
        const activityLevels = {
            1.2: "Sedentary",
            1.375: "Light",
            1.55: "Moderate",
            1.725: "Very",
            1.9: "Extra"
        };
        return activityLevels[initialGoalDetails.activity_level as keyof typeof activityLevels] || "Moderate";
    });

    const [mealPlan, setMealPlan] = useState<MealPlan>(initialMealPlan);
    const [isCuisineSearchOpen, setIsCuisineSearchOpen] = useState(false);

    const [recipesDetails, setRecipesDetails] = useState<Recipe[]>(initialRecipesDetails);

    const handleUserUpdate = async (updates: Partial<User>) => {
        const updatedUser = { ...userDetails, ...updates, updated_at: new Date().toISOString() };
        setUserDetails(updatedUser);
        await updateUserDetails(updatedUser);
    };

    const handleGoalUpdate = async (updates: Partial<Goal>) => {
        const activity_level_conversion: {[id: string]: number} = {
            "Sedentary": 1.2,
            "Light": 1.375, 
            "Moderate": 1.55,
            "Very": 1.725,
            "Extra": 1.9
        };

        const updatedGoal = { 
            ...goalDetails, 
            ...updates, 
            activity_level: updates.activity_level || activity_level_conversion[activityLevel],
            updated_at: new Date().toISOString() 
        };
        setGoalDetails(updatedGoal);
        await updateGoalDetails(updatedGoal);
    };

    const handleMealPlanUpdate = async (updates: Partial<MealPlan>) => {
        const updatedMealPlan = { ...mealPlan, ...updates, updated_at: new Date().toISOString() };
        setMealPlan(updatedMealPlan);
        await updateMealPlanner(updatedMealPlan);
    };

    const handleRecipesAppend = async (addition: Recipe) => {
        setRecipesDetails(currentRecipes => {
            const newRecipes = currentRecipes.length === 0 ? [addition] : [...currentRecipes, addition];
            return newRecipes;
        });
    }

    const handleRecipesUpdateAll = async (updates: Recipe[]) => {
        try {
            await Promise.all(recipesDetails.map(recipe =>
                deleteRecipes(recipe.user_id, recipe.id)
            ));
            setRecipesDetails(updates);
            await Promise.all(updates.map(recipe =>
                insertRecipes(recipe)
            ));
        } catch (error) {
            console.error('Error updating recipes:', error);
        }
    }

    return (
        <div className="flex flex-col">
            <div className="px-10 pt-10 pb-5 flex">
                <p className="flex-auto text-2xl">Hello {userDetails.name}</p>
                <UserDetails 
                    userDetails={userDetails}
                    heightUnit={heightUnit}
                    weightUnit={weightUnit}
                    setHeightUnit={setHeightUnit}
                    setWeightUnit={setWeightUnit}
                    onUpdate={handleUserUpdate}
                />
            </div>
            <div className="px-10 flex">
                <p className="flex-auto"></p>
                <GoalDetails 
                    goalDetails={goalDetails}
                    activityLevel={activityLevel}
                    setActivityLevel={setActivityLevel}
                    onUpdate={handleGoalUpdate}
                />
            </div>
            <div className="flex p-10 flex-col">
                <p className="flex flex-auto text-2xl pb-10">Meal Plan</p>
                <MealPlanner 
                    mealPlan={mealPlan}
                    searchSet={searchSet}
                    isCuisineSearchOpen={isCuisineSearchOpen}
                    setIsCuisineSearchOpen={setIsCuisineSearchOpen}
                    onUpdate={handleMealPlanUpdate}
                />
            </div>
            <div className="p-10 pt-20">
                <QuantitativeNutrition 
                    userDetails={userDetails} 
                    goalDetails={goalDetails}
                    mealPlan={mealPlan}
                    recipesDetails={recipesDetails}
                    onAppend={handleRecipesAppend}
                    onUpdateAll={handleRecipesUpdateAll}
                />
            </div>
        </div>
    );
} 
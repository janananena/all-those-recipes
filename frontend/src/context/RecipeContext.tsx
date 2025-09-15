// src/context/RecipeContext.tsx
import React, { createContext, useState, type ReactNode } from "react";
import type {Recipe} from "../types/Recipe";
import type {Tag} from "../types/Tag.ts";
import {fetchTags} from "../api/tag.ts";
import {fetchRecipes} from "../api/recipes.ts";

interface RecipeContextType {
    recipes: Recipe[];
    reloadRecipes: () => Promise<void>;
    setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
    addNewRecipe: (recipe: Recipe) => void;
    updateRecipe: (recipe:Recipe) => void;
    eraseRecipe: (recipe:Recipe) => void;
    tags: Tag[];
    setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
    reloadTags: () => Promise<void>;
    addNewTag: (tag: Tag) => void;
}

export const RecipeContext = createContext<RecipeContextType>({
    recipes: [],
    reloadRecipes: () => new Promise<void>(()=>{}),
    setRecipes: () => {},
    addNewRecipe: () => {},
    updateRecipe: () => {},
    eraseRecipe: () => {},
    tags: [],
    setTags: () => {},
    reloadTags: () => new Promise<void>(()=>{}),
    addNewTag: () => {},
});

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    const reloadRecipes = async () => {
        try {
            const data = await fetchRecipes();
            const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
            setRecipes(sorted);
        } catch (error) {
            console.error("Failed to reload recipes:", error);
        }
    };

    const addNewRecipe = (recipe: Recipe) => {
        setRecipes([...recipes, recipe]);
    };

    function updateRecipe(recipe: Recipe): void {
        setRecipes(recipes.map((r) => r.id === recipe.id ? recipe : r));
    }

    function eraseRecipe(recipe: Recipe): void {
        setRecipes(recipes.filter(r => r.id !== recipe.id));
    }

    const reloadTags = async () => {
        try {
            const data = await fetchTags();
            const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
            setTags(sorted);
        } catch (error) {
            console.error("Failed to reload tags:", error);
        }
    };

    const addNewTag = (tag:Tag) => {
        setTags([...tags, tag]);
    }

    return (
        <RecipeContext.Provider value={{ recipes, reloadRecipes, setRecipes, addNewRecipe, updateRecipe, eraseRecipe, tags, setTags, reloadTags, addNewTag }}>
            {children}
        </RecipeContext.Provider>
    );
};

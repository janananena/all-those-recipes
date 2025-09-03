import type {Favorite} from "../types/Favorites.ts";
import {createContext, useContext, useEffect, useState} from "react";
import {changeFavorite, createFavorite, fetchFavorites, toggleFavorite} from "../api/favorites.ts";

type FavoritesContextType = {
    favorites: Favorite[];
    getFavorite: (username: string) => Promise<Favorite | undefined>;
    addFavorite: (username: string, recipeId: string) => Promise<void>;
    flipFavorite: (username: string, recipeId: string) => Promise<void>;
    changeFavorites: (username: string, recipeIds: string[]) => Promise<void>;
    reloadFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType>({
    favorites: [],
    getFavorite: async () => new Promise<Favorite | undefined>(() => {}),
    addFavorite: async () => {
    },
    flipFavorite: async () => {
    },
    changeFavorites: async () => {},
    reloadFavorites: () => new Promise<void>(() => {
    }),
});

export const FavoritesProvider = ({children}: { children: React.ReactNode }) => {
    const [favorites, setFavorites] = useState<Favorite[]>([]);

    const reloadFavorites = async () => {
        try {
            const res = await fetchFavorites();
            console.log(`fetching favorites ${res}`);
            setFavorites(res);
        } catch (err) {
            console.error("Failed to load favorites", err);
        }
    };

    useEffect(() => {
        reloadFavorites();
    }, []);

    const getFavorite = async (username:string) => {
        try {
            const res = await fetchFavorites();
            return res.find(f => f.username === username) ?? undefined;
        } catch (err) {
            console.error("Failed to get user favorites", err);
        }
    };

    const flipFavorite = async (username: string, recipeId: string) => {
        try {
            await toggleFavorite(username, recipeId);
            await reloadFavorites();
            console.log(`flipped user favorite`);
        } catch (err) {
            console.error("Failed to create user favorite", err);
        }
    };

    const addFavorite = async (username: string, recipeId: string) => {
        try {
            const fav = favorites.find(f => f.username === username);
            if (fav === undefined) {
                await createFavorite({username: username, recipeIds: [recipeId]});
            } else {
                await changeFavorite({...fav, recipeIds: [...fav.recipeIds, recipeId]});
            }
            await reloadFavorites();
        } catch (err) {
            console.error("Failed to add user favorite", err);
        }
    };

    const changeFavorites = async (username: string, recipeIds: string[]) => {
        try {
            const fav = favorites.find(f => f.username === username);
            if (fav === undefined) {
                await createFavorite({username: username, recipeIds: recipeIds});
            } else {
                await changeFavorite({...fav, recipeIds: recipeIds});
            }
        } catch (err) {
            console.error("Failed to change user favorites", err);
        }
    };

    return (
        <FavoritesContext.Provider value={{favorites, getFavorite, addFavorite, flipFavorite, reloadFavorites, changeFavorites}}>
            {children}
        </FavoritesContext.Provider>);
}

export const useFavorites = () => useContext(FavoritesContext);
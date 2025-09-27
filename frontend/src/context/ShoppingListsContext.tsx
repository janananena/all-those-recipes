import {createContext, useContext, useEffect, useState} from "react";
import type {ShoppingList} from "../types/ShoppingLists.ts";
import {changeShoppingList, fetchShoppingLists} from "../api/shoppingLists.ts";

type ShoopingListsContextType = {
    shoppingLists: ShoppingList[];
    // getFavorite: (username: string) => Promise<Favorite | undefined>;
    // addFavorite: (username: string, recipeId: string) => Promise<void>;
    // flipFavorite: (username: string, recipeId: string) => Promise<void>;
    updateShoppingList: (username: string, note: string) => Promise<void>;
    reloadShoppingLists: () => Promise<void>;
};

const ShoopingListsContext = createContext<ShoopingListsContextType>({
    shoppingLists: [],
    // getFavorite: async () => new Promise<Favorite | undefined>(() => {}),
    // addFavorite: async () => {
    // },
    // flipFavorite: async () => {
    // },
    updateShoppingList: async () => {},
    reloadShoppingLists: () => new Promise<void>(() => {
    }),
});

export const ShoppingListsProvider = ({children}: { children: React.ReactNode }) => {
    const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);

    const reloadShoppingLists = async () => {
        try {
            const res = await fetchShoppingLists();
            console.log(`fetching shopping lists ${res}`);
            setShoppingLists(res);
        } catch (err) {
            console.error("Failed to load shopping lists", err);
        }
    };

    useEffect(() => {
        reloadShoppingLists();
    }, []);

    // const getFavorite = async (username:string) => {
    //     try {
    //         const res = await fetchFavorites();
    //         return res.find(f => f.username === username) ?? undefined;
    //     } catch (err) {
    //         console.error("Failed to get user favorites", err);
    //     }
    // };
    //
    // const flipFavorite = async (username: string, recipeId: string) => {
    //     try {
    //         await toggleFavorite(username, recipeId);
    //         await reloadFavorites();
    //         console.log(`flipped user favorite`);
    //     } catch (err) {
    //         console.error("Failed to create user favorite", err);
    //     }
    // };
    //
    // const addFavorite = async (username: string, recipeId: string) => {
    //     try {
    //         const fav = favorites.find(f => f.username === username);
    //         if (fav === undefined) {
    //             await createFavorite({username: username, recipeIds: [recipeId]});
    //         } else {
    //             await changeFavorite({...fav, recipeIds: [...fav.recipeIds, recipeId]});
    //         }
    //         await reloadFavorites();
    //     } catch (err) {
    //         console.error("Failed to add user favorite", err);
    //     }
    // };
    //
    const updateShoppingList = async (listId: string, note: string) => {
        try {
            const list = shoppingLists.find(s => s.id === listId);
            if (list === undefined) {
                console.error(`Shopping list ${listId} not found.`);
            } else {
                await changeShoppingList({...list, notes: note});
                await reloadShoppingLists();
            }
        } catch (err) {
            console.error("Failed to change user shopping list notes", err);
        }
    };

    return (
        <ShoopingListsContext.Provider value={{shoppingLists, reloadShoppingLists, updateShoppingList}}>
            {children}
        </ShoopingListsContext.Provider>);
}

export const useShoppingLists = () => useContext(ShoopingListsContext);
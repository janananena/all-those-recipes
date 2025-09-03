import axios from "axios";
import type {Favorite} from "../types/Favorites.ts";

const apiBaseUrl = `/api`;

export const fetchFavorites = async (): Promise<Favorite[]> => {
    const res = await axios.get<Favorite[]>(`${apiBaseUrl}/favorites`);
    return res.data;
};

export async function createFavorite(favorite: { username: string, recipeIds: string[] }): Promise<Favorite> {
    const headers = {headers: {'Content-Type': 'application/json'}};
    const response = await axios.post(`${apiBaseUrl}/favorites/`, favorite, headers);
    console.log(`added favorite w/ id ${response.data.id}: `, favorite);
    return response.data;
}

export async function changeFavorite(favorite: Favorite): Promise<Favorite> {
    const headers = {headers: {'Content-Type': 'application/json'}};
    const response = await axios.put(`${apiBaseUrl}/favorites/${favorite.id}`, favorite, headers);
    console.log(`changed favorite for user ${favorite.username}: `, favorite);
    return response.data;
}

export async function toggleFavorite(user: string, recipeId: string): Promise<void> {
    const fav = await fetchFavorites().then(res => {
        return res.find(fav => fav.username === user);
    });
    if (fav === undefined) {
        await createFavorite({username: user, recipeIds: [recipeId]});
    } else {
        const newIds = fav.recipeIds.includes(recipeId)
            ? fav.recipeIds.filter(r => r !== recipeId)
            : [...fav.recipeIds, recipeId];
        await changeFavorite({...fav, recipeIds: newIds});
    }
    console.log(`toggled favorite for user ${user} and recipe ${recipeId}`);
}
import axios from "axios";
import type {ShoppingList} from "../types/ShoppingLists.ts";

const apiBaseUrl = `/api`;

export const fetchShoppingLists = async (): Promise<ShoppingList[]> => {
    const res = await axios.get<ShoppingList[]>(`${apiBaseUrl}/shoppingLists`);
    return res.data;
};

export async function changeShoppingList(list: ShoppingList): Promise<ShoppingList> {
    const headers = {headers: {'Content-Type': 'application/json'}};
    const response = await axios.put(`${apiBaseUrl}/shoppingLists/${list.id}`, list, headers);
    console.log(`changed shopping lists for user ${list.username}: `, list);
    return response.data;
}
import axios from "axios";
import type {Recipe} from "../types/Recipe";

const apiBaseUrl = `/api`;

export const fetchRecipes = async (): Promise<Recipe[]> => {
    const res = await axios.get<Recipe[]>(`${apiBaseUrl}/recipes`);
    return res.data;
};

export async function createRecipe(recipe: Recipe): Promise<Recipe> {
    const headers = {headers: {'Content-Type': 'application/json'}};
    const response = await axios.post(`${apiBaseUrl}/recipes/`, recipe, headers);
    console.log(`added recipe w/ id ${response.data.id}: `, recipe);
    return response.data;
}

export async function changeRecipe(recipe: Recipe): Promise<Recipe> {
    const headers = {headers: {'Content-Type': 'application/json'}};
    const response = await axios.put(`${apiBaseUrl}/recipes/${recipe.id}`, recipe, headers);
    console.log(`changed recipe w/ id ${recipe.id}: `, recipe);
    return response.data;
}

export async function removeRecipe(recipeId: string): Promise<Recipe> {
    const response = await axios.delete(`${apiBaseUrl}/recipes/${recipeId}`);
    console.log(`deleted recipe w/ id ${recipeId}`);
    return response.data;
}

export async function uploadImage(image: File): Promise<string> {
    const headers = {headers: {'Content-Type': 'multipart/form-data'}};
    const formData = new FormData();
    formData.append("image", image);

    const response = await axios.post(`${apiBaseUrl}/uploadImage`, formData, headers);
    console.log(`added image ${response.data.url}: `);
    return response.data.url;
}

export async function uploadFile(file: File): Promise<string> {
    const headers = {headers: {'Content-Type': 'multipart/form-data'}};
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post(`${apiBaseUrl}/uploadFile`, formData, headers);
    console.log(`added file ${response.data.url}: `);
    return response.data.url;
}
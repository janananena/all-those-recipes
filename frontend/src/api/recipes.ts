import axios from "axios";
import type {Recipe} from "../types/Recipe";

const apiBaseUrl = `/api`;

function sanitizeFilename(filename: string): string {
    const replacements: Record<string, string> = {
        "ä": "ae",
        "ö": "oe",
        "ü": "ue",
        "Ä": "Ae",
        "Ö": "Oe",
        "Ü": "Ue",
        "ß": "ss",
    };

    // Replace umlauts
    filename = filename.replace(/[äöüÄÖÜß]/g, (char) => replacements[char] ?? char);

    // Replace spaces with underscores
    filename = filename.replace(/\s+/g, "_");

    // Remove all other non-safe characters
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, "");

    return filename;
}

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

    const sanitizedFilename = sanitizeFilename(image.name);
    const newFile = new File([image], sanitizedFilename, {type: image.type});
    console.log(`change filename old ${image.name} new ${sanitizedFilename}`);
    formData.append("image", newFile);

    const response = await axios.post(`${apiBaseUrl}/uploadImage`, formData, headers);
    console.log(`added image ${response.data.url}: `);
    return response.data.url;
}

export async function uploadFile(file: File): Promise<string> {
    const headers = {headers: {'Content-Type': 'multipart/form-data'}};
    const formData = new FormData();

    const sanitizedFilename = sanitizeFilename(file.name);
    const newFile = new File([file], sanitizedFilename, {type: file.type});
    console.log(`change filename old ${file.name} new ${sanitizedFilename}`);
    formData.append("file", newFile);
    const response = await axios.post(`${apiBaseUrl}/uploadFile`, formData, headers);
    console.log(`added file ${response.data.url}: `);
    return response.data.url;
}
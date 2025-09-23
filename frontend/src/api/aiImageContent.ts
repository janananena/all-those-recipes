import axios from 'axios';

const apiBaseUrl = `/api`;

export async function processRecipeImage(recipeId: string, fileUrl: string) {
    const res = await axios.post(`${apiBaseUrl}/extract-recipe-from-image`, {recipeId, fileUrl});
    return res.data; // updated recipe
}

export async function processRecipePdf(recipeId: string, fileUrl: string) {
    const res = await axios.post(`${apiBaseUrl}/extract-recipe-from-pdf`, {recipeId, fileUrl});
    return res.data; // updated recipe
}
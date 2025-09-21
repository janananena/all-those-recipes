import axios from 'axios';

const apiBaseUrl = `/api`;

export async function processRecipe(recipeId: string, fileUrl: string) {
    const res = await axios.post(`${apiBaseUrl}/extract-recipe-from-image`, {recipeId, fileUrl});
    return res.data; // updated recipe
}

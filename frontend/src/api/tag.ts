import axios from "axios";
import type {Tag} from "../types/Tag";

const apiBaseUrl = `/api`;

export const fetchTags = async (): Promise<Tag[]> => {
    const res = await axios.get<Tag[]>(`${apiBaseUrl}/tags`);
    return res.data;
};

export async function createTag(tag: Tag): Promise<Tag> {
    const headers = {headers: {'Content-Type': 'application/json'}};
    const response = await axios.post(`${apiBaseUrl}/tags/`, tag, headers);
    console.log(`added tag w/ id ${response.data.id}: `, tag);
    return response.data;
}

export async function changeTag(tag: Tag): Promise<Tag> {
    const headers = {headers: {'Content-Type': 'application/json'}};
    const response = await axios.put(`${apiBaseUrl}/tags/${tag.id}`, tag, headers);
    console.log(`changed tag w/ id ${tag.id}: `, tag);
    return response.data;
}
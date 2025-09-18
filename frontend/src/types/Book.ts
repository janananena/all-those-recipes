import type {Review} from "./Recipe.ts";

export interface Book {
    id: string;
    name: string;
    author?: string;
    tags?: string[];
    links?: string[];
    recipes?: string[];
    files?: string[];
    thumbnail?: string;
    reviews?: Review[];
}
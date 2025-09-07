import type {Review} from "./Recipe.ts";

export interface BookFile {
    fileUrl: string;
}

export interface Book {
    id: string;
    name: string;
    author?: string;
    links?: string[];
    recipes?: string[];
    files?: BookFile[];
    thumbnail?: string;
    reviews?: Review[];
}
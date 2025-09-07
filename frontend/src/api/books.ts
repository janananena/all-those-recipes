import axios from "axios";
import type {Book} from "../types/Book.ts";

const apiBaseUrl = `/api`;

export const fetchBooks = async (): Promise<Book[]> => {
    const res = await axios.get<Book[]>(`${apiBaseUrl}/books`);
    return res.data;
};

export async function createBook(book: Book): Promise<Book> {
    const headers = {headers: {'Content-Type': 'application/json'}};
    const response = await axios.post(`${apiBaseUrl}/books/`, book, headers);
    console.log(`added book w/ id ${response.data.id}: `, book);
    return response.data;
}

export async function changeBook(book: Book): Promise<Book> {
    const headers = {headers: {'Content-Type': 'application/json'}};
    const response = await axios.put(`${apiBaseUrl}/books/${book.id}`, book, headers);
    console.log(`changed book w/ id ${book.id}: `, book);
    return response.data;
}
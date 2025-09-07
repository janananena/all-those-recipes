import {createContext, useState} from "react";
import type {Book} from "../types/Book.ts";
import {fetchBooks} from "../api/books.ts";

type BooksContextType = {
    books: Book[];
    reloadBooks: () => Promise<void>;
    addNewBook: (book: Book) => void;
    updateBook: (book: Book) => void;
};

export const BooksContext = createContext<BooksContextType>({
    books: [],
    reloadBooks: () => new Promise<void>(() => {
    }),
    addNewBook: () => {
    },
    updateBook: () => {
    }
});

export const BooksProvider = ({children}: { children: React.ReactNode }) => {
    const [books, setBooks] = useState<Book[]>([]);

    const reloadBooks = async () => {
        try {
            const data = await fetchBooks();
            const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
            setBooks(sorted);
        } catch (error) {
            console.error("Failed to reload books:", error);
        }
    };

    const addNewBook = async (book: Book) => {
        setBooks([...books, book]);
    }

    function updateBook(book: Book): void {
        setBooks(books.map((b) => b.id === book.id ? book : b));
    }

    return (
        <BooksContext.Provider value={{books, reloadBooks, addNewBook, updateBook}}>
            {children}
        </BooksContext.Provider>
    );
}
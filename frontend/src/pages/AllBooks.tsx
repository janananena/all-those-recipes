import {useContext, useEffect, useMemo, useState} from "react";
import {BooksContext} from "../context/BooksContext.tsx";
import {Container, Form, Table} from "react-bootstrap";
import {createBook} from "../api/books.ts";
import {useTranslation} from "react-i18next";
import AverageRating from "../components/AverageRating.tsx";
import UserRating from "../components/UserRating.tsx";
import {useAuth} from "../context/AuthContext.tsx";
import type {Book} from "../types/Book.ts";
import {useNavigate} from "react-router-dom";
import {RecipeContext} from "../context/RecipeContext.tsx";

function sanitizeId(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export default function AllBooks() {
    const {recipes, reloadRecipes} = useContext(RecipeContext);
    const {books, reloadBooks} = useContext(BooksContext);
    const [newBookInput, setNewBookInput] = useState("");
    const {user} = useAuth();
    const {t} = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        reloadRecipes().then();
        reloadBooks().then();
    }, []);

    const handleAddBook = async () => {
        const trimmed = newBookInput.trim();
        if (!trimmed) return;

        const newBook = {
            id: sanitizeId(trimmed),
            name: trimmed,
        };

        try {
            await createBook(newBook);
            await reloadBooks();
            setNewBookInput("");
        } catch (err) {
            console.error("Failed to add tag", err);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddBook().then();
        }
    };

    const groupedBooks = useMemo(() => {
        const groups: Record<string, Book[]> = {};
        const ungrouped: Book[] = [];

        books.forEach((book) => {
            if (book.author) {
                if (!groups[book.author]) groups[book.author] = [];
                groups[book.author].push(book);
            } else {
                ungrouped.push(book);
            }
        });

        return {groups, ungrouped};
    }, [books]);

    const goToDetail = (book: Book) => navigate(`/books/${book.id}`);

    const bookRecipesCnt = (book: Book) => recipes.filter((r) => r.book === book.id).length;

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3 text-muted">
                <h2>{t('books.allBooks')}</h2>
            </div>
            <Table striped hover responsive>
                <thead>
                <tr>
                    <th style={{width: '45%'}} className="text-muted">{t("books.name")}</th>
                    <th style={{width: '20%'}} className="text-muted d-none d-md-table-cell">{t("books.author")}</th>
                    <th style={{width: '5%'}} className="text-muted d-none d-md-table-cell">{t("books.recipesCnt")}</th>
                    <th className="text-nowrap text-muted d-none d-md-table-cell" style={{width: '15%'}}>{t("books.avgRating")}</th>
                    <th className="text-nowrap text-muted d-none d-md-table-cell" style={{width: '15%'}}>{t("books.myRating")}</th>
                </tr>
                </thead>
                <tbody>
                {Object.entries(groupedBooks.groups).map(([author, authorBooks]) => (
                        authorBooks.map(book => (
                                <tr key={book.id} onClick={() => goToDetail(book)} style={{cursor: 'pointer'}}>
                                    <td className="text-muted">
                                        <div>{book.name}</div>
                                        {/* author below name on small screens */}
                                        <div className="d-md-none mt-1 small text-muted">
                                            {author}
                                        </div>
                                    </td>
                                    <td className="d-none d-md-table-cell text-muted">
                                        {author}
                                    </td>
                                    <td className="text-nowrap text-muted">
                                        {bookRecipesCnt(book).toString()}
                                    </td>
                                    <td className="text-nowrap d-none d-md-table-cell">
                                        <AverageRating reviews={book.reviews || []}/>
                                    </td>
                                    <td className="text-nowrap d-none d-md-table-cell">
                                        <UserRating reviews={book.reviews || []} username={user ?? ' '}/>
                                    </td>
                                </tr>
                            )
                        )
                    )
                )}
                {groupedBooks.ungrouped.map((book) => (
                    <tr key={book.id} onClick={() => goToDetail(book)} style={{cursor: 'pointer'}}>
                                    <td className="text-muted">
                                        <div>{book.name}</div>
                                    </td>
                                    <td className="d-none d-md-table-cell">
                                    </td>
                                    <td>
                                        {bookRecipesCnt(book)}
                                    </td>
                                    <td className="text-nowrap d-none d-md-table-cell">
                                        <AverageRating reviews={book.reviews || []}/>
                                    </td>
                                    <td className="text-nowrap d-none d-md-table-cell">
                                        <UserRating reviews={book.reviews || []} username={user ?? ' '}/>
                                    </td>
                                </tr>
                ))}
                </tbody>
            </Table>

            {/* Inline Add Form */}
            <Form className="mt-4">
                <Form.Group className="d-flex align-items-center gap-2">
                    <Form.Label className="mb-0" htmlFor="new-book-input">
                        {t("books.addBook")}
                    </Form.Label>
                    <Form.Control
                        id="new-book-input"
                        type="text"
                        placeholder={t("books.addBookHint")}
                        value={newBookInput}
                        onChange={(e) => setNewBookInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        style={{maxWidth: '300px'}} // optional, to control input width
                    />
                </Form.Group>
            </Form>
        </Container>
    );
}
import {useContext, useEffect, useMemo, useState} from "react";
import {BooksContext} from "../context/BooksContext.tsx";
import {Badge, Container, Form, Table} from "react-bootstrap";
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
    const {recipes, reloadRecipes, tags, reloadTags} = useContext(RecipeContext);
    const {books, reloadBooks} = useContext(BooksContext);
    const [newBookInput, setNewBookInput] = useState("");
    const {user} = useAuth();
    const {t} = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        reloadRecipes().then();
        reloadBooks().then();
        reloadTags().then();
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

    const bookRecipesCnt = (book: Book) => recipes.filter((r) => r.book === book.id).length;

    type SortKey = "name" | "author" | "count";
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: "asc" | "desc" }>({key: "author", direction: "asc"});

    const handleSort = (key: SortKey) => {
        if (sortConfig.key === key) {
            const newDirection = sortConfig.direction === "asc" ? "desc" : "asc";
            setSortConfig({...sortConfig, direction: newDirection});
        } else {
            setSortConfig({...sortConfig, key: key});
        }
    }

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

        // Turn groups into sortable array
        const groupEntries = Object.entries(groups); // [ [author, book[]], ... ]
        groupEntries.sort(([authorA], [authorB]) => {
            if (authorA < authorB) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (authorA > authorB) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });
        ungrouped.sort((a: Book, b: Book) => {
            const valA = a.name;
            const valB = b.name;
            if (valA < valB) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });

        return {groups: groupEntries, ungrouped};
    }, [books, sortConfig]);

    const sortedBooks: Book[] = useMemo(() => {
        if (sortConfig.key === "author") {
            return [];
        }
        if (sortConfig.key === "count") {
            return [...books].sort((a, b) => {
                const valA = bookRecipesCnt(a);
                const valB = bookRecipesCnt(b);

                if (valA < valB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === "asc" ? 1 : -1;
                }
                return 0;
            });
        }
        if (sortConfig.key === "name") {
            return [...books].sort((a, b) => {
                const valA = a.name;
                const valB = b.name;

                // Ensure they exist (or provide fallback)
                if (valA === undefined) return 1;
                if (valB === undefined) return -1;
                if (valA < valB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === "asc" ? 1 : -1;
                }
                return 0;
            });
        } else {
            return books;
        }
    }, [books, sortConfig]);

    const renderSortIndicator = (column: SortKey) => {
        if (sortConfig.key !== column) {
            return <i className="bi bi-arrow-down-up text-muted"></i>;
        }
        return sortConfig.direction === "asc" ? (
            <i className="bi bi-caret-up-fill"></i>
        ) : (
            <i className="bi bi-caret-down-fill"></i>
        );
    };


    const goToDetail = (book: Book) => navigate(`/books/${book.id}`);

    const BookTableRow = (book: Book) => {
        return (
            <tr key={book.id} onClick={() => goToDetail(book)} style={{cursor: 'pointer'}}>
                <td className="text-start text-muted">
                    <div>{book.name}</div>
                    {/* author below name on small screens */}
                    <div className="d-md-none mt-1 small text-muted">
                        {book.author}
                    </div>
                </td>
                <td className="d-none d-md-table-cell text-muted">
                    {book.author}
                </td>
                <td>
                    {book.tags?.map((tagId, index) => {
                        const tag = tags.find(t => t.id === tagId);
                        return (
                            <Badge
                                key={index}
                                bg="secondary"
                                className="me-1"
                                style={{textTransform: 'capitalize'}}
                            >
                                {tag?.name}
                            </Badge>
                        );
                    })}
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
            </tr>);
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3 text-muted">
                <h2>{t('books.allBooks')}</h2>
            </div>
            <Table striped hover responsive>
                <thead>
                <tr>
                    <th style={{width: '45%'}} className="text-start text-muted" onClick={() => handleSort("name")}>{t("books.name")} {renderSortIndicator("name")}</th>
                    <th style={{width: '10%'}} className="text-muted d-none d-md-table-cell" onClick={() => handleSort("author")}>{t("books.author")} {renderSortIndicator("author")}</th>
                    <th style={{width: '10%'}} className="text-muted d-none d-md-table-cell">{t("books.tags")}</th>
                    <th style={{width: '5%'}} className="text-muted text-nowrap d-none d-md-table-cell" onClick={() => handleSort("count")}>{t("books.recipesCnt")} {renderSortIndicator("count")}</th>
                    <th className="text-nowrap text-muted d-none d-md-table-cell" style={{width: '15%'}}>{t("books.avgRating")}</th>
                    <th className="text-nowrap text-muted d-none d-md-table-cell" style={{width: '15%'}}>{t("books.myRating")}</th>
                </tr>
                </thead>
                <tbody>
                {sortConfig.key === "author" ? (
                    <>
                        {groupedBooks.groups.map(([, authorBooks]) => (
                            authorBooks.map(book => BookTableRow(book))
                        ))}
                        {groupedBooks.ungrouped.map((book) => (
                            BookTableRow(book)
                        ))}
                    </>
                ) : (
                    <>
                        {sortedBooks.map((book) => BookTableRow(book))}
                    </>
                )}

                </tbody>
            </Table>

            {/* Inline Add Form */
            }
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
    )
        ;
}
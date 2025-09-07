import {useNavigate, useParams} from "react-router-dom";
import {BooksContext} from "../context/BooksContext.tsx";
import {useContext, useEffect, useState} from "react";
import {RecipeContext} from "../context/RecipeContext.tsx";
import {useUsersContext} from "../context/UsersContext.tsx";
import {Card, Container, Form, ListGroup} from "react-bootstrap";
import {useTranslation} from "react-i18next";
import AverageRating from "../components/AverageRating.tsx";
import type {Recipe} from "../types/Recipe.ts";
import {changeBook} from "../api/books.ts";
import ReviewList from "../components/ReviewList.tsx";
import {useAuth} from "../context/AuthContext.tsx";

export default function BookDetail() {
    const {id} = useParams<{ id: string }>();
    const {recipes, reloadRecipes} = useContext(RecipeContext);
    const {books, reloadBooks, updateBook} = useContext(BooksContext);
    const {reloadUsers} = useUsersContext();
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {user} = useAuth();

    const book = books.find((b) => b.id === id);

    const [newAuthorInput, setNewAuthorInput] = useState(book?.author ?? "");

    useEffect(() => {
        if (!book) {
            reloadUsers().then();
            reloadRecipes().then();
            reloadBooks().then();
        }
    }, [id]);


    if (!book) {
        return (
            <Container className="py-4">
                <h2>{t("recipe.notFound")}</h2>
            </Container>
        );
    }

    const bookRecipes = recipes.filter((r) => r.book === book.id)

    const goToRecipe = (recipe: Recipe) => navigate(`/recipes/${recipe.id}`);

    const handleAddAuthor = async () => {
        const newBook = {...book, author: newAuthorInput.trim()};
        const res = await changeBook(newBook);
        updateBook(res);
    }

    const handleKeyPressAuthor = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddAuthor().then();
        }
    };

    return (
        <Container className="py-4">
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title as="div" className="d-flex justify-content-between align-items-start flex-wrap mb-3">
                        <div className="d-flex align-items-center gap-2">
                            <h2 className="mb-0">{book.name}</h2>
                        </div>
                        <div className="d-flex flex-column align-items-end ms-auto text-end small">
                            <div className="text-muted">{t("recipe.averageRating")}</div>
                            <AverageRating reviews={book.reviews || []}/>
                        </div>
                    </Card.Title>
                </Card.Body>
                <Card.Body>
                    <Form className="mt-4">
                        <Form.Group className="d-flex align-items-center gap-2">
                            <Form.Label className="mb-0" htmlFor="new-author-input">
                                {t("book.author")}
                            </Form.Label>
                            <Form.Control
                                id="new-author-input"
                                type="text"
                                placeholder={t("book.addAuthorHint")}
                                value={newAuthorInput}
                                onChange={(e) => setNewAuthorInput(e.target.value)}
                                onKeyDown={handleKeyPressAuthor}
                                style={{maxWidth: '300px'}} // optional, to control input width
                            />
                        </Form.Group>
                    </Form>
                </Card.Body>
                <Card.Body>
                    {bookRecipes.length > 0 && (
                        <>
                            <Card.Subtitle className="text-start mb-2">{t('book.recipes')}</Card.Subtitle>
                            <ListGroup>
                                {bookRecipes.map((recipe) => (
                                    <ListGroup.Item action key={recipe.id} onClick={() => goToRecipe(recipe)}
                                                    className="d-flex justify-content-between align-items-center text-muted">
                                        <div>{recipe.name}</div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </>
                    )}
                </Card.Body>
                <Card.Body>
                    <ReviewList
                        reviews={book.reviews || []}
                        username={user ?? ''}
                        onUpdate={async (updated) => {
                            const rest = (book.reviews || []).filter(r => r.username !== updated.username);
                            const updatedRecipe = {...book, reviews: [...rest, updated]};
                            const res = await changeBook(updatedRecipe);
                            updateBook(res);
                        }}
                    />
                </Card.Body>
            </Card>
        </Container>
    )
}
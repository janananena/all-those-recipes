import {useNavigate, useParams} from "react-router-dom";
import {BooksContext} from "../context/BooksContext.tsx";
import {type SetStateAction, useContext, useEffect, useState} from "react";
import {RecipeContext} from "../context/RecipeContext.tsx";
import {useUsersContext} from "../context/UsersContext.tsx";
import {Button, ButtonGroup, Card, Container, ListGroup} from "react-bootstrap";
import {useTranslation} from "react-i18next";
import AverageRating from "../components/AverageRating.tsx";
import type {Recipe} from "../types/Recipe.ts";
import {changeBook} from "../api/books.ts";
import ReviewList from "../components/ReviewList.tsx";
import {useAuth} from "../context/AuthContext.tsx";
import AddEditBookModal from "../modal/AddEditBookModal.tsx";
import {getButtonOutline, getInitialThumbnailSize, getThumbnailClass, popupImgStyles, popupStyles, thumbnailSizes, type ThumbnailSizeType} from "../helper/thumbnailHelper.ts";

export default function BookDetail() {
    const {id} = useParams<{ id: string }>();
    const {recipes, reloadRecipes} = useContext(RecipeContext);
    const {books, reloadBooks, addNewBook, updateBook} = useContext(BooksContext);
    const {reloadUsers} = useUsersContext();
    const {t} = useTranslation();
    const {user} = useAuth();
    const navigate = useNavigate();

    const [showEditBook, setShowEditBook] = useState(false);
    const [showImagePopup, setShowImagePopup] = useState(false);
    const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSizeType>('original');

    const book = books.find((b) => b.id === id);

    useEffect(() => {
        if (!book) {
            reloadUsers().then();
            reloadRecipes().then();
            reloadBooks().then();
        }
    }, [id, book]);

    useEffect(() => {
        if (!book) {
            setThumbnailSize(('original'));
            return;
        }
        const img = new Image();
        const src = `${book.thumbnail}`;
        img.onload = () => {
            const {naturalWidth, naturalHeight} = img;
            const size = getInitialThumbnailSize(naturalWidth, naturalHeight);
            setThumbnailSize(size);
        }
        img.src = src;
    }, [book?.thumbnail]);

    if (!book) {
        return (
            <Container className="py-4">
                <h2>{t("recipe.notFound")}</h2>
            </Container>
        );
    }

    const bookRecipes = recipes.filter((r) => r.book === book.id)

    const goToRecipe = (recipe: Recipe) => navigate(`/recipes/${recipe.id}`);

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
                {book.thumbnail ? (
                    <>
                        <div onClick={() => setShowImagePopup(true)} style={{cursor: 'zoom-in'}}>
                            <Card.Img
                                variant="top"
                                src={book.thumbnail}
                                alt={book.name}
                                className={`img-fluid ${getThumbnailClass(thumbnailSize)}`}
                            />
                        </div>
                        <ButtonGroup size="sm" className="mb-3">
                            {thumbnailSizes.map(size => (
                                <Button
                                    key={size}
                                    variant={thumbnailSize === size ? 'primary' : 'outline-secondary'}
                                    onClick={() => setThumbnailSize(size as SetStateAction<ThumbnailSizeType>)}
                                >
                                    {size}
                                </Button>
                            ))}
                        </ButtonGroup>
                    </>
                ) : (
                    <div
                        className="d-flex justify-content-center align-items-center bg-secondary"
                        style={{height: "200px"}}
                    >
                        <Button variant={getButtonOutline()} onClick={() => setShowEditBook(true)}>
                            {t("book.addThumbnail")}
                        </Button>
                    </div>
                )}
                {showImagePopup && (
                    <div style={popupStyles(showImagePopup)} onClick={() => setShowImagePopup(false)}>
                        <img
                            src={book.thumbnail}
                            alt={book.name}
                            style={popupImgStyles}
                        />
                    </div>
                )}
                <Card.Body>
                    {book.author && (
                        <>
                            <Card.Subtitle className="text-start mb-2">{t("book.author")}</Card.Subtitle>
                            <Card.Text className="text-start mb-2">
                                {book.author}
                            </Card.Text>
                        </>
                    )}
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
                    {book.links && book.links.length > 0 && (
                        <>
                            <Card.Subtitle className="text-start mb-2">{t("book.links")}</Card.Subtitle>
                            <ListGroup className="mb-4">
                                {book.links.map((link, i) => (
                                    <ListGroup.Item
                                        key={i}
                                        action
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="d-flex justify-content-between align-items-center text-muted"
                                    >
                                        {link}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </>
                    )}
                </Card.Body>
                <Card.Body>
                    {book.files?.length && (
                        <>
                            <Card.Subtitle className="text-start mb-2">{t("book.files")}</Card.Subtitle>
                            <ListGroup>
                                {book.files.map((file, i) => {
                                    if (!file.fileUrl) return null;
                                    // Extract just the filename (without path and extension)
                                    const fileName = file.fileUrl
                                        .split('/').pop()!                // "1757936365845-Screenshot-from-2024-12-27-23-38-07.png"
                                        .replace(/^\d+-/, '')             // remove leading numbers + dash
                                        .replace(/\.[^/.]+$/, '');        // remove extension

                                    return (
                                        <ListGroup.Item key={`file-${i}`}>
                                            <a href={`/${file.fileUrl}`} download>
                                                {fileName}
                                            </a>
                                        </ListGroup.Item>
                                    );
                                })}
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
                <Card.Body>
                    <div className="text-start mt-4">
                        <Button variant="secondary" onClick={() => setShowEditBook(true)}>
                            {t("book.edit")}
                        </Button>
                    </div>
                    <AddEditBookModal show={showEditBook} closeModal={() => setShowEditBook(false)} addBook={addNewBook} updateBook={updateBook} initialBook={book} mode="edit"/>
                </Card.Body>
            </Card>
        </Container>
    )
}
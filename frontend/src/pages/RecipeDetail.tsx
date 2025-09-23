import {type SetStateAction, useContext, useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {RecipeContext} from "../context/RecipeContext";
import {Badge, Button, ButtonGroup, Card, Col, Container, ListGroup, Row, Stack, Table} from "react-bootstrap";
import AddEditRecipeModal from "../modal/AddEditRecipeModal.tsx";
import {useTranslation} from "react-i18next";
import {useAuth} from "../context/AuthContext.tsx";
import AverageRating from "../components/AverageRating.tsx";
import {changeRecipe, removeRecipe} from "../api/recipes.ts";
import ReviewList from "../components/ReviewList.tsx";
import {useFavorites} from "../context/FavoritesContext.tsx";
import {BooksContext} from "../context/BooksContext.tsx";
import type {Book} from "../types/Book.ts";
import {getButtonOutline, getInitialThumbnailSize, getThumbnailClass, popupImgStyles, popupStyles, thumbnailSizes, type ThumbnailSizeType} from "../helper/thumbnailHelper.ts";
import AiButton from "../components/AiButton.tsx";
import {useUsersContext} from "../context/UsersContext.tsx";

const RecipeDetail = () => {
    const {id} = useParams<{ id: string }>();
    const {recipes, tags, updateRecipe, addNewRecipe, reloadRecipes, reloadTags, eraseRecipe} = useContext(RecipeContext);
    const {getFavorite, flipFavorite} = useFavorites();
    const [isFavorite, setIsFavorite] = useState(false);
    const {reloadUsers} = useUsersContext();
    const {books, reloadBooks} = useContext(BooksContext);
    const [showImagePopup, setShowImagePopup] = useState(false);
    const [showEditRecipe, setShowEditRecipe] = useState(false);

    const recipe = recipes.find((r) => r.id === id);
    const recipeBook = books.find((b) => b.id === recipe?.book);

    const {t} = useTranslation();
    const {user, roles} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!recipe) {
            reloadRecipes().then();
            reloadTags().then();
            reloadBooks().then();
            reloadUsers().then();
        }
    }, [id]);

    const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSizeType>('original');
    const isAiUser = roles.find(r => r === "ai-user") ?? false;

    const goToBook = (book: Book) => navigate(`/books/${book.id}`);

    useEffect(() => {
        if (!recipe) {
            setThumbnailSize(('original'));
            return;
        }
        const img = new Image();
        const src = `${recipe.thumbnail}`;
        img.onload = () => {
            const {naturalWidth, naturalHeight} = img;
            const size = getInitialThumbnailSize(naturalWidth, naturalHeight);
            setThumbnailSize(size);
        }
        img.src = src;
    }, [recipe?.thumbnail]);

    useEffect(() => {
        if (!user || !recipe) return;
        getFavorite(user).then(fav => {
            const result = !!fav?.recipeIds.includes(recipe.id);
            setIsFavorite(result);
            console.log(`isFavorite: result: ${result}, user: ${user}, recipeId: ${recipe.id}`);
        });
    }, [user, id]);

    const deleteRecipe = async () => {
        if (!recipe) return;
        if (!window.confirm(t("recipe.deleteConfirmation", {recipeName: recipe.name}))) return;
        try {
            const res = await removeRecipe(recipe.id);
            eraseRecipe(res);
            navigate("/recipes", {
                state: {deletedRecipe: recipe}
            });
            window.scrollTo(0, 0);
        } catch (err) {
            console.error("Failed to delete recipe", err);
        }
    }

    if (!recipe) {
        return (
            <Container className="py-4">
                <h2>{t("recipe.notFound")}</h2>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title as="div" className="d-flex justify-content-between align-items-start flex-wrap mb-3">
                        {user && (<div className="d-flex align-items-center gap-2">
                            <i className={`bi ${isFavorite ? 'bi-bookmark-heart-fill' : 'bi-bookmark-heart'} fs-5`}
                               role="button"
                               title={isFavorite ? 'Favorit entfernen' : 'Zu Favoriten hinzufügen'}
                               onClick={async () => {
                                   flipFavorite(user, recipe.id);
                                   setIsFavorite(!isFavorite);
                               }}
                               style={{cursor: 'pointer', fontSize: '1.5rem', color: '#4e88c7'}}
                            />
                            <h2 className="mb-0">{recipe.name}</h2>
                        </div>)
                        }
                        <div className="d-flex flex-column align-items-end ms-auto text-end small">
                            <div className="text-muted">{t("recipe.averageRating")}</div>
                            <AverageRating reviews={recipe.reviews || []}/>
                        </div>
                    </Card.Title>

                </Card.Body>
                {recipe.thumbnail ? (
                    <>
                        <div onClick={() => setShowImagePopup(true)} style={{cursor: 'zoom-in'}}>
                            <Card.Img
                                variant="top"
                                src={recipe.thumbnail}
                                alt={recipe.name}
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
                        <Button variant={getButtonOutline()} onClick={() => setShowEditRecipe(true)}>
                            {t("recipe.addThumbnail")}
                        </Button>
                    </div>
                )}
                {showImagePopup && (
                    <div style={popupStyles(showImagePopup)} onClick={() => setShowImagePopup(false)}>
                        <img
                            src={recipe.thumbnail}
                            alt={recipe.name}
                            style={popupImgStyles}
                        />
                    </div>
                )}

                <Card.Body>
                    <Row>
                        {
                            isAiUser && recipe.thumbnail &&
                            <Col xs="auto">
                                <AiButton recipeId={recipe.id} fileUrl={recipe.thumbnail} key={`aiButtons-thumb-${recipe.id}`} isImage={true}/>
                            </Col>
                        }
                        {recipe.tags && recipe.tags.length > 0 && (
                            <Col>
                                <Card.Subtitle className="text-start mb-2">{t("recipe.tags")}</Card.Subtitle>
                                <Stack direction="horizontal" gap={2} className="flex-wrap mb-4">
                                    {recipe.tags
                                        .map(tagId => tags.find(t => t.id === tagId))
                                        .filter(Boolean)
                                        .map((tag) => (
                                            <Badge key={tag!.id} bg="secondary">
                                                {tag!.name}
                                            </Badge>
                                        ))}
                                </Stack>
                            </Col>
                        )}
                        {recipeBook && (
                            <Col>
                                <Card.Subtitle className="text-start mb-2">{t('recipe.book')}</Card.Subtitle>
                                <div
                                    role="button"
                                    className="text-start text-primary mb-2"
                                    style={{cursor: "pointer"}}
                                    onClick={() => goToBook(recipeBook)}
                                >
                                    {recipeBook.name}
                                </div>
                            </Col>
                        )}
                    </Row>
                </Card.Body>

                <Card.Body>
                    <Row>
                        {recipe.ingredients && recipe.ingredients.length > 0 && (
                            <Col>
                                <Card.Subtitle className="text-start mb-2">{t("recipe.ingredients")}</Card.Subtitle>
                                {recipe.ingredients.map((group, idx) => (
                                    <div key={idx} className="mb-4">
                                        {group.group && <h6 className="text-start mt-3"><small className="text-body-secondary">{group.group}</small></h6>}
                                        <Table bordered>
                                            <tbody>
                                            {group.items.map((ingredient, i) => (
                                                <tr key={i}>
                                                    <td style={{width: "25%"}} className="text-end">{ingredient.amount}</td>
                                                    <td className="text-start">{ingredient.name}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                ))}

                            </Col>
                        )}
                        {recipe.steps && recipe.steps.length > 0 && (
                            <Col>
                                <Card.Subtitle className="text-start mb-4">{t("recipe.steps")}</Card.Subtitle>
                                <ListGroup numbered className="mb-4">
                                    {recipe.steps.map((step, i) => (
                                        <ListGroup.Item key={i} className="text-start">{step}</ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Col>
                        )}
                    </Row>
                </Card.Body>

                <Card.Body>
                    {recipe.links && recipe.links.length > 0 && (
                        <>
                            <Card.Subtitle className="text-start mb-2">{t("recipe.links")}</Card.Subtitle>
                            <ListGroup className="mb-4">
                                {recipe.links.map((link, i) => (
                                    <ListGroup.Item
                                        key={i}
                                        action
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {link}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </>
                    )}
                </Card.Body>

                <Card.Body>
                    {recipe.files && recipe.files.length > 0 && (
                        <>
                            <Card.Subtitle className="text-start mb-2">{t("recipe.files")}</Card.Subtitle>
                            <ListGroup>
                                {recipe.files.map((file, i) => {
                                    if (!file) return null;
                                    const validImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
                                    const lowerName = file.toLowerCase();
                                    const isImage = validImageExtensions.some(ext => lowerName.endsWith(ext));
                                    const isPdf = lowerName.endsWith('.pdf');
                                    // Extract just the filename (without path and extension)
                                    const fileName = file
                                        .split('/').pop()!                // "1757936365845-Screenshot-from-2024-12-27-23-38-07.png"
                                        .replace(/^\d+-/, '')             // remove leading numbers + dash
                                        .replace(/\.[^/.]+$/, '');        // remove extension
                                    return (
                                        <ListGroup.Item
                                            key={`file-${i}`}
                                            className="d-flex justify-content-between align-items-center"
                                        >
                                            <a href={file} download>
                                                {fileName}
                                            </a>
                                            {isImage && <AiButton recipeId={recipe.id} fileUrl={file} isImage={true}/>}
                                            {isPdf && <AiButton recipeId={recipe.id} fileUrl={file} isImage={false}/>}
                                        </ListGroup.Item>
                                    );
                                })}
                            </ListGroup>
                        </>
                    )}
                </Card.Body>

                <Card.Body>
                    <ReviewList
                        reviews={recipe.reviews || []}
                        username={user ?? ''}
                        onUpdate={async (updated) => {
                            const rest = (recipe.reviews || []).filter(r => r.username !== updated.username);
                            const updatedRecipe = {...recipe, reviews: [...rest, updated]};
                            const res = await changeRecipe(updatedRecipe);
                            updateRecipe(res);
                        }}
                    />
                </Card.Body>

                <Card.Body>
                    <Row className="mt-4 justify-content-between">
                        <Col xs="auto" className="text-start">
                            <Button variant="secondary"
                                    onClick={() => setShowEditRecipe(true)}>
                                {t("recipe.edit")}
                            </Button>
                        </Col>
                        <Col xs="auto" className="text-end">
                            <Button variant="danger"
                                    onClick={() => deleteRecipe()}>
                                {t("recipe.delete")}
                            </Button>
                        </Col>
                    </Row>
                    <AddEditRecipeModal
                        show={showEditRecipe}
                        onClose={() => setShowEditRecipe(false)}
                        addRecipe={addNewRecipe}
                        updateRecipe={updateRecipe}
                        mode="edit"
                        initialRecipe={recipe}
                    />
                </Card.Body>
            </Card>
        </Container>
    );
};

export default RecipeDetail;

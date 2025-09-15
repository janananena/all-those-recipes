import {type SetStateAction, useContext, useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {RecipeContext} from "../context/RecipeContext";
import {Badge, Button, ButtonGroup, Card, Col, Container, ListGroup, Row, Stack} from "react-bootstrap";
import AddEditRecipeModal from "../modal/AddEditRecipeModal.tsx";
import {useTranslation} from "react-i18next";
import {useAuth} from "../context/AuthContext.tsx";
import AverageRating from "../components/AverageRating.tsx";
import {changeRecipe} from "../api/recipes.ts";
import ReviewList from "../components/ReviewList.tsx";
import {useFavorites} from "../context/FavoritesContext.tsx";
import {useUsersContext} from "../context/UsersContext.tsx";
import {BooksContext} from "../context/BooksContext.tsx";
import type {Book} from "../types/Book.ts";
import {getButtonOutline, getInitialThumbnailSize, getThumbnailClass, popupImgStyles, popupStyles, thumbnailSizes, type ThumbnailSizeType} from "../helper/thumbnailHelper.ts";

const RecipeDetail = () => {
    const {id} = useParams<{ id: string }>();
    const {recipes, tags, updateRecipe, addNewRecipe, reloadRecipes, reloadTags} = useContext(RecipeContext);
    const {getFavorite, flipFavorite} = useFavorites();
    const [isFavorite, setIsFavorite] = useState(false);
    const {reloadUsers} = useUsersContext();
    const {books, reloadBooks} = useContext(BooksContext);
    const [showImagePopup, setShowImagePopup] = useState(false);
    const [showEditRecipe, setShowEditRecipe] = useState(false);

    const recipe = recipes.find((r) => r.id === id);
    const recipeBook = books.find((b) => b.id === recipe?.book);

    const {t} = useTranslation();
    const {user} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!recipe) {
            reloadRecipes().then();
            reloadTags().then();
            reloadUsers().then();
            reloadBooks().then();
        }
    }, [id]);

    const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSizeType>('original');

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
                        {/* Left Column */}
                        <Col md={8}>
                            {recipe.ingredients && recipe.ingredients.length > 0 && (
                                <>
                                    <h4>{t("recipe.ingredients")}</h4>
                                    <ListGroup className="mb-4">
                                        {recipe.ingredients.map((group, idx) => (
                                            <div key={idx}>
                                                {group.group && <h6 className="mt-3">{group.group}</h6>}
                                                {group.items.map((ingredient, i) => (
                                                    <ListGroup.Item key={i}>
                                                        {ingredient.amount} {ingredient.name}
                                                    </ListGroup.Item>
                                                ))}
                                            </div>
                                        ))}
                                    </ListGroup>
                                </>
                            )}

                            {recipe.steps && recipe.steps.length > 0 && (
                                <>
                                    <h4>{t("recipe.steps")}</h4>
                                    <ListGroup numbered className="mb-4">
                                        {recipe.steps.map((step, i) => (
                                            <ListGroup.Item key={i}>{step}</ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </>
                            )}

                            {recipeBook && (
                                <>
                                    <h4>{t('recipe.book')}</h4>
                                    <div
                                        role="button"
                                        className="text-primary mb-2"
                                        style={{cursor: "pointer"}}
                                        onClick={() => goToBook(recipeBook)}
                                    >
                                        {recipeBook.name}
                                    </div>
                                </>
                            )}

                            {recipe.tags && recipe.tags.length > 0 && (
                                <>
                                    <h4>{t("recipe.tags")}</h4>
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
                                </>
                            )}

                            {recipe.links && recipe.links.length > 0 && (
                                <>
                                    <h4>{t("recipe.links")}</h4>
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

                            {recipe.files?.length && (
                                <>
                                    <h4>{t("recipe.files")}</h4>
                                    <ListGroup>
                                        {recipe.files.map((file, i) => {
                                            if (!file.fileUrl) return;
                                            console.log("file.fileUrl", file.fileUrl);
                                            return (
                                                <ListGroup.Item key={i}>
                                                    <ListGroup horizontal="sm">
                                                        <ListGroup.Item key={`file-${i}`}>
                                                            <a href={`/${file.fileUrl}`} download>
                                                                {file.fileUrl}
                                                            </a>
                                                        </ListGroup.Item>
                                                    </ListGroup>
                                                </ListGroup.Item>
                                            );
                                        })}
                                    </ListGroup>

                                </>
                            )}
                        </Col>

                        {/* Right Column */}
                        <Col md={4}>
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
                        </Col>
                    </Row>

                    <div className="mt-4">
                        <Button variant="secondary"
                                onClick={() => setShowEditRecipe(true)}
                        >{t("recipe.edit")}</Button>
                    </div>
                </Card.Body>
            </Card>
            <AddEditRecipeModal
                show={showEditRecipe}
                onClose={() => setShowEditRecipe(false)}
                addRecipe={addNewRecipe}
                updateRecipe={updateRecipe}
                mode="edit"
                initialRecipe={recipe}
            />
        </Container>
    );
};

export default RecipeDetail;

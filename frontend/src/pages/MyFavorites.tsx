import {useContext, useEffect, useState} from 'react';
import {Container, Toast, ToastContainer} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import {RecipeContext} from '../context/RecipeContext';
import ReviewItem from '../components/ReviewItem';
import type {Review} from '../types/Recipe';
import {useAuth} from "../context/AuthContext.tsx";
import {useFavorites} from "../context/FavoritesContext.tsx";
import {useTranslation} from 'react-i18next';
import {changeRecipe} from "../api/recipes.ts";

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import React from 'react';

type SortableFavoriteProps = {
    id: string;
    children: (props: {
        listeners: ReturnType<typeof useSortable>["listeners"];
        attributes: ReturnType<typeof useSortable>["attributes"];
    }) => React.ReactNode;
};

const SortableFavorite = ({id, children}: SortableFavoriteProps) => {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        border: '1px solid #797979',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        padding: '0.75rem',
        marginBottom: '0.5rem',
    };

    return (
        <div ref={setNodeRef} style={style}>
            {children({listeners, attributes})}
        </div>
    );
};


export default function MyFavorites() {
    const [undoData, setUndoData] = useState<{ recipeId: string } | null>(null);
    const [showToast, setShowToast] = useState(false);

    const {recipes, updateRecipe, reloadRecipes} = useContext(RecipeContext);
    const {favorites, reloadFavorites, flipFavorite, changeFavorites} = useFavorites();
    const {user} = useAuth();
    const navigate = useNavigate();
    const {t} = useTranslation();

    const userFavoriteEntry = favorites.find(f => f.username === user);
    const favoriteIds = userFavoriteEntry?.recipeIds ?? [];

    const [orderedIds, setOrderedIds] = useState<string[]>(favoriteIds);

    useEffect(() => {
        reloadRecipes();
        reloadFavorites();
    }, []);

    useEffect(() => {
        setOrderedIds(favoriteIds);
    }, [favoriteIds]);

    const myRecipes = orderedIds
        .map(id => recipes.find(r => r.id === id))
        .filter(Boolean) as typeof recipes;

    const handleReviewChange = async (recipeId: string, updatedReview: Review) => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const rest = (recipe.reviews || []).filter(r => r.username !== user);
        const updatedRecipe = {
            ...recipe,
            reviews: [...rest, updatedReview]
        };

        const res = await changeRecipe(updatedRecipe);
        updateRecipe(res);
    };

    const handleRemoveFavorite = (recipeId: string) => {
        flipFavorite(user ?? '', recipeId);
        setUndoData({recipeId});
        setShowToast(true);
    };

    const handleUndo = () => {
        if (undoData) {
            flipFavorite(user ?? '', undoData.recipeId);
            setUndoData(null);
        }
        setShowToast(false);
    };

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        if (!over || active.id === over.id) return;

        const oldIndex = orderedIds.indexOf(active.id as string);
        const newIndex = orderedIds.indexOf(over.id as string);

        const newOrder = arrayMove(orderedIds, oldIndex, newIndex);
        setOrderedIds(newOrder);

        if (userFavoriteEntry) {
            changeFavorites(user ?? '', newOrder);
        }
    };

    return (
        <>
            <Container className="py-4">
                <div className="d-flex justify-content-between align-items-center mb-3 text-muted">
                    <h2>{t("nav.favorites")}</h2>
                </div>
                {myRecipes.length === 0 && <p>{t("recipe.noFavorites")}</p>}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                        {myRecipes.map(recipe => {
                            const myReview =
                                recipe.reviews?.find(r => r.username === user) ?? {
                                    username: user ?? "",
                                    score: undefined,
                                    comment: ''
                                };

                            return (
                                <SortableFavorite
                                    key={recipe.id}
                                    id={recipe.id}>{({listeners, attributes}) => {
                                    const displayLabel = (
                                        <div className="d-flex align-items-center gap-2">
                                            <i
                                                className="bi bi-grip-vertical text-muted hover:text-primary"
                                                title={t("dragToReorder")}
                                                {...listeners}
                                                {...attributes}
                                                style={{cursor: 'grab'}}
                                            />
                                            <span
                                                role="button"
                                                className="text-decoration-underline fw-semibold"
                                                style={{color: 'var(--my-blue)'}}
                                                onClick={() => navigate(`/recipes/${recipe.id}`)}
                                            >
                                                {recipe.name}
                                            </span>
                                            <i
                                                className="bi bi-bookmark-fill"
                                                style={{color: 'var(--my-blue)'}}
                                                role="button"
                                                title={t("removeFavorite")}
                                                onClick={() => handleRemoveFavorite(recipe.id)}
                                            />
                                        </div>
                                    );

                                    return (<div className="mb-1">
                                            <div className="d-flex align-items-start gap-3">
                                                <div style={{width: '120px', height: '120px', flexShrink: 0}}>
                                                    {recipe.thumbnail ? (
                                                        <img
                                                            src={recipe.thumbnail}
                                                            alt={recipe.name}
                                                            className="img-fluid rounded"
                                                            style={{width: '120px', height: '120px', objectFit: 'cover'}}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="bg-secondary text-white d-flex justify-content-center align-items-center rounded"
                                                            style={{width: '120px', height: '120px', fontSize: '0.8rem'}}
                                                        >
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-grow-1" style={{height: '120px'}}>
                                                    <ReviewItem
                                                        review={myReview}
                                                        editable
                                                        displayLabel={displayLabel}
                                                        onChange={updated => handleReviewChange(recipe.id, updated)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                                </SortableFavorite>
                            );
                        })}
                    </SortableContext>
                </DndContext>
            </Container>

            <ToastContainer position="top-end" className="mb-3">
                <Toast onClose={() => setShowToast(false)} show={showToast} bg="secondary" delay={4000} autohide>
                    <Toast.Body className="d-flex justify-content-between align-items-center">
                        <span>{t("recipe.removedFromFavorites")}</span>
                        <button
                            className="btn btn-link p-0 ms-3 text-decoration-none"
                            onClick={handleUndo}
                        >
                            {t("undo")}
                        </button>
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </>
    );
}

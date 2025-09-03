import React, {useContext} from "react";
import Table from "react-bootstrap/Table";
import type {Recipe} from "../types/Recipe";
import {useTranslation} from "react-i18next";
import {RecipeContext} from "../context/RecipeContext.tsx";
import {Badge} from "react-bootstrap";
import UserRating from "./UserRating.tsx";
import AverageRating from "./AverageRating.tsx";
import {useAuth} from "../context/AuthContext.tsx";
import {useFavorites} from "../context/FavoritesContext.tsx";

type Props = {
    recipes: Recipe[];
    onSelect: (recipe: Recipe) => void;
};

const RecipeTable: React.FC<Props> = ({recipes, onSelect}) => {
    const {tags} = useContext(RecipeContext);
    const {favorites, flipFavorite} = useFavorites();
    const {user} = useAuth();
    const {t} = useTranslation();

    const userFavorites = favorites.find(fav => fav.username === user)?.recipeIds ?? [];

    const isFavorite = (id: string) => {
        return userFavorites.includes(id);
    }

    return (
        <Table striped hover responsive>
            <thead>
            <tr>
                <th style={{ width: '40px' }} className="text-muted" />
                <th style={{ width: '40%' }} className="text-muted">{t("recipes.name")}</th>
                <th style={{ width: '30%' }} className="text-muted d-none d-md-table-cell">{t("recipes.tags")}</th>
                <th className="text-nowrap text-muted d-none d-md-table-cell" style={{ width: '15%' }}>{t("recipes.avgRating")}</th>
                <th className="text-nowrap text-muted d-none d-md-table-cell" style={{ width: '15%' }}>{t("recipes.myRating")}</th>
            </tr>
            </thead>
            <tbody>
            {recipes.map((recipe) => (
                <tr key={recipe.id} onClick={() => onSelect(recipe)} style={{ cursor: 'pointer' }}>
                    {user && (
                        <td>
                            <i
                                className={`bi ${isFavorite(recipe.id) ? 'bi-bookmark-fill' : 'bi-bookmark'}`}
                                role="button"
                                style={{ color: 'var(--my-blue)' }}
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    await flipFavorite(user, recipe.id);
                                }}
                            />
                        </td>
                    )}
                    <td className="text-muted">
                        <div>{recipe.name}</div>
                        {/* Tags below name on small screens */}
                        <div className="d-md-none mt-1 small text-muted">
                            {recipe.tags?.map((tagId, index) => {
                                const tag = tags.find(t => t.id === tagId);
                                return (
                                    <Badge
                                        key={index}
                                        bg="secondary"
                                        className="me-1"
                                        style={{ textTransform: 'capitalize' }}
                                    >
                                        {tag?.name}
                                    </Badge>
                                );
                            })}
                        </div>
                    </td>
                    <td className="d-none d-md-table-cell">
                        {recipe.tags?.map((tagId, index) => {
                            const tag = tags.find(t => t.id === tagId);
                            return (
                                <Badge
                                    key={index}
                                    bg="secondary"
                                    className="me-1"
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {tag?.name}
                                </Badge>
                            );
                        })}
                    </td>
                    <td className="text-nowrap d-none d-md-table-cell">
                        <AverageRating reviews={recipe.reviews || []} />
                    </td>
                    <td className="text-nowrap d-none d-md-table-cell">
                        <UserRating reviews={recipe.reviews || []} username={user ?? ' '} />
                    </td>
                </tr>
            ))}
            </tbody>
        </Table>

    );
};

export default RecipeTable;

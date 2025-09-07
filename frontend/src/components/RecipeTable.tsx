import React, {useContext, useMemo} from "react";
import Table from "react-bootstrap/Table";
import type {Recipe} from "../types/Recipe";
import {useTranslation} from "react-i18next";
import {RecipeContext} from "../context/RecipeContext.tsx";
import {Badge} from "react-bootstrap";
import UserRating from "./UserRating.tsx";
import AverageRating from "./AverageRating.tsx";
import {useAuth} from "../context/AuthContext.tsx";
import {useFavorites} from "../context/FavoritesContext.tsx";
import {BooksContext} from "../context/BooksContext.tsx";

type Props = {
    recipes: Recipe[];
    onSelect: (recipe: Recipe) => void;
};

const RecipeTable: React.FC<Props> = ({recipes, onSelect}) => {
    const {tags} = useContext(RecipeContext);
    const {favorites, flipFavorite} = useFavorites();
    const {books} = useContext(BooksContext);
    const {user} = useAuth();
    const {t} = useTranslation();

    const userFavorites = favorites.find(fav => fav.username === user)?.recipeIds ?? [];

    const isFavorite = (id: string) => {
        return userFavorites.includes(id);
    }

    const recipeBook = (recipe: Recipe) => books.find((b) => b.id === recipe?.book);

    const groupedRecipes = useMemo(() => {
        const groups: Record<string, Recipe[]> = {};
        const ungrouped: Recipe[] = [];

        recipes.forEach((recipe) => {
            if (recipe.book) {
                if (!groups[recipe.book]) groups[recipe.book] = [];
                groups[recipe.book].push(recipe);
            } else {
                ungrouped.push(recipe);
            }
        });

        return {groups, ungrouped};
    }, [recipes]);

    function RecipeTableRow(recipe: Recipe) {
        return (
            <>
                <tr key={recipe.id} onClick={() => onSelect(recipe)} style={{cursor: 'pointer'}}>
                    {user && (
                        <td>
                            <i
                                className={`bi ${isFavorite(recipe.id) ? 'bi-bookmark-fill' : 'bi-bookmark'}`}
                                role="button"
                                style={{color: 'var(--my-blue)'}}
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    await flipFavorite(user, recipe.id);
                                }}
                            />
                        </td>
                    )}
                    <td className="text-muted">
                        <div className="text-start">{recipe.name}</div>
                        {/* Tags below name on small screens */}
                        <div className="d-md-none mt-1 small text-muted">
                            {recipe.tags?.map((tagId, index) => {
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
                        </div>
                    </td>
                    <td className="text-muted text-nowrap">
                        <div>{recipeBook(recipe)?.name ?? ""}</div>
                    </td>
                    <td className="d-none d-md-table-cell">
                        {recipe.tags?.map((tagId, index) => {
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
                    <td className="text-nowrap d-none d-md-table-cell">
                        <AverageRating reviews={recipe.reviews || []}/>
                    </td>
                    <td className="text-nowrap d-none d-md-table-cell">
                        <UserRating reviews={recipe.reviews || []} username={user ?? ' '}/>
                    </td>
                </tr>
            </>
        );
    }

    return (
        <Table striped hover responsive>
            <thead>
            <tr>
                <th style={{width: '40px'}} className="text-muted"/>
                <th style={{width: '40%'}} className="text-muted text-start">{t("recipes.name")}</th>
                <th style={{width: '10%'}} className="text-muted">{t("recipes.book")}</th>
                <th style={{width: '20%'}} className="text-muted d-none d-md-table-cell">{t("recipes.tags")}</th>
                <th className="text-nowrap text-muted d-none d-md-table-cell" style={{width: '15%'}}>{t("recipes.avgRating")}</th>
                <th className="text-nowrap text-muted d-none d-md-table-cell" style={{width: '15%'}}>{t("recipes.myRating")}</th>
            </tr>
            </thead>
            <tbody>
            {Object.entries(groupedRecipes.groups).map(([, bookRecipes]) => (
                bookRecipes.map(recipe => RecipeTableRow(recipe))
            ))}
            {groupedRecipes.ungrouped.map((recipe) => RecipeTableRow(recipe))}
            </tbody>
        </Table>

    );
};

export default RecipeTable;

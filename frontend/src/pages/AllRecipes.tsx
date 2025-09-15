import {useContext, useEffect, useMemo, useState} from "react";
import {Container, Toast, ToastContainer} from "react-bootstrap";
import type {Recipe} from "../types/Recipe";
import type {SearchTag} from "../types/SearchTag";
import TagSelector from "../components/TagSelector";
import SearchBar from "../components/SearchBar";
import RecipeTable from "../components/RecipeTable";
import {useLocation, useNavigate, useSearchParams} from "react-router-dom";
import {RecipeContext} from "../context/RecipeContext";
import {useFavorites} from "../context/FavoritesContext.tsx";
import {BooksContext} from "../context/BooksContext.tsx";
import {useTranslation} from "react-i18next";
import {createRecipe} from "../api/recipes.ts";

export const AllRecipes = () => {
    const location = useLocation();
    const deletedRecipe = location.state?.deletedRecipe;
    const [undoData, setUndoData] = useState<Recipe|null>(deletedRecipe);

    const {recipes, reloadRecipes, reloadTags, addNewRecipe} = useContext(RecipeContext);
    const {reloadFavorites} = useFavorites();
    const {reloadBooks} = useContext(BooksContext);
    const [searchTags, setSearchTags] = useState<SearchTag[]>([]);

    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const {t} = useTranslation();

    const [showToast, setShowToast] = useState<boolean>(!!undoData);

    const handleUndo = async () => {
        if (undoData) {
            console.log(`undorecipe: ${undoData.id}: `, undoData);
            const res = await createRecipe(undoData);
            addNewRecipe(res);
            reloadRecipes();
            setUndoData(null);
        }
        setShowToast(false);
        //remove toast for next reload
        navigate('/recipes', {replace: true});
    };

    useEffect(() => {
        reloadRecipes().then();
        reloadTags().then();
        reloadFavorites().then();
        reloadBooks().then();

        const tagParams = searchParams.getAll("tag");
        const textParams = searchParams.getAll("text");

        const parsedTags: SearchTag[] = [
            ...tagParams.map((value) => ({type: "tag" as const, value: value})),
            ...textParams.map((value) => ({type: "text" as const, value: value})),
        ];

        setSearchTags(parsedTags);
    }, []);

    useEffect(() => {
        const newParams = new URLSearchParams();
        for (const tag of searchTags) {
            newParams.append(tag.type, tag.value);
        }
        setSearchParams(newParams, {replace: true});
    }, [searchTags, setSearchParams]);

    const filteredRecipes = useMemo(() => {
        if (searchTags.length === 0) return recipes;

        return recipes.filter((recipe) => {
            const search = searchTags.map((t) => t.value.toLowerCase());

            const matchName = search.some((term) =>
                recipe.name.toLowerCase().includes(term)
            );
            const matchTags = recipe.tags
                ? search.some((term) =>
                    // @ts-expect-error tags are checked before usage
                    recipe.tags.some((t) => t.toLowerCase().includes(term))
                )
                : false;

            return matchName || matchTags;
        });
    }, [searchTags, recipes]);

    const addSearchTag = (tag: SearchTag) => {
        // Avoid duplicates
        setSearchTags((prev) => {
            if (prev.some((t) => t.type === tag.type && t.value === tag.value)) {
                return prev;
            }
            return [...prev, tag];
        });
    };

    const removeSearchTag = (tag: SearchTag) => {
        setSearchTags((prev) =>
            prev.filter((t) => !(t.type === tag.type && t.value === tag.value))
        );
    };

    const clearSearchTags = () => setSearchTags([]);

    const goToDetail = (recipe: Recipe) => navigate(`/recipes/${recipe.id}`);

    return (
        <Container className="my-4">
            <TagSelector searchTags={searchTags} onSelect={addSearchTag} onClear={clearSearchTags}/>
            <SearchBar searchTags={searchTags} onAdd={addSearchTag} onRemove={removeSearchTag}/>
            <RecipeTable recipes={filteredRecipes} onSelect={goToDetail}/>
            {undoData && <ToastContainer key={`toast-container-${undoData.id}`} position="top-end" className="mb-3">
                <Toast key={`toast-${undoData.id}`} onClose={() => setShowToast(false)} show={showToast} bg="secondary" delay={6000} autohide>
                    <Toast.Body key={`toast-body-${undoData.id}`} className="d-flex justify-content-between align-items-center">
                        <span>{t("recipe.deleted", {recipeName: undoData.name})}</span>
                        <button
                            key={`toast-button-${undoData.id}`}
                            className="btn btn-link p-0 ms-3 text-decoration-none"
                            onClick={handleUndo}
                        >
                            {t("undo")}
                        </button>
                    </Toast.Body>
                </Toast>
            </ToastContainer>}
        </Container>
    );
};

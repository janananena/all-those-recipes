import {useContext, useEffect, useMemo, useState} from "react";
import {Container} from "react-bootstrap";
import type {Recipe} from "../types/Recipe";
import type {SearchTag} from "../types/SearchTag";
import TagSelector from "../components/TagSelector";
import SearchBar from "../components/SearchBar";
import RecipeTable from "../components/RecipeTable";
import {useNavigate, useSearchParams} from "react-router-dom";
import {RecipeContext} from "../context/RecipeContext";
import {useFavorites} from "../context/FavoritesContext.tsx";

export const AllRecipes = () => {
    const {recipes, reloadRecipes, reloadTags} = useContext(RecipeContext);
    const {reloadFavorites} = useFavorites();
    const [searchTags, setSearchTags] = useState<SearchTag[]>([]);

    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        reloadRecipes().then();
        reloadTags().then();
        reloadFavorites().then();

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
        </Container>
    );
};

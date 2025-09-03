import React, {useContext, useEffect, useState} from "react";
import {Button, Spinner} from "react-bootstrap";
import type {IngredientGroup} from "../types/Recipe.ts";
import {changeRecipe} from "../api/recipes.ts";
import {RecipeContext} from "../context/RecipeContext.tsx";
import {readImgText, readIngredients, readSteps} from "../api/aiImageContentExt.ts";
import {AiContext} from "../context/AiContext.tsx";
import { useTranslation } from "react-i18next";

interface AiButtonProps {
    recipeId: string;
    fileUrl: string;
}

const AiButton: React.FC<AiButtonProps> = ({recipeId, fileUrl}: AiButtonProps) => {

    const [loading, setLoading] = useState<boolean>(false);
    const {recipes, updateRecipe} = useContext(RecipeContext);
    const {googleVisionApiKey, googlePalmApiKey, ingredientPrompt, stepsPrompt, reloadAiConfig} = useContext(AiContext);
    const {t} = useTranslation();

    const hasUrl = !!fileUrl;
    const recipe = recipes.find(r => r.id === recipeId);
    //enable button in case one of the extractions failed
    const wasExtracted = (recipe?.ingredients?.find(r => r.group === "extracted") !== undefined) && ((recipe?.steps?.length ?? 0) > 0);
    const disableThumbnailExtraction = !hasUrl || wasExtracted;

    useEffect(() => {
        reloadAiConfig().then();
    }, []);

    if (!recipe) {
        return (
            <></>
        );
    }

    async function writeIngredientsAndSteps(ingredients: IngredientGroup[], steps: string[]) {
        if (!recipe) return;
        const newRecipe = {...recipe, ingredients: ingredients, steps: steps};
        const res = await changeRecipe(newRecipe);
        updateRecipe(res);
        console.log(`updated recipe w/ ingredients and steps, recipe: ${recipe.id}`);
    }

    async function calcThumbnail() {
        const fulltext = await readImgText(fileUrl, setLoading, googleVisionApiKey);
        const ings = await readIngredients(fulltext ?? "", setLoading, googlePalmApiKey, ingredientPrompt);
        const steps = await readSteps(recipe?.name ?? '', fulltext ?? "", setLoading, googlePalmApiKey, stepsPrompt);
        writeIngredientsAndSteps(ings, steps).then();
    }

    const renderButtonContent = (label: string) =>
        loading ? (
            <Spinner animation="border" size="sm"/>
        ) : (
            label
        );

    return (
        <Button
            variant="secondary"
            disabled={disableThumbnailExtraction || loading}
            onClick={calcThumbnail}
        >
            <i className="bi bi-magic"></i> {renderButtonContent(t("ai.extract"))}
        </Button>
    );
};

export default AiButton;

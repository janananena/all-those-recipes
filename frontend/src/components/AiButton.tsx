import React, {useContext, useState} from "react";
import {Button, Spinner} from "react-bootstrap";
import {RecipeContext} from "../context/RecipeContext.tsx";
import {processRecipeImage, processRecipePdf} from "../api/aiImageContent.ts";
import {useTranslation} from "react-i18next";

interface AiButtonProps {
    recipeId: string;
    fileUrl: string;
    isImage: boolean;
}

const AiButton: React.FC<AiButtonProps> = ({recipeId, fileUrl, isImage}: AiButtonProps) => {

    const [loading, setLoading] = useState<boolean>(false);
    const {recipes, updateRecipe} = useContext(RecipeContext);
    const {t} = useTranslation();

    const hasUrl = !!fileUrl;
    const recipe = recipes.find(r => r.id === recipeId);
    //enable button in case one of the extractions failed
    const wasExtracted = (recipe?.ingredients?.find(r => r.group === "extracted") !== undefined) && ((recipe?.steps?.length ?? 0) > 0);
    const disableThumbnailExtraction = !hasUrl || wasExtracted;

    if (!recipe) {
        return (
            <></>
        );
    }

    async function calcUpdatedRecipeFromImage() {
        if (!recipe) return;
        setLoading(true);
        let res;
        if(isImage){
            res = await processRecipeImage(recipeId, fileUrl);
        } else {
            res = await processRecipePdf(recipeId, fileUrl);
        }
        updateRecipe(res);
        setLoading(false);
        console.log(`updated recipe w/ ingredients and steps, recipe: ${recipe.id}`);
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
            onClick={calcUpdatedRecipeFromImage}
        >
            <i className="bi bi-magic"></i> {renderButtonContent(isImage ? t("ai.extractFromImage") : t("ai.extractFromPdf"))}
        </Button>
    );
};

export default AiButton;

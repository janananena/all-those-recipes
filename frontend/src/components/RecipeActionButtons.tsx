import {ButtonGroup, Button} from "react-bootstrap";
import {useState} from "react";
import type {Recipe} from "../types/Recipe";
import {useTranslation} from "react-i18next";
import {ShoppingListModal} from "../modal/ShoppingListModal.tsx";
import axios from "axios";
import {CookingStepsSelectionModal} from "../modal/CookingStepsSelectionModal.tsx";
import {CookingStepsModal} from "../modal/CookingStepsModal.tsx";

type Props = {
    recipes: Recipe[];
};

export const RecipeActionButtons: React.FC<Props> = ({recipes}) => {
    const [showShoppingModal, setShowShoppingModal] = useState(false);
    const [showStepsModal, setShowStepsModal] = useState(false);
    const [showCookingModal, setShowCookingModal] = useState(false);
    const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
    const {t} = useTranslation();

    const handleGenerateShoppingList = async (ids: string[]) => {
        const headers = {headers: {'Content-Type': 'application/json'}};
        const res = await axios.post("/api/shopping-list", {recipeIds: ids}, headers);
        const {url} = await res.data;
        window.open(url, "_blank");
    };

    return (
        <>
            <div className="d-flex justify-content-start mb-3">
                <ButtonGroup size="sm">
                    <Button
                        variant="secondary"
                        onClick={() => setShowShoppingModal(true)}
                    >
                        {t("shopping.actions.createList")}
                    </Button>
                    <Button
                        variant="secondary"
                        className="me-2"
                        onClick={() => setShowStepsModal(true)}
                    >
                        {t("shopping.actions.createCookingView")}
                    </Button>
                </ButtonGroup>
            </div>

            <ShoppingListModal
                show={showShoppingModal}
                onClose={() => setShowShoppingModal(false)}
                recipes={recipes}
                onGenerate={handleGenerateShoppingList}
            />

            <CookingStepsSelectionModal
                show={showStepsModal}
                onClose={() => setShowStepsModal(false)}
                onCook={(selectedRecipes) => {
                    setSelectedRecipes(selectedRecipes);
                    setShowCookingModal(true);
                }}
            />

            <CookingStepsModal
                show={showCookingModal}
                onClose={() => setShowCookingModal(false)}
                selectedRecipes={selectedRecipes}
            />
        </>
    );
};

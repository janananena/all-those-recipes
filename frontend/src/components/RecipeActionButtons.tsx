import { ButtonGroup, Button } from "react-bootstrap";
import { useState } from "react";
import type { Recipe } from "../types/Recipe";
import { useTranslation } from "react-i18next";
import {ShoppingListModal} from "../modal/ShoppingListModal.tsx";
import axios from "axios";

type Props = {
    recipes: Recipe[];
};

export const RecipeActionButtons: React.FC<Props> = ({ recipes }) => {
    const [showShoppingModal, setShowShoppingModal] = useState(false);
    const { t } = useTranslation();

    const handleGenerateShoppingList = async (ids: string[]) => {
        const headers = {headers: {'Content-Type': 'application/json'}};
        const res = await axios.post("/api/shopping-list", { recipeIds: ids }, headers);
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
                    {/* Future buttons go here:
          <Button variant="secondary">{t("shopping.actions.export")}</Button>
          <Button variant="secondary">{t("shopping.actions.share")}</Button>
          */}
                </ButtonGroup>
            </div>

            <ShoppingListModal
                show={showShoppingModal}
                onClose={() => setShowShoppingModal(false)}
                recipes={recipes}
                onGenerate={handleGenerateShoppingList}
            />
        </>
    );
};

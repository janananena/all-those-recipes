import { useState, useMemo, useEffect, useContext } from "react";
import {
    Modal,
    Button,
    Form,
    ListGroup,
    Row,
    Col,
    Alert,
    Spinner,
} from "react-bootstrap";
import type { Recipe } from "../types/Recipe";
import { useTranslation } from "react-i18next";
import {RecipeContext} from "../context/RecipeContext.tsx";

type Props = {
    show: boolean;
    onClose: () => void;
    onCook: (selected: Recipe[]) => void | Promise<void>;
};

export const CookingStepsSelectionModal: React.FC<Props> = ({
                                                                show,
                                                                onClose,
                                                                onCook,
                                                            }) => {
    const { t } = useTranslation();
    const {recipes} = useContext(RecipeContext);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            setSearch("");
            setLoading(false);
        }
    }, [show]);

    const available = useMemo(() => {
        return recipes.filter(
            (r) =>
                r.steps &&
                r.steps.length > 0 &&
                !selected.find((s) => s.id === r.id) &&
                r.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [recipes, selected, search]);

    const addRecipe = (recipe: Recipe) =>
        setSelected((prev) => [...prev, recipe]);
    const removeRecipe = (id: string) =>
        setSelected((prev) => prev.filter((r) => r.id !== id));

    const handleCook = async () => {
        try {
            setLoading(true);
            await onCook(selected);
            setSelected([]);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{t("cooking.modal.selectionTitle")}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert variant="info" className="mb-3">
                    {t("cooking.modal.note")}
                </Alert>

                <Row>
                    {/* Recipe Picker */}
                    <Col md={7} className="border-end">
                        <Form.Control
                            type="text"
                            placeholder={t("cooking.modal.searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="mb-3"
                            disabled={loading}
                        />
                        <ListGroup style={{ maxHeight: "400px", overflowY: "auto" }}>
                            {available.map((r) => (
                                <ListGroup.Item
                                    key={r.id}
                                    action
                                    onClick={() => !loading && addRecipe(r)}
                                >
                                    {r.name}{" "}
                                    <span className="text-muted">
                                        ({r.steps && r.steps.length} {t("cooking.modal.steps")})
                                    </span>
                                </ListGroup.Item>
                            ))}
                            {available.length === 0 && (
                                <div className="text-muted text-center p-3">
                                    {t("cooking.modal.noResults")}
                                </div>
                            )}
                        </ListGroup>
                    </Col>

                    {/* Selected Recipes */}
                    <Col md={5}>
                        <h6>{t("cooking.modal.selectedTitle")}</h6>
                        <ListGroup style={{ maxHeight: "400px", overflowY: "auto" }}>
                            {selected.map((r) => (
                                <ListGroup.Item
                                    key={r.id}
                                    className="d-flex justify-content-between align-items-center"
                                >
                                    {r.name}
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => removeRecipe(r.id)}
                                        disabled={loading}
                                    >
                                        ✕
                                    </Button>
                                </ListGroup.Item>
                            ))}
                            {selected.length === 0 && (
                                <div className="text-muted text-center p-3">
                                    {t("cooking.modal.emptySelection")}
                                </div>
                            )}
                        </ListGroup>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose} disabled={loading}>
                    {t("cooking.modal.cancel")}
                </Button>
                <Button
                    variant="primary"
                    disabled={selected.length === 0 || loading}
                    onClick={handleCook}
                >
                    {loading && (
                        <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                        />
                    )}
                    {t("cooking.modal.cook")}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

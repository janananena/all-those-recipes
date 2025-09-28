import {useEffect, useRef, useState} from "react";
import {Button, Form, Modal} from "react-bootstrap";
import {useTranslation} from "react-i18next";
import type {Recipe} from "../types/Recipe.ts";

type Props = {
    show: boolean;
    onClose: () => void;
    selectedRecipes: Recipe[];
};

type StepState = {
    checked: boolean;
    note: string;
};

export const CookingStepsModal: React.FC<Props> = ({
                                                       show,
                                                       onClose,
                                                       selectedRecipes,
                                                   }) => {
    const {t} = useTranslation();
    const [stepsState, setStepsState] = useState<Record<string, StepState[]>>({});
    const [cols, setCols] = useState(3);
    const modalRef = useRef<HTMLDivElement>(null);

    // default col count when modal opens
    useEffect(() => {
        if (show) {
            const initialState: Record<string, StepState[]> = {};
            selectedRecipes.forEach((recipe) => {
                initialState[recipe.id] = (recipe.steps || []).map(() => ({
                    checked: false,
                    note: "",
                }));
            });
            setStepsState(initialState);

            if (selectedRecipes.length === 2) {
                setCols(2);
            } else if (selectedRecipes.length >= 3) {
                setCols(3);
            } else {
                setCols(1);
            }
        }
    }, [show, selectedRecipes]);

    const toggleStep = (recipeId: string, stepIndex: number) => {
        setStepsState((prev) => {
            const recipeSteps = prev[recipeId] || [];
            const newSteps = [...recipeSteps];
            newSteps[stepIndex] = {
                ...newSteps[stepIndex],
                checked: !newSteps[stepIndex].checked,
            };
            return {...prev, [recipeId]: newSteps};
        });
    };

    const updateNote = (recipeId: string, stepIndex: number, note: string) => {
        setStepsState((prev) => {
            const recipeSteps = prev[recipeId] || [];
            const newSteps = [...recipeSteps];
            newSteps[stepIndex] = {
                ...newSteps[stepIndex],
                note,
            };
            return {...prev, [recipeId]: newSteps};
        });
    };

    const handlePrint = () => {
        if (!modalRef.current) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
      <html>
        <head>
          <title>${t("cooking.printTitle")}</title>
          <style>
            @media print {
              @page { size: landscape; margin: 20mm; }
              body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; margin: 0; }
            }
            body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; margin: 20px; }
            h2 { text-align: center; margin-bottom: 20px; }
            .recipes {
              display: grid;
              grid-template-columns: repeat(${cols}, 1fr);
              gap: 12px;
            }
            .recipe {
              border: 1px solid #ccc;
              border-radius: 4px;
              padding: 8px;
              page-break-inside: avoid;
            }
            .recipe h3 {
              margin-top: 0;
              text-align: center;
              font-size: 11pt;
            }
            .step {
              display: flex;
              gap: 6px;
              margin-bottom: 6px;
            }
            .step input[type=checkbox] { flex-shrink: 0; }
            .note { flex: 0 0 30%; font-style: italic; color: #555; }
            .text { flex: 1; }
            .strike { text-decoration: line-through; color: #999; }
          </style>
        </head>
        <body>
          <h2>${t("cooking.printTitle")}</h2>
          <div class="recipes">
            ${selectedRecipes
            .map((r) => {
                const steps = stepsState[r.id] || [];
                return `
                  <div class="recipe">
                    <h3>${r.name}</h3>
                    ${r.steps
                    ?.map(
                        (step, idx) => `
                          <div class="step">
                            <input type="checkbox" ${
                            steps[idx]?.checked ? "checked" : ""
                        } disabled />
                            <div class="text ${
                            steps[idx]?.checked ? "strike" : ""
                        }">${step}</div>
                            ${
                            steps[idx]?.note
                                ? `<div class="note">${steps[idx]?.note}</div>`
                                : ""
                        }
                          </div>`
                    )
                    .join("")}
                  </div>`;
            })
            .join("")}
          </div>
        </body>
      </html>
    `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <Modal
            show={show}
            onHide={onClose}
            size="xl"
            backdrop="static"
            scrollable
            ref={modalRef}
            dialogClassName="modal-xxl"
        >
            <Modal.Header closeButton>
                <Modal.Title>{t("cooking.modal.title")}</Modal.Title>
                <div className="ms-3">
                    <Button
                        size="sm"
                        variant={cols === 2 ? "primary" : "outline-primary"}
                        onClick={() => setCols(2)}
                        className="me-1"
                    >
                        2
                    </Button>
                    <Button
                        size="sm"
                        variant={cols === 3 ? "primary" : "outline-primary"}
                        onClick={() => setCols(3)}
                        className="me-1"
                    >
                        3
                    </Button>
                    <Button
                        size="sm"
                        variant={cols === 4 ? "primary" : "outline-primary"}
                        onClick={() => setCols(4)}
                    >
                        4
                    </Button>
                </div>
            </Modal.Header>
            <Modal.Body>
                {selectedRecipes.length === 0 ? (
                    <p className="text-muted">{t("cooking.modal.noResults")}</p>
                ) : (
                    <div
                        className="cooking-steps-grid"
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${cols}, 1fr)`,
                            gap: "20px",
                        }}
                    >
                        {selectedRecipes.map((recipe) => {
                            const steps = recipe.steps || [];
                            return (
                                <div key={recipe.id} className="recipe-column">
                                    <h5 className="text-center">{recipe.name}</h5>
                                    {steps.map((step, idx) => {
                                        const state = stepsState[recipe.id]?.[idx];
                                        return (
                                            <div key={idx} className="step-row">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={state?.checked || false}
                                                    onChange={() => toggleStep(recipe.id, idx)}
                                                />
                                                <div className={`step-text ${state?.checked ? "strike" : ""}`}>
                                                    {step}
                                                </div>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2} // or 3 if you prefer
                                                    placeholder={t("cooking.modal.notePlaceholder")}
                                                    value={state?.note || ""}
                                                    onChange={(e) => updateNote(recipe.id, idx, e.target.value)}
                                                    className="note-field"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="success" onClick={handlePrint}>
                    {t("cooking.modal.print")}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

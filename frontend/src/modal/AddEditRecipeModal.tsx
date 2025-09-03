import {useContext, useEffect, useRef, useState} from "react";
import {Button, Col, Form, InputGroup, Modal, Row} from "react-bootstrap";
import {AxiosError} from "axios";
import {changeRecipe, createRecipe, uploadFile, uploadImage} from "../api/recipes.ts";
import type {ExtFile, IngredientGroup, NewRecipe, Recipe} from "../types/Recipe.ts";
import {RecipeContext} from "../context/RecipeContext.tsx";
import CreatableSelect from "react-select/creatable";
import type {ActionMeta, MultiValue} from "react-select";
import {createTag} from "../api/tag.ts";
import {useTranslation} from "react-i18next";

interface Props {
    show: boolean;
    onClose: () => void;
    addRecipe: (recipe: Recipe) => void;
    updateRecipe: (recipe: Recipe) => void;
    mode?: "add" | "edit";
    initialRecipe?: Recipe
}

export default function AddEditRecipeModal({show, onClose, addRecipe, updateRecipe, mode, initialRecipe}: Props) {
    const {tags, reloadTags} = useContext(RecipeContext);
    const [name, setName] = useState("");
    const [tagsRaw, setTagsRaw] = useState("");
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPath, setThumbnailPath] = useState("");
    const [initialRecipeFiles, setinitialRecipeFiles] = useState<File[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [fileObjects, setFileObjects] = useState<ExtFile[]>([]);
    const [steps, setSteps] = useState<string[]>([""]);
    const [links, setLinks] = useState<string[]>([""]);
    const [ingredients, setIngredients] = useState<IngredientGroup[]>([{group: "", items: [{name: "", amount: ""}]}]);

    const [submitting, setSubmitting] = useState(false);
    const {t} = useTranslation();

    const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

    const tagOptionIds = tagsRaw.split(",").map(t => t.trim());
    const selectedTagOptions = tags
        .filter(tag => tagOptionIds.some(value => value === tag.id))
        .map(tag => ({value: tag.id, label: tag.name}));
    const allTagOptions = tags.map(tag => ({value: tag.id, label: tag.name}));
    type SelectOptionType = { label: string, value: string };

    const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";

    async function handleMultiChange(newValue: MultiValue<SelectOptionType>, actionMeta: ActionMeta<SelectOptionType>) {
        if (["select-option", "deselect-option", "remove-value", "pop-value"].includes(actionMeta.action)) {
            setTagsRaw(newValue.map(v => v.value).join(","));
        } else if (actionMeta.action === "create-option") {
            newValue.filter(v => !tags.map(t => t.id).includes(v.value)).forEach(async v => {
                await createTag({id: v.value, name: v.label});
            });
            setTagsRaw(newValue.map(v => v.value).join(","));
            reloadTags().then();
        }
    }

    useEffect(() => {
        if (mode === "edit" && initialRecipe) {
            initializeFields(initialRecipe);
        } else if (mode === "add") {
            resetFields();
        }
    }, []);

    async function initializeFields(recipe: Recipe): Promise<void> {
        const recipeFiles = await urlsToFiles(recipe.files?.map(f => f.fileUrl) ?? []);
        setName(recipe.name);
        setTagsRaw(recipe.tags ? recipe.tags.join(",") : "");
        setThumbnail(null);
        setThumbnailPath(recipe.thumbnail ?? "");
        setFiles(recipeFiles);
        setinitialRecipeFiles(recipeFiles);
        setFileObjects(recipe.files ?? []);
        setSteps(recipe.steps ?? [""]);
        setIngredients(recipe.ingredients ?? [{group: "", items: [{name: "", amount: ""}]}]);
        setLinks(recipe.links ?? []);
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }

    function resetFields(): void {
        setName("");
        setTagsRaw("");
        setThumbnail(null);
        setThumbnailPath("");
        setFiles([]);
        setinitialRecipeFiles([]);
        setFileObjects([]);
        setSteps([""]);
        setIngredients([{group: "", items: [{name: "", amount: ""}]}]);
        setLinks([]);
    }

    function handleClose() {
        if (mode === "add") {
            resetFields();
        } else if (mode === "edit" && initialRecipe) {
            initializeFields(initialRecipe);
        }
        onClose();
    }

    function handleRemoveStep(index: number) {
        const updatedSteps = [...steps];
        if (steps.length > 1) {
            updatedSteps.splice(index, 1);
        } else {
            updatedSteps[0] = "";
        }
        setSteps(updatedSteps);
    }

    function handleRemoveIngredient(groupIndex: number, itemIndex: number) {
        const updated = [...ingredients];
        const items = updated[groupIndex].items;

        if (items.length > 1) {
            items.splice(itemIndex, 1);
        } else {
            items[0] = {name: "", amount: ""}; // Reset if only one item
        }

        setIngredients(updated);
    }

    function handleRemoveGroup(groupIndex: number) {
        if (ingredients.length > 1) {
            const updated = [...ingredients];
            updated.splice(groupIndex, 1);
            setIngredients(updated);
        } else {
            // Reset the only group
            setIngredients([{group: "", items: [{name: "", amount: ""}]}]);
        }
    }

    async function urlsToFiles(urls: string[]): Promise<File[]> {
        const files = await Promise.all(
            urls.map(async (url) => {
                const response = await fetch(`/${url}`);
                const blob = await response.blob();

                const filename = url.split('/').pop() || 'downloaded-file';
                const fileType = blob.type || 'application/octet-stream';

                return new File([blob], filename, {type: fileType});
            })
        );

        return files;
    }

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (thumbnail) setThumbnailPath(await uploadImage(thumbnail));
            for (const file of files) {
                if (!initialRecipeFiles.includes(file)) {
                    const res = await uploadFile(file);
                    setFileObjects([...fileObjects, {fileUrl: res}]);
                    // do not reupload
                    setinitialRecipeFiles(files);
                }
            }

            const normalizedLinks = links
                .map(link => link.trim())
                .filter(link => link !== "")
                .map(link =>
                    /^(https?:)?\/\//i.test(link) ? link : `https://${link}`
                );

            const newRecipe: NewRecipe = {
                ...initialRecipe,
                name,
                tags: tagsRaw.split(",").map(t => t.trim()).filter(Boolean),
                thumbnail: thumbnailPath,
                steps: steps,
                ingredients: ingredients,
                files: fileObjects.length ? fileObjects : undefined,
                links: normalizedLinks.length ? normalizedLinks : undefined,
            };

            if (mode === "edit" && initialRecipe?.id) {
                const recipeWithId = {...newRecipe, id: initialRecipe.id};
                const res = await changeRecipe(recipeWithId);
                updateRecipe(res);
                initializeFields(res);
                handleClose();
            } else {
                const res = await createRecipe(newRecipe);
                addRecipe(res);
                resetFields();
                handleClose();
            }
        } catch (error) {
            if (error instanceof AxiosError && error.response?.data) {
                console.error("Backend error response:", error.response.data);
                const backendErrors = error.response.data.errors;
                if (Array.isArray(backendErrors)) backendErrors.forEach((err) => console.error("Validation error: ", err));
            } else {
                console.error("Failed to add recipe, unknown error: ", error);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>{mode === "edit" ? t("recipe.modal.edit") : t("recipe.modal.add")}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Row>
                        <Col md={6}>
                            <Form.Group controlId="recipeName" className="mb-2">
                                <Form.Label>{t("recipes.name")}</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder={t("recipe.modal.addHint")}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group controlId="recipeThumbnail" className="mb-2">
                                <Form.Label>{t("recipe.modal.thumbnail")}</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type="file"
                                        onChange={(e) => {
                                            const input = e.target as HTMLInputElement;
                                            setThumbnail(input.files?.[0] ?? null)
                                        }}
                                        ref={thumbnailInputRef}
                                    />
                                    {thumbnail && (
                                        <Button variant="outline-danger"
                                                size="sm"
                                                onClick={() => {
                                                    setThumbnail(null);
                                                    thumbnailInputRef.current!.value = '';
                                                }}>
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    )}
                                </InputGroup>
                            </Form.Group>

                            <Form.Group controlId="recipeIngredients" className="mb-2">
                                <Form.Label>{t("recipe.ingredients")}</Form.Label>
                                {ingredients.map((group, gi) => (
                                    <div key={gi} className="border rounded p-2 mb-2">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <Form.Control
                                                className="mb-2"
                                                placeholder={t("recipe.modal.ingredientGroupHint")}
                                                value={group.group}
                                                onChange={(e) => {
                                                    const updated = [...ingredients];
                                                    updated[gi].group = e.target.value;
                                                    setIngredients(updated);
                                                }}
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                className="text-nowrap mb-2"
                                                onClick={() => handleRemoveGroup(gi)}
                                            >
                                                <i className="bi bi-trash"></i> Group
                                            </Button>
                                        </div>
                                        {group.items.map((item, ii) => (
                                            <div key={ii} className="d-flex gap-2 mb-1">
                                                <Form.Control
                                                    placeholder={t("recipe.modal.ingredientHint")}
                                                    value={item.name}
                                                    onChange={(e) => {
                                                        const updated = [...ingredients];
                                                        updated[gi].items[ii].name = e.target.value;
                                                        setIngredients(updated);
                                                    }}
                                                />
                                                <Form.Control
                                                    placeholder={t("recipe.modal.amountHint")}
                                                    value={item.amount}
                                                    onChange={(e) => {
                                                        const updated = [...ingredients];
                                                        updated[gi].items[ii].amount = e.target.value;
                                                        setIngredients(updated);
                                                    }}
                                                />
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => handleRemoveIngredient(gi, ii)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                const updated = [...ingredients];
                                                updated[gi].items.push({name: "", amount: ""});
                                                setIngredients(updated);
                                            }}
                                        >
                                            {t("recipe.modal.addIngredient")}
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() =>
                                        setIngredients([
                                            ...ingredients,
                                            {group: "", items: [{name: "", amount: ""}]},
                                        ])
                                    }
                                >
                                    {t("recipe.modal.addGroup")}
                                </Button>
                            </Form.Group>

                            <Form.Group controlId="recipeSteps" className="mb-2">
                                <Form.Label>{t("recipe.steps")}</Form.Label>
                                {steps.map((step, i) => (
                                    <div key={i} className="d-flex align-items-center gap-2 mb-2">
                                        <Form.Control
                                            key={i}
                                            className="mb-2"
                                            as="textarea"
                                            rows={2}
                                            placeholder={t("recipe.modal.stepsHint", {stepNo: i + 1})}
                                            value={step}
                                            onChange={(e) => {
                                                const updated = [...steps];
                                                updated[i] = e.target.value;
                                                setSteps(updated);
                                            }}
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => handleRemoveStep(i)}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setSteps([...steps, ""])}
                                >
                                    {t("recipe.modal.addStep")}
                                </Button>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group controlId="recipeTags" className="mb-2">
                                <Form.Label>{t("recipe.tags")}</Form.Label>
                                <CreatableSelect
                                    isMulti
                                    name="recipeTagsSelect"
                                    options={allTagOptions}
                                    value={selectedTagOptions}
                                    onChange={handleMultiChange}
                                    placeholder={t("recipe.modal.tagsHint")}
                                    classNamePrefix="react-select"
                                    theme={(theme) => ({
                                        ...theme,
                                        colors: {
                                            ...theme.colors,
                                            neutral0: isDark ? "#212529" : theme.colors.neutral0,
                                            neutral80: isDark ? "#f8f9fa" : theme.colors.neutral80,
                                            primary25: isDark ? "#343a40" : theme.colors.primary25,
                                            primary: "#0d6efd",
                                        },
                                    })}
                                    styles={{
                                        multiValue: (base) => ({
                                            ...base,
                                            backgroundColor: isDark ? "#495057" : base.backgroundColor,
                                        }),
                                        multiValueLabel: (base) => ({
                                            ...base,
                                            color: isDark ? "#f8f9fa" : base.color,
                                        }),
                                        multiValueRemove: (base) => ({
                                            ...base,
                                            color: isDark ? "#f8f9fa" : base.color,
                                            ':hover': {
                                                backgroundColor: isDark ? "#6c757d" : "#e9ecef",
                                                color: isDark ? "#ffffff" : "#212529",
                                            },
                                        }),
                                        control: (base, state) => ({
                                            ...base,
                                            backgroundColor: isDark ? "#212529" : base.backgroundColor,
                                            borderColor: isDark ? "#495057" : base.borderColor,
                                            boxShadow: state.isFocused
                                                ? isDark ? "0 0 0 0.2rem rgba(13,110,253,.25)" : base.boxShadow
                                                : "none",
                                            '&:hover': {
                                                borderColor: isDark ? "#adb5bd" : base.borderColor,
                                            },
                                        }),
                                    }}
                                />
                            </Form.Group>

                            <Form.Group controlId="recipeLinks" className="mb-2">
                                <Form.Label>{t("recipe.links")}</Form.Label>
                                {links.map((link, index) => (
                                    <div key={index} className="d-flex align-items-center gap-2 mb-2">
                                        <Form.Control
                                            type="url"
                                            placeholder="https://example.com"
                                            value={link}
                                            onChange={(e) => {
                                                const updated = [...links];
                                                updated[index] = e.target.value;
                                                setLinks(updated);
                                            }}
                                        />
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => {
                                                const updated = links.filter((_, i) => i !== index);
                                                setLinks(updated.length ? updated : [""]);
                                            }}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    </div>
                                ))}
                                {links.length === 0 && (
                                    <div/> // Spacer to push the button down
                                )}
                                <Button
                                    size="sm"
                                    className="mt-1"
                                    variant="secondary"
                                    onClick={() => setLinks([...links, ""])}
                                >
                                    {t("recipe.modal.addLink")}
                                </Button>
                            </Form.Group>

                            <Form.Group controlId="recipeFiles" className="mb-2">
                                <Form.Label>{t("recipe.files")}</Form.Label>
                                <Form.Control
                                    type="file"
                                    multiple
                                    onChange={(e) => {
                                        const input = e.target as HTMLInputElement;
                                        if (!input.files) return;
                                        const newFiles = Array.from(input.files);

                                        // Avoid duplicates based on name + size (can be adapted)
                                        const uniqueFiles = [
                                            ...files,
                                            ...newFiles.filter(
                                                (nf) => !files.some((f) => f.name === nf.name && f.size === nf.size)
                                            ),
                                        ];

                                        setFiles(uniqueFiles);
                                        // Reset input to allow re-selection of same file if removed
                                        e.target.value = '';
                                    }}
                                />

                                {/* Show selected files */}
                                <ul className="mt-2 list-unstyled">
                                    {files.map((file, index) => (
                                        <li key={index} className="d-flex align-items-center justify-content-between mb-1">
                                            <span>{file.name}</span>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => {
                                                    const updated = [...files];
                                                    updated.splice(index, 1);
                                                    setFiles(updated);
                                                }}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={submitting}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? t("recipe.modal.submitting") : t("recipe.modal.save")}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

import {useContext, useEffect, useRef, useState} from "react";
import {Button, Col, Form, InputGroup, Modal, Row} from "react-bootstrap";
import {AxiosError} from "axios";
import {changeRecipe, createRecipe, uploadFile, uploadImage} from "../api/recipes.ts";
import type {ExtFile, IngredientGroup, NewRecipe, Recipe} from "../types/Recipe.ts";
import {RecipeContext} from "../context/RecipeContext.tsx";
import CreatableSelect from "react-select/creatable";
import type {ActionMeta, GroupBase, SingleValue, MultiValue} from "react-select";
import {createTag} from "../api/tag.ts";
import {useTranslation} from "react-i18next";
import {BooksContext} from "../context/BooksContext.tsx";
import {createBook} from "../api/books.ts";
import {customStyles, customTheme, type SelectOptionType} from "../helper/reactSelectHelper.ts";

function sanitizeId(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, "-");
}

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
    const {books, reloadBooks, addNewBook} = useContext(BooksContext);
    const [name, setName] = useState("");
    const [book, setBook] = useState<string>("");
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

    const selectedBookOption = books.filter(b => b.id === book).map(b => ({value: b.id, label: b.name}))[0];
    const allBookOptions = books.map(book => ({value: book.id, label: book.name}));

    function handleChange(newValue: SingleValue<SelectOptionType>) {
        setBook(books.find(b => b.id === newValue?.value)?.id ?? "");
    }

    async function handleCreateOption(inputValue: string) {
        if (inputValue == null) {
            return;
        }
        const book = {name: inputValue, id: sanitizeId(inputValue)};
        const res = await createBook(book);
        addNewBook(res);
        setBook(res.id);
        reloadBooks().then();
    }

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
            initializeFields(initialRecipe).then();
        } else if (mode === "add") {
            resetFields();
        }
    }, [show, mode, initialRecipe]);

    async function initializeFields(recipe: Recipe): Promise<void> {
        const recipeFiles = await urlsToFiles(recipe.files?.map(f => f.fileUrl) ?? []);
        setName(recipe.name);
        setBook(recipe.book ?? "");
        setTagsRaw(recipe.tags ? recipe.tags.join(",") : "");
        setThumbnail(null);
        setThumbnailPath(recipe.thumbnail ?? "");
        setFiles(recipeFiles);
        setinitialRecipeFiles(recipeFiles);
        setFileObjects(recipe.files ?? []);
        setSteps(recipe.steps ?? []);
        setIngredients(recipe.ingredients ?? []);
        setLinks(recipe.links ?? []);
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }

    function resetFields(): void {
        setName("");
        setBook("");
        setTagsRaw("");
        setThumbnail(null);
        setThumbnailPath("");
        setFiles([]);
        setinitialRecipeFiles([]);
        setFileObjects([]);
        setSteps([]);
        setIngredients([]);
        setLinks([]);
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }

    function handleClose() {
        onClose();
    }

    function handleRemoveStep(index: number) {
        let updatedSteps = [...steps];
        if (steps.length > 1) {
            updatedSteps.splice(index, 1);
        } else {
            updatedSteps = [];
        }
        setSteps(updatedSteps);
    }

    function handleRemoveIngredient(groupIndex: number, itemIndex: number) {
        const updated = [...ingredients];
        let items = updated[groupIndex].items;

        if (items.length > 1) {
            items.splice(itemIndex, 1);
        } else {
            items = []; // Reset if only one item
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
            setIngredients([]);
        }
    }

    async function urlsToFiles(urls: string[]): Promise<File[]> {
        const files = await Promise.all(
            urls.map(async (url) => {
                const response = await fetch(`${url}`);
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
            let uploadedThumbnailPath = thumbnailPath;
            if (thumbnail) {
                uploadedThumbnailPath = await uploadImage(thumbnail);
                setThumbnailPath(uploadedThumbnailPath);
            }
            const uploadedFiles: ExtFile[] = [...fileObjects];
            for (const file of files) {
                if (!initialRecipeFiles.includes(file)) {
                    const res = await uploadFile(file);
                    uploadedFiles.push({fileUrl: res});

                }
            }
            setFileObjects(uploadedFiles);
            // do not reupload
            setinitialRecipeFiles(files);

            const normalizedLinks = links
                .map(link => link.trim())
                .filter(link => link !== "")
                .map(link =>
                    /^(https?:)?\/\//i.test(link) ? link : `https://${link}`
                );

            const normalizedIngredients = ingredients
                .map(group => ({
                    group: group.group ? group.group.trim() : "",
                    items: group.items.filter(item => item.name.trim() !== "")
                }))
                .filter(group => group.group !== "" || group.items.length > 0);

            const normalizedSteps = steps
                .map(s => s.trim())
                .filter(s => s !== "");

            const newRecipe: NewRecipe = {
                ...initialRecipe,
                name,
                tags: tagsRaw.split(",").map(t => t.trim()).filter(Boolean),
                thumbnail: uploadedThumbnailPath,
                steps: normalizedSteps.length ? normalizedSteps : undefined,
                ingredients: normalizedIngredients.length ? normalizedIngredients : undefined,
                files: uploadedFiles.length ? uploadedFiles : undefined,
                links: normalizedLinks.length ? normalizedLinks : undefined,
                book: book ?? undefined
            };

            if (mode === "edit" && initialRecipe?.id) {
                const recipeWithId = {...newRecipe, id: initialRecipe.id};
                const res = await changeRecipe(recipeWithId);
                updateRecipe(res);
                await initializeFields(res);
                handleClose();
            } else {
                const res = await createRecipe({...newRecipe, id: sanitizeId(name)});
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
                                        accept="image/*"
                                        onChange={(e) => {
                                            const input = e.target as HTMLInputElement;
                                            const file = input.files?.[0];

                                            if (file) {
                                                // Check MIME type
                                                if (!file.type.startsWith("image/")) {
                                                    alert("Please select a valid image file.");
                                                    input.value = ""; // reset the field
                                                    setThumbnail(null);
                                                    return;
                                                }

                                                // Optional: Check extension manually
                                                const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
                                                const lowerName = file.name.toLowerCase();
                                                if (!validExtensions.some(ext => lowerName.endsWith(ext))) {
                                                    alert("Only JPG, PNG, GIF, or WEBP files are allowed.");
                                                    input.value = "";
                                                    setThumbnail(null);
                                                    return;
                                                }
                                                setThumbnail(file);
                                            } else {
                                                setThumbnail(null);
                                            }
                                        }}
                                        ref={thumbnailInputRef}
                                    />
                                    {thumbnailPath && (
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

                            <Form.Group controlId="recipeBook" className="mb-2">
                                <Form.Label>{t('recipe.book')}</Form.Label>
                                <CreatableSelect<SelectOptionType, false, GroupBase<SelectOptionType>>
                                    isClearable
                                    name="recipeBookSelect"
                                    options={allBookOptions}
                                    value={selectedBookOption}
                                    onChange={handleChange}
                                    onCreateOption={handleCreateOption}
                                    placeholder={t("recipe.modal.bookHint")}
                                    classNamePrefix="react-select"
                                    theme={customTheme()}
                                    styles={customStyles(false)}
                                />
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
                                    theme={customTheme()}
                                    styles={customStyles(true)}
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

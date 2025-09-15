import {useContext, useEffect, useRef, useState} from 'react';
import {Button, Form, InputGroup, Modal} from 'react-bootstrap';
import Select, {type ActionMeta, type MultiValue} from 'react-select';
import {useTranslation} from 'react-i18next';
import type {Tag} from "../types/Tag.ts";
import {changeBook, createBook} from "../api/books.ts";
import {RecipeContext} from "../context/RecipeContext.tsx";
import {customStyles, customTheme, type SelectOptionType} from "../helper/reactSelectHelper.ts";
import type {Book} from "../types/Book.ts";
import {changeRecipe, uploadFile, uploadImage} from "../api/recipes.ts";
import type {ExtFile} from "../types/Recipe.ts";
import {AxiosError} from 'axios';

interface AddBookModalProps {
    show: boolean;
    closeModal: () => void;
    mode: "add" | "edit";
    initialBook?: Book;
    addBook: (tag: Tag) => void;
    updateBook: (tag: Tag) => void;
}

export default function AddEditBookModal({show, closeModal, mode, initialBook, addBook, updateBook}: AddBookModalProps) {
    const {recipes, updateRecipe} = useContext(RecipeContext);
    const [name, setName] = useState('');

    const [author, setAuthor] = useState('');
    const [links, setLinks] = useState<string[]>([]);
    const [bookRecipesIds, setBookRecipesIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
    const [thumbnailPath, setThumbnailPath] = useState("");

    const [initialBookFiles, setinitialBookFiles] = useState<File[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [fileObjects, setFileObjects] = useState<ExtFile[]>([]);

    const {t} = useTranslation();

    useEffect(() => {
        if (mode === "edit" && initialBook) {
            initializeFields(initialBook).then();
        } else if (mode === "add") {
            resetFields();
        }
    }, [show, mode, initialBook]);

    const selectedRecipeOptions = recipes
        .filter(recipe => bookRecipesIds.some(value => value === recipe.id))
        .map(recipe => ({value: recipe.id, label: recipe.name}));
    const allRecipeOptions = recipes
        .filter(recipe => recipe.book === undefined || recipe.book === initialBook?.id)
        .map(recipe => ({value: recipe.id, label: recipe.name}));

    const handleChangeRecipes = async (_newValue: MultiValue<SelectOptionType>, actionMeta: ActionMeta<SelectOptionType>) => {
        const id = initialBook?.id ?? name.trim().toLowerCase().replace(/\s+/g, '-');
        if (id === undefined || id === '') {
            return;
        }
        if (actionMeta.action === "select-option") {
            const newRecipeId = actionMeta?.option?.value;
            const selectedRecipe = recipes.find(r => r.id === newRecipeId);
            if (selectedRecipe === undefined || newRecipeId === undefined) {
                return;
            }
            const res = await changeRecipe({...selectedRecipe, book: id});
            updateRecipe(res);
            setBookRecipesIds([...bookRecipesIds, newRecipeId]);
        } else if (["deselect-option", "remove-value", "pop-value"].includes(actionMeta.action)) {
            const removedRecipeId = actionMeta?.removedValue?.value;
            const removedRecipe = recipes.find(r => r.id === removedRecipeId);
            if (removedRecipe === undefined || removedRecipeId === undefined) {
                return;
            }
            const res = await changeRecipe({...removedRecipe, book: undefined});
            updateRecipe(res);
            setBookRecipesIds(bookRecipesIds.filter(r => r !== removedRecipeId));
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
            if (!name.trim()) return;
            setSaving(true);
            try {
                let uploadedThumbnailPath = thumbnailPath;
                if (thumbnail) {
                    uploadedThumbnailPath = await uploadImage(thumbnail);
                    setThumbnailPath(uploadedThumbnailPath);
                }

                const uploadedFiles: ExtFile[] = [...fileObjects];
                for (const file of files) {
                    if (!initialBookFiles.includes(file)) {
                        const res = await uploadFile(file);
                        uploadedFiles.push({fileUrl: res});

                    }
                }
                setFileObjects(uploadedFiles);
                // do not reupload
                setinitialBookFiles(files);

                const normalizedLinks = links
                    .map(link => link.trim())
                    .filter(link => link !== "")
                    .map(link =>
                        /^(https?:)?\/\//i.test(link) ? link : `https://${link}`
                    );
                const newBook = {
                    name: name.trim() ?? '',
                    author: author.trim() ?? '',
                    links: normalizedLinks.length ? normalizedLinks : undefined,
                    thumbnail: uploadedThumbnailPath,
                    files: uploadedFiles.length ? uploadedFiles : undefined,
                }

                if (mode === "add") {
                    const newBook2 = await createBook({
                        ...newBook,
                        id: name.trim().toLowerCase().replace(/\s+/g, '-')
                    });
                    addBook(newBook2);
                    resetFields();
                    closeModal();
                } else if (mode === "edit" && initialBook?.id) {
                    const changedBook = await changeBook({
                        ...newBook,
                        id: initialBook.id
                    });
                    updateBook(changedBook);
                    await initializeFields(changedBook);
                    closeModal();
                }
            } catch (err) {
                if (err instanceof AxiosError && err.response?.data) {
                    console.error("Backend error response:", err.response.data);
                    const backendErrors = err.response.data.errors;
                    if (Array.isArray(backendErrors)) backendErrors.forEach((err) => console.error("Validation error: ", err));
                } else {
                    console.error('Failed to create book', err);
                }
            } finally {
                setSaving(false);
            }
        }
    ;

    const initializeFields = async (book: Book) => {
        const bookRecipes = recipes.filter((r) => r.book === book.id)
        const bookFiles = await urlsToFiles(book.files?.map(f => f.fileUrl) ?? []);
        setName(book.name);
        setAuthor(book.author ?? '');
        setLinks(book.links ?? []);
        setBookRecipesIds(bookRecipes.map(b => b.id));
        setThumbnail(null);
        setThumbnailPath(book.thumbnail ?? "");
        setFiles(bookFiles);
        setinitialBookFiles(bookFiles);
        setFileObjects(book.files ?? []);
    }

    const resetFields = () => {
        setName('');
        setAuthor('');
        setLinks([]);
        setBookRecipesIds([]);
        setThumbnail(null);
        setThumbnailPath('');
        setFiles([]);
        setinitialBookFiles([]);
        setFileObjects([]);
    }

    const handleCancel = () => {
        closeModal();
    }

    return (
        <Modal show={show} onHide={closeModal} centered>
            <Modal.Header closeButton>
                <Modal.Title>{mode === "edit" ? t("book.modal.edit") : t("book.modal.add")}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>{t('books.name')}</Form.Label>
                        <Form.Control
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>{t('books.author')}</Form.Label>
                        <Form.Control
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group controlId="bookThumbnail" className="mb-3">
                        <Form.Label>{t("book.modal.thumbnail")}</Form.Label>
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
                    <Form.Group controlId="bookRecipes" className="mb-3">
                        <Form.Label>{t("book.modal.recipes")}</Form.Label>
                        <Select isMulti
                                name="bookRecipes"
                                value={selectedRecipeOptions}
                                options={allRecipeOptions}
                                onChange={handleChangeRecipes}
                                placeholder={t("book.modal.recipesHint")}
                                theme={customTheme()}
                                styles={customStyles(true)}
                        />
                    </Form.Group>

                    <Form.Group controlId="bookLinks" className="mb-3">
                        <div>
                            <Form.Label>{t("book.modal.links")}</Form.Label>
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
                                            setLinks(updated.length ? updated : []);
                                        }}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            size="sm"
                            className="mt-1"
                            variant="secondary"
                            onClick={() => setLinks([...links, ""])}
                        >
                            {t("book.modal.addLink")}
                        </Button>
                    </Form.Group>

                    <Form.Group controlId="bookFiles" className="mb-2">
                        <Form.Label>{t("book.modal.files")}</Form.Label>
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
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                    {t('cancel')}
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={saving || !name.trim()}>
                    {saving ? t("book.modal.submitting") : t("book.modal.save")}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
import {useContext, useEffect, useRef, useState} from 'react';
import {Button, Form, InputGroup, Modal} from 'react-bootstrap';
import Select, {type ActionMeta, type MultiValue} from 'react-select';
import {useTranslation} from 'react-i18next';
import type {Tag} from "../types/Tag.ts";
import {changeBook, createBook} from "../api/books.ts";
import {RecipeContext} from "../context/RecipeContext.tsx";
import {customStyles, customTheme, type SelectOptionType} from "../helper/reactSelectHelper.ts";
import type {Book} from "../types/Book.ts";
import {changeRecipe, uploadImage} from "../api/recipes.ts";

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

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            let uploadedThumbnailPath = thumbnailPath;
            if (thumbnail) {
                uploadedThumbnailPath = await uploadImage(thumbnail);
                setThumbnailPath(uploadedThumbnailPath);
            }
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
            console.error('Failed to create book', err);
        } finally {
            setSaving(false);
        }
    };

    const initializeFields = async (book: Book) => {
        const bookRecipes = recipes.filter((r) => r.book === book.id)
        setName(book.name);
        setAuthor(book.author ?? '');
        setLinks(book.links ?? []);
        setBookRecipesIds(bookRecipes.map(b => b.id));
        setThumbnail(null);
        setThumbnailPath(book.thumbnail ?? "");
    }

    const resetFields = () => {
        setName('');
        setAuthor('');
        setLinks([]);
        setBookRecipesIds([]);
        setThumbnail(null);
        setThumbnailPath('');
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
                    <Form.Group controlId="bookThumbnail" className="mb-2">
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
                    <Form.Group controlId="bookLinks" className="mb-3">
                        <div>
                            <Form.Label>{t("book.links")}</Form.Label>
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

                    <Form.Group>
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
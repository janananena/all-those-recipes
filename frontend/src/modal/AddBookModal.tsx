import {useContext, useState} from 'react';
import {Button, Form, Modal} from 'react-bootstrap';
import Select, {type MultiValue} from 'react-select';
import {useTranslation} from 'react-i18next';
import type {Tag} from "../types/Tag.ts";
import {createBook} from "../api/books.ts";
import {RecipeContext} from "../context/RecipeContext.tsx";
import {customStyles, customTheme} from "../helper/reactSelectHelper.ts";

interface AddBookModalProps {
    show: boolean;
    closeModal: () => void;
    onAdded: (tag: Tag) => void;
}

export default function AddBookModal({show, closeModal, onAdded}: AddBookModalProps) {
    const {recipes} = useContext(RecipeContext);
    const {t} = useTranslation();

    const [name, setName] = useState('');
    const [author, setAuthor] = useState('');
    const [links, setLinks] = useState<string[]>([]);
    const [bookRecipes, setBookRecipes] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const selectedRecipeOptions = recipes
        .filter(recipe => bookRecipes.some(value => value === recipe.id))
        .map(recipe => ({value: recipe.id, label: recipe.name}));
    const allRecipeOptions = recipes.map(recipe => ({value: recipe.id, label: recipe.name}));

    type SelectOptionType = { label: string, value: string };
    const handleChangeRecipes = (newValue: MultiValue<SelectOptionType>) => {
        setBookRecipes(newValue.map(r => r.value));
    }

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const normalizedLinks = links
                .map(link => link.trim())
                .filter(link => link !== "")
                .map(link =>
                    /^(https?:)?\/\//i.test(link) ? link : `https://${link}`
                );

            const newBook = await createBook({
                id: name.trim().toLowerCase().replace(/\s+/g, '-'),
                name: name.trim(),
                author: author.trim(),
                links: normalizedLinks.length ? normalizedLinks : undefined,
            });
            onAdded(newBook);
            resetFields();
            closeModal();
        } catch (err) {
            console.error('Failed to create book', err);
        } finally {
            setSaving(false);
        }
    };

    const resetFields = () => {
        setName('');
        setAuthor('');
        setLinks([]);
        setBookRecipes([]);
    }

    const handleCancel = () => {
        resetFields();
        closeModal();
    }

    return (
        <Modal show={show} onHide={closeModal} centered>
            <Modal.Header closeButton>
                <Modal.Title>{t('books.addBook')}</Modal.Title>
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
                    {t('submit')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
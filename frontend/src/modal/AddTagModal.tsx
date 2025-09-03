import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { createTag } from '../api/tag.ts';
import type {Tag} from "../types/Tag.ts";

interface AddTagModalProps {
    show: boolean;
    closeModal: () => void;
    onAdded: (tag:Tag) => void;
}

export default function AddTagModal({ show, closeModal, onAdded }: AddTagModalProps) {
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [group, setGroup] = useState('');
    const [selectable, setSelectable] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const res = await createTag({
                id: name.trim().toLowerCase().replace(/\s+/g, '-'),
                name: name.trim(),
                group: group.trim() || undefined,
                selectable,
            });
            onAdded(res);
            resetFields();
            closeModal();
        } catch (err) {
            console.error('Failed to create tag', err);
        } finally {
            setSaving(false);
        }
    };

    const resetFields = () => {
        setName('');
        setGroup('');
        setSelectable(false);
    }

    return (
        <Modal show={show} onHide={closeModal} centered>
            <Modal.Header closeButton>
                <Modal.Title>{t('tags.addTag')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>{t('tags.name')}</Form.Label>
                        <Form.Control
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('tags.group')}</Form.Label>
                        <Form.Control
                            type="text"
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            label={t('tags.selectable')}
                            checked={selectable}
                            onChange={(e) => setSelectable(e.target.checked)}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal} disabled={saving}>
                    {t('cancel')}
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={saving || !name.trim()}>
                    {t('submit')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
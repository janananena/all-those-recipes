import {useContext, useEffect, useMemo, useState} from "react";
import {Button, Container, Form, Table} from "react-bootstrap";
import {RecipeContext} from "../context/RecipeContext";
import {changeTag, createTag} from "../api/tag";
import type {Tag} from "../types/Tag";
import {useTranslation} from "react-i18next";

function sanitizeId(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, "-");
}

interface TagRowProps {
    tag: Tag;
    onChange: () => void;
}

function TagRow({tag, onChange}: TagRowProps) {
    const [edit, setEdit] = useState(false);
    const [name, setName] = useState(tag.name);
    const [group, setGroup] = useState(tag.group || "");
    const [selectable, setSelectable] = useState(tag.selectable ?? false);
    const [onTop, setOntop] = useState(tag.onTop ?? false);
    const {t} = useTranslation();

    const handleSave = async () => {
        try {
            await changeTag({...tag, name, group: group || undefined, selectable, onTop});
            onChange();
            setEdit(false);
        } catch (err) {
            console.error("Failed to update tag:", err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        } else if (e.key === "Escape") {
            setName(tag.name);
            setGroup(tag.group || "");
            setSelectable(tag.selectable ?? false);
            setOntop(tag.onTop ?? false);
            setEdit(false);
        }
    };

    if (edit) {
        return (
            // Edit mode: stacked layout on mobile, table on md+
            <>
                <tr className="d-none d-md-table-row no-border">
                    <td style={{textAlign: 'left'}}>
                        <Form.Control
                            size="sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </td>
                    <td style={{minWidth: '160px'}}>
                        <Form.Control
                            size="sm"
                            placeholder={t("tags.group")}
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </td>
                    <td style={{width: '90px'}}>
                        <Form.Check
                            type="checkbox"
                            label={t("tags.mainTag")}
                            checked={selectable}
                            onChange={(e) => setSelectable(e.target.checked)}
                            onKeyDown={handleKeyDown}
                        />
                    </td>
                    <td style={{width: '90px'}}>
                        <Form.Check
                            type="checkbox"
                            label={t("tags.onTop")}
                            checked={onTop}
                            onChange={(e) => setOntop(e.target.checked)}
                            onKeyDown={handleKeyDown}
                        />
                    </td>
                    <td className="text-end">
                        <Button variant="outline-success" size="sm" onClick={handleSave}>
                            <i className="bi bi-check"/>
                        </Button>{' '}
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                                setEdit(false);
                                setName(tag.name);
                                setGroup(tag.group || "");
                                setSelectable(tag.selectable ?? false);
                            }}
                        >
                            <i className="bi bi-x"/>
                        </Button>
                    </td>
                </tr>
                <tr className="d-md-none">
                    <td colSpan={4} className="p-2">
                        <div className="d-flex flex-column gap-2">
                            <div className="d-flex gap-2">
                                <Form.Control
                                    size="sm"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                />
                                <Form.Control
                                    size="sm"
                                    placeholder={t("tags.group")}
                                    value={group}
                                    onChange={(e) => setGroup(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <Form.Check
                                    type="checkbox"
                                    label={t("tags.mainTag")}
                                    checked={selectable}
                                    onChange={(e) => setSelectable(e.target.checked)}
                                    onKeyDown={handleKeyDown}
                                />
                                <Form.Check
                                    type="checkbox"
                                    label={t("tags.onTop")}
                                    checked={onTop}
                                    onChange={(e) => setOntop(e.target.checked)}
                                    onKeyDown={handleKeyDown}
                                />
                                <div className="d-flex gap-1">
                                    <Button variant="outline-success" size="sm" onClick={handleSave}>
                                        <i className="bi bi-check"/>
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => {
                                            setEdit(false);
                                            setName(tag.name);
                                            setGroup(tag.group || "");
                                            setSelectable(tag.selectable ?? false);
                                        }}
                                    >
                                        <i className="bi bi-x"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            </>
        );
    } else {
        // not edit mode
        return (
            <>
                <tr className="no-border">
                    <td style={{textAlign: 'left'}}>
                        <strong className="text-muted">{tag.name}</strong>
                        <div className="d-md-none mt-1 small text-muted">
                            {tag.group ? (
                                <div className="text-muted">{tag.group}</div>
                            ) : (
                                <span className="text-muted">
                                <em>{t("tags.noGroup")}</em>
                            </span>
                            )}
                        </div>
                    </td>
                    <td style={{minWidth: '160px'}} className="d-none d-md-table-cell">
                        {tag.group ? (
                            <div className="text-muted">{tag.group}</div>
                        ) : (
                            <span className="text-muted">
                                <em>{t("tags.noGroup")}</em>
                            </span>
                        )}
                    </td>
                    <td style={{width: '90px'}}>
                        {selectable && <div style={{color: 'var(--my-blue)'}}>{t("tags.mainTag")}</div>}
                        {!selectable && (
                            <div/> // Spacer to push the button down
                        )}
                    </td>
                    <td style={{width: '90px'}}>
                        {onTop && <div style={{color: 'var(--my-blue)'}}>{t("tags.onTop")}</div>}
                        {!onTop && (
                            <div/> // Spacer to push the button down
                        )}
                        <Button variant="outline-secondary" className="d-md-none mt-1 small" size="sm" onClick={() => setEdit(true)}>
                            <i className="bi bi-pencil"/>
                        </Button>
                    </td>
                    <td className="text-end d-none d-md-table-cell">
                        <Button variant="outline-secondary" size="sm" onClick={() => setEdit(true)}>
                            <i className="bi bi-pencil"/>
                        </Button>
                    </td>
                </tr>
            </>
        );
    }
}

export default function AllTags() {
    const {tags, reloadTags} = useContext(RecipeContext);
    const [newTagInput, setNewTagInput] = useState("");
    const {t} = useTranslation();

    useEffect(() => {
        reloadTags().then();
    }, []);

    const groupedTags = useMemo(() => {
        const groups: Record<string, Tag[]> = {};
        const ungrouped: Tag[] = [];

        tags.forEach((tag) => {
            if (tag.group) {
                if (!groups[tag.group]) groups[tag.group] = [];
                groups[tag.group].push(tag);
            } else {
                ungrouped.push(tag);
            }
        });

        return {groups, ungrouped};
    }, [tags]);

    const handleAddTag = async () => {
        const trimmed = newTagInput.trim();
        if (!trimmed) return;

        const newTag = {
            id: sanitizeId(trimmed),
            name: trimmed,
            selectable: false,
        };

        try {
            await createTag(newTag);
            await reloadTags();
            setNewTagInput("");
        } catch (err) {
            console.error("Failed to add tag", err);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        }
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3 text-muted">
                <h2>All Tags</h2>
            </div>

            {/* Grouped Tags */}
            {Object.entries(groupedTags.groups).map(([group, tags]) => (
                <div key={group} className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3 text-muted">
                        <h5>{group}</h5>
                    </div>
                    <Table striped responsive size="sm" className="no-border text-nowrap">
                        <thead>
                        <th style={{width: "70%"}}/>
                        <th style={{width: "10%"}} className="d-none d-md-table-cell"/>
                        <th style={{width: "10%"}}/>
                        <th style={{width: "5%"}} className="d-none d-md-table-cell"/>
                        <th style={{width: "5%"}} className="d-none d-md-table-cell"/>
                        </thead>
                        <tbody>
                        {tags.map((tag) => (
                            <TagRow key={tag.id} tag={tag} onChange={reloadTags}/>
                        ))}
                        </tbody>
                    </Table>
                </div>
            ))}

            {/* Ungrouped Tags */}
            {groupedTags.ungrouped.length > 0 && (
                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3 text-muted">
                        <h5>No Group</h5>
                    </div>
                    <Table striped responsive size="sm" className="no-border text-nowrap">
                        <thead>
                        <th style={{width: "70%"}}/>
                        <th style={{width: "10%"}} className="d-none d-md-table-cell"/>
                        <th style={{width: "10%"}}/>
                        <th style={{width: "5%"}} className="d-none d-md-table-cell"/>
                        <th style={{width: "5%"}} className="d-none d-md-table-cell"/>
                        </thead>
                        <tbody>
                        {groupedTags.ungrouped.map((tag) => (
                            <TagRow key={tag.id} tag={tag} onChange={reloadTags}/>
                        ))}
                        </tbody>
                    </Table>
                </div>
            )}

            {/* Inline Add Form */}
            <Form className="mt-4">
                <Form.Group className="d-flex align-items-center gap-2">
                    <Form.Label className="mb-0" htmlFor="new-tag-input">
                        {t("tags.addTag")}
                    </Form.Label>
                    <Form.Control
                        id="new-tag-input"
                        type="text"
                        placeholder={t("tags.addTagHint")}
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        style={{maxWidth: '300px'}} // optional, to control input width
                    />
                </Form.Group>
            </Form>
        </Container>
    );
}
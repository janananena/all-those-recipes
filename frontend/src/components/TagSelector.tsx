import {Badge, Button, Stack} from 'react-bootstrap';
import type {SearchTag} from '../types/SearchTag';
import {useContext} from "react";
import {RecipeContext} from "../context/RecipeContext.tsx";
import {useTranslation} from "react-i18next";

type TagSelectorProps = {
    searchTags: SearchTag[];
    onSelect: (tag: SearchTag) => void;
    onClear: () => void;
};

const TagSelector = ({searchTags, onSelect, onClear}: TagSelectorProps) => {
    const {tags} = useContext(RecipeContext);
    const {t} = useTranslation();
    const selectableTags = tags.filter(tag => tag.selectable);

    // 🔹 Group tags by group name (excluding undefined)
    const groupNames = Array.from(
        new Set(tags.map(tag => tag.group).filter(Boolean))
    ) as string[];

    const getTagsByGroup = (group: string) =>
        tags.filter(tag => tag.group === group);

    return (
        <div className="mb-3">
            {/* 🔹 Group badges row */}
            {groupNames.length > 0 && (
                <Stack direction="horizontal" gap={2} className="flex-wrap mb-3">
                    {groupNames.map(group => (
                        <span
                            key={group}
                            className="badge custom-badge rounded-pill"
                            style={{cursor: 'pointer'}}
                            onClick={() => {
                                getTagsByGroup(group).forEach(tag =>
                                    onSelect({type: 'tag', value: tag.name})
                                );
                            }}
                        >
                            {group}
                        </span>
                    ))}
                    {searchTags.length > 0 && (
                        <div className="ms-auto">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={onClear}
                            >
                                {t("recipes.showAll")}
                            </Button>
                        </div>
                    )}
                </Stack>
            )}

            {/* 🔹 Tag badges row */}
            <Stack direction="horizontal" gap={2} className="flex-wrap align-items-center">
                {selectableTags.map(tag => (
                    <Badge
                        key={tag.id}
                        pill
                        bg="secondary"
                        style={{cursor: 'pointer'}}
                        onClick={() => onSelect({type: 'tag', value: tag.name})}
                    >
                        {tag.name}
                    </Badge>
                ))}
            </Stack>
        </div>
    );
};

export default TagSelector;

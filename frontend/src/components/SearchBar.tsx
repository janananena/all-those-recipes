import React, {useState} from 'react';
import {Badge, Button, CloseButton, Form, InputGroup, Stack} from 'react-bootstrap';
import type {SearchTag} from '../types/SearchTag';
import {useTranslation} from "react-i18next";

type SearchBarProps = {
    searchTags: SearchTag[];
    onAdd: (tag: SearchTag) => void;
    onRemove: (tag: SearchTag) => void;
};

const SearchBar = ({searchTags, onAdd, onRemove}: SearchBarProps) => {
    const [inputValue, setInputValue] = useState('');
    const {t} = useTranslation();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim() !== '') {
            const newTag: SearchTag = {type: 'text', value: inputValue.trim()};
            onAdd(newTag);
            setInputValue('');
        }
    };

    return (
        <Stack gap={2}>
            <InputGroup>
                <Form.Control
                    placeholder={t("recipes.searchHint")}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    name="recipe-search"
                    autoComplete="off"
                    readOnly
                    onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
                />
                <Button
                    variant="outline-secondary"
                    onClick={() => {
                        if (inputValue.trim() !== '') {
                            onAdd({type: 'text', value: inputValue.trim()});
                            setInputValue('');
                        }
                    }}
                >
                    Add
                </Button>
            </InputGroup>

            <div className="d-flex flex-wrap gap-2">
                {searchTags.map((tag) => (
                    <Badge
                        bg="secondary"
                        key={`${tag.type}-${tag.value}`}
                        className="d-flex align-items-center gap-1"
                        pill
                    >
                        {tag.value}
                        <CloseButton
                            onClick={() => onRemove(tag)}
                            variant="white"
                        />
                    </Badge>
                ))}
            </div>
        </Stack>
    );
};

export default SearchBar;

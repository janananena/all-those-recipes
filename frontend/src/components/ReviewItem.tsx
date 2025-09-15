import React, {useState} from 'react';
import Form from 'react-bootstrap/Form';
import UserRating from './UserRating';
import type {Review} from '../types/Recipe';
import {useTranslation} from 'react-i18next';

interface ReviewItemProps {
    review: Review;
    editable?: boolean;
    onChange?: (updated: Review) => void;
    displayLabel?: React.ReactNode;
}

const ReviewItem: React.FC<ReviewItemProps> = ({review, editable = false, onChange, displayLabel}) => {

    const {t} = useTranslation();

    const [comment, setComment] = useState(review.comment ?? '');

    const handleRate = (newScore: number | null) => {
        onChange?.({...review, score: newScore ?? undefined});
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newComment = e.target.value;
        setComment(newComment);
        onChange?.({...review, comment: newComment});
    };

    return (
        <div className="mb-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start mb-1 gap-1">
                {displayLabel ?? review.username}
                <UserRating
                    reviews={[review]}
                    username={review.username}
                    onRate={editable ? handleRate : undefined}
                />
            </div>

            {editable ? (
                <Form.Control
                    as="textarea"
                    className="text-muted"
                    rows={3}
                    placeholder={t("recipe.myComment")}
                    value={comment}
                    onChange={handleCommentChange}
                />
            ) : (
                review.comment?.trim() && <div>{review.comment}</div>
            )}
        </div>
    );
};

export default ReviewItem;

import React from 'react';
import ReviewItem from './ReviewItem';
import type { Review } from '../types/Recipe';

interface ReviewListProps {
    reviews: Review[];
    username: string;
    onUpdate: (updated: Review) => void;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, username, onUpdate }) => {
    const myReview: Review = reviews.find(r => r.username === username) ?? {
        username,
        score: undefined,
        comment: ''
    };

    const others = reviews
        .filter(r => r.username !== username)
        .filter(r => r.score || (r.comment && r.comment.trim() !== ''));

    return (
        <div className="mt-4">
            <ReviewItem review={myReview} editable onChange={onUpdate} />
            {others.map((review) => (
                <ReviewItem key={review.username} review={review} />
            ))}
        </div>
    );
};

export default ReviewList;

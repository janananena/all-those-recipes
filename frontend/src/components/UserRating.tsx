import React from 'react';
import Rating from 'react-rating';
import type {ReviewEntry} from './AverageRating';

interface UserRatingProps {
    reviews: ReviewEntry[];
    username: string;
    onRate?: (score: number | null) => void;
}

const UserRating: React.FC<UserRatingProps> = ({reviews, username, onRate}) => {
    const userRating = reviews.find(r => r.username === username)?.score || 0;

    if (!onRate && userRating === 0) return null;

    const handleChange = (newValue: number) => {
        if (onRate) {
            if (newValue === userRating) {
                onRate(null); // Toggle off to remove
            } else {
                onRate(newValue);
            }
        }
    };

    return (
        <div className="d-inline-flex align-items-center gap-1 flex-nowrap">
            <Rating
                initialRating={userRating}
                readonly={!onRate}
                onChange={handleChange}
                fractions={2}
                emptySymbol={<i className="bi bi-star fs-6" style={{ color: 'var(--my-blue)'}}/>}
                fullSymbol={<i className="bi bi-star-fill fs-6" style={{ color: 'var(--my-blue)'}}/>}
                placeholderSymbol={<i className="bi bi-star-half fs-6" style={{ color: 'var(--my-blue)'}}/>}
            />
            {onRate && userRating > 0 && (
                <i
                    className="bi bi-x-circle text-danger fs-6"
                    role="button"
                    title="Remove rating"
                    onClick={() => onRate(null)}
                />
            )}
        </div>
    );
};

export default UserRating;

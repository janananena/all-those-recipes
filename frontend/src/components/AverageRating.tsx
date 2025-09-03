import React from 'react';
import Rating from "react-rating";

export interface ReviewEntry {
    username: string;
    score?: number;
    comment?: string;
}

interface AverageRatingProps {
    reviews: ReviewEntry[];
}

const AverageRating: React.FC<AverageRatingProps> = ({reviews}) => {
    if (!reviews || reviews.length === 0) return <span className="text-muted">No rating</span>;
    const avg = reviews.reduce((sum, r) => sum + (r.score ?? 0), 0) / reviews.length;

    return (
        <div className="d-inline-flex align-items-center gap-1 flex-nowrap">
            <Rating
                readonly
                initialRating={avg}
                fractions={2}
                emptySymbol={<i className="bi bi-star fs-6" style={{ color: '#d4af37'}}/>}
                fullSymbol={<i className="bi bi-star-fill fs-6" style={{ color: '#d4af37'}}/>}
                placeholderSymbol={<i className="bi bi-star-half fs-6" style={{ color: '#d4af37'}}/>}
            />
        </div>
    );
};

export default AverageRating;
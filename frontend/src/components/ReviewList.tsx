import React from 'react';
import ReviewItem from './ReviewItem';
import type { Review } from '../types/Recipe';
import {Card, Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface ReviewListProps {
    reviews: Review[];
    username: string;
    onUpdate: (updated: Review) => void;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, username, onUpdate }) => {
    const {t} = useTranslation();

    const myReview: Review = reviews.find(r => r.username === username) ?? {
        username,
        score: undefined,
        comment: ''
    };

    const others = reviews
        .filter(r => r.username !== username)
        .filter(r => r.score || (r.comment && r.comment.trim() !== ''));

    return (
        <Row>
            <Card.Subtitle className="text-start mb-2">{t("review.headline")}</Card.Subtitle>
            <Col>
                <ReviewItem review={myReview} editable onChange={onUpdate} />
            </Col>
            {others.length > 0 && (
                <Col>
                    {others.map((review) => (
                        <ReviewItem key={review.username} review={review} />
                    ))}
                </Col>
            )}
        </Row>
    );
};

export default ReviewList;

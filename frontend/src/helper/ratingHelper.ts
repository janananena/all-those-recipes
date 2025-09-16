import type {ReviewEntry} from "../components/AverageRating.tsx";
import type {Review} from "../types/Recipe.ts";

export const calculateAverageScore = (reviews: ReviewEntry[]): number => {
    if (!reviews || reviews.length === 0) {
        return 0;
    }
    return reviews.reduce((sum, r) => sum + (r.score ?? 0), 0) / reviews.length;
}

export const getScore = (username: string, reviews: ReviewEntry[]): number => {
    if (!username || username === '' || !reviews || reviews.length === 0) {
        return 0;
    }
    return reviews.find(r => r.username === username)?.score || 0;
}

type Reviewable = { reviews?: Review[] };

export const sortByAverage = <T extends Reviewable>(recipes: T[], direction: "asc" | "desc"): T[] => {
    return [...recipes].sort((a, b) => {
        const valA = calculateAverageScore(a.reviews ?? []);
        const valB = calculateAverageScore(b.reviews ?? []);

        if (valA < valB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return direction === "asc" ? 1 : -1;
        }
        return 0;
    });
}

export const sortByUserRating = <T extends Reviewable>(recipes: T[], username: string, direction: "asc" | "desc"): T[] => {
    return [...recipes].sort((a, b) => {
        const valA = getScore(username ?? '', a.reviews ?? []);
        const valB = getScore(username ?? '', b.reviews ?? []);

        if (valA < valB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return direction === "asc" ? 1 : -1;
        }
        return 0;
    });
}
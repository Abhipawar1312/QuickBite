export interface ReviewUser {
    _id: string;
    fullname: string;
    email: string;
    profilePicture?: string;
}

export interface Review {
    _id: string;
    user: ReviewUser;
    restaurant: string;
    order: string;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
}

export type ReviewState = {
    loading: boolean;
    reviews: Review[];
    createReview: (orderId: string, rating: number, comment: string) => Promise<{ success: boolean; review?: Review }>;
    getRestaurantReviews: (restaurantId: string) => Promise<void>;
    addLocalReview: (review: Review) => void;
};

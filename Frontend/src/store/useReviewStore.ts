import { ReviewState, Review } from "@/types/reviewType";
import axios from "axios";
import { toast } from "sonner";
import { create } from "zustand";

// const API_END_POINT = "http://localhost:8000/api/v1/review";
const API_END_POINT = "https://quickbite-ogw0.onrender.com/api/v1/review";
axios.defaults.withCredentials = true;

export const useReviewStore = create<ReviewState>((set) => ({
    loading: false,
    reviews: [],

    createReview: async (orderId: string, rating: number, comment: string) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/`, { orderId, rating, comment }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                toast.success(response.data.message || "Review submitted!");
                const review = response.data.review;
                set((state) => ({
                    reviews: [review, ...state.reviews],
                    loading: false
                }));
                return { success: true, review };
            }
            set({ loading: false });
            return { success: false };
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Failed to submit review";
            toast.error(errorMsg);
            set({ loading: false });
            return { success: false };
        }
    },

    getRestaurantReviews: async (restaurantId: string) => {
        try {
            set({ loading: true });
            const response = await axios.get(`${API_END_POINT}/restaurant/${restaurantId}`);
            if (response.data.success) {
                set({ reviews: response.data.reviews, loading: false });
            } else {
                set({ loading: false });
            }
        } catch (error) {
            set({ loading: false });
        }
    },

    addLocalReview: (review: Review) => {
        set((state) => {
            // Avoid adding duplicates if socket and HTTP response fire at similar times
            if (state.reviews.some((r) => r._id === review._id)) {
                return state;
            }
            return { reviews: [review, ...state.reviews] };
        });
    }
}));

import { create } from "zustand";
import axios from "axios";
import { Restaurant, MenuItem } from "@/types/restaurantType";
import { API_END_POINTS } from "@/config/api";

const API_END_POINT = API_END_POINTS.RECOMMENDATION;
axios.defaults.withCredentials = true;

interface RecommendationState {
  frequentlyPairedItems: MenuItem[];
  trendingRestaurants: Restaurant[];
  trendingDishes: MenuItem[];
  personalizedRestaurants: Restaurant[];
  personalizedDishes: MenuItem[];
  favoriteCuisines: string[];
  loadingPaired: boolean;
  loadingTrending: boolean;
  loadingPersonalized: boolean;
  fetchFrequentlyPaired: (menuId?: string, restaurantId?: string, excludeIds?: string[]) => Promise<void>;
  fetchTrending: (city?: string) => Promise<void>;
  fetchPersonalized: () => Promise<void>;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  frequentlyPairedItems: [],
  trendingRestaurants: [],
  trendingDishes: [],
  personalizedRestaurants: [],
  personalizedDishes: [],
  favoriteCuisines: [],
  loadingPaired: false,
  loadingTrending: false,
  loadingPersonalized: false,

  fetchFrequentlyPaired: async (menuId?: string, restaurantId?: string, excludeIds?: string[]) => {
    try {
      set({ loadingPaired: true });
      const params: any = {};
      if (menuId) params.menuId = menuId;
      if (restaurantId) params.restaurantId = restaurantId;
      if (excludeIds && excludeIds.length > 0) params.excludeIds = excludeIds.join(",");

      const response = await axios.get(`${API_END_POINT}/frequently-paired`, { params });
      if (response.data.success) {
        set({ frequentlyPairedItems: response.data.pairedItems || [], loadingPaired: false });
      }
    } catch (error) {
      console.error("fetchFrequentlyPaired error:", error);
      set({ loadingPaired: false });
    }
  },


  fetchTrending: async (city?: string) => {
    try {
      set({ loadingTrending: true });
      const response = await axios.get(`${API_END_POINT}/trending`, {
        params: city ? { city } : {},
      });
      if (response.data.success) {
        set({
          trendingRestaurants: response.data.trending?.restaurants || [],
          trendingDishes: response.data.trending?.dishes || [],
          loadingTrending: false,
        });
      }
    } catch (error) {
      console.error("fetchTrending error:", error);
      set({ loadingTrending: false });
    }
  },

  fetchPersonalized: async () => {
    try {
      set({ loadingPersonalized: true });
      const response = await axios.get(`${API_END_POINT}/personalized`);
      if (response.data.success) {
        set({
          personalizedRestaurants: response.data.recommendations?.restaurants || [],
          personalizedDishes: response.data.recommendations?.dishes || [],
          favoriteCuisines: response.data.recommendations?.favoriteCuisines || [],
          loadingPersonalized: false,
        });
      }
    } catch (error) {
      console.error("fetchPersonalized error:", error);
      set({ loadingPersonalized: false });
    }
  },
}));

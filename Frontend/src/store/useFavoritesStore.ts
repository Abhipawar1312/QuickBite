import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import axios from "axios";
import { toast } from "sonner";
import { Restaurant, MenuItem } from "@/types/restaurantType";
import { API_END_POINTS } from "@/config/api";

const API_END_POINT = API_END_POINTS.USER;
axios.defaults.withCredentials = true;

interface FavoritesState {
  favoriteRestaurants: Restaurant[];
  favoriteMenus: MenuItem[];
  favoriteRestaurantIds: string[];
  favoriteMenuIds: string[];
  loading: boolean;
  fetchFavorites: () => Promise<void>;
  toggleFavoriteRestaurant: (restaurant: Restaurant) => Promise<void>;
  toggleFavoriteMenu: (menu: MenuItem) => Promise<void>;
  isRestaurantFavorite: (restaurantId: string) => boolean;
  isMenuFavorite: (menuId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteRestaurants: [],
      favoriteMenus: [],
      favoriteRestaurantIds: [],
      favoriteMenuIds: [],
      loading: false,

      fetchFavorites: async () => {
        try {
          set({ loading: true });
          const response = await axios.get(`${API_END_POINT}/favorites`);
          if (response.data.success) {
            const favs = response.data.favorites;
            const restaurants = favs.restaurants || [];
            const menus = favs.menus || [];
            set({
              favoriteRestaurants: restaurants,
              favoriteMenus: menus,
              favoriteRestaurantIds: restaurants.map((r: any) => r._id),
              favoriteMenuIds: menus.map((m: any) => m._id),
              loading: false,
            });
          }
        } catch (error) {
          console.error("fetchFavorites error:", error);
          set({ loading: false });
        }
      },

      toggleFavoriteRestaurant: async (restaurant: Restaurant) => {
        const { favoriteRestaurantIds, favoriteRestaurants } = get();
        const exists = favoriteRestaurantIds.includes(restaurant._id);

        // Optimistic update
        if (exists) {
          set({
            favoriteRestaurantIds: favoriteRestaurantIds.filter((id) => id !== restaurant._id),
            favoriteRestaurants: favoriteRestaurants.filter((r) => r._id !== restaurant._id),
          });
        } else {
          set({
            favoriteRestaurantIds: [...favoriteRestaurantIds, restaurant._id],
            favoriteRestaurants: [...favoriteRestaurants, restaurant],
          });
        }

        try {
          const response = await axios.post(`${API_END_POINT}/favorites/restaurant/${restaurant._id}`);
          if (response.data.success) {
            toast.success(response.data.message);
          }
        } catch (error: any) {
          // Rollback on error
          set({ favoriteRestaurantIds, favoriteRestaurants });
          toast.error(error.response?.data?.message || "Failed to update favorite");
        }
      },

      toggleFavoriteMenu: async (menu: MenuItem) => {
        const { favoriteMenuIds, favoriteMenus } = get();
        const exists = favoriteMenuIds.includes(menu._id);

        // Optimistic update
        if (exists) {
          set({
            favoriteMenuIds: favoriteMenuIds.filter((id) => id !== menu._id),
            favoriteMenus: favoriteMenus.filter((m) => m._id !== menu._id),
          });
        } else {
          set({
            favoriteMenuIds: [...favoriteMenuIds, menu._id],
            favoriteMenus: [...favoriteMenus, menu],
          });
        }

        try {
          const response = await axios.post(`${API_END_POINT}/favorites/menu/${menu._id}`);
          if (response.data.success) {
            toast.success(response.data.message);
          }
        } catch (error: any) {
          // Rollback on error
          set({ favoriteMenuIds, favoriteMenus });
          toast.error(error.response?.data?.message || "Failed to update favorite");
        }
      },

      isRestaurantFavorite: (restaurantId: string) => {
        return get().favoriteRestaurantIds.includes(restaurantId);
      },

      isMenuFavorite: (menuId: string) => {
        return get().favoriteMenuIds.includes(menuId);
      },
    }),
    {
      name: "quickbite-favorites",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favoriteRestaurantIds: state.favoriteRestaurantIds,
        favoriteMenuIds: state.favoriteMenuIds,
        favoriteRestaurants: state.favoriteRestaurants,
        favoriteMenus: state.favoriteMenus,
      }),
    }
  )
);

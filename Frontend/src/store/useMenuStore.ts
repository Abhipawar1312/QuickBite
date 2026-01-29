import axios from "axios";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useRestaurantStore } from "./useRestaurantStore";

// const API_END_POINT = "http://localhost:8000/api/v1/menu";
const API_END_POINT = "https://quickbite-ogw0.onrender.com/api/v1/menu";
axios.defaults.withCredentials = true;

type MenuState = {
    loading: boolean,
    menu: null,
    clearMenuData: () => void; // Add this method
    createMenu: (formData: FormData) => Promise<void>;
    editMenu: (menuId: string, formData: FormData) => Promise<void>;
    deleteMenu: (menuId: string) => Promise<void>;
    toggleMenuAvailability: (menuId: string, availability: 'Available' | 'Out of Stock') => Promise<void>;
}

export const useMenuStore = create<MenuState>()(persist((set) => ({
    loading: false,
    menu: null,

    // Add method to clear menu data
    clearMenuData: () => {
        set({
            loading: false,
            menu: null,
        });
    },

    createMenu: async (formData: FormData) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false, menu: response.data.menu });
            }
            // update restaurant 
            useRestaurantStore.getState().addMenuToRestaurant(response.data.menu);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create menu");
            set({ loading: false });
        }
    },

    editMenu: async (menuId: string, formData: FormData) => {
        try {
            set({ loading: true });
            const response = await axios.put(`${API_END_POINT}/${menuId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false, menu: response.data.menu });
            }
            // update restaurant menu
            useRestaurantStore.getState().updateMenuToRestaurant(response.data.menu);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update menu");
            set({ loading: false });
        }
    },

    deleteMenu: async (menuId: string) => {
        try {
            set({ loading: true });
            const response = await axios.delete(`${API_END_POINT}/${menuId}`);
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
                // Remove menu from restaurant
                useRestaurantStore.getState().removeMenuFromRestaurant(menuId);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete menu");
            set({ loading: false });
        }
    },

    toggleMenuAvailability: async (menuId: string, availability: 'Available' | 'Out of Stock') => {
        try {
            // Optimistic update for better UX
            useRestaurantStore.getState().updateMenuAvailability(menuId, availability);

            const response = await axios.patch(`${API_END_POINT}/${menuId}/availability`, {
                availability
            });

            if (response.data.success) {
                toast.success(`Menu ${availability === 'Available' ? 'marked as available' : 'marked as out of stock'}`);
                // Update with server response to ensure consistency
                useRestaurantStore.getState().updateMenuToRestaurant(response.data.menu);
            }
        } catch (error: any) {
            // Revert optimistic update on error
            const revertedAvailability = availability === 'Available' ? 'Out of Stock' : 'Available';
            useRestaurantStore.getState().updateMenuAvailability(menuId, revertedAvailability);
            toast.error(error.response?.data?.message || "Failed to update menu availability");
        }
    },

}), {
    name: "menu-name",
    storage: createJSONStorage(() => localStorage)
}))
import { MenuItem, RestaurantState } from '@/types/restaurantType';
import axios from 'axios';
import { toast } from 'sonner';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// const API_END_POINT = "http://localhost:8000/api/v1/restaurant";
const API_END_POINT = "https://quickbite-ogw0.onrender.com/api/v1/restaurant";
axios.defaults.withCredentials = true;

export const useRestaurantStore = create<RestaurantState>()(persist((set, get) => ({
    loading: false,
    restaurant: null,
    searchedRestaurant: null,
    appliedFilter: [],
    singleRestaurant: null,
    restaurantOrder: [],

    // Add method to clear all data
    clearRestaurantData: () => {
        set({
            loading: false,
            restaurant: null,
            searchedRestaurant: null,
            appliedFilter: [],
            singleRestaurant: null,
            restaurantOrder: [],
        });
    },

    createRestaurant: async (formData: FormData) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false, restaurant: response.data.restaurant });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create restaurant');
            set({ loading: false });
        }
    },

    getRestaurant: async () => {
        try {
            set({ loading: true });
            const response = await axios.get(`${API_END_POINT}/`);
            if (response.data.success) {
                set({ loading: false, restaurant: response.data.restaurant });
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                set({ restaurant: null });
            }
            set({ loading: false });
        }
    },

    updateRestaurant: async (formData: FormData) => {
        try {
            set({ loading: true });
            const response = await axios.put(`${API_END_POINT}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false, restaurant: response.data.restaurant });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update restaurant');
            set({ loading: false });
        }
    },

    searchRestaurant: async (searchText: string, searchQuery: string, selectedCuisines: any) => {
        try {
            set({ loading: true });

            const params = new URLSearchParams();
            params.set("searchQuery", searchQuery);
            params.set("selectedCuisines", selectedCuisines.join(","));

            const response = await axios.get(`${API_END_POINT}/search/${searchText}?${params.toString()}`);
            if (response.data.success) {
                set({ loading: false, searchedRestaurant: response.data });
            }
        } catch (error) {
            set({ loading: false });
        }
    },

    addMenuToRestaurant: (menu: MenuItem) => {
        set((state: any) => ({
            restaurant: state.restaurant ? {
                ...state.restaurant,
                menus: [...state.restaurant.menus, menu]
            } : null,
        }))
    },

    updateMenuToRestaurant: (updatedMenu: MenuItem) => {
        set((state: any) => {
            if (state.restaurant) {
                const updatedMenuList = state.restaurant.menus.map((menu: any) =>
                    menu._id === updatedMenu._id ? updatedMenu : menu
                );
                return {
                    restaurant: {
                        ...state.restaurant,
                        menus: updatedMenuList
                    }
                }
            }
            return state;
        })
    },

    removeMenuFromRestaurant: (menuId: string) => {
        set((state: any) => {
            if (state.restaurant) {
                const updatedMenuList = state.restaurant.menus.filter((menu: any) =>
                    menu._id !== menuId
                );
                return {
                    restaurant: {
                        ...state.restaurant,
                        menus: updatedMenuList
                    }
                }
            }
            return state;
        })
    },

    updateMenuAvailability: (menuId: string, availability: 'Available' | 'Out of Stock') => {
        set((state: any) => {
            if (state.restaurant) {
                const updatedMenuList = state.restaurant.menus.map((menu: any) =>
                    menu._id === menuId ? { ...menu, availability } : menu
                );
                return {
                    restaurant: {
                        ...state.restaurant,
                        menus: updatedMenuList
                    }
                }
            }
            return state;
        })
    },

    setAppliedFilter: (value: string) => {
        set((state) => {
            const isAlreadyApplied = state.appliedFilter.includes(value);
            const updatedFilter = isAlreadyApplied
                ? state.appliedFilter.filter((item) => item !== value)
                : [...state.appliedFilter, value];
            return { appliedFilter: updatedFilter }
        })
    },

    resetAppliedFilter: () => {
        set({ appliedFilter: [] })
    },

    getSingleRestaurant: async (restaurantId: string) => {
        try {
            const response = await axios.get(`${API_END_POINT}/${restaurantId}`);
            if (response.data.success) {
                set({ singleRestaurant: response.data.restaurant })
            }
        } catch (error) {
            console.log(error);
        }
    },

    getRestaurantOrders: async () => {
        try {
            const response = await axios.get(`${API_END_POINT}/order`);
            if (response.data.success) {
                set({ restaurantOrder: response.data.orders });
            }
        } catch (error) {
            console.log(error);
        }
    },

    updateRestaurantOrder: async (orderId: string, status: string) => {
        try {
            const response = await axios.put(`${API_END_POINT}/order/${orderId}/status`, { status }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                const updatedOrder = get().restaurantOrder.map((order: any) => {
                    return order._id === orderId ? { ...order, status: response.data.status } : order;
                })
                set({ restaurantOrder: updatedOrder });
                toast.success(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update order status');
        }
    },
    updateLocalRestaurantOrder: (updatedOrder: any) => {
        const updatedList = get().restaurantOrder.map((order: any) => {
            return order._id === updatedOrder._id ? updatedOrder : order;
        });
        set({ restaurantOrder: updatedList });
    },
    addLocalRestaurantOrder: (newOrder: any) => {
        set((state) => {
            const exists = state.restaurantOrder.some((order: any) => order._id === newOrder._id);
            if (exists) {
                return {
                    restaurantOrder: state.restaurantOrder.map((order: any) =>
                        order._id === newOrder._id ? newOrder : order
                    )
                };
            }
            return {
                restaurantOrder: [newOrder, ...state.restaurantOrder]
            };
        });
    },
    updateSingleRestaurantMenu: (data: { action: "add" | "edit" | "delete", menu?: MenuItem, menuId?: string }) => {
        set((state: any) => {
            if (!state.singleRestaurant) return state;
            let updatedMenus = [...state.singleRestaurant.menus];

            if (data.action === "add" && data.menu) {
                if (!updatedMenus.some(m => m._id === data.menu!._id)) {
                    updatedMenus = [data.menu, ...updatedMenus];
                }
            } else if (data.action === "edit" && data.menu) {
                updatedMenus = updatedMenus.map(m => m._id === data.menu!._id ? data.menu! : m);
            } else if (data.action === "delete" && data.menuId) {
                updatedMenus = updatedMenus.filter(m => m._id !== data.menuId);
            }

            return {
                singleRestaurant: {
                    ...state.singleRestaurant,
                    menus: updatedMenus
                }
            };
        });
    },
    updateSingleRestaurantRatings: (averageRating: number, numReviews: number) => {
        set((state: any) => {
            if (!state.singleRestaurant) return state;
            return {
                singleRestaurant: {
                    ...state.singleRestaurant,
                    averageRating,
                    numReviews
                }
            };
        });
    },
    toggleRestaurantStatus: async () => {
        try {
            set({ loading: true });
            const response = await axios.put(`${API_END_POINT}/status`);
            if (response.data.success) {
                toast.success(response.data.message);
                set((state: any) => ({
                    restaurant: state.restaurant ? { ...state.restaurant, isOpen: response.data.isOpen } : null,
                    loading: false
                }));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to toggle status');
            set({ loading: false });
        }
    },
    getAllRestaurantsAdmin: async () => {
        try {
            set({ loading: true });
            const response = await axios.get(`${API_END_POINT}/admin/all`);
            set({ loading: false });
            return response.data.restaurants;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch admin restaurants');
            set({ loading: false });
            return [];
        }
    },
    verifyRestaurantAdmin: async (restaurantId: string) => {
        try {
            set({ loading: true });
            const response = await axios.put(`${API_END_POINT}/admin/${restaurantId}/verify`);
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to verify restaurant');
            set({ loading: false });
        }
    },
    deleteRestaurantAdmin: async (restaurantId: string) => {
        try {
            set({ loading: true });
            const response = await axios.delete(`${API_END_POINT}/admin/${restaurantId}`);
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete restaurant');
            set({ loading: false });
        }
    }

}), {
    name: 'restaurant-name',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
        restaurant: state.restaurant,
        searchedRestaurant: state.searchedRestaurant,
        appliedFilter: state.appliedFilter,
        singleRestaurant: state.singleRestaurant,
        restaurantOrder: state.restaurantOrder,
    }),
}))
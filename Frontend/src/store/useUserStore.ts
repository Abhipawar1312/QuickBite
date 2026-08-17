import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import axios from "axios";
import { LoginInputState, SignupInputState } from "@/schema/userSchema";
import { toast } from "sonner";
import { useThemeStore } from "./useThemeStore";
import { API_END_POINTS } from "@/config/api";

const API_END_POINT = API_END_POINTS.USER;
axios.defaults.withCredentials = true;


export type SavedAddress = {
    _id?: string;
    label?: string;
    tag?: 'Home' | 'Work' | 'Other';
    address: string;
    city: string;
    pincode?: string;
    deliveryInstructions?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
};

type User = {
    _id: string;
    fullname: string;
    email: string;
    contact?: number;
    address: string;
    city: string;
    country: string;
    pincode?: string;
    profilePicture: string;
    admin: boolean;
    role?: 'user' | 'restaurant_owner' | 'admin' | 'rider';
    isRoleSelected?: boolean;
    savedAddresses?: SavedAddress[];
    isVerified: boolean;
};


type UserState = {
    user: User | null;
    isAuthenticated: boolean;
    isCheckingAuth: boolean;
    loading: boolean;
    signup: (input: SignupInputState) => Promise<void>;
    login: (input: LoginInputState) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    verifyEmail: (verificationCode: string) => Promise<void>;
    checkAuthentication: () => Promise<void>;
    logout: () => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
    updateProfile: (input: any) => Promise<void>;
    selectRole: (role: string) => Promise<void>;
    addSavedAddress: (addressData: Partial<SavedAddress>) => Promise<boolean>;
    updateSavedAddress: (addressId: string, addressData: Partial<SavedAddress>) => Promise<boolean>;
    deleteSavedAddress: (addressId: string) => Promise<boolean>;
};



export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isCheckingAuth: true,
            loading: false,

            signup: async (input) => {
                try {
                    set({ loading: true });
                    const response = await axios.post(`${API_END_POINT}/signup`, input, {
                        headers: { 'Content-Type': 'application/json' },
                    });

                    if (response.data.success) {
                        toast.success(response.data.message);
                        set({ loading: false, user: response.data.user, isAuthenticated: true });
                    } else {
                        // ❗ THROW if success is false
                        throw new Error(response.data.message);
                    }
                } catch (error: any) {
                    const message = error?.response?.data?.message || error.message || "Signup failed";
                    toast.error(message);
                    set({ loading: false });
                    throw new Error(message); // Ensure the caller can catch this
                }
            },

            login: async (input: LoginInputState) => {
                try {
                    set({ loading: true });
                    const response = await axios.post(`${API_END_POINT}/login`, input, {
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (response.data.success) {
                        toast.success(response.data.message);
                        set({ loading: false, user: response.data.user, isAuthenticated: true });
                    } else {
                        throw new Error(response.data.message);
                    }
                } catch (error: any) {
                    const message = error?.response?.data?.message || error.message || "Login failed";
                    toast.error(message);
                    set({ loading: false });
                    throw new Error(message); // 👈 this is key
                }
            },

            loginWithGoogle: async (idToken: string) => {
                try {
                    set({ loading: true });
                    const response = await axios.post(`${API_END_POINT}/google-login`, { idToken }, {
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (response.data.success) {
                        toast.success(response.data.message);
                        set({ loading: false, user: response.data.user, isAuthenticated: true });
                    } else {
                        throw new Error(response.data.message);
                    }
                } catch (error: any) {
                    const message = error?.response?.data?.message || error.message || "Google login failed";
                    toast.error(message);
                    set({ loading: false });
                    throw new Error(message);
                }
            },

            verifyEmail: async (verificationCode: string) => {
                try {
                    set({ loading: true });
                    const response = await axios.post(
                        `${API_END_POINT}/verify-email`,
                        { verificationCode },
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                    if (response.data.success) {
                        toast.success(response.data.message);
                        set({ loading: false, user: response.data.user, isAuthenticated: true });
                    }
                } catch (error: any) {
                    toast.error(error.response.data.message);
                    set({ loading: false });
                }
            },

            checkAuthentication: async () => {
                try {
                    set({ isCheckingAuth: true });
                    const response = await axios.get(`${API_END_POINT}/check-auth`);
                    if (response.data.success) {
                        set({ user: response.data.user, isAuthenticated: true, isCheckingAuth: false });
                    }
                } catch {
                    set({ isAuthenticated: false, isCheckingAuth: false });
                }
            },

            logout: async () => {
                try {
                    set({ loading: true });
                    const response = await axios.post(`${API_END_POINT}/logout`);
                    if (response.data.success) {
                        // Clear user data and trigger redirect
                        set({ loading: false, user: null, isAuthenticated: false });

                        // Reset theme first to ensure it updates before redirect
                        try {
                            useThemeStore.getState().setTheme("light");
                        } catch (e) {
                            // ignore
                        }

                        // Clear restaurant, menu, and rider data from other stores safely
                        try {
                            const { useRestaurantStore } = await import("./useRestaurantStore");
                            const { useMenuStore } = await import("./useMenuStore");
                            const { useRiderStore } = await import("./useRiderStore");

                            useRestaurantStore.getState().clearRestaurantData?.();
                            useMenuStore.getState().clearMenuData?.();
                            useRiderStore.setState?.({ riderProfile: null, activeOrder: null, incomingOrders: [] });
                        } catch (e) {
                            // ignore
                        }

                        toast.success(response.data.message);
                    }

                } catch (error: any) {
                    const message = error.response?.data?.message || "Logout failed";
                    toast.error(message);
                    set({ loading: false });
                }
            },

            forgotPassword: async (email: string) => {
                try {
                    set({ loading: true });
                    const response = await axios.post(`${API_END_POINT}/forgot-password`, { email });
                    if (response.data.success) {
                        toast.success(response.data.message);
                        set({ loading: false });
                    }
                } catch (error: any) {
                    toast.error(error.response.data.message);
                    set({ loading: false });
                }
            },

            resetPassword: async (token: string, newPassword: string) => {
                try {
                    set({ loading: true });
                    const response = await axios.post(
                        `${API_END_POINT}/reset-password/${token}`,
                        { newPassword }
                    );
                    if (response.data.success) {
                        toast.success(response.data.message);
                        set({ loading: false });
                    }
                } catch (error: any) {
                    toast.error(error.response.data.message);
                    set({ loading: false });
                }
            },

            updateProfile: async (input: any) => {
                try {
                    const response = await axios.put(
                        `${API_END_POINT}/profile/update`,
                        input,
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                    if (response.data.success) {
                        toast.success(response.data.message);
                        set({ user: response.data.user, isAuthenticated: true });
                    }
                } catch (error: any) {
                    toast.error(error.response.data.message);
                }
            },

            selectRole: async (role: string) => {
                try {
                    set({ loading: true });
                    const response = await axios.put(`${API_END_POINT}/select-role`, { role });
                    if (response.data.success) {
                        toast.success(response.data.message);
                        set({ user: response.data.user, isAuthenticated: true, loading: false });
                    }
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to select role");
                    set({ loading: false });
                }
            },

            addSavedAddress: async (addressData: Partial<SavedAddress>) => {
                try {
                    set({ loading: true });
                    const response = await axios.post(`${API_END_POINT}/saved-address`, addressData);
                    set({ loading: false });
                    if (response.data.success) {
                        toast.success(response.data.message || "Address saved successfully");
                        set({ user: response.data.user });
                        return true;
                    }
                    return false;
                } catch (error: any) {
                    set({ loading: false });
                    toast.error(error.response?.data?.message || "Failed to save address");
                    return false;
                }
            },

            updateSavedAddress: async (addressId: string, addressData: Partial<SavedAddress>) => {
                try {
                    set({ loading: true });
                    const response = await axios.put(`${API_END_POINT}/saved-address/${addressId}`, addressData);
                    set({ loading: false });
                    if (response.data.success) {
                        toast.success(response.data.message || "Address updated");
                        set({ user: response.data.user });
                        return true;
                    }
                    return false;
                } catch (error: any) {
                    set({ loading: false });
                    toast.error(error.response?.data?.message || "Failed to update address");
                    return false;
                }
            },

            deleteSavedAddress: async (addressId: string) => {
                try {
                    const response = await axios.delete(`${API_END_POINT}/saved-address/${addressId}`);
                    if (response.data.success) {
                        toast.success(response.data.message || "Address removed");
                        set({ user: response.data.user });
                        return true;
                    }
                    return false;
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to delete address");
                    return false;
                }
            },

        }),

        {
            name: 'user-name',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
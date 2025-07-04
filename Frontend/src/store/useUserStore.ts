import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import axios from "axios";
import { LoginInputState, SignupInputState } from "@/schema/userSchema";
import { toast } from "sonner";
import { useThemeStore } from "./useThemeStore";

// const API_END_POINT = "http://localhost:8000/api/v1/user";
const API_END_POINT = "https://quickbite-ogw0.onrender.com/api/v1/user"
axios.defaults.withCredentials = true;

type User = {
    fullname: string;
    email: string;
    contact: number;
    address: string;
    city: string;
    country: string;
    profilePicture: string;
    admin: boolean;
    isVerified: boolean;
};

type UserState = {
    user: User | null;
    isAuthenticated: boolean;
    isCheckingAuth: boolean;
    loading: boolean;
    signup: (input: SignupInputState) => Promise<void>;
    login: (input: LoginInputState) => Promise<void>;
    verifyEmail: (verificationCode: string) => Promise<void>;
    checkAuthentication: () => Promise<void>;
    logout: () => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
    updateProfile: (input: any) => Promise<void>;
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
                        toast.success(response.data.message);
                        set({ loading: false, user: null, isAuthenticated: false });
                        useThemeStore.getState().setTheme("light");
                    }
                } catch (error: any) {
                    toast.error(error.response.data.message);
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
        }),
        {
            name: 'user-name',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
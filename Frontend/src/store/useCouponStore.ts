import { Coupon, CouponState } from "@/types/couponType";
import axios from "axios";
import { toast } from "sonner";
import { create } from "zustand";
import { API_END_POINTS } from "@/config/api";

const API_END_POINT = API_END_POINTS.COUPON;
axios.defaults.withCredentials = true;


export const useCouponStore = create<CouponState>((set) => ({
    loading: false,
    activeCoupons: [],
    allCoupons: [],

    getActiveCoupons: async () => {
        try {
            set({ loading: true });
            const response = await axios.get(`${API_END_POINT}/active`);
            if (response.data.success) {
                set({ activeCoupons: response.data.coupons, loading: false });
            }
        } catch (error) {
            set({ loading: false });
        }
    },

    applyCoupon: async (code: string, subtotal: number) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/apply`, { code, subtotal });
            set({ loading: false });
            if (response.data.success) {
                toast.success(response.data.message);
                return {
                    success: true,
                    message: response.data.message,
                    discountAmount: response.data.coupon.discountAmount
                };
            }
            return { success: false, message: response.data.message };
        } catch (error: any) {
            set({ loading: false });
            const message = error.response?.data?.message || "Failed to apply coupon";
            toast.error(message);
            return { success: false, message };
        }
    },

    getAllCouponsAdmin: async () => {
        try {
            set({ loading: true });
            const response = await axios.get(`${API_END_POINT}/admin/all`);
            if (response.data.success) {
                set({ allCoupons: response.data.coupons, loading: false });
            }
        } catch (error) {
            set({ loading: false });
        }
    },

    createCouponAdmin: async (data: Partial<Coupon>) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/admin/create`, data);
            set({ loading: false });
            if (response.data.success) {
                toast.success(response.data.message || "Coupon created successfully");
                set((state) => ({
                    allCoupons: [response.data.coupon, ...state.allCoupons]
                }));
                return true;
            }
            return false;
        } catch (error: any) {
            set({ loading: false });
            toast.error(error.response?.data?.message || "Failed to create coupon");
            return false;
        }
    },

    toggleCouponAdmin: async (id: string) => {
        try {
            const response = await axios.put(`${API_END_POINT}/admin/${id}/toggle`);
            if (response.data.success) {
                toast.success(response.data.message);
                set((state) => ({
                    allCoupons: state.allCoupons.map((c) =>
                        c._id === id ? { ...c, isActive: response.data.coupon.isActive } : c
                    )
                }));
                return true;
            }
            return false;
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to toggle coupon");
            return false;
        }
    },

    deleteCouponAdmin: async (id: string) => {
        try {
            const response = await axios.delete(`${API_END_POINT}/admin/${id}`);
            if (response.data.success) {
                toast.success("Coupon deleted successfully");
                set((state) => ({
                    allCoupons: state.allCoupons.filter((c) => c._id !== id)
                }));
                return true;
            }
            return false;
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete coupon");
            return false;
        }
    }
}));

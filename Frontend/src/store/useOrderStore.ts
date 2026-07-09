import { CheckoutSessionRequest, OrderState } from "@/types/orderType";
import axios from "axios";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// const API_END_POINT: string = "http://localhost:8000/api/v1/order";
const API_END_POINT: string = "https://quickbite-ogw0.onrender.com/api/v1/order";
axios.defaults.withCredentials = true;

export const useOrderStore = create<OrderState>()(persist((set => ({
    loading: false,
    orders: [],
    createCheckoutSession: async (checkoutSession: CheckoutSessionRequest) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/checkout/create-checkout-session`, checkoutSession, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            window.location.href = response.data.session.url;
            set({ loading: false });
        } catch (error) {
            set({ loading: false });
        }
    },
    getOrderDetails: async (confirmSuccess?: boolean) => {
        try {
            set({ loading: true });
            const response = await axios.get(API_END_POINT, {
                params: confirmSuccess ? { confirmSuccess: true } : {}
            });

            set({ loading: false, orders: response.data.orders });
        } catch (error) {
            set({ loading: false });
        }
    },
    cancelOrder: async (orderId: string, cancellationReason: string) => {
        try {
            set({ loading: true });
            const response = await axios.put(`${API_END_POINT}/${orderId}/cancel`, { cancellationReason }, {
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.data.success) {
                toast.success(response.data.message || "Order cancelled successfully");
                set((state) => ({
                    orders: state.orders.map((o) => o._id === orderId ? { ...o, status: 'Cancelled', cancellationReason } : o),
                    loading: false
                }));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to cancel order");
            set({ loading: false });
        }
    },
    updateLocalOrderStatus: (updatedOrder: any) => {
        set((state) => ({
            orders: state.orders.map((o) => o._id === updatedOrder._id ? updatedOrder : o)
        }));
    },
    markOrderAsReviewed: (orderId: string) => {
        set((state) => ({
            orders: state.orders.map((o) => o._id === orderId ? { ...o, isReviewed: true } : o)
        }));
    }
})), {
    name: 'order-name',
    storage: createJSONStorage(() => localStorage)
}))
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import axios from "axios";
import { toast } from "sonner";
import { Orders } from "@/types/orderType";

// const API_END_POINT = "http://localhost:8000/api/v1/rider";
const API_END_POINT = "https://quickbite-ogw0.onrender.com/api/v1/rider";
axios.defaults.withCredentials = true;

export interface RiderProfile {
  _id: string;
  user: any;
  vehicleName: string;
  licenseNumber: string;
  contact: string;
  isVerified: boolean;
  isOnline: boolean;
  location?: {
    type: string;
    coordinates: [number, number];
  };
}

export type RiderState = {
  loading: boolean;
  riderProfile: RiderProfile | null;
  ridersList: any[];
  incomingOrders: Orders[];
  activeOrder: Orders | null;
  submitRiderDetails: (vehicleName: string, licenseNumber: string, contact: string) => Promise<void>;
  getRiderProfile: () => Promise<void>;
  toggleOnlineStatus: (isOnline: boolean, latitude: number, longitude: number) => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  updateDeliveryWorkflow: (orderId: string, status: "reached_restaurant" | "delivered") => Promise<void>;
  getAllRidersAdmin: () => Promise<void>;
  verifyRiderAdmin: (riderId: string) => Promise<void>;
  deleteRiderAdmin: (riderId: string) => Promise<void>;
  setIncomingOrders: (orders: Orders[]) => void;
  addIncomingOrder: (order: Orders) => void;
  removeIncomingOrder: (orderId: string) => void;
  setActiveOrder: (order: Orders | null) => void;
  riderEarnings: { today: number; week: number; total: number; tripsToday: number; tripsWeek: number; tripsTotal: number } | null;
  riderDeliveries: any[];
  getRiderEarnings: () => Promise<void>;
};

export const useRiderStore = create<RiderState>()(
  persist(
    (set, get) => ({
      loading: false,
      riderProfile: null,
      ridersList: [],
      incomingOrders: [],
      activeOrder: null,
      riderEarnings: null,
      riderDeliveries: [],

      getRiderEarnings: async () => {
        try {
          set({ loading: true });
          const response = await axios.get(`${API_END_POINT}/earnings`);
          if (response.data.success) {
            set({
              riderEarnings: response.data.earnings,
              riderDeliveries: response.data.deliveries,
              loading: false
            });
          }
        } catch (error) {
          set({ loading: false });
        }
      },

      getRiderProfile: async () => {
        try {
          set({ loading: true });
          const response = await axios.get(`${API_END_POINT}/profile`);
          if (response.data.success) {
            set({ riderProfile: response.data.rider, loading: false });
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            set({ riderProfile: null });
          }
          set({ loading: false });
        }
      },


      submitRiderDetails: async (vehicleName, licenseNumber, contact) => {
        try {
          set({ loading: true });
          const response = await axios.post(`${API_END_POINT}/submit`, {
            vehicleName,
            licenseNumber,
            contact,
          });
          if (response.data.success) {
            toast.success(response.data.message);
            set({ riderProfile: response.data.rider, loading: false });
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to submit rider details");
          set({ loading: false });
        }
      },

      toggleOnlineStatus: async (isOnline, latitude, longitude) => {
        try {
          set({ loading: true });
          const response = await axios.post(`${API_END_POINT}/toggle-online`, {
            isOnline,
            latitude,
            longitude,
          });
          if (response.data.success) {
            toast.success(response.data.message);
            set({ riderProfile: response.data.rider, loading: false });
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to change online status");
          set({ loading: false });
          throw error;
        }
      },

      acceptOrder: async (orderId) => {
        try {
          set({ loading: true });
          const response = await axios.put(`${API_END_POINT}/order/${orderId}/accept`);
          if (response.data.success) {
            toast.success(response.data.message);
            set({
              activeOrder: response.data.order,
              incomingOrders: get().incomingOrders.filter((o) => o._id !== orderId),
              loading: false,
            });
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to accept order");
          set({ loading: false });
          throw error;
        }
      },

      updateDeliveryWorkflow: async (orderId, status) => {
        try {
          set({ loading: true });
          const response = await axios.put(`${API_END_POINT}/order/${orderId}/workflow`, { status });
          if (response.data.success) {
            toast.success(response.data.message);
            set({
              activeOrder: status === "delivered" ? null : response.data.order,
              loading: false,
            });
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to update workflow");
          set({ loading: false });
        }
      },

      getAllRidersAdmin: async () => {
        try {
          set({ loading: true });
          const response = await axios.get(`${API_END_POINT}/admin/all`);
          if (response.data.success) {
            set({ ridersList: response.data.riders, loading: false });
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to fetch riders list");
          set({ loading: false });
        }
      },

      verifyRiderAdmin: async (riderId) => {
        try {
          set({ loading: true });
          const response = await axios.put(`${API_END_POINT}/admin/${riderId}/verify`);
          if (response.data.success) {
            toast.success(response.data.message);
            const updatedList = get().ridersList.map((r) =>
              r._id === riderId ? { ...r, isVerified: true } : r
            );
            set({ ridersList: updatedList, loading: false });
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to verify rider");
          set({ loading: false });
        }
      },

      deleteRiderAdmin: async (riderId) => {
        try {
          set({ loading: true });
          const response = await axios.delete(`${API_END_POINT}/admin/${riderId}`);
          if (response.data.success) {
            toast.success(response.data.message);
            const updatedList = get().ridersList.filter((r) => r._id !== riderId);
            set({ ridersList: updatedList, loading: false });
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to delete rider");
          set({ loading: false });
        }
      },

      setIncomingOrders: (orders) => set({ incomingOrders: orders }),

      addIncomingOrder: (order) => {
        const exists = get().incomingOrders.some((o) => o._id === order._id);
        if (!exists) {
          set({ incomingOrders: [...get().incomingOrders, order] });
        }
      },

      removeIncomingOrder: (orderId) => {
        set({ incomingOrders: get().incomingOrders.filter((o) => o._id !== orderId) });
      },

      setActiveOrder: (order) => set({ activeOrder: order }),
    }),
    {
      name: "rider-store-key",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        riderProfile: state.riderProfile,
        ridersList: state.ridersList,
        incomingOrders: state.incomingOrders,
        activeOrder: state.activeOrder,
        riderEarnings: state.riderEarnings,
        riderDeliveries: state.riderDeliveries,
      }),
    }
  )
);

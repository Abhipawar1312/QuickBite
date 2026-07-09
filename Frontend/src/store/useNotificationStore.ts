import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string; // 'new_order', 'rider_accepted', 'outfordelivery', 'delivered', 'cancelled', 'status_update'
  timestamp: string;
  read: boolean;
  link?: string; // optional navigation target
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(persist((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notif) => {
    set((state) => {
      const newNotif: AppNotification = {
        ...notif,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        read: false
      };
      return {
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    });
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0
    }));
  },
  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  }
}), {
  name: "app-notifications",
  storage: createJSONStorage(() => localStorage)
}));

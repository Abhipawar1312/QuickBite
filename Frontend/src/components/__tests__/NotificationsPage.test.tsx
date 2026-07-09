import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationsPage } from "../NotificationsPage";
import { useNotificationStore } from "@/store/useNotificationStore";

const mockMarkAllAsRead = jest.fn();
const mockClearNotifications = jest.fn();

jest.mock("@/store/useNotificationStore", () => ({
    useNotificationStore: jest.fn(() => ({
        notifications: [],
        unreadCount: 0,
        markAllAsRead: mockMarkAllAsRead,
        clearNotifications: mockClearNotifications,
    })),
}));

describe("NotificationsPage Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders empty state when no notifications exist", () => {
        (useNotificationStore as unknown as jest.Mock).mockReturnValue({
            notifications: [],
            unreadCount: 0,
            markAllAsRead: mockMarkAllAsRead,
            clearNotifications: mockClearNotifications,
        });

        render(<NotificationsPage />);

        expect(screen.getByText("All caught up!")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /mark read/i })).not.toBeInTheDocument();
    });

    test("renders notifications list correctly and calls markAllAsRead on mount if unread exists", () => {
        const mockNotif = {
            id: "notif1",
            title: "Order Delivered",
            message: "Your pizza is delivered!",
            type: "delivered",
            read: false,
            timestamp: new Date().toISOString(),
            link: "/orders",
        };

        (useNotificationStore as unknown as jest.Mock).mockReturnValue({
            notifications: [mockNotif],
            unreadCount: 1,
            markAllAsRead: mockMarkAllAsRead,
            clearNotifications: mockClearNotifications,
        });

        render(<NotificationsPage />);

        expect(screen.getByText("Order Delivered")).toBeInTheDocument();
        expect(screen.getByText("Your pizza is delivered!")).toBeInTheDocument();
        expect(screen.getByText("Delivered")).toBeInTheDocument();
        expect(mockMarkAllAsRead).toHaveBeenCalled();
    });

    test("handles notification actions (mark read, clear all)", () => {
        const mockNotif = {
            id: "notif1",
            title: "Order Delivered",
            message: "Your pizza is delivered!",
            type: "delivered",
            read: true,
            timestamp: new Date().toISOString(),
        };

        (useNotificationStore as unknown as jest.Mock).mockReturnValue({
            notifications: [mockNotif],
            unreadCount: 0,
            markAllAsRead: mockMarkAllAsRead,
            clearNotifications: mockClearNotifications,
        });

        render(<NotificationsPage />);

        // Click mark read
        fireEvent.click(screen.getByRole("button", { name: /mark read/i }));
        expect(mockMarkAllAsRead).toHaveBeenCalled();

        // Click clear all
        fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
        expect(mockClearNotifications).toHaveBeenCalled();
    });
});

jest.unmock("@/store/useNotificationStore");
jest.unmock("../useNotificationStore");
const { useNotificationStore } = jest.requireActual("../useNotificationStore");

describe("useNotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.getState().clearNotifications();
  });

  test("should start with empty notifications and zero unread count", () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
  });

  test("should add a notification and increment unread count", () => {
    useNotificationStore.getState().addNotification({
      title: "Order Placed",
      message: "Your order #123 was received",
      type: "new_order"
    });

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].title).toBe("Order Placed");
    expect(state.notifications[0].read).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  test("should mark all notifications as read and reset unread count", () => {
    useNotificationStore.getState().addNotification({
      title: "Order Update",
      message: "Out for delivery",
      type: "outfordelivery"
    });
    useNotificationStore.getState().addNotification({
      title: "Order Delivered",
      message: "Enjoy your food!",
      type: "delivered"
    });

    expect(useNotificationStore.getState().unreadCount).toBe(2);

    useNotificationStore.getState().markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.notifications.every((n: any) => n.read)).toBe(true);
  });

  test("should clear all notifications", () => {
    useNotificationStore.getState().addNotification({
      title: "Test",
      message: "Test message",
      type: "test"
    });
    useNotificationStore.getState().clearNotifications();

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
  });
});

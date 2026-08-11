jest.unmock("@/store/useOrderStore");
jest.unmock("../useOrderStore");
const { useOrderStore } = jest.requireActual("../useOrderStore");
import axios from "axios";
import { toast } from "sonner";

jest.mock("axios");
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("useOrderStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOrderStore.setState({ loading: false, orders: [] });
  });

  test("getOrderDetails populates orders on success", async () => {
    const mockOrders = [
      { _id: "ord1", status: "Preparing", totalAmount: 500 },
      { _id: "ord2", status: "Delivered", totalAmount: 350 },
    ];
    mockedAxios.get.mockResolvedValueOnce({ data: { orders: mockOrders } });

    await useOrderStore.getState().getOrderDetails();

    expect(useOrderStore.getState().orders).toEqual(mockOrders);
    expect(useOrderStore.getState().loading).toBe(false);
  });

  test("cancelOrder updates order status locally on success", async () => {
    useOrderStore.setState({
      orders: [
        { _id: "ord1", status: "Preparing", totalAmount: 500 } as any,
      ],
    });

    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true, message: "Cancelled successfully" },
    });

    await useOrderStore.getState().cancelOrder("ord1", "Changed my mind");

    expect(useOrderStore.getState().orders[0].status).toBe("Cancelled");
    expect(toast.success).toHaveBeenCalledWith("Cancelled successfully");
  });

  test("updateLocalOrderStatus replaces existing order with updated order", () => {
    useOrderStore.setState({
      orders: [{ _id: "ord1", status: "Preparing" } as any],
    });

    useOrderStore.getState().updateLocalOrderStatus({ _id: "ord1", status: "Out for Delivery" });

    expect(useOrderStore.getState().orders[0].status).toBe("Out for Delivery");
  });

  test("markOrderAsReviewed sets isReviewed flag", () => {
    useOrderStore.setState({
      orders: [{ _id: "ord1", isReviewed: false } as any],
    });

    useOrderStore.getState().markOrderAsReviewed("ord1");

    expect(useOrderStore.getState().orders[0].isReviewed).toBe(true);
  });
});

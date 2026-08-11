jest.unmock("@/store/useRiderStore");
jest.unmock("../useRiderStore");
const { useRiderStore } = jest.requireActual("../useRiderStore");
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

describe("useRiderStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRiderStore.setState({
      loading: false,
      riderProfile: null,
      ridersList: [],
      incomingOrders: [],
      activeOrder: null,
      riderEarnings: null,
      riderDeliveries: [],
    });
  });

  test("getRiderProfile populates rider profile state", async () => {
    const mockProfile = { _id: "r1", vehicleName: "Bike", licenseNumber: "LIC123" };
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, rider: mockProfile },
    });

    await useRiderStore.getState().getRiderProfile();

    expect(useRiderStore.getState().riderProfile).toEqual(mockProfile);
    expect(useRiderStore.getState().loading).toBe(false);
  });

  test("submitRiderDetails submits rider data", async () => {
    const mockProfile = { _id: "r1", vehicleName: "Honda Activa" };
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, message: "Rider registered", rider: mockProfile },
    });

    await useRiderStore.getState().submitRiderDetails("Honda Activa", "MH041234", "9876543210");

    expect(useRiderStore.getState().riderProfile).toEqual(mockProfile);
    expect(toast.success).toHaveBeenCalledWith("Rider registered");
  });

  test("acceptOrder updates active order and removes from incoming", async () => {
    const mockOrder = { _id: "ord100", status: "Picked Up" } as any;
    useRiderStore.setState({ incomingOrders: [mockOrder] });

    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true, message: "Order accepted", order: mockOrder },
    });

    await useRiderStore.getState().acceptOrder("ord100");

    expect(useRiderStore.getState().activeOrder).toEqual(mockOrder);
    expect(useRiderStore.getState().incomingOrders).toHaveLength(0);
    expect(toast.success).toHaveBeenCalledWith("Order accepted");
  });

  test("updateDeliveryWorkflow sets active order null when delivered", async () => {
    const mockOrder = { _id: "ord100", status: "Delivered" } as any;
    useRiderStore.setState({ activeOrder: mockOrder });

    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true, message: "Delivered successfully", order: mockOrder },
    });

    await useRiderStore.getState().updateDeliveryWorkflow("ord100", "delivered");

    expect(useRiderStore.getState().activeOrder).toBeNull();
    expect(toast.success).toHaveBeenCalledWith("Delivered successfully");
  });

  test("getAllRidersAdmin fetches riders list", async () => {
    const mockRiders = [{ _id: "r1", vehicleName: "Scooter" }];
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, riders: mockRiders },
    });

    await useRiderStore.getState().getAllRidersAdmin();
    expect(useRiderStore.getState().ridersList).toEqual(mockRiders);
  });
});

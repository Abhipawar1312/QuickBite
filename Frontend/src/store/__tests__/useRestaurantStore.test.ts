jest.unmock("@/store/useRestaurantStore");
jest.unmock("../useRestaurantStore");
const { useRestaurantStore } = jest.requireActual("../useRestaurantStore");
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

describe("useRestaurantStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRestaurantStore.getState().clearRestaurantData();
  });

  test("clearRestaurantData resets state", () => {
    useRestaurantStore.setState({
      restaurant: { restaurantName: "Test Diner" } as any,
      loading: true,
    });
    useRestaurantStore.getState().clearRestaurantData();

    expect(useRestaurantStore.getState().restaurant).toBeNull();
    expect(useRestaurantStore.getState().loading).toBe(false);
  });

  test("getRestaurant populates restaurant state on success", async () => {
    const mockRest = { _id: "r1", restaurantName: "Spice Garden" };
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, restaurant: mockRest },
    });

    await useRestaurantStore.getState().getRestaurant();

    expect(useRestaurantStore.getState().restaurant).toEqual(mockRest);
    expect(useRestaurantStore.getState().loading).toBe(false);
  });

  test("createRestaurant creates restaurant successfully", async () => {
    const mockRest = { _id: "r1", restaurantName: "Spice Garden" };
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, message: "Restaurant created", restaurant: mockRest },
    });

    const formData = new FormData();
    await useRestaurantStore.getState().createRestaurant(formData);

    expect(useRestaurantStore.getState().restaurant).toEqual(mockRest);
    expect(toast.success).toHaveBeenCalledWith("Restaurant created");
  });

  test("updateRestaurant updates restaurant state", async () => {
    const mockRest = { _id: "r1", restaurantName: "Spice Garden Updated" };
    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true, message: "Restaurant updated", restaurant: mockRest },
    });

    const formData = new FormData();
    await useRestaurantStore.getState().updateRestaurant(formData);

    expect(useRestaurantStore.getState().restaurant).toEqual(mockRest);
    expect(toast.success).toHaveBeenCalledWith("Restaurant updated");
  });

  test("addMenuToRestaurant, updateMenuToRestaurant, and removeMenuFromRestaurant update menu list", () => {
    useRestaurantStore.setState({
      restaurant: { _id: "r1", menus: [] } as any,
    });

    const newMenu = { _id: "m1", name: "Naan" } as any;
    useRestaurantStore.getState().addMenuToRestaurant(newMenu);
    expect(useRestaurantStore.getState().restaurant?.menus).toHaveLength(1);

    const updatedMenu = { _id: "m1", name: "Butter Naan" } as any;
    useRestaurantStore.getState().updateMenuToRestaurant(updatedMenu);
    expect(useRestaurantStore.getState().restaurant?.menus[0].name).toBe("Butter Naan");

    useRestaurantStore.getState().removeMenuFromRestaurant("m1");
    expect(useRestaurantStore.getState().restaurant?.menus).toHaveLength(0);
  });

  test("setAppliedFilter toggles applied filters", () => {
    useRestaurantStore.getState().setAppliedFilter("Italian");
    expect(useRestaurantStore.getState().appliedFilter).toContain("Italian");

    useRestaurantStore.getState().setAppliedFilter("Italian");
    expect(useRestaurantStore.getState().appliedFilter).not.toContain("Italian");
  });

  test("getRestaurantOrders fetches orders successfully", async () => {
    const mockOrders = [{ _id: "o1", status: "Preparing" }];
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, orders: mockOrders },
    });

    await useRestaurantStore.getState().getRestaurantOrders();
    expect(useRestaurantStore.getState().restaurantOrder).toEqual(mockOrders);
  });

  test("fetchAllCuisines fetches global cuisines list successfully", async () => {
    const mockCuisines = ["Biryani", "Burger", "Chinese", "Momos"];
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, cuisines: mockCuisines },
    });

    await useRestaurantStore.getState().fetchAllCuisines();
    expect(useRestaurantStore.getState().allCuisines).toEqual(mockCuisines);
  });
});


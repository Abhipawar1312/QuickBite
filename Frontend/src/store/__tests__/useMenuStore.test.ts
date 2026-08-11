jest.unmock("@/store/useMenuStore");
jest.unmock("../useMenuStore");
const { useMenuStore } = jest.requireActual("../useMenuStore");
import axios from "axios";
import { toast } from "sonner";

jest.mock("axios");
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../useRestaurantStore", () => ({
  useRestaurantStore: {
    getState: jest.fn(() => ({
      addMenuToRestaurant: jest.fn(),
      updateMenuToRestaurant: jest.fn(),
      removeMenuFromRestaurant: jest.fn(),
      updateMenuAvailability: jest.fn(),
    })),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("useMenuStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMenuStore.getState().clearMenuData();
  });

  test("clearMenuData resets state", () => {
    useMenuStore.setState({ loading: true, menu: { name: "Burger" } as any });
    useMenuStore.getState().clearMenuData();
    expect(useMenuStore.getState().loading).toBe(false);
    expect(useMenuStore.getState().menu).toBeNull();
  });

  test("createMenu updates menu on success", async () => {
    const mockMenu = { _id: "m1", name: "Butter Chicken" };
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, message: "Menu created", menu: mockMenu },
    });

    const formData = new FormData();
    await useMenuStore.getState().createMenu(formData);

    expect(useMenuStore.getState().menu).toEqual(mockMenu);
    expect(toast.success).toHaveBeenCalledWith("Menu created");
  });

  test("editMenu updates menu on success", async () => {
    const mockMenu = { _id: "m1", name: "Butter Chicken Special" };
    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true, message: "Menu updated", menu: mockMenu },
    });

    const formData = new FormData();
    await useMenuStore.getState().editMenu("m1", formData);

    expect(useMenuStore.getState().menu).toEqual(mockMenu);
    expect(toast.success).toHaveBeenCalledWith("Menu updated");
  });

  test("deleteMenu handles deletion", async () => {
    mockedAxios.delete.mockResolvedValueOnce({
      data: { success: true, message: "Menu deleted" },
    });

    await useMenuStore.getState().deleteMenu("m1");

    expect(toast.success).toHaveBeenCalledWith("Menu deleted");
    expect(useMenuStore.getState().loading).toBe(false);
  });
});

jest.unmock("@/store/useUserStore");
jest.unmock("../useUserStore");
const { useUserStore } = jest.requireActual("../useUserStore");
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

describe("useUserStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserStore.setState({ user: null, isAuthenticated: false, loading: false, isCheckingAuth: false });
  });

  test("signup success updates user state", async () => {
    const mockUser = { _id: "u1", fullname: "Abhishek", email: "abhishek@example.com" };
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, message: "Signup successful", user: mockUser },
    });

    await useUserStore.getState().signup({
      fullname: "Abhishek",
      email: "abhishek@example.com",
      password: "password123",
      contact: "9876543210",
    } as any);

    expect(useUserStore.getState().user).toEqual(mockUser);
    expect(useUserStore.getState().isAuthenticated).toBe(true);
    expect(toast.success).toHaveBeenCalledWith("Signup successful");
  });

  test("login success updates user state", async () => {
    const mockUser = { _id: "u1", fullname: "Abhishek", email: "abhishek@example.com" };
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, message: "Welcome back", user: mockUser },
    });

    await useUserStore.getState().login({
      email: "abhishek@example.com",
      password: "password123",
    } as any);

    expect(useUserStore.getState().user).toEqual(mockUser);
    expect(useUserStore.getState().isAuthenticated).toBe(true);
    expect(toast.success).toHaveBeenCalledWith("Welcome back");
  });

  test("checkAuthentication sets user when valid", async () => {
    const mockUser = { _id: "u1", fullname: "Abhishek" };
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, user: mockUser },
    });

    await useUserStore.getState().checkAuthentication();

    expect(useUserStore.getState().user).toEqual(mockUser);
    expect(useUserStore.getState().isAuthenticated).toBe(true);
  });

  test("selectRole updates role on user object", async () => {
    const mockUser = { _id: "u1", role: "restaurant_owner" };
    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true, message: "Role selected", user: mockUser },
    });

    await useUserStore.getState().selectRole("restaurant_owner");

    expect(useUserStore.getState().user).toEqual(mockUser);
    expect(toast.success).toHaveBeenCalledWith("Role selected");
  });
});

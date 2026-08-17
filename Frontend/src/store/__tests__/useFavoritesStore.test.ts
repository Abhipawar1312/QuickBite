import { act } from "react";
import axios from "axios";
import { useFavoritesStore } from "../useFavoritesStore";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("useFavoritesStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFavoritesStore.setState({
      favoriteRestaurants: [],
      favoriteMenus: [],
      favoriteRestaurantIds: [],
      favoriteMenuIds: [],
      loading: false,
    });
  });

  const mockRestaurant: any = {
    _id: "rest123",
    restaurantName: "Spicy Treats",
    city: "Mumbai",
    cuisines: ["Indian"],
    deliveryTime: 25,
    imageUrl: "https://example.com/rest.jpg",
  };

  const mockMenu: any = {
    _id: "menu123",
    name: "Paneer Tikka",
    price: 240,
    isVeg: true,
    image: "https://example.com/paneer.jpg",
  };

  it("should fetch user favorites successfully", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        favorites: {
          restaurants: [mockRestaurant],
          menus: [mockMenu],
        },
      },
    });

    await act(async () => {
      await useFavoritesStore.getState().fetchFavorites();
    });

    const state = useFavoritesStore.getState();
    expect(state.favoriteRestaurants).toHaveLength(1);
    expect(state.favoriteRestaurantIds).toContain("rest123");
    expect(state.favoriteMenus).toHaveLength(1);
    expect(state.favoriteMenuIds).toContain("menu123");
    expect(state.isRestaurantFavorite("rest123")).toBe(true);
    expect(state.isMenuFavorite("menu123")).toBe(true);
  });

  it("should toggle favorite restaurant optimistically and call API", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Restaurant added to favorites",
      },
    });

    await act(async () => {
      await useFavoritesStore.getState().toggleFavoriteRestaurant(mockRestaurant);
    });

    expect(useFavoritesStore.getState().isRestaurantFavorite("rest123")).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalled();

    // Toggle off
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Restaurant removed from favorites",
      },
    });

    await act(async () => {
      await useFavoritesStore.getState().toggleFavoriteRestaurant(mockRestaurant);
    });

    expect(useFavoritesStore.getState().isRestaurantFavorite("rest123")).toBe(false);
  });

  it("should toggle favorite menu optimistically and call API", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Dish added to favorites",
      },
    });

    await act(async () => {
      await useFavoritesStore.getState().toggleFavoriteMenu(mockMenu);
    });

    expect(useFavoritesStore.getState().isMenuFavorite("menu123")).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalled();
  });
});

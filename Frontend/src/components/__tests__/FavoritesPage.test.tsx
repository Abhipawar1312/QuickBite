import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FavoritesPage } from "../FavoritesPage";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useCartStore } from "@/store/useCartStore";
import { BrowserRouter } from "react-router-dom";

jest.mock("@/store/useFavoritesStore");
jest.mock("@/store/useCartStore");

describe("FavoritesPage Component", () => {
  const mockFetchFavorites = jest.fn();
  const mockToggleRestaurant = jest.fn();
  const mockToggleMenu = jest.fn();
  const mockAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCartStore as unknown as jest.Mock).mockReturnValue({
      addToCart: mockAddToCart,
    });
    (useFavoritesStore as unknown as jest.Mock).mockReturnValue({
      favoriteRestaurants: [
        {
          _id: "rest1",
          restaurantName: "Pizza Garden",
          address: "Bandra West",
          city: "Mumbai",
          cuisines: ["Italian", "Pizza"],
          deliveryTime: 30,
          averageRating: 4.5,
          menus: [{ _id: "m1" }],
        },
      ],
      favoriteMenus: [
        {
          _id: "dish1",
          name: "Farmhouse Pizza",
          price: 399,
          isVeg: true,
          description: "Loaded with fresh bell peppers & corn",
          restaurant: {
            _id: "rest1",
            restaurantName: "Pizza Garden",
            city: "Mumbai",
          },
        },
      ],
      fetchFavorites: mockFetchFavorites,
      toggleFavoriteRestaurant: mockToggleRestaurant,
      toggleFavoriteMenu: mockToggleMenu,
      loading: false,
    });
  });

  it("renders both favorite restaurants and favorite dishes simultaneously with restaurant info", () => {
    render(
      <BrowserRouter>
        <FavoritesPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Your Wishlist & Favorites/i)).toBeInTheDocument();
    expect(screen.getByText("Pizza Garden")).toBeInTheDocument();
    expect(screen.getByText("Italian")).toBeInTheDocument();

    expect(screen.getByText("Farmhouse Pizza")).toBeInTheDocument();
    expect(screen.getByText("From Pizza Garden")).toBeInTheDocument();
    expect(screen.getByText("₹399")).toBeInTheDocument();

    const addToCartBtn = screen.getByRole("button", { name: /Add to Cart/i });
    fireEvent.click(addToCartBtn);
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "dish1", name: "Farmhouse Pizza" }),
      "rest1",
      "Pizza Garden"
    );
  });
});

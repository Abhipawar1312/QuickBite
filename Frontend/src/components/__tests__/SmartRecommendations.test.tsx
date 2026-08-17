import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SmartRecommendations } from "../SmartRecommendations";
import { useRecommendationStore } from "@/store/useRecommendationStore";
import { useCartStore } from "@/store/useCartStore";

jest.mock("@/store/useRecommendationStore");
jest.mock("@/store/useCartStore");
jest.mock("@/store/useFavoritesStore", () => ({
  useFavoritesStore: () => ({
    isMenuFavorite: jest.fn().mockReturnValue(false),
    toggleFavoriteMenu: jest.fn(),
  }),
}));

describe("SmartRecommendations Component", () => {
  const mockAddToCart = jest.fn();
  const mockFetchFrequentlyPaired = jest.fn();
  const mockFetchTrending = jest.fn();
  const mockFetchPersonalized = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCartStore as unknown as jest.Mock).mockReturnValue({
      addToCart: mockAddToCart,
    });
  });

  it("renders frequently paired dishes and allows adding to cart", () => {
    (useRecommendationStore as unknown as jest.Mock).mockReturnValue({
      frequentlyPairedItems: [
        {
          _id: "paired1",
          name: "Crispy Fries",
          description: "Golden crispy fries",
          price: 99,
          isVeg: true,
          image: "https://example.com/fries.jpg",
        },
      ],
      trendingDishes: [],
      personalizedDishes: [],
      fetchFrequentlyPaired: mockFetchFrequentlyPaired,
      fetchTrending: mockFetchTrending,
      fetchPersonalized: mockFetchPersonalized,
      loadingPaired: false,
      loadingTrending: false,
      loadingPersonalized: false,
    });

    render(<SmartRecommendations variant="paired" restaurantId="rest123" />);

    expect(screen.getByText(/Frequently Paired Together/i)).toBeInTheDocument();
    expect(screen.getByText("Crispy Fries")).toBeInTheDocument();
    expect(screen.getByText("₹99")).toBeInTheDocument();

    const addBtn = screen.getByRole("button", { name: /^Add$/i });
    fireEvent.click(addBtn);
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "paired1", name: "Crispy Fries" }),
      "rest123",
      undefined
    );


  });

  it("renders trending dishes variant", () => {
    (useRecommendationStore as unknown as jest.Mock).mockReturnValue({
      frequentlyPairedItems: [],
      trendingDishes: [
        {
          _id: "trend1",
          name: "Butter Chicken",
          price: 320,
          isVeg: false,
        },
      ],
      personalizedDishes: [],
      fetchFrequentlyPaired: mockFetchFrequentlyPaired,
      fetchTrending: mockFetchTrending,
      fetchPersonalized: mockFetchPersonalized,
      loadingPaired: false,
      loadingTrending: false,
      loadingPersonalized: false,
    });

    render(<SmartRecommendations variant="trending" city="Mumbai" />);

    expect(screen.getByText(/Trending In Your Area/i)).toBeInTheDocument();
    expect(screen.getByText("Butter Chicken")).toBeInTheDocument();
  });
});

import { act } from "react";
import axios from "axios";
import { useRecommendationStore } from "../useRecommendationStore";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("useRecommendationStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRecommendationStore.setState({
      frequentlyPairedItems: [],
      trendingRestaurants: [],
      trendingDishes: [],
      personalizedRestaurants: [],
      personalizedDishes: [],
      favoriteCuisines: [],
      loadingPaired: false,
      loadingTrending: false,
      loadingPersonalized: false,
    });
  });

  it("should fetch frequently paired items", async () => {
    const mockDish: any = { _id: "dish1", name: "Garlic Bread", price: 120 };
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        pairedItems: [mockDish],
      },
    });

    await act(async () => {
      await useRecommendationStore.getState().fetchFrequentlyPaired("mainDish1", "rest1");
    });

    const state = useRecommendationStore.getState();
    expect(state.frequentlyPairedItems).toHaveLength(1);
    expect(state.frequentlyPairedItems[0].name).toBe("Garlic Bread");
  });

  it("should fetch trending restaurants and dishes", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        trending: {
          restaurants: [{ _id: "rest1", restaurantName: "Burger Hub" }],
          dishes: [{ _id: "dish2", name: "Cheese Burger", price: 150 }],
        },
      },
    });

    await act(async () => {
      await useRecommendationStore.getState().fetchTrending("Mumbai");
    });

    const state = useRecommendationStore.getState();
    expect(state.trendingRestaurants).toHaveLength(1);
    expect(state.trendingDishes).toHaveLength(1);
  });

  it("should fetch personalized recommendations", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        recommendations: {
          restaurants: [{ _id: "rest2", restaurantName: "Pasta Palace" }],
          dishes: [{ _id: "dish3", name: "Alfredo Pasta", price: 280 }],
          favoriteCuisines: ["Italian"],
        },
      },
    });

    await act(async () => {
      await useRecommendationStore.getState().fetchPersonalized();
    });

    const state = useRecommendationStore.getState();
    expect(state.personalizedRestaurants).toHaveLength(1);
    expect(state.personalizedDishes).toHaveLength(1);
    expect(state.favoriteCuisines).toContain("Italian");
  });
});

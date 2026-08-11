import { render, screen } from "@testing-library/react";
import SearchPage from "../SearchPage";
import { BrowserRouter } from "react-router-dom";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ text: "mumbai" }),
}));

jest.mock("@/store/useRestaurantStore", () => ({
  useRestaurantStore: () => ({
    loading: false,
    searchedRestaurant: {
      data: [
        {
          _id: "r1",
          restaurantName: "Pizza Palace",
          city: "Mumbai",
          country: "India",
          cuisines: ["Italian", "Pizza"],
          imageUrl: "pizza.jpg",
        },
      ],
    },
    searchRestaurant: jest.fn(),
    appliedFilter: [],
    setAppliedFilter: jest.fn(),
  }),
}));

describe("SearchPage Component", () => {
  test("renders search results correctly", () => {
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Pizza Palace")).toBeInTheDocument();
  });
});

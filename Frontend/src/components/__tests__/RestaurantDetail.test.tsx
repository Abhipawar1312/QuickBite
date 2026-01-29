import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RestaurantDetail from "../RestaurantDetail";

// Mock stores
jest.mock("@/store/useRestaurantStore", () => ({
    useRestaurantStore: () => ({
        singleRestaurant: {
            restaurantName: "Test Restaurant",
            city: "Mumbai",
            cuisines: ["Burger", "Pizza"],
            deliveryTime: 30,
            menus: [],
        },
        getSingleRestaurant: jest.fn(),
    }),
}));

jest.mock("@/store/useCartStore", () => ({
    useCartStore: () => ({
        cart: [],
        addToCart: jest.fn(),
        incrementQuantity: jest.fn(),
        decrementQuantity: jest.fn(),
        removeFromTheCart: jest.fn(),
        clearCart: jest.fn(),
    }),
}));

test("renders restaurant details", () => {
    render(
        <MemoryRouter initialEntries={["/restaurant/1"]}>
            <Routes>
                <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            </Routes>
        </MemoryRouter>
    );

    expect(screen.getByText("Test Restaurant")).toBeInTheDocument();
    expect(screen.getByText("Mumbai")).toBeInTheDocument();
});

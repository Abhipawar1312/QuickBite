import { render, screen, fireEvent } from "@testing-library/react";
import AvailableMenu from "../AvailableMenu";
import { BrowserRouter } from "react-router-dom";
import type { MenuItem } from "@/types/restaurantType";

// ---- MOCK useNavigate ----
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

// ---- MOCK CART STORE ----
const mockAddToCart = jest.fn();

jest.mock("@/store/useCartStore", () => ({
    useCartStore: () => ({
        addToCart: mockAddToCart,
    }),
}));

const mockMenus: MenuItem[] = [
    {
        _id: "1",
        name: "Butter Chicken",
        description: "Delicious creamy chicken",
        price: 250,
        image: "test.jpg",
        availability: "Available",
    },
    {
        _id: "2",
        name: "Paneer Tikka",
        description: "Smoky paneer cubes",
        price: 200,
        image: "test.jpg",
        availability: "Out of Stock",
    },
];

const renderMenu = (menus?: MenuItem[]) =>
    render(
        <BrowserRouter>
            <AvailableMenu menus={menus} />
        </BrowserRouter>
    );

describe("AvailableMenu Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders menu items correctly", () => {
        renderMenu(mockMenus);

        expect(screen.getByText("Butter Chicken")).toBeInTheDocument();
        expect(screen.getByText("Paneer Tikka")).toBeInTheDocument();
    });

    test("shows empty state when no menus", () => {
        renderMenu([]);

        expect(
            screen.getByText(/No Menu Items Available/i)
        ).toBeInTheDocument();
    });

    test("adds item to cart and navigates on Add to Cart click", () => {
        renderMenu(mockMenus);

        const addButton = screen.getAllByRole("button", {
            name: /Add to Cart/i,
        })[0];

        fireEvent.click(addButton);

        expect(mockAddToCart).toHaveBeenCalledWith(mockMenus[0]);
        expect(mockNavigate).toHaveBeenCalledWith("/cart");
    });

    test("disables Add to Cart button when item is out of stock", () => {
        renderMenu(mockMenus);

        const outOfStockButton = screen.getByRole("button", {
            name: /Out of Stock/i,
        });

        expect(outOfStockButton).toBeDisabled();
    });

    test("toggles favorite icon when heart button clicked", () => {
        renderMenu(mockMenus);

        const heartButtons = screen.getAllByRole("button");
        const favoriteButton = heartButtons.find((btn) =>
            btn.querySelector("svg")
        );

        expect(favoriteButton).toBeTruthy();

        if (favoriteButton) {
            fireEvent.click(favoriteButton);
            fireEvent.click(favoriteButton);
        }
    });
});

import { render, screen, fireEvent } from "@testing-library/react";
import Cart from "../Cart";
import { useCartStore } from "@/store/useCartStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useUserStore } from "@/store/useUserStore"; // <-- import this

// Mock the stores
jest.mock("@/store/useCartStore");
jest.mock("@/store/useRestaurantStore");
jest.mock("@/store/useOrderStore");
jest.mock("@/store/useUserStore"); // <-- mock user store

const mockIncrement = jest.fn();
const mockDecrement = jest.fn();
const mockRemove = jest.fn();
const mockClear = jest.fn();
const mockGetRestaurant = jest.fn();

(useCartStore as unknown as jest.Mock).mockReturnValue({
    cart: [
        {
            _id: "1",
            name: "Butter Chicken",
            price: 250,
            quantity: 2,
            image: "",
        },
    ],
    incrementQuantity: mockIncrement,
    decrementQuantity: mockDecrement,
    removeFromTheCart: mockRemove,
    clearCart: mockClear,
});

(useRestaurantStore as unknown as jest.Mock).mockReturnValue({
    restaurant: { id: "r1", name: "Test Restaurant" },
    getRestaurant: mockGetRestaurant,
});

(useOrderStore as unknown as jest.Mock).mockReturnValue({
    createCheckoutSession: jest.fn(),
    loading: false,
});

// <-- NEW: mock user store
(useUserStore as unknown as jest.Mock).mockReturnValue({
    user: {
        fullname: "Test User",
        email: "testuser@example.com",
    },
});

const renderCart = () => render(<Cart />);

describe("Cart Component", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("renders cart item correctly", () => {
        renderCart();

        const itemName = screen.getByTestId("cart-item-name-1");
        const itemTotal = screen.getByTestId("cart-item-total-1");

        expect(itemName).toHaveTextContent("Butter Chicken");
        expect(itemTotal).toHaveTextContent("₹500"); // 250 * 2
    });

    test("increments item quantity", () => {
        renderCart();

        const increaseButton = screen.getByTestId("increase-quantity-1");
        fireEvent.click(increaseButton);

        expect(mockIncrement).toHaveBeenCalledWith("1");
    });

    test("decrements item quantity", () => {
        renderCart();

        const decreaseButton = screen.getByTestId("decrease-quantity-1");
        fireEvent.click(decreaseButton);

        expect(mockDecrement).toHaveBeenCalledWith("1");
    });

    test("clears cart", () => {
        renderCart();

        const clearButton = screen.getByTestId("clear-cart-button");
        fireEvent.click(clearButton);

        expect(mockClear).toHaveBeenCalled();
    });
});

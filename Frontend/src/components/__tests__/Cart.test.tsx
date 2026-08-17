import { render, screen, fireEvent } from "@testing-library/react";
import Cart from "../Cart";
import { BrowserRouter } from "react-router-dom";
import { useCartStore } from "@/store/useCartStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useUserStore } from "@/store/useUserStore";
import { useCouponStore } from "@/store/useCouponStore";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

// Mock the stores
jest.mock("@/store/useCartStore");
jest.mock("@/store/useRestaurantStore");
jest.mock("@/store/useOrderStore");
jest.mock("@/store/useUserStore");
jest.mock("@/store/useCouponStore");


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
    restaurantName: "Test Restaurant",
    tipAmount: 0,
    couponCode: "",
    discountAmount: 0,
    removeAddOnFromCartItem: jest.fn(),
    updateCartItemAddOns: jest.fn(),
    setTipAmount: jest.fn(),
    setCoupon: jest.fn(),
    clearCoupon: jest.fn(),
});

(useRestaurantStore as unknown as jest.Mock).mockReturnValue({
    restaurant: { id: "r1", name: "Test Restaurant" },
    singleRestaurant: { isOpen: true, menus: [] },
    getRestaurant: mockGetRestaurant,
});

(useOrderStore as unknown as jest.Mock).mockReturnValue({
    createCheckoutSession: jest.fn(),
    loading: false,
});

(useUserStore as unknown as jest.Mock).mockReturnValue({
    user: {
        fullname: "Test User",
        email: "testuser@example.com",
    },
});

(useCouponStore as unknown as jest.Mock).mockReturnValue({
    activeCoupons: [],
    getActiveCoupons: jest.fn(),
    applyCoupon: jest.fn(),
});

const renderCart = () => render(<Cart />);

describe("Cart Component", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("renders cart item correctly", () => {
        renderCart();

        expect(screen.getAllByText("Butter Chicken")[0]).toBeInTheDocument();
        expect(screen.getAllByText("₹500")[0]).toBeInTheDocument();
    });

    test("clears cart", () => {
        renderCart();

        const clearButton = screen.getByRole("button", { name: /clear cart/i });
        fireEvent.click(clearButton);

        expect(mockClear).toHaveBeenCalled();
    });

    test("navigates to /search/all when Explore Restaurants is clicked in empty cart", () => {
        (useCartStore as unknown as jest.Mock).mockReturnValueOnce({
            cart: [],
            restaurantName: "",
            tipAmount: 0,
            couponCode: "",
            discountAmount: 0,
            clearCart: mockClear,
        });

        renderCart();
        expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();

        const exploreBtn = screen.getByRole("button", { name: /Explore Restaurants/i });
        fireEvent.click(exploreBtn);

        expect(mockNavigate).toHaveBeenCalledWith("/search/all");
    });
});



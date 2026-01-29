import { render, screen, fireEvent } from "@testing-library/react";
import CheckoutConfirmPage from "../CheckoutConfirmPage";

const mockCreateCheckoutSession = jest.fn();
const mockSetOpen = jest.fn();

jest.mock("@/store/useUserStore", () => ({
    useUserStore: () => ({
        user: {
            fullname: "Abhi",
            email: "abhi@test.com",
            contact: "9999999999",
            address: "Test Street",
            city: "Mumbai",
            country: "India",
        },
    }),
}));

jest.mock("@/store/useCartStore", () => ({
    useCartStore: () => ({
        cart: [
            {
                _id: "1",
                name: "Pizza",
                price: 200,
                quantity: 1,
                image: "test.jpg",
            },
        ],
    }),
}));

jest.mock("@/store/useRestaurantStore", () => ({
    useRestaurantStore: () => ({
        restaurant: { _id: "rest1" },
        getRestaurant: jest.fn(),
    }),
}));

jest.mock("@/store/useOrderStore", () => ({
    useOrderStore: () => ({
        createCheckoutSession: mockCreateCheckoutSession,
        loading: false,
    }),
}));

describe("CheckoutConfirmPage", () => {
    test("renders checkout dialog", () => {
        render(
            <CheckoutConfirmPage open={true} setOpen={mockSetOpen} />
        );

        expect(
            screen.getByText(/review your order/i)
        ).toBeInTheDocument();
    });

    test("submits checkout form", () => {
        render(
            <CheckoutConfirmPage open={true} setOpen={mockSetOpen} />
        );

        fireEvent.click(
            screen.getByRole("button", { name: /continue to payment/i })
        );

        expect(mockCreateCheckoutSession).toHaveBeenCalled();
    });
});

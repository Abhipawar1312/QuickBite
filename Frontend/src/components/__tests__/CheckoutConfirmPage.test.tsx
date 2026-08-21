import { render, screen, fireEvent } from "@testing-library/react";
import CheckoutConfirmPage from "../CheckoutConfirmPage";

const mockCreateCheckoutSession = jest.fn();
const mockSetOpen = jest.fn();

const mockUser = {
    fullname: "Abhi",
    email: "abhi@test.com",
    contact: "9999999999",
    address: "Test Street",
    city: "Mumbai",
    country: "India",
    pincode: "400070",
};

jest.mock("@/store/useUserStore", () => ({
    useUserStore: () => ({
        user: mockUser,
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
        tipAmount: 0,
        couponCode: "",
        discountAmount: 0,
        deliveryInstructions: "",
        restaurantNote: "",
        scheduledDeliveryTime: "",
        setDeliveryInstructions: jest.fn(),
        setRestaurantNote: jest.fn(),
        setScheduledDeliveryTime: jest.fn(),
    }),
}));


jest.mock("@/store/useRestaurantStore", () => ({
    useRestaurantStore: () => ({
        singleRestaurant: { _id: "rest1" },
        getRestaurant: jest.fn(),
    }),
}));

jest.mock("@/store/useOrderStore", () => ({
    useOrderStore: () => ({
        createCheckoutSession: mockCreateCheckoutSession,
        loading: false,
    }),
}));

jest.mock("../MapAddressPicker", () => ({
    MapAddressPicker: () => null,
}));

jest.mock("../ui/dialog", () => ({
    Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

describe("CheckoutConfirmPage", () => {

    test("renders checkout dialog", () => {
        render(
            <CheckoutConfirmPage open={true} setOpen={mockSetOpen} />
        );

        expect(
            screen.getByText(/confirm delivery & checkout/i)
        ).toBeInTheDocument();
    });

    test("submits checkout form", () => {
        render(
            <CheckoutConfirmPage open={true} setOpen={mockSetOpen} />
        );

        fireEvent.change(screen.getByPlaceholderText(/pincode/i), {
            target: { value: "400070", name: "pincode" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: /proceed to payment/i })
        );

        expect(mockCreateCheckoutSession).toHaveBeenCalled();
    });

    test("renders cooking instructions input and handles chip clicks", () => {
        render(
            <CheckoutConfirmPage open={true} setOpen={mockSetOpen} />
        );

        expect(
            screen.getByText(/Cooking Instructions \/ Restaurant Note/i)
        ).toBeInTheDocument();

        const lessSpicyChip = screen.getByRole("button", { name: /\+ Less spicy/i });
        expect(lessSpicyChip).toBeInTheDocument();
        fireEvent.click(lessSpicyChip);

        const input = screen.getByPlaceholderText(/Make it less spicy, extra mint chutney/i) as HTMLInputElement;
        expect(input.value).toContain("Less spicy");
    });
});



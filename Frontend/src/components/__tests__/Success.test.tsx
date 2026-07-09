import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Success from "../Success";
import { useOrderStore } from "@/store/useOrderStore";
import { useReviewStore } from "@/store/useReviewStore";
import { useCartStore } from "@/store/useCartStore";

const mockGetOrderDetails = jest.fn();
const mockUpdateLocalOrderStatus = jest.fn();
const mockMarkOrderAsReviewed = jest.fn();
const mockClearCart = jest.fn();
const mockSetCart = jest.fn();
const mockCreateReview = jest.fn();

jest.mock("@/store/useOrderStore", () => ({
    useOrderStore: jest.fn(() => ({
        orders: [],
        getOrderDetails: mockGetOrderDetails,
        updateLocalOrderStatus: mockUpdateLocalOrderStatus,
        markOrderAsReviewed: mockMarkOrderAsReviewed,
    })),
}));

jest.mock("@/store/useCartStore", () => ({
    useCartStore: jest.fn(() => ({
        clearCart: mockClearCart,
        setCart: mockSetCart,
    })),
}));

jest.mock("@/store/useReviewStore", () => ({
    useReviewStore: jest.fn(() => ({
        createReview: mockCreateReview,
        loading: false,
    })),
}));

// Mock socket.io-client
jest.mock("socket.io-client", () => ({
    io: jest.fn(() => ({
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
    })),
}));

describe("Success Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(URLSearchParams.prototype, "get").mockImplementation((key) => {
            if (key === "success") return "true";
            return null;
        });
    });

    test("renders no orders found state", () => {
        (useOrderStore as unknown as jest.Mock).mockReturnValue({
            orders: [],
            getOrderDetails: mockGetOrderDetails,
            updateLocalOrderStatus: mockUpdateLocalOrderStatus,
            markOrderAsReviewed: mockMarkOrderAsReviewed,
        });

        render(
            <MemoryRouter>
                <Success />
            </MemoryRouter>
        );

        expect(screen.getByText("No orders found")).toBeInTheDocument();
        expect(mockGetOrderDetails).toHaveBeenCalledWith(true);
        expect(mockClearCart).toHaveBeenCalled();
    });

    test("renders orders list correctly", () => {
        const mockOrder = {
            _id: "order123456",
            status: "pending",
            totalAmount: 500,
            cartItems: [
                {
                    menuId: "menu1",
                    name: "Burgers",
                    price: 250,
                    quantity: 2,
                    image: "burger.jpg",
                },
            ],
            restaurant: {
                restaurantName: "Tasty Burgers",
                location: { coordinates: [72.8777, 19.076] },
            },
            deliveryDetails: {
                name: "Customer",
                latitude: 19.076,
                longitude: 72.8777,
            },
        };

        (useOrderStore as unknown as jest.Mock).mockReturnValue({
            orders: [mockOrder],
            getOrderDetails: mockGetOrderDetails,
            updateLocalOrderStatus: mockUpdateLocalOrderStatus,
            markOrderAsReviewed: mockMarkOrderAsReviewed,
        });

        render(
            <MemoryRouter>
                <Success />
            </MemoryRouter>
        );

        expect(screen.getByText("Order #123456")).toBeInTheDocument();
        expect(screen.getByText("Burgers")).toBeInTheDocument();
        expect(screen.getAllByText("500").length).toBe(2);
        expect(screen.getByText("pending")).toBeInTheDocument();
    });

    test("submits rating/review for delivered order", async () => {
        const mockOrder = {
            _id: "order123456",
            status: "delivered",
            totalAmount: 500,
            cartItems: [
                {
                    menuId: "menu1",
                    name: "Burgers",
                    price: 250,
                    quantity: 2,
                    image: "burger.jpg",
                },
            ],
            isReviewed: false,
        };

        (useOrderStore as unknown as jest.Mock).mockReturnValue({
            orders: [mockOrder],
            getOrderDetails: mockGetOrderDetails,
            updateLocalOrderStatus: mockUpdateLocalOrderStatus,
            markOrderAsReviewed: mockMarkOrderAsReviewed,
        });

        mockCreateReview.mockResolvedValue({ success: true });

        render(
            <MemoryRouter>
                <Success />
            </MemoryRouter>
        );

        // Click Rate & Review Order button
        const reviewBtn = screen.getByRole("button", { name: /rate & review order/i });
        fireEvent.click(reviewBtn);

        // Fill comment
        const commentArea = screen.getByPlaceholderText(/delicious taste/i);
        fireEvent.change(commentArea, { target: { value: "Awesome food!" } });

        // Submit review
        fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

        await waitFor(() => {
            expect(mockCreateReview).toHaveBeenCalledWith("order123456", 5, "Awesome food!");
            expect(mockMarkOrderAsReviewed).toHaveBeenCalledWith("order123456");
        });
    });
});

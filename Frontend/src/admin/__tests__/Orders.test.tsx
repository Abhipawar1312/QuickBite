import { render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import Orders from "../Orders"; // default import
import { useRestaurantStore } from "@/store/useRestaurantStore";

const mockGetOrders = jest.fn();
const mockUpdateOrder = jest.fn();

jest.mock("@/store/useRestaurantStore", () => ({
    useRestaurantStore: jest.fn(),
}));

describe("Orders Component", () => {
    beforeEach(() => {
        (useRestaurantStore as unknown as jest.Mock).mockReturnValue({
            restaurantOrder: [
                {
                    _id: "1234567890abcdef",
                    deliveryDetails: { name: "John Doe", address: "123 Street" },
                    cartItems: [{ name: "Pizza", quantity: 2 }],
                    totalAmount: 500,
                    status: "pending",
                },
            ],
            getRestaurantOrders: mockGetOrders,
            updateRestaurantOrder: mockUpdateOrder,
        });
    });

    it("calls getRestaurantOrders on mount", async () => {
        await act(async () => {
            render(<Orders />);
        });
        expect(mockGetOrders).toHaveBeenCalled();
    });

    it("renders order details correctly", async () => {
        await act(async () => {
            render(<Orders />);
        });
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Order #abcdef")).toBeInTheDocument(); // last 6 chars
        expect(screen.getByText("2 items")).toBeInTheDocument();
        expect(screen.getByText("₹500")).toBeInTheDocument();
    });

    it("shows empty state when no orders exist", async () => {
        (useRestaurantStore as unknown as jest.Mock).mockReturnValueOnce({
            restaurantOrder: [],
            getRestaurantOrders: mockGetOrders,
            updateRestaurantOrder: mockUpdateOrder,
        });

        await act(async () => {
            render(<Orders />);
        });

        expect(screen.getByText(/No orders yet/i)).toBeInTheDocument();
    });
});

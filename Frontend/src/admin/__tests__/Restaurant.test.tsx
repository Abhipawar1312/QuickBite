// src/admin/__tests__/Restaurant.test.tsx
import { render, screen, fireEvent, act } from "@testing-library/react";
import Restaurant from "../Restaurant";
import { useRestaurantStore } from "@/store/useRestaurantStore";

// Mock functions
const mockGetRestaurant = jest.fn();
const mockCreateRestaurant = jest.fn();
const mockUpdateRestaurant = jest.fn();
const mockClearRestaurantData = jest.fn();

// Mock the store
jest.mock("@/store/useRestaurantStore", () => ({
    useRestaurantStore: jest.fn(),
}));

describe("Restaurant Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (useRestaurantStore as jest.Mock).mockReturnValue({
            loading: false,
            restaurant: null,
            getRestaurant: mockGetRestaurant,
            createRestaurant: mockCreateRestaurant.mockResolvedValue({}), // async mock
            updateRestaurant: mockUpdateRestaurant.mockResolvedValue({}),
            clearRestaurantData: mockClearRestaurantData,
        });
    });

    it("calls getRestaurant and clearRestaurantData on mount", async () => {
        await act(async () => {
            render(<Restaurant />);
        });

        expect(mockClearRestaurantData).toHaveBeenCalled();
        expect(mockGetRestaurant).toHaveBeenCalled();
    });

    it("renders Add Restaurant header when no restaurant exists", async () => {
        await act(async () => {
            render(<Restaurant />);
        });

        expect(
            screen.getByRole("heading", { name: /Add Restaurant/i })
        ).toBeInTheDocument();
    });

    it("updates input fields correctly", async () => {
        await act(async () => {
            render(<Restaurant />);
        });

        const nameInput = screen.getByPlaceholderText(/Enter your restaurant name/i);
        fireEvent.change(nameInput, { target: { value: "Test Restaurant" } });
        expect(nameInput).toHaveValue("Test Restaurant");
    });

    it("submits the form via createRestaurant when restaurant is null", async () => {
        await act(async () => {
            render(<Restaurant />);
        });

        // Fill in required fields
        fireEvent.change(screen.getByPlaceholderText(/Enter your restaurant name/i), {
            target: { value: "Test Restaurant" },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter your city name/i), {
            target: { value: "Test City" },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter your country name/i), {
            target: { value: "Test Country" },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter delivery time/i), {
            target: { value: 30 },
        });
        fireEvent.change(screen.getByPlaceholderText(/e.g. Momos, Biryani, Chinese/i), {
            target: { value: "Momos,Biryani" },
        });

        // Submit the form
        const form = screen.getByTestId("restaurant-form");
        await act(async () => {
            fireEvent.submit(form);
        });

        // Ensure createRestaurant was called
        expect(mockCreateRestaurant).toHaveBeenCalled();
    });
});

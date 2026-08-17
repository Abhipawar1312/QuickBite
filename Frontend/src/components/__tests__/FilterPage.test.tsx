import { render, screen, fireEvent } from "@testing-library/react";
import FilterPage from "../FilterPage";
import { useRestaurantStore } from "@/store/useRestaurantStore";

jest.mock("@/store/useRestaurantStore");

const mockSetAppliedFilter = jest.fn();
const mockResetAppliedFilter = jest.fn();
const mockFetchAllCuisines = jest.fn();

(useRestaurantStore as unknown as jest.Mock).mockReturnValue({
    appliedFilter: [],
    setAppliedFilter: mockSetAppliedFilter,
    resetAppliedFilter: mockResetAppliedFilter,
    allCuisines: ["Biryani", "Burger", "Chinese", "Momos", "Pizza"],
    fetchAllCuisines: mockFetchAllCuisines,
    searchedRestaurant: { data: [] },
});

describe("FilterPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders filter heading and fetches cuisines on mount", () => {
        render(<FilterPage />);
        expect(screen.getByText(/Filter by Cuisine/i)).toBeInTheDocument();
        expect(mockFetchAllCuisines).toHaveBeenCalled();
    });

    test("applies filter when clicking option", () => {
        render(<FilterPage />);

        fireEvent.click(screen.getByText("Burger"));
        expect(mockSetAppliedFilter).toHaveBeenCalledWith("Burger");
    });

    test("resets filters when reset button clicked", () => {
        render(<FilterPage />);

        fireEvent.click(screen.getByText(/reset/i));
        expect(mockResetAppliedFilter).toHaveBeenCalled();
    });

    test("filters cuisine list via the in-sidebar search input", () => {
        render(<FilterPage />);

        const searchInput = screen.getByPlaceholderText(/search cuisines/i);
        fireEvent.change(searchInput, { target: { value: "Mom" } });

        expect(screen.getByText("Momos")).toBeInTheDocument();
        expect(screen.queryByText("Burger")).not.toBeInTheDocument();
    });
});


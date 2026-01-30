import { render, screen, fireEvent } from "@testing-library/react";
import FilterPage from "../FilterPage";
import { useRestaurantStore } from "@/store/useRestaurantStore";

jest.mock("@/store/useRestaurantStore");

const mockSetAppliedFilter = jest.fn();
const mockResetAppliedFilter = jest.fn();

(useRestaurantStore as unknown as jest.Mock).mockReturnValue({
    appliedFilter: [],
    setAppliedFilter: mockSetAppliedFilter,
    resetAppliedFilter: mockResetAppliedFilter,
});

describe("FilterPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders filter heading", () => {
        render(<FilterPage />);
        expect(screen.getByText(/Filter by Cuisine/i)).toBeInTheDocument();
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
});

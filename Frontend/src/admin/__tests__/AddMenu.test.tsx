import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddMenu from "../AddMenu";

// IMPORTANT: mock with factory
jest.mock("@/store/useMenuStore", () => ({
    useMenuStore: jest.fn(),
}));

jest.mock("@/store/useRestaurantStore", () => ({
    useRestaurantStore: jest.fn(),
}));

import { useMenuStore } from "@/store/useMenuStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";

describe("AddMenu Component", () => {
    const mockCreateMenu = jest.fn();
    const mockDeleteMenu = jest.fn();
    const mockToggleMenuAvailability = jest.fn();
    const mockGetRestaurant = jest.fn();
    const mockClearRestaurantData = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // ✅ Now this works
        (useMenuStore as jest.Mock).mockReturnValue({
            loading: false,
            createMenu: mockCreateMenu,
            deleteMenu: mockDeleteMenu,
            toggleMenuAvailability: mockToggleMenuAvailability,
            clearMenuData: jest.fn(),
        });

        (useRestaurantStore as jest.Mock).mockReturnValue({
            restaurant: { menus: [] },
            getRestaurant: mockGetRestaurant,
            clearRestaurantData: mockClearRestaurantData,
            addMenuToRestaurant: jest.fn(),
            updateMenuToRestaurant: jest.fn(),
            removeMenuFromRestaurant: jest.fn(),
            updateMenuAvailability: jest.fn(),
        });
    });

    it("renders Add Menu button and opens dialog", async () => {
        render(<AddMenu />);

        const addButton = screen.getByRole("button", { name: /add menu/i });
        expect(addButton).toBeInTheDocument();

        await userEvent.click(addButton);

        expect(
            await screen.findByText(/add new menu/i)
        ).toBeInTheDocument();
    });

    it("shows validation errors on empty submit", async () => {
        render(<AddMenu />);

        await userEvent.click(screen.getByRole("button", { name: /add menu/i }));
        await userEvent.click(screen.getByRole("button", { name: /submit/i }));

        await waitFor(() => {
            expect(screen.getByText(/name is required/i)).toBeInTheDocument();
            expect(screen.getByText(/description is required/i)).toBeInTheDocument();
        });
    });

    it("calls createMenu when form is valid", async () => {
        render(<AddMenu />);

        await userEvent.click(screen.getByRole("button", { name: /add menu/i }));

        await userEvent.type(
            screen.getByPlaceholderText(/enter menu name/i),
            "Pizza"
        );

        await userEvent.type(
            screen.getByPlaceholderText(/enter menu description/i),
            "Cheese pizza"
        );

        const priceInput = screen.getByPlaceholderText(/enter menu price/i);
        await userEvent.clear(priceInput);
        await userEvent.type(priceInput, "250");

        const file = new File(["pizza"], "pizza.png", { type: "image/png" });
        const imageInput = screen.getByTestId("menu-image-input");
        await userEvent.upload(imageInput, file);


        await userEvent.click(screen.getByRole("button", { name: /submit/i }));

        await waitFor(() => {
            expect(mockCreateMenu).toHaveBeenCalledTimes(1);
        });
    });

    it("renders empty state when no menus exist", () => {
        render(<AddMenu />);

        expect(
            screen.getByText(/no menu items yet/i)
        ).toBeInTheDocument();
    });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditMenu from "../EditMenu";
import { useMenuStore } from "@/store/useMenuStore";

jest.mock("@/store/useMenuStore", () => ({
    useMenuStore: jest.fn(),
}));

const mockEditMenu = jest.fn();

const selectedMenu = {
    _id: "menu123",
    name: "Pizza",
    description: "Cheese Pizza",
    price: 199,
    availability: "Available",
};

const setup = () => {
    const setEditOpen = jest.fn();

    (useMenuStore as unknown as jest.Mock).mockReturnValue({
        loading: false,
        editMenu: mockEditMenu,
    });

    render(
        <EditMenu
            selectedMenu={selectedMenu as any}
            editOpen={true}
            setEditOpen={setEditOpen}
        />
    );

    return { setEditOpen };
};

describe("EditMenu Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders dialog with prefilled data", () => {
        setup();

        expect(screen.getByText(/edit menu/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue("Pizza")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Cheese Pizza")).toBeInTheDocument();
        expect(screen.getByDisplayValue("199")).toBeInTheDocument();
    });

    it("shows validation errors on empty submit", async () => {
        setup();

        await userEvent.clear(screen.getByPlaceholderText(/enter menu name/i));
        await userEvent.clear(
            screen.getByPlaceholderText(/enter menu description/i)
        );
        await userEvent.clear(
            screen.getByPlaceholderText(/enter menu price/i)
        );

        await userEvent.click(
            screen.getByRole("button", { name: /update menu/i })
        );

        expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/description is required/i)).toBeInTheDocument();

    });

    it("toggles availability switch", async () => {
        setup();

        const switchBtn = screen.getByRole("switch");
        expect(switchBtn).toHaveAttribute("aria-checked", "true");

        await userEvent.click(switchBtn);

        await waitFor(() => {
            expect(switchBtn).toHaveAttribute("aria-checked", "false");
        });
    });

    it("calls editMenu when form is valid", async () => {
        const { setEditOpen } = setup();

        await userEvent.clear(screen.getByPlaceholderText(/enter menu name/i));
        await userEvent.type(
            screen.getByPlaceholderText(/enter menu name/i),
            "Burger"
        );

        await userEvent.clear(
            screen.getByPlaceholderText(/enter menu description/i)
        );
        await userEvent.type(
            screen.getByPlaceholderText(/enter menu description/i),
            "Veg Burger"
        );

        await userEvent.clear(
            screen.getByPlaceholderText(/enter menu price/i)
        );
        await userEvent.type(
            screen.getByPlaceholderText(/enter menu price/i),
            "149"
        );

        await userEvent.click(
            screen.getByRole("button", { name: /update menu/i })
        );

        await waitFor(() => {
            expect(mockEditMenu).toHaveBeenCalledWith(
                "menu123",
                expect.any(FormData)
            );
        });

        await waitFor(() => {
            expect(setEditOpen).toHaveBeenCalledWith(false);
        });
    });
});

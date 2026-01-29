import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "../Profile";

// ---------- MOCK STORE ----------
const mockUpdateProfile = jest.fn();

jest.mock("@/store/useUserStore", () => ({
    useUserStore: jest.fn(() => ({
        user: {
            fullname: "Abhi Pawar",
            email: "abhi@test.com",
            address: "Mumbai",
            city: "Mumbai",
            country: "India",
            profilePicture: "",
        },
        updateProfile: mockUpdateProfile,
    })),
}));

describe("Profile Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders user information", () => {
        render(<Profile />);

        expect(screen.getByText("Your Profile")).toBeInTheDocument();
        expect(screen.getByText("Abhi Pawar")).toBeInTheDocument();
        expect(screen.getByText("abhi@test.com")).toBeInTheDocument();
    });

    test("edit button enables edit mode", () => {
        render(<Profile />);

        const editButton = screen.getAllByRole("button")[0];
        fireEvent.click(editButton);

        const fullNameInput = screen.getByPlaceholderText(/enter your full name/i);
        expect(fullNameInput).not.toBeDisabled();
    });

    test("cancel button exits edit mode", async () => {
        render(<Profile />);

        // Enter edit mode
        fireEvent.click(screen.getAllByRole("button")[0]);

        // Cancel
        fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

        await waitFor(() => {
            expect(
                screen.queryByRole("button", { name: /update profile/i })
            ).not.toBeInTheDocument();
        });
    });

    test("updates profile on submit", async () => {
        render(<Profile />);

        // Enter edit mode
        fireEvent.click(screen.getAllByRole("button")[0]);

        const nameInput = screen.getByPlaceholderText(/enter your full name/i);
        fireEvent.change(nameInput, {
            target: { value: "New Name", name: "fullname" },
        });

        fireEvent.click(screen.getByRole("button", { name: /update profile/i }));

        await waitFor(() => {
            expect(mockUpdateProfile).toHaveBeenCalledWith(
                expect.objectContaining({
                    fullname: "New Name",
                })
            );
        });
    });
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResetPassword from "../ResetPassword";
import { BrowserRouter } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";

// 🔹 Mock framer-motion (VERY IMPORTANT)
jest.mock("framer-motion", () => ({
    motion: {
        div: ({ children }: any) => <div>{children}</div>,
        img: ({ children }: any) => <img>{children}</img>,
    },
}));

// 🔹 Mock user store
jest.mock("@/store/useUserStore");

const mockResetPassword = jest.fn();
const mockNavigate = jest.fn();

// 🔹 Mock react-router hooks
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
    useParams: () => ({ token: "fake-reset-token" }),
}));

describe("ResetPassword Component", () => {
    beforeEach(() => {
        (useUserStore as jest.Mock).mockReturnValue({
            loading: false,
            resetPassword: mockResetPassword,
        });

        jest.clearAllMocks();
    });

    const renderComponent = () =>
        render(
            <BrowserRouter>
                <ResetPassword />
            </BrowserRouter>
        );

    test("renders reset password heading", () => {
        renderComponent();

        expect(
            screen.getByRole("heading", { name: /reset password/i })
        ).toBeInTheDocument();
    });

    test("allows user to type new password", () => {
        renderComponent();

        const input = screen.getByPlaceholderText(/new password/i);
        fireEvent.change(input, { target: { value: "newPassword123" } });

        expect(input).toHaveValue("newPassword123");
    });

    test("submits form and calls resetPassword", async () => {
        mockResetPassword.mockResolvedValueOnce({});

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText(/new password/i), {
            target: { value: "newPassword123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

        await waitFor(() => {
            expect(mockResetPassword).toHaveBeenCalledWith(
                "fake-reset-token",
                "newPassword123"
            );
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    test("does not crash if resetPassword throws error", async () => {
        mockResetPassword.mockRejectedValueOnce(new Error("Invalid token"));

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText(/new password/i), {
            target: { value: "newPassword123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

        await waitFor(() => {
            expect(mockResetPassword).toHaveBeenCalled();
        });
    });

    test("shows loading button when loading is true", () => {
        (useUserStore as jest.Mock).mockReturnValue({
            loading: true,
            resetPassword: mockResetPassword,
        });

        renderComponent();

        expect(screen.getByText(/please wait/i)).toBeInTheDocument();
    });
});

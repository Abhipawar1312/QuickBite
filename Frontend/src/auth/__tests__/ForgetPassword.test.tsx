import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import ForgetPassword from "../ForgetPassword";
import * as userStore from "@/store/useUserStore";

/* ---------------- MOCKS ---------------- */

// ✅ Mock framer-motion (IGNORE animations)
jest.mock("framer-motion", () => ({
    motion: {
        div: ({ children }: any) => <div>{children}</div>,
        img: ({ children }: any) => <img>{children}</img>,
    },
}));

// ✅ Mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

// ✅ Mock store
const mockForgotPassword = jest.fn();

jest.spyOn(userStore, "useUserStore").mockReturnValue({
    loading: false,
    forgotPassword: mockForgotPassword,
} as any);

// Helper render
const renderComponent = () =>
    render(
        <BrowserRouter>
            <ForgetPassword />
        </BrowserRouter>
    );

/* ---------------- TESTS ---------------- */

describe("ForgetPassword Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders forget password page correctly", () => {
        renderComponent();

        expect(
            screen.getByRole("heading", { name: /forgot password/i })
        ).toBeInTheDocument();

        expect(
            screen.getByPlaceholderText(/enter your email/i)
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /send reset link/i })
        ).toBeInTheDocument();
    });

    test("updates email input value", async () => {
        const user = userEvent.setup();
        renderComponent();

        const emailInput = screen.getByPlaceholderText(/enter your email/i);
        await user.type(emailInput, "abhi@test.com");

        expect(emailInput).toHaveValue("abhi@test.com");
    });

    test("calls forgotPassword and navigates on success", async () => {
        const user = userEvent.setup();
        renderComponent();

        mockForgotPassword.mockResolvedValueOnce(undefined);

        const emailInput = screen.getByPlaceholderText(/enter your email/i);
        const submitBtn = screen.getByRole("button", {
            name: /send reset link/i,
        });

        await user.type(emailInput, "abhi@test.com");
        await user.click(submitBtn);

        expect(mockForgotPassword).toHaveBeenCalledWith("abhi@test.com");
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    test("does not navigate if forgotPassword fails", async () => {
        const user = userEvent.setup();
        renderComponent();

        mockForgotPassword.mockRejectedValueOnce(
            new Error("User not found")
        );

        const emailInput = screen.getByPlaceholderText(/enter your email/i);
        const submitBtn = screen.getByRole("button", {
            name: /send reset link/i,
        });

        await user.type(emailInput, "wrong@test.com");
        await user.click(submitBtn);

        expect(mockForgotPassword).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});

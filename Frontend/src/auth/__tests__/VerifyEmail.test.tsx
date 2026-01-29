import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VerifyEmail from "../VerifyEmail";
import { BrowserRouter } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";

// 🔹 Mock framer-motion
jest.mock("framer-motion", () => ({
    motion: {
        div: ({ children }: any) => <div>{children}</div>,
        img: ({ children }: any) => <img>{children}</img>,
    },
}));

// 🔹 Mock Zustand store
jest.mock("@/store/useUserStore");

const mockVerifyEmail = jest.fn();
const mockNavigate = jest.fn();

// 🔹 Mock react-router
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

describe("VerifyEmail Component", () => {
    beforeEach(() => {
        (useUserStore as jest.Mock).mockReturnValue({
            loading: false,
            verifyEmail: mockVerifyEmail,
        });

        jest.clearAllMocks();
    });

    const renderComponent = () =>
        render(
            <BrowserRouter>
                <VerifyEmail />
            </BrowserRouter>
        );

    test("renders verify email heading", () => {
        renderComponent();

        expect(
            screen.getByRole("heading", { name: /verify email/i })
        ).toBeInTheDocument();
    });

    test("renders OTP input slots", () => {
        renderComponent();

        // InputOTP renders 6 inputs internally
        const inputs = screen.getAllByRole("textbox");
        expect(inputs.length).toBeGreaterThanOrEqual(1);
    });

    test("submits OTP and calls verifyEmail", async () => {
        mockVerifyEmail.mockResolvedValueOnce({});

        renderComponent();

        // Since InputOTP is a controlled component,
        // we simulate typing via fireEvent on first input
        const otpInput = screen.getAllByRole("textbox")[0];

        fireEvent.change(otpInput, {
            target: { value: "123456" },
        });

        fireEvent.click(screen.getByRole("button", { name: /verify/i }));

        await waitFor(() => {
            expect(mockVerifyEmail).toHaveBeenCalledWith("123456");
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    test("does not crash when verifyEmail throws error", async () => {
        mockVerifyEmail.mockRejectedValueOnce(new Error("Invalid OTP"));

        renderComponent();

        const otpInput = screen.getAllByRole("textbox")[0];

        fireEvent.change(otpInput, {
            target: { value: "000000" },
        });

        fireEvent.click(screen.getByRole("button", { name: /verify/i }));

        await waitFor(() => {
            expect(mockVerifyEmail).toHaveBeenCalled();
        });
    });

    test("shows loading state when loading is true", () => {
        (useUserStore as jest.Mock).mockReturnValue({
            loading: true,
            verifyEmail: mockVerifyEmail,
        });

        renderComponent();

        expect(screen.getByText(/verifying/i)).toBeInTheDocument();
    });

    test("back to login button navigates correctly", () => {
        renderComponent();

        fireEvent.click(screen.getByText(/back to login/i));

        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
});

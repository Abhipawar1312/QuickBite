import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUp from "../SignUp";
import { BrowserRouter } from "react-router-dom";
import * as userStore from "../../store/useUserStore";

const mockNavigate = jest.fn();
const mockSignup = jest.fn();



jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

jest.spyOn(userStore, "useUserStore").mockReturnValue({
    signup: mockSignup,
    loading: false,
} as any);

const renderComponent = () =>
    render(
        <BrowserRouter>
            <SignUp />
        </BrowserRouter>
    );

function fillSignUpForm() {
    fireEvent.change(screen.getByPlaceholderText(/Full Name/i), {
        target: { value: "Abhi Pawar", name: "fullname" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), {
        target: { value: "abhi@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
        target: { value: "123456", name: "password" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Contact Number/i), {
        target: { value: "9876543210", name: "contact" },
    });
}

describe("SignUp Component", () => {
    beforeEach(() => {
        mockSignup.mockReset();
    });

    test("renders all form fields", () => {
        renderComponent();

        expect(screen.getByPlaceholderText(/Full Name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Contact Number/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Sign Up/i })).toBeInTheDocument();
    });

    test("updates input values on change", () => {
        renderComponent();
        fillSignUpForm();

        expect(screen.getByPlaceholderText(/Full Name/i)).toHaveValue("Abhi Pawar");
        expect(screen.getByPlaceholderText(/Email/i)).toHaveValue("abhi@test.com");
        expect(screen.getByPlaceholderText(/Password/i)).toHaveValue("123456");
        // type="number" inputs can report value as string or number depending on env
        const contactInput = screen.getByPlaceholderText(/Contact Number/i) as HTMLInputElement;
        expect(String(contactInput.value)).toBe("9876543210");
    });

    test("toggles password visibility", async () => {
        const user = userEvent.setup({ delay: null });
        renderComponent();

        const passwordInput = screen.getByPlaceholderText(/Password/i);
        const toggleBtn = screen.getByTestId("toggle-password-visibility");

        expect(passwordInput).toHaveAttribute("type", "password");

        await user.click(toggleBtn);
        expect(passwordInput).toHaveAttribute("type", "text");

        await user.click(toggleBtn);
        expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("calls signup on valid form submit", async () => {
        renderComponent();
        fillSignUpForm();

        fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

        expect(mockSignup).toHaveBeenCalledWith({
            fullname: "Abhi Pawar",
            email: "abhi@test.com",
            password: "123456",
            contact: "9876543210",
        });
    });

    test("shows error when email already exists", async () => {
        mockSignup.mockRejectedValueOnce(new Error("Email already exists"));
        renderComponent();
        fillSignUpForm();

        fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

        const errorMessage = await screen.findByText(/Email already exists/i);
        expect(errorMessage).toBeInTheDocument();
    });

    test("shows error when contact already exists", async () => {
        mockSignup.mockRejectedValueOnce(new Error("Contact number already exists"));
        renderComponent();
        fillSignUpForm();

        fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

        const errorMessage = await screen.findByText(/Contact number already exists/i);
        expect(errorMessage).toBeInTheDocument();
    });
});

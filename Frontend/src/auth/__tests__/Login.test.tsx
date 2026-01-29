import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../Login";
import { BrowserRouter } from "react-router-dom";



// --- MOCK STORE ---
const mockLogin = jest.fn();
jest.mock("@/store/useUserStore", () => ({
    useUserStore: jest.fn(() => ({
        login: mockLogin,
        loading: false,
    })),
}));

// Helper to render Login
const renderLogin = () =>
    render(
        <BrowserRouter>
            <Login />
        </BrowserRouter>
    );

// Set value on real DOM input, then fire change with that element as target so handler sees correct value/name
function setInputValue(input: HTMLInputElement, value: string) {
    const descriptor = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
    );
    descriptor?.set?.call(input, value);
    fireEvent.change(input, { target: input });
}

describe("Login Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders login form correctly", () => {
        renderLogin();

        expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });

    test("shows validation errors on empty submit", async () => {
        renderLogin();

        fireEvent.click(screen.getByRole("button", { name: /login/i }));

        await waitFor(() => {
            expect(screen.getByText(/Invalid Email Address/i)).toBeInTheDocument();
            expect(
                screen.getByText(/Password must be atleast 6 characters/i)
            ).toBeInTheDocument();
        });
    });

    test("updates input fields correctly", () => {
        renderLogin();

        const emailInput = screen.getByPlaceholderText(/Enter your email/i);
        const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

        fireEvent.change(emailInput, { target: { value: "test@example.com", name: "email" } });
        fireEvent.change(passwordInput, { target: { value: "123456", name: "password" } });

        expect(emailInput).toHaveValue("test@example.com");
        expect(passwordInput).toHaveValue("123456");
    });

    test("calls login function on valid submit", async () => {
        renderLogin();

        const emailInput = screen.getByPlaceholderText(/Enter your email/i) as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText(/Enter your password/i) as HTMLInputElement;

        setInputValue(emailInput, "test@example.com");
        await waitFor(() => expect(emailInput).toHaveValue("test@example.com"));

        setInputValue(passwordInput, "123456");
        await waitFor(() => expect(passwordInput).toHaveValue("123456"));

        fireEvent.click(screen.getByRole("button", { name: /login/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "123456",
            });
        });
    });
});

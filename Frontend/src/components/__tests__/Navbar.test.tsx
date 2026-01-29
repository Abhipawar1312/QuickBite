import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Navbar from "../Navbar";


// ✅ Mock User Store
jest.mock("@/store/useUserStore", () => ({
    useUserStore: () => ({
        user: {
            fullname: "Abhi Pawar",
            email: "abhi@test.com",
            admin: false,
            profilePicture: "",
        },
        loading: false,
        logout: jest.fn(),
    }),
}));

// ✅ Mock Cart Store
jest.mock("@/store/useCartStore", () => ({
    useCartStore: () => ({
        cart: [
            { id: "1", quantity: 2 },
            { id: "2", quantity: 1 },
        ],
    }),
}));

describe("Navbar Component", () => {
    test("renders brand name and nav links", () => {
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

        expect(screen.getByText("QuickBite")).toBeInTheDocument();
        expect(screen.getByText("Home")).toBeInTheDocument();
        expect(screen.getByText("Profile")).toBeInTheDocument();
        expect(screen.getByText("Orders")).toBeInTheDocument();
    });

    test("shows cart item count", () => {
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

        expect(screen.getByText("3")).toBeInTheDocument();
    });

    test("shows user initials in avatar fallback", () => {
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

        expect(screen.getByText("AP")).toBeInTheDocument();
    });
});

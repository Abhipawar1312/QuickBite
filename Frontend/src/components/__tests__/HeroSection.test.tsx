import { render, screen, fireEvent } from "@testing-library/react";
import HeroSection from "../HeroSection";
import { BrowserRouter } from "react-router-dom";

// ---- MOCK useNavigate ----
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

const renderHero = () =>
    render(
        <BrowserRouter>
            <HeroSection />
        </BrowserRouter>
    );

describe("HeroSection Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders hero heading and subtitle", () => {
        renderHero();

        expect(
            screen.getByText(/Discover/i)
        ).toBeInTheDocument();

        expect(
            screen.getByText(/Craving something delicious/i)
        ).toBeInTheDocument();
    });

    test("renders search input and search button", () => {
        renderHero();

        expect(
            screen.getByPlaceholderText(/Type a restaurant, city or country/i)
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /search/i })
        ).toBeInTheDocument();
    });

    test("updates search input value when typing", () => {
        renderHero();

        const input = screen.getByPlaceholderText(
            /Type a restaurant, city or country/i
        ) as HTMLInputElement;

        fireEvent.change(input, { target: { value: "Pizza" } });

        expect(input.value).toBe("Pizza");
    });

    test("navigates on search button click", () => {
        renderHero();

        const input = screen.getByPlaceholderText(
            /Type a restaurant, city or country/i
        ) as HTMLInputElement;

        fireEvent.change(input, { target: { value: "Burger" } });

        fireEvent.click(screen.getByRole("button", { name: /search/i }));

        expect(mockNavigate).toHaveBeenCalledWith("/search/Burger");
    });

    test("navigates on Enter key press", () => {
        renderHero();

        const input = screen.getByPlaceholderText(
            /Type a restaurant, city or country/i
        ) as HTMLInputElement;

        fireEvent.change(input, { target: { value: "Pasta" } });

        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

        expect(mockNavigate).toHaveBeenCalledWith("/search/Pasta");
    });

    test("navigates when clicking popular search", () => {
        renderHero();

        fireEvent.click(screen.getByText("Momos"));

        expect(mockNavigate).toHaveBeenCalledWith("/search/Momos");
    });
});

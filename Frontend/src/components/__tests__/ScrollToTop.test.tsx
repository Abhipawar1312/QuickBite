import { render } from "@testing-library/react";
import ScrollToTop from "../ScrollToTop";
import { MemoryRouter } from "react-router-dom";

// Mock window.scrollTo
window.scrollTo = jest.fn();

describe("ScrollToTop Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("scrolls to (0,0) on render", () => {
        render(
            <MemoryRouter>
                <ScrollToTop />
            </MemoryRouter>
        );

        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });
});

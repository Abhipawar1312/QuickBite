import { render } from "@testing-library/react";
import MainLayout from "../MainLayout";
import { BrowserRouter } from "react-router-dom";

jest.mock("@/components/Footer", () => () => <div>Footer</div>);
jest.mock("@/components/Navbar", () => () => <div>Navbar</div>);
jest.mock("@/components/ScrollToTop", () => () => null);
jest.mock("@/components/RoleOnboardingModal", () => ({ RoleOnboardingModal: () => null }));

describe("MainLayout Component", () => {
  test("renders layout structure with header and footer", () => {
    const { getByText } = render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );

    expect(getByText("Navbar")).toBeInTheDocument();
    expect(getByText("Footer")).toBeInTheDocument();
  });
});

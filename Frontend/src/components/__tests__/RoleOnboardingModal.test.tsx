import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RoleOnboardingModal } from "../RoleOnboardingModal";
import { useUserStore } from "@/store/useUserStore";

// Mock store
const mockSelectRole = jest.fn();

jest.mock("@/store/useUserStore", () => ({
    useUserStore: jest.fn(),
}));

describe("RoleOnboardingModal Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("does not render when user is not logged in", () => {
        (useUserStore as unknown as jest.Mock).mockReturnValue({
            user: null,
            selectRole: mockSelectRole,
            loading: false,
        });

        const { container } = render(<RoleOnboardingModal />);
        expect(container.firstChild).toBeNull();
    });

    test("does not render when user role is already selected", () => {
        (useUserStore as unknown as jest.Mock).mockReturnValue({
            user: { fullname: "Abhi Pawar", isRoleSelected: true },
            selectRole: mockSelectRole,
            loading: false,
        });

        const { container } = render(<RoleOnboardingModal />);
        expect(container.firstChild).toBeNull();
    });

    test("renders onboarding options when user role is not selected", () => {
        (useUserStore as unknown as jest.Mock).mockReturnValue({
            user: { fullname: "Abhi Pawar", isRoleSelected: false },
            selectRole: mockSelectRole,
            loading: false,
        });

        render(<RoleOnboardingModal />);

        expect(screen.getByText("QuickBite Onboarding")).toBeInTheDocument();
        expect(screen.getByText("Welcome, Abhi!")).toBeInTheDocument();
        expect(screen.getByText("Hungry Customer")).toBeInTheDocument();
        expect(screen.getByText("Restaurant Owner")).toBeInTheDocument();
        expect(screen.getByText("Delivery Partner / Rider")).toBeInTheDocument();
    });

    test("allows selecting a role and confirming", async () => {
        (useUserStore as unknown as jest.Mock).mockReturnValue({
            user: { fullname: "Abhi Pawar", isRoleSelected: false },
            selectRole: mockSelectRole,
            loading: false,
        });

        render(<RoleOnboardingModal />);

        // Click "Restaurant Owner" option
        fireEvent.click(screen.getByText("Restaurant Owner"));

        // Click confirm
        fireEvent.click(screen.getByRole("button", { name: /confirm & continue/i }));

        await waitFor(() => {
            expect(mockSelectRole).toHaveBeenCalledWith("restaurant_owner");
        });
    });

    test("renders loader when store is loading", () => {
        (useUserStore as unknown as jest.Mock).mockReturnValue({
            user: { fullname: "Abhi Pawar", isRoleSelected: false },
            selectRole: mockSelectRole,
            loading: true,
        });

        render(<RoleOnboardingModal />);
        
        expect(screen.getByRole("button")).toBeDisabled();
    });
});

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddressBookModal } from "../AddressBookModal";
import { useUserStore } from "@/store/useUserStore";

jest.mock("@/store/useUserStore");

describe("AddressBookModal Component", () => {
  const mockAddSavedAddress = jest.fn().mockResolvedValue(true);
  const mockUpdateSavedAddress = jest.fn().mockResolvedValue(true);
  const mockDeleteSavedAddress = jest.fn().mockResolvedValue(true);
  const mockOnClose = jest.fn();
  const mockOnSelectAddress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      user: {
        savedAddresses: [
          {
            _id: "addr1",
            tag: "Home",
            label: "Home",
            address: "Flat 101, Palm Beach",
            city: "Mumbai",
            pincode: "400001",
            isDefault: true,
          },
          {
            _id: "addr2",
            tag: "Work",
            label: "Work",
            address: "Tech Park, Cyber City",
            city: "Mumbai",
            pincode: "400051",
            isDefault: false,
          },
        ],
      },
      addSavedAddress: mockAddSavedAddress,
      updateSavedAddress: mockUpdateSavedAddress,
      deleteSavedAddress: mockDeleteSavedAddress,
      loading: false,
    });
  });

  it("renders list of saved addresses and selects one on click", () => {
    render(
      <AddressBookModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectAddress={mockOnSelectAddress}
      />
    );

    expect(screen.getByText("Saved Delivery Addresses")).toBeInTheDocument();
    expect(screen.getByText("Flat 101, Palm Beach, Mumbai - 400001")).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Flat 101, Palm Beach, Mumbai - 400001"));
    expect(mockOnSelectAddress).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "addr1", tag: "Home" })
    );
  });

  it("switches to add form and saves new address", async () => {
    render(
      <AddressBookModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectAddress={mockOnSelectAddress}
      />
    );

    const addBtn = screen.getByRole("button", { name: /Add New Address/i });
    fireEvent.click(addBtn);

    expect(screen.getByText("Complete Address")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/e.g. Flat 402/i), {
      target: { value: "Villa 22, Green Valley" },
    });
    fireEvent.change(screen.getByPlaceholderText(/e.g. Mumbai/i), {
      target: { value: "Pune" },
    });

    const submitBtn = screen.getByRole("button", { name: /Save Address/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddSavedAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "Villa 22, Green Valley",
          city: "Pune",
          tag: "Home",
        })
      );
    });
  });
});

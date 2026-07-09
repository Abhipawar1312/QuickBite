import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MapAddressPicker } from "../MapAddressPicker";
import { toast } from "sonner";

// Mock react-leaflet
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ position, eventHandlers }: any) => (
    <div data-testid="map-marker" data-position={JSON.stringify(position)} />
  ),
  useMap: () => ({
    flyTo: jest.fn(),
    setView: jest.fn(),
    getZoom: () => 15,
  }),
  useMapEvents: jest.fn(),
}));

// Mock leaflet
jest.mock("leaflet", () => ({
  divIcon: jest.fn(() => ({})),
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("MapAddressPicker", () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            display_name: "Mock Address",
            address: {
              city: "Mumbai",
              country: "India",
              postcode: "400070",
            },
          }),
      })
    );
  });

  test("does not render when open is false", () => {
    const { container } = render(
      <MapAddressPicker open={false} onClose={mockOnClose} onConfirm={mockOnConfirm} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders correctly when open is true", async () => {
    render(<MapAddressPicker open={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    expect(screen.getByText("Pin Your Exact Delivery Location")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search for your street/i)).toBeInTheDocument();
    expect(screen.getByTestId("map-container")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Mock Address")).toBeInTheDocument();
    });
  });

  test("calls onClose when cancel button is clicked", async () => {
    render(<MapAddressPicker open={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    await waitFor(() => {
      expect(screen.getByText("Mock Address")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("calls onConfirm and onClose when confirm button is clicked with valid address", async () => {
    render(<MapAddressPicker open={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    await waitFor(() => {
      expect(screen.getByText("Mock Address")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /confirm delivery location/i }));
    expect(mockOnConfirm).toHaveBeenCalledWith({
      address: "Mock Address",
      city: "Mumbai",
      pincode: "400070",
      country: "India",
      latitude: 19.076,
      longitude: 72.8777,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("searches location and updates pin position", async () => {
    const mockSearchResults = [
      {
        lat: "19.218",
        lon: "72.978",
        display_name: "Thane",
      },
    ];

    global.fetch = jest.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve({ display_name: "Initial Address", address: {} }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockSearchResults),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve({ display_name: "Thane Address", address: { city: "Thane" } }),
        })
      );

    render(<MapAddressPicker open={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    await waitFor(() => {
      expect(screen.getByText("Initial Address")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search for your street/i);
    fireEvent.change(searchInput, { target: { value: "Thane" } });

    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Thane Address")).toBeInTheDocument();
    });
  });

  test("locates user when locate me button is clicked", async () => {
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementationOnce((success) =>
        success({
          coords: {
            latitude: 19.111,
            longitude: 72.888,
          },
        })
      ),
    };

    (global.navigator as any).geolocation = mockGeolocation;

    global.fetch = jest.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve({ display_name: "Initial Address", address: {} }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve({ display_name: "GPS Address", address: { city: "GPS City" } }),
        })
      );

    render(<MapAddressPicker open={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    await waitFor(() => {
      expect(screen.getByText("Initial Address")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /locate me/i }));

    await waitFor(() => {
      expect(screen.getByText("GPS Address")).toBeInTheDocument();
    });
  });
});

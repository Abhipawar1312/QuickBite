import { render, screen } from "@testing-library/react";
import { LiveTrackingMap } from "../LiveTrackingMap";

// Mock react-leaflet
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }: any) => (
    <div data-testid="map-marker" data-position={JSON.stringify(position)}>{children}</div>
  ),
  Popup: ({ children }: any) => <div data-testid="map-popup">{children}</div>,
  Polyline: ({ positions }: any) => (
    <div data-testid="map-polyline" data-positions={JSON.stringify(positions)} />
  ),
  useMap: () => ({
    setView: jest.fn(),
    fitBounds: jest.fn(),
    getZoom: () => 15,
  }),
}));

// Mock leaflet
jest.mock("leaflet", () => ({
  divIcon: jest.fn(() => ({})),
  latLng: (lat: number, lng: number) => ({ lat, lng }),
  latLngBounds: () => ({
    pad: jest.fn(),
  }),
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
}));

// Mock socket.io-client
jest.mock("socket.io-client", () => ({
  io: () => ({
    emit: jest.fn(),
    on: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

describe("LiveTrackingMap", () => {
  test("renders estimated delivery text and status details", () => {
    render(
      <LiveTrackingMap
        orderId="test-order-id"
        restaurantCoords={[72.8777, 19.076]}
        customerCoords={[72.8888, 19.088]}
        restaurantName="Bukhara"
        customerName="Abhi"
        orderStatus="preparing"
      />
    );

    expect(screen.getAllByText(/estimated delivery/i)[0]).toBeInTheDocument();
    expect(screen.getByText("Preparing")).toBeInTheDocument();
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });

  test("renders correct route polyline and markers", () => {
    render(
      <LiveTrackingMap
        orderId="test-order-id"
        restaurantCoords={[72.8777, 19.076]}
        customerCoords={[72.8888, 19.088]}
        restaurantName="Bukhara"
        customerName="Abhi"
        orderStatus="outfordelivery"
        hasRider={true}
        riderVehicle="Scooter"
      />
    );

    expect(screen.getByText("🚀 Out for Delivery")).toBeInTheDocument();
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });
});

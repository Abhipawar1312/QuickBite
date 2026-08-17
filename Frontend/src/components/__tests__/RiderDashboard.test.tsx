import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { RiderDashboard } from "../RiderDashboard";
import { useRiderStore } from "@/store/useRiderStore";

jest.mock("@/store/useRiderStore");

jest.mock("@/store/useUserStore", () => ({
  useUserStore: () => ({
    user: { fullname: "Rider Rajesh", email: "rajesh@rider.com", role: "rider" },
  }),
}));

jest.mock("@/store/useChatStore", () => ({
  useChatStore: () => ({
    openChat: jest.fn(),
    isChatOpen: false,
    unreadCount: 0,
  }),
}));

jest.mock("../LiveTrackingMap", () => ({
  LiveTrackingMap: () => <div data-testid="live-tracking-map" />,
}));

jest.mock("../ChatPanel", () => ({
  ChatPanel: () => null,
}));

// Mock socket.io-client
jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation((success) =>
    success({
      coords: {
        latitude: 19.076,
        longitude: 72.8777,
      },
    })
  ),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, "geolocation", {
  value: mockGeolocation,
  writable: true,
});


const mockRiderProfile = {
  _id: "rider123",
  user: {
    fullname: "Rider Rajesh",
    email: "rajesh@rider.com",
    contact: "9876543210",
  },
  isOnline: true,
  isVerified: true,
  vehicleType: "Bike",
  vehicleNumber: "MH-04-AB-1234",
  rating: 4.8,
  totalDeliveries: 25,
  totalEarnings: 3200,
};


const mockActiveOrder = {
  _id: "order_66d9f3b1a2c3d4e5f6789012",
  deliveryHandoverPin: "8821",
  deliveryFee: 25,
  tipAmount: 50,
  deliveryInstructions: "Leave with security guard at gate",
  riderStatus: "accepted",
  cartItems: [
    { name: "Biryani", quantity: 2, price: 200 },
  ],
  totalAmount: 475,
  deliveryDetails: {
    name: "Amit Sharma",
    address: "Flat 402, Sunshine Heights",
    city: "Mumbai",
    contact: "9123456780",
  },
  restaurant: {
    restaurantName: "Royal Biryani",
    address: "Bhiwandi Road",
    city: "Thane",
    contactNumber: "022-25801234",
  },
};

const mockDeliveries = [
  {
    _id: "deliv_123456",
    restaurant: { restaurantName: "Pizza Palace" },
    deliveryFee: 25,
    tipAmount: 40,
    createdAt: new Date().toISOString(),
    distanceKM: 3.2,
  },
];

describe("RiderDashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRiderStore as unknown as jest.Mock).mockReturnValue({
      loading: false,
      riderProfile: mockRiderProfile,
      incomingOrders: [],
      activeOrder: mockActiveOrder,
      submitRiderDetails: jest.fn(),
      getRiderProfile: jest.fn(),
      toggleOnlineStatus: jest.fn(),
      acceptOrder: jest.fn(),
      updateDeliveryWorkflow: jest.fn(),
      addIncomingOrder: jest.fn(),
      removeIncomingOrder: jest.fn(),
      riderEarnings: 3200,
      riderDeliveries: mockDeliveries,
      getRiderEarnings: jest.fn(),
    });
  });

  test("renders active delivery task with tip amount and total earnings", () => {
    render(
      <BrowserRouter>
        <RiderDashboard />
      </BrowserRouter>
    );

    // Earnings calculation: 25 fee + 50 tip = 75
    expect(screen.getByText(/₹75 Delivery Earnings/i)).toBeInTheDocument();
    expect(screen.getByText(/\(Incl\. ₹50 Tip\)/i)).toBeInTheDocument();
  });

  test("renders prominent customer delivery instructions note", () => {
    render(
      <BrowserRouter>
        <RiderDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Customer Delivery Note/i)).toBeInTheDocument();
    expect(screen.getByText(/Leave with security guard at gate/i)).toBeInTheDocument();
  });
});

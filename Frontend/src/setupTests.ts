import '@testing-library/jest-dom';

/* =======================
   JSDOM Polyfills
======================= */

// Node 18+ / Jest already provides these
if (typeof globalThis.TextEncoder === 'undefined') {
   globalThis.TextEncoder = class TextEncoder {
      encode(input?: string) {
         return new Uint8Array(Buffer.from(input || ''));
      }
   } as any;
}

if (typeof globalThis.TextDecoder === 'undefined') {
   globalThis.TextDecoder = class TextDecoder {
      decode(input?: Uint8Array) {
         return Buffer.from(input || []).toString();
      }
   } as any;
}

/* =======================
   ResizeObserver mock
======================= */

class ResizeObserverMock {
   observe() { }
   unobserve() { }
   disconnect() { }
}

(globalThis as any).ResizeObserver = ResizeObserverMock;

/* ============================
   MOCK REACT ROUTER
============================ */

jest.mock('react-router-dom', () => ({
   ...jest.requireActual('react-router-dom'),
   useNavigate: () => jest.fn(),
   useParams: () => ({}),
}));

/* ============================
   MOCK TOAST
============================ */

jest.mock('sonner', () => ({
   toast: {
      success: jest.fn(),
      error: jest.fn(),
   },
}));

/* ============================
   MOCK ZUSTAND STORES
============================ */

jest.mock('./store/useMenuStore', () => ({
   __esModule: true,
   useMenuStore: jest.fn(() => ({
      menus: [],
      loading: false,
      getMenu: jest.fn(),
   })),
}));

jest.mock('./store/useCartStore', () => ({
   __esModule: true,
   useCartStore: jest.fn(() => ({
      cart: [],
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      clearCart: jest.fn(),
   })),
}));

jest.mock('./store/useRestaurantStore', () => ({
   __esModule: true,
   useRestaurantStore: jest.fn(() => ({
      restaurant: null,
      restaurantOrder: [],
      getRestaurantOrders: jest.fn(),
      updateRestaurantOrder: jest.fn(),
      addLocalRestaurantOrder: jest.fn(),
      updateLocalRestaurantOrder: jest.fn(),
   })),
}));

jest.mock('./store/useOrderStore', () => ({
   __esModule: true,
   useOrderStore: jest.fn(() => ({
      orders: [],
      getOrderDetails: jest.fn(),
      updateLocalOrderStatus: jest.fn(),
      createCheckoutSession: jest.fn(),
   })),
}));

const globalMockUser = { fullname: "Abhi", email: "abhi@test.com", role: "user" };

jest.mock('./store/useUserStore', () => ({
   __esModule: true,
   useUserStore: jest.fn(() => ({
      user: globalMockUser,
      updateProfile: jest.fn(),
      loading: false,
   })),
}));

jest.mock('./store/useNotificationStore', () => ({
   __esModule: true,
   useNotificationStore: jest.fn(() => ({
      unreadCount: 0,
      addNotification: jest.fn(),
   })),
}));

jest.mock('./store/useRiderStore', () => ({
   __esModule: true,
   useRiderStore: jest.fn(() => ({
      riderProfile: null,
      getRiderProfile: jest.fn(),
      submitRiderDetails: jest.fn(),
      toggleOnlineStatus: jest.fn(),
      acceptOrder: jest.fn(),
      updateDeliveryWorkflow: jest.fn(),
      getAllRidersAdmin: jest.fn(),
      verifyRiderAdmin: jest.fn(),
      deleteRiderAdmin: jest.fn(),
      riderEarnings: null,
      riderDeliveries: [],
      getRiderEarnings: jest.fn(),
   })),
}));

/* ============================
   RADIX UI POINTER FIX
============================ */

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => { };
HTMLElement.prototype.releasePointerCapture = () => { };

/* ============================
   CLEANUP
============================ */

afterEach(() => {
   jest.clearAllMocks();
});

/* ============================
   MOCK LEAFLET & REACT-LEAFLET GLOBALLY
============================ */
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => children,
  TileLayer: () => null,
  Marker: ({ children }: any) => children,
  Popup: ({ children }: any) => children,
  Polyline: () => null,
  useMap: () => ({
    flyTo: jest.fn(),
    setView: jest.fn(),
    fitBounds: jest.fn(),
    getZoom: () => 15,
  }),
  useMapEvents: jest.fn(),
}));

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

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
   useMenuStore: jest.fn(),
}));

jest.mock('./store/useCartStore', () => ({
   __esModule: true,
   useCartStore: jest.fn(),
}));

jest.mock('./store/useRestaurantStore', () => ({
   __esModule: true,
   useRestaurantStore: jest.fn(),
}));

jest.mock('./store/useOrderStore', () => ({
   __esModule: true,
   useOrderStore: jest.fn(),
}));

jest.mock('./store/useUserStore', () => ({
   __esModule: true,
   useUserStore: jest.fn(),
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

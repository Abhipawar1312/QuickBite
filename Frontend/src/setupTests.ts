import '@testing-library/jest-dom';

/* =======================
   Polyfills for JSDOM
======================= */

// import { TextEncoder, TextDecoder } from 'util';

// Explicitly type globalThis (works in Node + TS)
(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder = TextDecoder;

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
   MOCK ZUSTAND STORES (DECL ONLY)
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
   RADIX UI FIXES (CRITICAL)
============================ */



// 🔥 FIX hasPointerCapture CRASH
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => { };
HTMLElement.prototype.releasePointerCapture = () => { };

// Prevent mock leakage
afterEach(() => {
   jest.clearAllMocks();
});

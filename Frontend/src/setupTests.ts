import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

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

// ResizeObserver (Radix requirement)
class ResizeObserverMock {
   observe() { }
   unobserve() { }
   disconnect() { }
}
(global as any).ResizeObserver = ResizeObserverMock;

// 🔥 FIX hasPointerCapture CRASH
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => { };
HTMLElement.prototype.releasePointerCapture = () => { };

// Prevent mock leakage
afterEach(() => {
   jest.clearAllMocks();
});

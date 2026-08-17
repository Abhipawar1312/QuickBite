// Centralized API and WebSocket Base URLs
// Reads directly from .env (FRONTEND_URL) with fallback to http://localhost:8000

export const BASE_URL: string = import.meta.env.FRONTEND_URL || "http://localhost:8000";



// API Base URL (e.g. http://localhost:8000/api/v1 or https://quickbite-ogw0.onrender.com/api/v1)
export const API_BASE_URL: string = `${BASE_URL.replace(/\/+$/, "")}/api/v1`;

// API Endpoints mapped for each feature domain
export const API_END_POINTS = {
  USER: `${API_BASE_URL}/user`,
  RESTAURANT: `${API_BASE_URL}/restaurant`,
  MENU: `${API_BASE_URL}/menu`,
  ORDER: `${API_BASE_URL}/order`,
  RIDER: `${API_BASE_URL}/rider`,
  REVIEW: `${API_BASE_URL}/review`,
  CHAT: `${API_BASE_URL}/chat`,
  COUPON: `${API_BASE_URL}/coupon`,
  ANALYTICS: `${API_BASE_URL}/analytics`,
  RECOMMENDATION: `${API_BASE_URL}/recommendation`,
};


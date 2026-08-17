// Centralized API and WebSocket Base URLs
// You can switch between Local and Production (Render) in your Frontend/.env file via VITE_API_URL

const getEnvApiUrl = (): string => {
  try {
    if (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch {
    // fallback
  }
  return "http://localhost:8000";
};

export const BASE_URL: string = getEnvApiUrl();


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


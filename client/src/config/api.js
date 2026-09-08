// Centralized API configuration for Development & Production hosting
const getApiBaseUrl = () => {
  // In production always use the live backend URL
  if (import.meta.env.PROD) {
    return 'https://api.rudranpay.com/api';
  }
  // In development use local server
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();



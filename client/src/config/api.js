// Centralized API configuration for Development & Production hosting
const getApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'https://api.rudranpay.com/api';
  url = url.trim().replace(/\/+$/, '');
  // Ensure /api is appended so all routes (/registrations, /auth, /services) work seamlessly
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

export const API_BASE_URL = getApiBaseUrl();



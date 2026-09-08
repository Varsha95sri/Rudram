// Centralized API configuration for Development & Production hosting
const getApiBaseUrl = () => {
  // Default already includes /api so no double-append happens
  let url = import.meta.env.VITE_API_URL || 'https://api.rudranpay.com';
  url = url.trim().replace(/\/+$/, '');
  // Append /api only if not already present
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

export const API_BASE_URL = getApiBaseUrl();



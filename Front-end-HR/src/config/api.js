const PRODUCTION_API_BASE_URL = 'https://front-and-back-jhov.onrender.com';

export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;

    if (protocol === 'file:') {
      return PRODUCTION_API_BASE_URL;
    }

    const tunnelPattern = /^([a-z0-9-]+)-\d+(\..*devtunnels\.ms)$/i;
    const match = hostname.match(tunnelPattern);
    if (match) {
      return `${protocol}//${match[1]}-5000${match[2]}`;
    }

    return `${protocol}//${hostname}:5000`;
  }

  return PRODUCTION_API_BASE_URL;
};

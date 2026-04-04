const WEBSITE_BASE_URL = 'https://6r-diamond-portal.vercel.app';

export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const { protocol, hostname, origin } = window.location;
    const tunnelPattern = /^([a-z0-9-]+)-\d+(\..*devtunnels\.ms)$/i;
    const match = hostname.match(tunnelPattern);
    if (match) return `${protocol}//${match[1]}-5000${match[2]}`;

    const isLocalHost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1';

    if (isLocalHost) {
      return `${protocol}//${hostname}:5000`;
    }

    if (origin) {
      return origin;
    }

    return WEBSITE_BASE_URL;
  }

  return WEBSITE_BASE_URL;
};

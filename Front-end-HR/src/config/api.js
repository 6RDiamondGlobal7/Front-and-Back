export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    
    // --- NEW: Check if running as a Desktop App (Electron) ---
    if (protocol === 'file:') {
      // NOTE: If you eventually host your backend on the internet (e.g., Render), 
      // replace this with your real live URL like 'https://my-backend.onrender.com'
      return 'http://localhost:5000'; 
    }

    // Para sa DevTunnels (VS Code Port Forwarding)
    const tunnelPattern = /^([a-z0-9-]+)-\d+(\..*devtunnels\.ms)$/i;
    const match = hostname.match(tunnelPattern);
    if (match) {
      return `${protocol}//${match[1]}-5000${match[2]}`;
    }

    // Para sa Localhost o Shared Network IP (hal. 192.168.1.x)
    return `${protocol}//${hostname}:5000`;
  }

  return 'http://localhost:5000';
};
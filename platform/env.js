// In dev, call /api on this Vite server so the browser is not blocked by CORS.
export const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');

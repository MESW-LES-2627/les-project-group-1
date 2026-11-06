/**
 * Base URL for the backend API.
 *
 * In development the Vite app and the backend run on different ports, so we hit
 * the local backend directly. In production the app is served from the same
 * origin and the reverse proxy (Caddy) forwards `/api/*` and `/socket.io/*` to
 * the API container, so the origin is enough.
 *
 * `VITE_SOCKET_URL` overrides both when the API lives on another host.
 */
export const API_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin)
).replace(/\/+$/, '');

/// <reference types="vite/client" />
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://smart-house-l3aw.onrender.com';

// Automatically derive WS base URL from API base URL (http -> ws, https -> wss)
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const DEFAULT_HOUSEHOLD: 'hh124' = 'hh124';

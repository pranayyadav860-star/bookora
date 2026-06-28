// client/src/utils/api.js
// FIXED: Centralised API config — replaces all 37 hardcoded localhost:5000 references
// Usage: import api from '../utils/api';  then api.get('/hotels')

import axios from 'axios';

// ─── Base URLs from environment ───────────────────────────────────────────────
export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Attach JWT on every request ─────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Global response handling ─────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

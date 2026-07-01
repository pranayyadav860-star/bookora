// client/src/utils/api.js
import axios from 'axios';

export const BASE_URL = process.env.REACT_APP_API_URL || 'https://bookora-server-22ox.onrender.com';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://bookora-server-22ox.onrender.com';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

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
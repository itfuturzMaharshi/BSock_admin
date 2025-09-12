import axios from 'axios';
import { SocketService } from '../socket/socket';

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'https://t9hr21z3-3200.inc1.devtunnels.ms',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure correct Content-Type: let Axios set it for FormData
    if (config.headers) {
      const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
      if (isFormData) {
        // Remove any preset header so axios can set multipart/form-data with boundary
        delete (config.headers as any)['Content-Type'];
      } else {
        // Default for JSON requests
        if (!('Content-Type' in config.headers)) {
          config.headers['Content-Type'] = 'application/json';
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Ensure socket disconnects on auth loss
      try { SocketService.disconnect(); } catch {}
      window.location.href = '/#/signin';
    }
    return Promise.reject(error);
  }
);

export default api;
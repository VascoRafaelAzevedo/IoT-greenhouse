import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL || ''; // Replace with your real endpoint
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' }
});

// Example interceptor (optional)
apiClient.interceptors.request.use(
  (config) => {
    // You could inject an auth token here:
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API ERROR]', error);
    return Promise.reject(error);
  }
);



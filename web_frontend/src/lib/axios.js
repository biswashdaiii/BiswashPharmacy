import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://192.168.226.1:5050";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Automatically add Authorization header with token from localStorage on every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Try to get token from common keys (admin, generic)
    const token =
      localStorage.getItem("dToken") ||
      localStorage.getItem("aToken") ||
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;

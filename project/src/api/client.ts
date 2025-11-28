// src/api/client.ts
import axios from "axios";

const API_BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});

// simple retry interceptor: retry once on network/transient errors
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error?.config;
    if (!config) return Promise.reject(error);

    config.__retryCount = config.__retryCount || 0;
    const shouldRetry =
      config.__retryCount < 1 &&
      (error.code === "ERR_NETWORK" ||
        error.code === "ECONNABORTED" ||
        error?.response?.status >= 500 ||
        !error.response);

    if (shouldRetry) {
      config.__retryCount += 1;
      await new Promise((r) => setTimeout(r, 500)); // 500ms backoff
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;

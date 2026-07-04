import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '@shared/constants';

interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
  details?: Array<{ field?: string; message?: string; errors?: string[] }>;
}

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Ocurrió un error inesperado',
): string => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const payload = error.response?.data as ApiErrorPayload | undefined;

  if (Array.isArray(payload?.details) && payload.details.length > 0) {
    const firstDetail = payload.details[0];

    if (Array.isArray(firstDetail?.errors) && firstDetail.errors.length > 0) {
      return firstDetail.errors[0];
    }

    if (typeof firstDetail?.message === 'string' && firstDetail.message.trim().length > 0) {
      return firstDetail.message;
    }
  }

  if (Array.isArray(payload?.message) && payload.message.length > 0) {
    return payload.message[0];
  }

  if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
    return payload.message;
  }

  if (typeof payload?.error === 'string' && payload.error.trim().length > 0) {
    return payload.error;
  }

  return fallback;
};

// ─── Axios Instance ───────────────────────────────────────────────────────────

const httpClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────

httpClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────────────────────

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
    return Promise.reject(error);
  },
);

export default httpClient;

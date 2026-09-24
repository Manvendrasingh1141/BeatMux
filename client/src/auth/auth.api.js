import { apiClient } from '@/lib/axios';
import { useAuthStore } from './auth.store';

export const setupAxiosInterceptors = () => {
  apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
      }
      return Promise.reject(error);
    }
  );
};

export const checkAuth = async () => {
  try {
    const { data } = await apiClient.get('/auth/me');
    if (data.success) {
      useAuthStore.getState().setAuth(data.data.user, '');
    }
  } catch (error) {
    useAuthStore.getState().logout();
  } finally {
    useAuthStore.getState().setLoading(false);
  }
};

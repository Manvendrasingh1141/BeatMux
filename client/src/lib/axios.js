import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Handle 429 Rate Limited responses gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      error.userMessage = retryAfter
        ? `Too many requests. Please try again in ${retryAfter} seconds.`
        : 'Too many requests. Please try again later.';
      error.code = 'RATE_LIMITED';
    } else if (error.response?.status === 401) {
      error.userMessage = 'Your session has expired. Please log in again.';
      error.code = 'AUTHENTICATION_ERROR';
    } else if (error.response?.status === 403) {
      error.userMessage = "You don't have permission to do that.";
      error.code = 'AUTHORIZATION_ERROR';
    } else if (error.response?.status === 404) {
      error.userMessage = 'The requested resource was not found.';
      error.code = 'NOT_FOUND';
    } else if (!error.response) {
      error.userMessage = 'Network error. Please check your connection.';
      error.code = 'NETWORK_ERROR';
    } else {
      error.userMessage = error.response?.data?.error || 'Something went wrong. Please try again.';
      error.code = error.response?.data?.code || 'SERVER_ERROR';
    }
    return Promise.reject(error);
  }
);

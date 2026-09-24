import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  setAuth: (user, accessToken) => 
    set({ user, isAuthenticated: true, accessToken, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false, accessToken: null, isLoading: false }),
}));

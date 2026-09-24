import { create } from 'zustand';
import { apiClient } from '../lib/axios';

export const useRoomStore = create((set, get) => ({
  currentRoom: null,
  loading: false,
  error: null,

  fetchRoom: async (roomCode) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get(`/rooms/${roomCode}`);
      if (data.success) {
        set({ currentRoom: data.data.room, loading: false });
      }
    } catch (error) {
      set({ error: error.response?.data || { message: 'Failed to fetch room' }, loading: false });
      throw error;
    }
  },

  createRoom: async (name) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post('/rooms', { name });
      if (data.success) {
        set({ currentRoom: data.data.room, loading: false });
        return data.data.room;
      }
    } catch (error) {
      set({ error: error.response?.data || { message: 'Failed to create room' }, loading: false });
      throw error;
    }
  },

  joinRoom: async (roomCode) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post(`/rooms/${roomCode}/join`);
      if (data.success) {
        set({ currentRoom: data.data.room, loading: false });
        return data.data.room;
      }
    } catch (error) {
      set({ error: error.response?.data || { message: 'Failed to join room' }, loading: false });
      throw error;
    }
  },

  leaveRoom: async (roomCode) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post(`/rooms/${roomCode}/leave`);
      set({ currentRoom: null, loading: false });
    } catch (error) {
      set({ error: error.response?.data || { message: 'Failed to leave room' }, loading: false });
      throw error;
    }
  },

  clearRoom: () => set({ currentRoom: null, error: null })
}));

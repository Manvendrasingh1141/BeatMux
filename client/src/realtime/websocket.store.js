import { create } from 'zustand';

export const useWebSocketStore = create((set, get) => ({
  presenceUsers: [],
  connectionState: 'DISCONNECTED', // DISCONNECTED, CONNECTING, CONNECTED, RECONNECTING, ERROR
  syncState: 'UNSYNCED', // UNSYNCED, SYNCING, SYNCED
  latency: null,

  setConnectionState: (state) => set({ connectionState: state }),
  setSyncState: (state) => set({ syncState: state }),
  
  setLatency: (latency) => set({ latency }),

  setPresence: (users) => set({ presenceUsers: users }),

  addUser: (user) => set((state) => {
    // Avoid duplicates
    const exists = state.presenceUsers.some(u => u.id === user.id);
    if (exists) return state;
    return { presenceUsers: [...state.presenceUsers, user] };
  }),

  removeUser: (userId) => set((state) => ({
    presenceUsers: state.presenceUsers.filter(u => u.id !== userId)
  })),

  clearPresence: () => set({ presenceUsers: [], latency: null })
}));

import { create } from 'zustand';
import { apiClient } from '../../../lib/axios';

export const useTimelineStore = create((set, get) => ({
  roomId: null,
  version: 0,
  tracks: [],
  clips: [],
  selectedClipId: null,
  selectedTrackId: null,
  pixelsPerSecond: 100, // Zoom level
  scrollLeft: 0,
  scrollTop: 0,
  
  setRoomId: (roomId) => set({ roomId }),
  setVersion: (version) => set({ version }),

  fetchTimeline: async (roomCode) => {
    try {
      const res = await apiClient.get(`/timeline/${roomCode}`);
      // normalize IDs (_id to id)
      const tracks = res.data.tracks.map(t => ({ ...t, id: t._id }));
      const clips = res.data.clips.map(c => ({ ...c, id: c._id }));
      set({ tracks, clips, version: res.data.timelineVersion, roomId: roomCode });
    } catch (err) {
      console.error('Failed to fetch timeline', err);
    }
  },

  getDuration: () => {
    const clips = get().clips;
    if (clips.length === 0) return 60; // minimum default duration
    const maxEnd = Math.max(...clips.map(c => c.startTime + c.duration));
    return maxEnd + 10; // add 10 seconds buffer
  },

  // Optimistic UI methods
  addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),
  
  removeTrack: (trackId) => set((state) => ({
    tracks: state.tracks.filter(t => t.id !== trackId),
    clips: state.clips.filter(c => c.trackId !== trackId)
  })),

  addClip: (clip) => set((state) => ({
    clips: [...state.clips, clip]
  })),

  removeClip: (clipId) => set((state) => ({
    clips: state.clips.filter(c => c.id !== clipId),
    selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId
  })),

  moveClip: (clipId, newStartTime, trackId = null) => set((state) => {
    const safeStart = Math.max(0, newStartTime);
    return {
      clips: state.clips.map(c => c.id === clipId ? { 
        ...c, 
        startTime: safeStart, 
        trackId: trackId || c.trackId 
      } : c)
    };
  }),

  resizeClip: (clipId, newStartTime, newDuration, newOffset = null) => set((state) => {
    const safeStart = Math.max(0, newStartTime);
    const safeDuration = Math.max(0.1, newDuration);
    
    return {
      clips: state.clips.map(c => c.id === clipId ? {
        ...c,
        startTime: safeStart,
        duration: safeDuration,
        ...(newOffset !== null && { offset: Math.max(0, newOffset) })
      } : c)
    };
  }),
  
  // Remote Actions
  addClipRemote: (clipData, version) => set((state) => {
    const clip = { ...clipData, id: clipData._id };
    // deduplicate if already added optimistically
    if (state.clips.some(c => c.id === clip.id)) return { version };
    return { clips: [...state.clips, clip], version };
  }),
  
  updateClipRemote: (clipId, changes, version) => set((state) => {
    const normalizedId = changes._id || clipId;
    return {
      clips: state.clips.map(c => c.id === normalizedId ? { ...c, ...changes, id: normalizedId } : c),
      version
    };
  }),
  
  removeClipRemote: (clipId, version) => set((state) => ({
    clips: state.clips.filter(c => c.id !== clipId),
    selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    version
  })),
  
  addTrackRemote: (trackData, version) => set((state) => {
    const track = { ...trackData, id: trackData._id };
    if (state.tracks.some(t => t.id === track.id)) return { version };
    return { tracks: [...state.tracks, track], version };
  }),
  
  removeTrackRemote: (trackId, version) => set((state) => ({
    tracks: state.tracks.filter(t => t.id !== trackId),
    clips: state.clips.filter(c => c.trackId !== trackId),
    version
  })),

  selectClip: (clipId) => set({ selectedClipId: clipId, selectedTrackId: null }),
  selectTrack: (trackId) => set({ selectedTrackId: trackId, selectedClipId: null }),
  clearSelection: () => set({ selectedClipId: null, selectedTrackId: null }),

  setZoom: (pixelsPerSecond) => set((state) => {
    const pps = Math.max(10, Math.min(500, pixelsPerSecond));
    return { pixelsPerSecond: pps };
  }),

  setScrollPosition: (scrollLeft, scrollTop) => set({ scrollLeft, scrollTop })
}));

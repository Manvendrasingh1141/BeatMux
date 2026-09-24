import { create } from 'zustand';
import { mixerEngine } from '../engine/mixer.engine';

export const useMixerStore = create((set, get) => ({
  masterVolumeDb: 0,
  tracks: {}, // trackId -> { volumeDb, pan, muted, soloed }

  initTrack: (trackId) => set(state => {
    if (state.tracks[trackId]) return state; // Already exists
    
    const newTracks = {
      ...state.tracks,
      [trackId]: { volumeDb: 0, pan: 0, muted: false, soloed: false }
    };
    
    // Engine will be updated via component effect or we can call it here.
    // Calling it here guarantees immediate sync.
    mixerEngine.updateAllTracksState(newTracks);
    return { tracks: newTracks };
  }),

  removeTrack: (trackId) => set(state => {
    const newTracks = { ...state.tracks };
    delete newTracks[trackId];
    
    mixerEngine.removeChannel(trackId);
    mixerEngine.updateAllTracksState(newTracks);
    return { tracks: newTracks };
  }),

  setTrackVolume: (trackId, volumeDb) => set(state => {
    if (!state.tracks[trackId]) return state;
    const newTracks = {
      ...state.tracks,
      [trackId]: { ...state.tracks[trackId], volumeDb }
    };
    mixerEngine.updateAllTracksState(newTracks);
    return { tracks: newTracks };
  }),

  setTrackPan: (trackId, pan) => set(state => {
    if (!state.tracks[trackId]) return state;
    const newTracks = {
      ...state.tracks,
      [trackId]: { ...state.tracks[trackId], pan }
    };
    mixerEngine.updateAllTracksState(newTracks);
    return { tracks: newTracks };
  }),

  toggleTrackMute: (trackId) => set(state => {
    if (!state.tracks[trackId]) return state;
    const newTracks = {
      ...state.tracks,
      [trackId]: { ...state.tracks[trackId], muted: !state.tracks[trackId].muted }
    };
    mixerEngine.updateAllTracksState(newTracks);
    return { tracks: newTracks };
  }),

  toggleTrackSolo: (trackId) => set(state => {
    if (!state.tracks[trackId]) return state;
    const newTracks = {
      ...state.tracks,
      [trackId]: { ...state.tracks[trackId], soloed: !state.tracks[trackId].soloed }
    };
    mixerEngine.updateAllTracksState(newTracks);
    return { tracks: newTracks };
  }),

  setMasterVolume: (volumeDb) => {
    mixerEngine.setMasterVolume(volumeDb);
    set({ masterVolumeDb: volumeDb });
  }
}));

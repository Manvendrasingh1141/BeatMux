import { create } from 'zustand';
import { audioEngine } from '../../audio/audio.engine';

export const useTransportStore = create((set, get) => ({
  status: 'STOPPED', // 'STOPPED', 'PLAYING', 'PAUSED'
  currentTime: 0,
  bpm: 120,
  timeSignature: {
    numerator: 4,
    denominator: 4
  },
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 0,
  snapMode: 'OFF', // 'OFF', 'BEAT', 'BAR'

  setStatus: (status) => set({ status }),
  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  
  setBpm: (bpm) => {
    const validBpm = Math.max(20, Math.min(300, bpm));
    if (isNaN(validBpm)) return;
    set({ bpm: validBpm });
    // Keep audio engine transport in sync
    audioEngine.setBpm(validBpm);
  },

  setSnapMode: (mode) => set({ snapMode: mode }),
  
  toggleLoop: () => set(state => ({ loopEnabled: !state.loopEnabled })),
  setLoopPoints: (start, end) => set({ loopStart: start, loopEnd: end })
}));

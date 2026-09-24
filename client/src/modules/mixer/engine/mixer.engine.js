import * as Tone from 'tone';
import { isTrackAudible } from '../utils/soloLogic';

class MixerEngine {
  constructor() {
    this.masterBus = new Tone.Gain(1).toDestination();
    this.channels = new Map(); // trackId -> Tone.Channel
  }

  // --- Master Bus ---
  setMasterVolume(volumeDb) {
    this.masterBus.gain.rampTo(Tone.dbToGain(volumeDb), 0.1);
  }

  // --- Track Channels ---
  getChannel(trackId) {
    if (!this.channels.has(trackId)) {
      const channel = new Tone.Channel().connect(this.masterBus);
      this.channels.set(trackId, channel);
    }
    return this.channels.get(trackId);
  }

  removeChannel(trackId) {
    if (this.channels.has(trackId)) {
      const channel = this.channels.get(trackId);
      channel.dispose();
      this.channels.delete(trackId);
    }
  }

  updateTrackState(trackId, state, allTracks) {
    const channel = this.getChannel(trackId);
    
    // Volume
    channel.volume.rampTo(state.volumeDb, 0.1);
    
    // Pan
    channel.pan.rampTo(state.pan, 0.1);
    
    // Mute logic considering Solo
    const audible = isTrackAudible(state, allTracks);
    channel.mute = !audible;
  }

  updateAllTracksState(mixerTracksState) {
    const allTracks = Object.values(mixerTracksState);
    for (const [trackId, state] of Object.entries(mixerTracksState)) {
      this.updateTrackState(trackId, state, allTracks);
    }
  }

  dispose() {
    this.channels.forEach(channel => channel.dispose());
    this.channels.clear();
    this.masterBus.dispose();
    
    // Re-initialize master bus so it's ready if Studio is re-entered without page reload
    this.masterBus = new Tone.Gain(1).toDestination();
  }
}

export const mixerEngine = new MixerEngine();

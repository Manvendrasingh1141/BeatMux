import * as Tone from 'tone';
import { audioScheduler } from './audio.scheduler';
import { audioCache } from './audio.cache';

class AudioEngine {
  constructor() {
    this.initialized = false;
    this.isPlaying = false;
    this.animationFrameId = null;
    this.onTimeUpdate = null; // Callback for UI playhead sync
  }

  async initialize() {
    if (this.initialized) return;
    await Tone.start();
    this.initialized = true;
    Tone.Transport.loop = false;
  }

  async play(clips, assetsMap, currentTimelineTime) {
    if (!this.initialized) await this.initialize();

    // Prevent double play
    if (this.isPlaying) return;

    Tone.Transport.position = currentTimelineTime;

    // Load and schedule
    await audioScheduler.scheduleClips(clips, assetsMap);

    Tone.Transport.start();
    this.isPlaying = true;
    this.startClockSync();
  }

  pause() {
    if (!this.isPlaying) return;
    Tone.Transport.pause();
    this.isPlaying = false;
    this.stopClockSync();
  }

  stop() {
    Tone.Transport.stop();
    this.isPlaying = false;
    this.stopClockSync();
    // Ensure we send exactly 0 or whatever stopped position back to UI
    if (this.onTimeUpdate) {
      this.onTimeUpdate(Tone.Transport.seconds);
    }
    audioScheduler.clearSchedules();
  }

  seek(time) {
    if (this.initialized) {
      Tone.Transport.position = time;
      if (this.onTimeUpdate) {
        this.onTimeUpdate(time);
      }
    }
  }

  setBpm(bpm) {
    Tone.Transport.bpm.value = bpm;
  }

  startClockSync() {
    const tick = () => {
      if (this.isPlaying && this.onTimeUpdate) {
        this.onTimeUpdate(Tone.Transport.seconds);
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  stopClockSync() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  dispose() {
    this.stop();
    audioCache.clear();
    audioScheduler.clearSchedules();
  }
}

export const audioEngine = new AudioEngine();

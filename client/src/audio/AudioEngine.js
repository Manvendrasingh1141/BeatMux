/**
 * AudioEngine.js
 */

import { playKick }      from './sounds/kick.js';
import { playSnare }     from './sounds/snare.js';
import { playClosedHat } from './sounds/closedHat.js';
import { playOpenHat }   from './sounds/openHat.js';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1;
const TOTAL_STEPS = 16;

const SOUND_FNS = {
  kick:      playKick,
  snare:     playSnare,
  closedHat: playClosedHat,
  openHat:   playOpenHat,
};

export class AudioEngine {
  constructor() {
    this._ctx           = null;
    this._masterGain    = null;
    this._trackGains    = {};
    this._isPlaying     = false;
    this._currentStep   = 0;
    this._nextStepTime  = 0;
    this._bpm           = 120;
    this._resolution    = "1/4 Beat";
    this._pattern       = this._emptyPattern();
    this._muted         = {};
    this._soloed        = {};
    this._volumes       = { kick: 80, snare: 80, closedHat: 80, openHat: 80 };
    
    this._musicBuffer   = null;
    this._musicSource   = null;
    this._recorder      = null;
    this._destNode      = null;
    this._recordedChunks = [];

    this._schedulerTimer = null;
    this._stepQueue = [];
    this._rafHandle = null;
    this._onStepChange = null;
  }

  init() {
    if (this._ctx) {
      if (this._ctx.state === 'suspended') this._ctx.resume();
      return;
    }

    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = 0.9;
    this._masterGain.connect(this._ctx.destination);

    Object.keys(SOUND_FNS).forEach(key => {
      const gainNode = this._ctx.createGain();
      const vol = this._volumes[key] / 100;
      gainNode.gain.value = vol * vol;
      gainNode.connect(this._masterGain);
      this._trackGains[key] = gainNode;
    });
  }

  _ensureCtx() {
    if (!this._ctx) this.init();
    if (this._ctx.state === 'suspended') this._ctx.resume();
  }

  async loadMusic(file) {
    this._ensureCtx();
    const arrayBuffer = await file.arrayBuffer();
    this._musicBuffer = await this._ctx.decodeAudioData(arrayBuffer);
  }

  startRecording() {
    this._ensureCtx();
    this._destNode = this._ctx.createMediaStreamDestination();
    this._masterGain.connect(this._destNode);
    this._recorder = new MediaRecorder(this._destNode.stream);
    this._recordedChunks = [];
    this._recorder.ondataavailable = e => {
      if (e.data.size > 0) this._recordedChunks.push(e.data);
    };
    this._recorder.onstop = () => {
      const blob = new Blob(this._recordedChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'beatmux-mix.webm';
      a.click();
    };
    this._recorder.start();
  }

  stopRecording() {
    if (this._recorder && this._recorder.state !== 'inactive') {
      this._recorder.stop();
    }
    if (this._destNode) {
      this._masterGain.disconnect(this._destNode);
      this._destNode = null;
    }
  }

  setBpm(bpm) { this._bpm = Math.max(40, Math.min(240, bpm)); }
  setResolution(res) { this._resolution = res; }
  setPattern(pattern) { this._pattern = Object.fromEntries(Object.entries(pattern).map(([k, v]) => [k, [...v]])); }
  setMuted(muted) { this._muted = { ...muted }; }
  setSoloed(soloed) { this._soloed = { ...soloed }; }
  
  setVolumes(volumes) {
    this._volumes = { ...volumes };
    if (this._ctx && this._trackGains) {
      Object.entries(this._volumes).forEach(([key, val]) => {
        if (this._trackGains[key]) {
          const v = val / 100;
          this._trackGains[key].gain.setTargetAtTime(v * v, this._ctx.currentTime, 0.05);
        }
      });
    }
  }

  setMasterVolume(linear) {
    if (this._masterGain) this._masterGain.gain.value = linear;
  }

  onStepChange(fn) {
    this._onStepChange = fn;
  }

  play(startTime = null) {
    if (this._isPlaying) return;
    this._ensureCtx();

    this._isPlaying = true;
    this._stepQueue = [];

    let offset = 0;

    if (startTime) {
      const elapsedSec = (Date.now() - startTime) / 1000;
      const stepsPerBeat = this._resolution === '1/8 Beat' ? 8 : 4;
      const stepSec = (60 / this._bpm) / stepsPerBeat;

      if (elapsedSec > 0) {
        offset = elapsedSec;
        const exactSteps = elapsedSec / stepSec;
        this._currentStep = Math.floor(exactSteps) % 16;
        const remainderSec = (exactSteps - Math.floor(exactSteps)) * stepSec;
        this._nextStepTime = this._ctx.currentTime + (stepSec - remainderSec);
      } else {
        this._currentStep = 0;
        this._nextStepTime = this._ctx.currentTime + Math.abs(elapsedSec) + 0.05;
      }
    } else {
      this._currentStep = 0;
      this._nextStepTime = this._ctx.currentTime + 0.05;
    }

    if (this._musicBuffer) {
      this._musicSource = this._ctx.createBufferSource();
      this._musicSource.buffer = this._musicBuffer;
      this._musicSource.connect(this._masterGain);
      if (offset < this._musicBuffer.duration) {
        this._musicSource.start(this._nextStepTime, offset);
      }
    }

    this._startScheduler();
    this._startVisualLoop();
  }

  stop() {
    if (!this._isPlaying) return;
    this._isPlaying = false;

    clearTimeout(this._schedulerTimer);
    this._schedulerTimer = null;

    if (this._rafHandle) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = null;
    }

    if (this._musicSource) {
      this._musicSource.stop();
      this._musicSource.disconnect();
      this._musicSource = null;
    }

    this._stepQueue = [];
    
    // We do NOT reset this._currentStep to 0 here. 
    // It maintains state so the UI knows where it paused.
    
    if (this._onStepChange) this._onStepChange(-1);
  }

  get isPlaying() { return this._isPlaying; }

  _startScheduler() {
    const tick = () => {
      if (!this._isPlaying) return;
      while (this._ctx && this._nextStepTime < this._ctx.currentTime + SCHEDULE_AHEAD) {
        this._scheduleStep(this._currentStep, this._nextStepTime);
        this._advance();
      }
      this._schedulerTimer = setTimeout(tick, LOOKAHEAD_MS);
    };
    tick();
  }

  _scheduleStep(step, time) {
    this._stepQueue.push({ step, time });
    const hasSolo = Object.values(this._soloed).some(Boolean);
    Object.entries(SOUND_FNS).forEach(([key, fn]) => {
      if (!this._pattern[key]?.[step]) return;
      if (this._muted[key]) return;
      if (hasSolo && !this._soloed[key]) return;
      fn(this._ctx, time, this._trackGains[key]);
    });
  }

  _advance() {
    const stepsPerBeat = this._resolution === '1/8 Beat' ? 8 : 4;
    const secondsPerStep = 60.0 / this._bpm / stepsPerBeat;
    this._nextStepTime += secondsPerStep;
    this._currentStep = (this._currentStep + 1) % TOTAL_STEPS;
  }

  _startVisualLoop() {
    const tick = () => {
      if (!this._isPlaying) return;
      const now = this._ctx ? this._ctx.currentTime : 0;
      while (this._stepQueue.length > 0 && this._stepQueue[0].time <= now) {
        const { step } = this._stepQueue.shift();
        if (this._onStepChange) this._onStepChange(step);
      }
      this._rafHandle = requestAnimationFrame(tick);
    };
    this._rafHandle = requestAnimationFrame(tick);
  }

  _emptyPattern() {
    return { kick: [], snare: [], closedHat: [], openHat: [] };
  }
}

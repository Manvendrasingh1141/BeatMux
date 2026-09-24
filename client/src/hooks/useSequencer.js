/**
 * useSequencer.js
 *
 * React hook that owns all sequencer state, bridges React ↔ AudioEngine,
 * and handles Socket.IO real-time synchronization.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioEngine } from '../audio/AudioEngine.js';
import { getSocket } from '../services/socketService.js';

// Available dot/button colour palettes for new tracks
export const TRACK_COLORS = [
  { dot: 'bg-rose-500',    activeBtn: 'bg-rose-500 shadow-sm shadow-rose-300'       },
  { dot: 'bg-blue-500',    activeBtn: 'bg-blue-500 shadow-sm shadow-blue-300'       },
  { dot: 'bg-emerald-500', activeBtn: 'bg-emerald-500 shadow-sm shadow-emerald-300' },
  { dot: 'bg-purple-500',  activeBtn: 'bg-purple-500 shadow-sm shadow-purple-300'   },
  { dot: 'bg-amber-500',   activeBtn: 'bg-amber-500 shadow-sm shadow-amber-300'     },
  { dot: 'bg-cyan-500',    activeBtn: 'bg-cyan-500 shadow-sm shadow-cyan-300'       },
  { dot: 'bg-pink-500',    activeBtn: 'bg-pink-500 shadow-sm shadow-pink-300'       },
  { dot: 'bg-indigo-500',  activeBtn: 'bg-indigo-500 shadow-sm shadow-indigo-300'   },
];

export const DEFAULT_TRACKS = [
  { key: 'kick',      label: 'Kick',       ...TRACK_COLORS[0] },
  { key: 'snare',     label: 'Snare',      ...TRACK_COLORS[1] },
  { key: 'closedHat', label: 'Closed Hat', ...TRACK_COLORS[2] },
  { key: 'openHat',   label: 'Open Hat',   ...TRACK_COLORS[3] },
];

// Keep TRACKS export so existing imports don't break (points to seed list)
export const TRACKS = DEFAULT_TRACKS;

export const TOTAL_STEPS = 16;

export const DEFAULT_PATTERN = {
  kick:      [true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false],
  snare:     [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
  closedHat: [true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false],
  openHat:   [false, false, false, false, false, false, false, true,  false, false, false, false, false, false, false, true ],
};

function emptyPatternFor(tracks) {
  return tracks.reduce((acc, t) => {
    acc[t.key] = Array(TOTAL_STEPS).fill(false);
    return acc;
  }, {});
}

function clonePatternFor(tracks, src) {
  return tracks.reduce((acc, t) => {
    acc[t.key] = src[t.key] ? [...src[t.key]] : Array(TOTAL_STEPS).fill(false);
    return acc;
  }, {});
}

// Legacy helpers (used internally for default tracks)
function emptyPattern() { return emptyPatternFor(DEFAULT_TRACKS); }
function clonePattern(src) { return clonePatternFor(DEFAULT_TRACKS, src); }

export function useSequencer(initialState = null) {
  const [pattern,     setPattern]     = useState(() => initialState ? clonePattern(initialState.pattern) : clonePattern(DEFAULT_PATTERN));

  // ── Undo / Redo history ───────────────────────────────────────────────────
  const historyRef  = useRef([]);  // past snapshots
  const futureRef   = useRef([]);  // redo snapshots
  const MAX_HISTORY = 50;

  // ── Dynamic tracks (add / rename synced over socket) ─────────────────────
  const [tracks, setTracks] = useState(() => {
    if (initialState?.tracks) return initialState.tracks;
    return DEFAULT_TRACKS;
  });

  const [bpm,         setBpm]         = useState(initialState ? initialState.bpm : 120);
  const [isPlaying,   setIsPlaying]   = useState(initialState ? initialState.isPlaying : false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [muted,       setMuted]       = useState(initialState ? { ...initialState.muted } : {});
  const [soloed,      setSoloed]      = useState(initialState ? { ...initialState.soloed } : {});
  const [volumes,     setVolumes]     = useState(initialState ? { ...initialState.volumes } : { kick: 80, snare: 80, closedHat: 80, openHat: 80 });

  const [quantize,    setQuantize]    = useState(initialState?.quantize || '1/16');
  const [patternBank, setPatternBank] = useState(initialState?.patternBank || 'A');
  const [resolution,  setResolution]  = useState(initialState?.resolution || '1/4 Beat');

  const engineRef = useRef(null);
  const socket = getSocket();

  if (!engineRef.current) {
    engineRef.current = new AudioEngine();
  }

  useEffect(() => {
    engineRef.current.onStepChange((step) => {
      setCurrentStep(step);
      if (step === -1) setIsPlaying(false);
    });
    return () => {
      engineRef.current.stop();
    };
  }, []);

  // ── Sync Engine ───────────────────────────────────────────────────────────
  useEffect(() => { engineRef.current.setPattern(pattern); }, [pattern]);
  useEffect(() => { engineRef.current.setBpm(bpm); },        [bpm]);
  useEffect(() => { engineRef.current.setResolution(resolution); }, [resolution]);
  useEffect(() => { engineRef.current.setMuted(muted); },    [muted]);
  useEffect(() => { engineRef.current.setSoloed(soloed); },  [soloed]);
  useEffect(() => { engineRef.current.setVolumes(volumes); },[volumes]);

  // ── Sync Playback state on load ───────────────────────────────────────────
  useEffect(() => {
    if (isPlaying && !engineRef.current.isPlaying) {
      engineRef.current.init();
      engineRef.current.play(initialState?.startTime || null);
    } else if (!isPlaying && engineRef.current.isPlaying) {
      engineRef.current.stop();
    }
  }, [isPlaying]); // Note: only intended to run once or when isPlaying boolean toggles

  // ── Socket Listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onSeqStep = ({ trackKey, stepIndex, value }) => {
      setPattern((prev) => ({
        ...prev,
        [trackKey]: prev[trackKey].map((v, i) => (i === stepIndex ? value : v)),
      }));
    };

    const onSeqBpm = ({ bpm }) => setBpm(bpm);
    
    const onSeqPlay = ({ isPlaying, serverTimestamp }) => {
      setIsPlaying(isPlaying);
      if (isPlaying) {
        engineRef.current.init();
        engineRef.current.play(serverTimestamp);
      } else {
        engineRef.current.stop();
      }
    };

    const onSeqPattern = ({ pattern }) => setPattern(clonePattern(pattern));
    
    const onTrackMute = ({ trackKey, value }) => {
      setMuted((prev) => ({ ...prev, [trackKey]: value }));
    };
    
    const onTrackSolo = ({ trackKey, value }) => {
      setSoloed((prev) => ({ ...prev, [trackKey]: value }));
    };

    const onTrackVolume = ({ trackKey, volume }) => {
      setVolumes((prev) => ({ ...prev, [trackKey]: volume }));
    };

    const onSeqQuantize = ({ quantize }) => setQuantize(quantize);
    const onSeqPatternBank = ({ patternBank }) => setPatternBank(patternBank);
    const onSeqResolution = ({ resolution }) => setResolution(resolution);

    const onTrackAdd = ({ track, pattern: newPattern }) => {
      setTracks((prev) => [...prev, track]);
      if (newPattern) setPattern(newPattern);
    };

    const onTrackRename = ({ trackKey, label }) => {
      setTracks((prev) => prev.map((t) => t.key === trackKey ? { ...t, label } : t));
    };

    const onRoomJoined = ({ state }) => {
      // Overwrite all state on reconnect
      if (state.tracks) setTracks(state.tracks);
      setPattern(clonePatternFor(state.tracks || DEFAULT_TRACKS, state.pattern));
      setBpm(state.bpm);
      setMuted({ ...state.muted });
      setSoloed({ ...state.soloed });
      setVolumes({ ...state.volumes });
      setQuantize(state.quantize || '1/16');
      setPatternBank(state.patternBank || 'A');
      setResolution(state.resolution || '1/4 Beat');
      setIsPlaying(state.isPlaying);
      
      if (state.isPlaying) {
        engineRef.current.init();
        engineRef.current.play(state.startTime);
      } else {
        engineRef.current.stop();
      }
    };

    socket.on('sequencer:step', onSeqStep);
    socket.on('sequencer:bpm', onSeqBpm);
    socket.on('sequencer:play', onSeqPlay);
    socket.on('sequencer:pattern', onSeqPattern);
    socket.on('track:mute', onTrackMute);
    socket.on('track:solo', onTrackSolo);
    socket.on('track:volume', onTrackVolume);
    socket.on('sequencer:quantize', onSeqQuantize);
    socket.on('sequencer:patternBank', onSeqPatternBank);
    socket.on('sequencer:resolution', onSeqResolution);
    socket.on('track:add', onTrackAdd);
    socket.on('track:rename', onTrackRename);
    socket.on('room:joined', onRoomJoined); // Catch-up on reconnect

    return () => {
      socket.off('sequencer:step', onSeqStep);
      socket.off('sequencer:bpm', onSeqBpm);
      socket.off('sequencer:play', onSeqPlay);
      socket.off('sequencer:pattern', onSeqPattern);
      socket.off('track:mute', onTrackMute);
      socket.off('track:solo', onTrackSolo);
      socket.off('track:volume', onTrackVolume);
      socket.off('sequencer:quantize', onSeqQuantize);
      socket.off('sequencer:patternBank', onSeqPatternBank);
      socket.off('sequencer:resolution', onSeqResolution);
      socket.off('track:add', onTrackAdd);
      socket.off('track:rename', onTrackRename);
      socket.off('room:joined', onRoomJoined);
    };
  }, [socket]);

  // ── Activity Reporting ────────────────────────────────────────────────────
  const activityTimeout = useRef(null);
  
  const reportActivity = useCallback((text) => {
    if (!socket) return;
    socket.emit('user:activity', { activity: text });
    if (activityTimeout.current) clearTimeout(activityTimeout.current);
    activityTimeout.current = setTimeout(() => {
      socket.emit('user:activity', { activity: 'Idle' });
    }, 4000);
  }, [socket]);

  // ── Actions (Emit to Socket) ──────────────────────────────────────────────

  const play = useCallback(() => {
    const ts = Date.now();
    engineRef.current.init();
    engineRef.current.play(ts);
    setIsPlaying(true);
    setCurrentStep(0);
    if (socket) socket.emit('sequencer:play', { isPlaying: true, timestamp: ts });
    reportActivity('Playing');
  }, [socket, reportActivity]);

  const stop = useCallback(() => {
    engineRef.current.stop();
    setIsPlaying(false);
    setCurrentStep(-1);
    if (socket) socket.emit('sequencer:play', { isPlaying: false });
    reportActivity('Idle');
  }, [socket, reportActivity]);

  const togglePlay = useCallback(() => {
    if (engineRef.current.isPlaying) stop();
    else play();
  }, [play, stop]);

  const toggleStep = useCallback((trackKey, stepIndex) => {
    setPattern((prev) => {
      // save snapshot before mutating
      historyRef.current = [...historyRef.current.slice(-MAX_HISTORY), clonePattern(prev)];
      futureRef.current = [];

      const newValue = !prev[trackKey][stepIndex];
      if (socket) socket.emit('sequencer:step', { trackKey, stepIndex, value: newValue });
      return {
        ...prev,
        [trackKey]: prev[trackKey].map((v, i) => (i === stepIndex ? newValue : v)),
      };
    });
    
    const label = TRACKS.find(t => t.key === trackKey)?.label || trackKey;
    reportActivity(`Editing ${label.toLowerCase()}`);
  }, [socket, reportActivity]);

  const clearPattern = useCallback(() => {
    setPattern((prev) => {
      historyRef.current = [...historyRef.current.slice(-MAX_HISTORY), clonePattern(prev)];
      futureRef.current = [];
      return emptyPattern();
    });
    if (socket) socket.emit('sequencer:pattern', { pattern: emptyPattern() });
    reportActivity('Cleared pattern');
  }, [socket, reportActivity]);

  const resetPattern = useCallback(() => {
    setPattern((prev) => {
      historyRef.current = [...historyRef.current.slice(-MAX_HISTORY), clonePattern(prev)];
      futureRef.current = [];
      return clonePattern(DEFAULT_PATTERN);
    });
    if (socket) socket.emit('sequencer:pattern', { pattern: clonePattern(DEFAULT_PATTERN) });
    reportActivity('Reset pattern');
  }, [socket, reportActivity]);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    setPattern((prev) => {
      futureRef.current = [clonePattern(prev), ...futureRef.current];
      const prev_snap = historyRef.current[historyRef.current.length - 1];
      historyRef.current = historyRef.current.slice(0, -1);
      if (socket) socket.emit('sequencer:pattern', { pattern: prev_snap });
      return prev_snap;
    });
    reportActivity('Undo');
  }, [socket, reportActivity]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    setPattern((prev) => {
      historyRef.current = [...historyRef.current, clonePattern(prev)];
      const next_snap = futureRef.current[0];
      futureRef.current = futureRef.current.slice(1);
      if (socket) socket.emit('sequencer:pattern', { pattern: next_snap });
      return next_snap;
    });
    reportActivity('Redo');
  }, [socket, reportActivity]);

  const changeBpm = useCallback((newBpm) => {
    const clamped = Math.max(40, Math.min(240, Math.round(newBpm)));
    setBpm(clamped);
    if (socket) socket.emit('sequencer:bpm', { bpm: clamped });
    reportActivity('Changing BPM');
  }, [socket, reportActivity]);

  const toggleMute = useCallback((trackKey) => {
    setMuted((prev) => {
      const newValue = !prev[trackKey];
      if (socket) socket.emit('track:mute', { trackKey, value: newValue });
      return { ...prev, [trackKey]: newValue };
    });
  }, [socket]);

  const toggleSolo = useCallback((trackKey) => {
    setSoloed((prev) => {
      const newValue = !prev[trackKey];
      if (socket) socket.emit('track:solo', { trackKey, value: newValue });
      return { ...prev, [trackKey]: newValue };
    });
  }, [socket]);

  const changeVolume = useCallback((trackKey, volume) => {
    setVolumes((prev) => {
      if (socket) socket.emit('track:volume', { trackKey, volume });
      return { ...prev, [trackKey]: volume };
    });
    
    const label = TRACKS.find(t => t.key === trackKey)?.label || trackKey;
    reportActivity(`Mixing ${label.toLowerCase()}`);
  }, [socket, reportActivity]);

  const changeMasterVolume = useCallback((linear) => {
    engineRef.current.setMasterVolume(linear);
  }, []);

  const changeQuantize = useCallback((val) => {
    setQuantize(val);
    if (socket) socket.emit('sequencer:quantize', { quantize: val });
    reportActivity('Changing quantize');
  }, [socket, reportActivity]);

  const changePatternBank = useCallback((val) => {
    setPatternBank(val);
    if (socket) socket.emit('sequencer:patternBank', { patternBank: val });
    reportActivity('Changing pattern');
  }, [socket, reportActivity]);

  const changeResolution = useCallback((val) => {
    setResolution(val);
    if (socket) socket.emit('sequencer:resolution', { resolution: val });
    reportActivity('Changing resolution');
  }, [socket, reportActivity]);

  const addTrack = useCallback((label) => {
    setTracks((prev) => {
      const colorIdx = prev.length % TRACK_COLORS.length;
      const key      = `custom_${Date.now()}`;
      const newTrack = { key, label: label || 'New Track', ...TRACK_COLORS[colorIdx] };
      const newTracks = [...prev, newTrack];

      // Extend the pattern with an empty row for the new track
      setPattern((pat) => {
        const newPat = { ...pat, [key]: Array(TOTAL_STEPS).fill(false) };
        if (socket) socket.emit('track:add', { track: newTrack, pattern: newPat, tracks: newTracks });
        return newPat;
      });

      return newTracks;
    });
    reportActivity('Added track');
  }, [socket, reportActivity]);

  const renameTrack = useCallback((trackKey, label) => {
    if (!label || !label.trim()) return;
    setTracks((prev) => prev.map((t) => t.key === trackKey ? { ...t, label: label.trim() } : t));
    if (socket) socket.emit('track:rename', { trackKey, label: label.trim() });
    reportActivity(`Renamed track`);
  }, [socket, reportActivity]);

  return {
    pattern,
    bpm,
    isPlaying,
    currentStep,
    muted,
    soloed,
    volumes,
    tracks,
    quantize,
    patternBank,
    resolution,
    play,
    stop,
    togglePlay,
    toggleStep,
    clearPattern,
    resetPattern,
    changeBpm,
    toggleMute,
    toggleSolo,
    changeVolume,
    changeMasterVolume,
    changeQuantize,
    changePatternBank,
    changeResolution,
    addTrack,
    renameTrack,
    undo,
    redo,
    canUndo: historyRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}

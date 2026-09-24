import React, { useEffect, useState } from 'react';
import { useTimelineStore } from '../store/timeline.store';
import { useTransportStore } from '../../transport/store/transport.store';
import { useAssetStore } from '../../assets/store/asset.store';
import { audioEngine } from '../../audio/audio.engine';

const formatTimeCode = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
};

const TimelineToolbar = () => {
  const { pixelsPerSecond, setZoom, clips, getDuration } = useTimelineStore();
  const { status, setStatus, currentTime, setCurrentTime, bpm, setBpm, snapMode, setSnapMode } = useTransportStore();
  const { assets } = useAssetStore();
  const duration = getDuration();
  const [localBpm, setLocalBpm] = useState(bpm.toString());

  // Keep timecode ticking while playing
  useEffect(() => {
    audioEngine.onTimeUpdate = (time) => {
      if (time >= duration && duration > 0 && status === 'PLAYING') {
        handleStop();
        return;
      }
      setCurrentTime(time);
    };
  }, [duration, status]);

  // ── Play / Pause ────────────────────────────────────────────────────────
  const handlePlay = async () => {
    // 1. Unlock AudioContext synchronously on the click gesture
    if (!audioEngine.initialized) await audioEngine.initialize();

    if (status === 'PLAYING') {
      // Pause locally immediately
      audioEngine.pause();
      setStatus('PAUSED');
      // Sync to other users via WS (fire-and-forget)
      import('../../transport/sync/transport.sync').then(s => s.syncPause());
      return;
    }

    // Play
    const startTime = (currentTime >= duration && duration > 0) ? 0 : currentTime;
    const assetsMap = {};
    assets.forEach(a => { assetsMap[a._id] = a; });

    // Start local audio immediately so there's no lag
    setStatus('PLAYING');
    audioEngine.play(clips, assetsMap, startTime);

    // Also notify other users via WS so they play too
    import('../../transport/sync/transport.sync').then(s => s.syncPlay(startTime));
  };

  // ── Stop ────────────────────────────────────────────────────────────────
  const handleStop = async () => {
    if (!audioEngine.initialized) await audioEngine.initialize();
    audioEngine.stop();
    setStatus('STOPPED');
    setCurrentTime(0);
    // Sync stop to other users
    import('../../transport/sync/transport.sync').then(s => s.syncStop());
  };

  // ── BPM ─────────────────────────────────────────────────────────────────
  const handleBpmChange = (val) => {
    const b = parseInt(val, 10);
    if (!isNaN(b) && b >= 20 && b <= 300) {
      setBpm(b);
      audioEngine.setBpm(b);
      import('../../transport/sync/transport.sync').then(s => s.syncSetBpm(b));
    }
    setLocalBpm(val);
  };

  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0 font-sans shadow-sm z-10">

      {/* Left: Tool icons */}
      <div className="flex items-center gap-2">
        <button className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100" title="Select">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 4.7z"/></svg>
        </button>
        <button className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center" title="Edit">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
        <button className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center" title="Split">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
        </button>
      </div>

      {/* Center: BPM + Transport */}
      <div className="flex items-center gap-6">
        {/* BPM */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">BPM</span>
          <div className="flex items-center bg-slate-100 rounded-full p-1 gap-1">
            <button type="button" onClick={() => handleBpmChange(String(Math.max(20, bpm - 1)))} className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-sm font-bold">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <input type="number" className="w-12 bg-transparent text-center text-sm font-black text-slate-900 outline-none" value={localBpm} onChange={e => handleBpmChange(e.target.value)} onBlur={() => setLocalBpm(bpm.toString())}/>
            <button type="button" onClick={() => handleBpmChange(String(Math.min(300, bpm + 1)))} className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-sm font-bold">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </div>

        {/* Stop / Play */}
        <div className="flex items-center gap-3">
          <button onClick={handleStop} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all" title="Stop">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
          </button>
          <button onClick={handlePlay} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${status === 'PLAYING' ? 'bg-indigo-700 shadow-indigo-700/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'}`} title={status === 'PLAYING' ? 'Pause' : 'Play'}>
            {status === 'PLAYING'
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M5 3l14 9-14 9V3z"/></svg>
            }
          </button>
        </div>

        {/* Timecode */}
        <div className="text-sm font-black text-slate-700 w-24 text-center tabular-nums">
          {formatTimeCode(currentTime)}
        </div>
      </div>

      {/* Right: Zoom + Snap */}
      <div className="flex items-center gap-4">
        <select value={snapMode} onChange={e => setSnapMode(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none">
          <option value="OFF">Snap: Off</option>
          <option value="BEAT">Snap: Beat</option>
          <option value="BAR">Snap: Bar</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Zoom</span>
          <input type="range" min="10" max="200" value={pixelsPerSecond} onChange={e => setZoom(Number(e.target.value))} className="w-24 h-1.5 bg-slate-200 rounded-full appearance-none accent-indigo-600"/>
        </div>
      </div>
    </div>
  );
};

export default TimelineToolbar;

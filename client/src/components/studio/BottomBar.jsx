import { useState, useEffect } from 'react';
import { Pencil, SkipBack, Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';

export default function BottomBar({ isPlaying, onTogglePlay, onStop, onChangeMasterVolume, currentMusicName }) {
  const [volume, setVolume] = useState(80);
  const [muted,  setMuted]  = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const volDb = ((volume / 100) * 6 - 6).toFixed(1);

  // Dynamic time counter while playing
  useEffect(() => {
    let animationFrameId;
    let startTimestamp = null;
    let initialElapsed = elapsedMs;

    if (isPlaying) {
      const tick = (timestamp) => {
        if (startTimestamp === null) startTimestamp = timestamp;
        const delta = timestamp - startTimestamp;
        
        // Loop at 32 seconds (32000 ms) for visual effect
        const current = (initialElapsed + delta) % 32000;
        setElapsedMs(current);
        animationFrameId = requestAnimationFrame(tick);
      };
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  const handleStop = () => {
    onStop();
    setElapsedMs(0);
  };

  // Format MM:SS.ms (e.g. 00:12.34)
  const mins = Math.floor(elapsedMs / 60000).toString().padStart(2, '0');
  const secs = Math.floor((elapsedMs % 60000) / 1000).toString().padStart(2, '0');
  const ms = Math.floor((elapsedMs % 1000) / 10).toString().padStart(2, '0');
  const timeString = `${mins}:${secs}.${ms}`;

  return (
    <footer className="h-[64px] bg-white border-t border-slate-200/80 flex items-center justify-between px-5 shrink-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">

      {/* ── Left: Current Track ─────────────────────────────────── */}
      <div className="w-52 shrink-0 flex flex-col justify-center">
        {currentMusicName && (
          <>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current song</span>
            <span className="text-sm font-semibold text-slate-800 truncate">{currentMusicName}</span>
          </>
        )}
      </div>

      {/* ── Centre: Timecode + Transport ───────────────────────── */}
      <div className="flex items-center gap-6">
        {/* Current Time (Left) */}
        <span className="text-[13px] font-bold tabular-nums text-slate-500 w-[60px] text-right">
          {timeString}
        </span>

        {/* Transport Controls (Center) */}
        <div className="flex items-center gap-4">
          <button onClick={handleStop} className="text-slate-400 hover:text-slate-700 transition-colors" aria-label="Skip to start">
            <SkipBack className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg,#6c63ff,#5e60ce)', boxShadow: '0 4px 14px rgba(94,96,206,0.4)' }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause className="w-4 h-4 fill-current" />
              : <Play  className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button className="text-slate-400 hover:text-slate-700 transition-colors" aria-label="Skip forward">
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Total Time (Right) */}
        <span className="text-[13px] font-bold tabular-nums text-slate-500 w-[60px]">
          00:32.00
        </span>
      </div>

      {/* ── Right: Volume ───────────────────────────── */}
      <div className="flex items-center gap-3 w-52 shrink-0 justify-end">
        <button
          onClick={() => { const m = !muted; setMuted(m); onChangeMasterVolume?.(m ? 0 : volume / 100); }}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <input
          type="range" min={0} max={100} value={muted ? 0 : volume}
          onChange={(e) => { const v = Number(e.target.value); setVolume(v); setMuted(false); onChangeMasterVolume?.(v / 100); }}
          className="w-20 h-1 rounded-full cursor-pointer appearance-none"
          style={{ background: `linear-gradient(to right,#6c63ff ${muted ? 0 : volume}%,#e2e8f0 ${muted ? 0 : volume}%)` }}
        />
        <span className="text-[11px] font-semibold text-slate-500 w-12 text-right tabular-nums">
          {muted ? '−∞ dB' : `${volDb} dB`}
        </span>
      </div>
    </footer>
  );
}

import { useState } from 'react';
import { SkipBack, Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';

export default function BottomBar({ isPlaying, onTogglePlay, onStop, onChangeMasterVolume, currentMusicName, elapsedMs, musicDuration, onResetElapsed }) {
  const [volume, setVolume] = useState(80);
  const [muted,  setMuted]  = useState(false);

  const volDb = ((volume / 100) * 6 - 6).toFixed(1);

  const handleStop = () => {
    onStop();
    if (onResetElapsed) onResetElapsed();
  };

  const formatTime = (msVal) => {
    const mins = Math.floor(msVal / 60000).toString().padStart(2, '0');
    const secs = Math.floor((msVal % 60000) / 1000).toString().padStart(2, '0');
    const ms = Math.floor((msVal % 1000) / 10).toString().padStart(2, '0');
    return `${mins}:${secs}.${ms}`;
  };

  const timeString = formatTime(elapsedMs);
  const totalString = musicDuration > 0 ? formatTime(musicDuration * 1000) : "00:32.00";

  return (
    <footer className="h-auto min-h-[64px] py-3 lg:py-0 bg-white border-t border-slate-200/80 flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-between px-2 lg:px-5 shrink-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] gap-3 lg:gap-0">
      <div className="w-full lg:w-52 shrink-0 flex flex-col justify-center items-center lg:items-start text-center lg:text-left order-3 lg:order-1 hidden sm:flex">
        {currentMusicName && (
          <>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current song</span>
            <span className="text-sm font-semibold text-slate-800 truncate">{currentMusicName}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-6 order-1 lg:order-2">
        <span className="text-[13px] font-bold tabular-nums text-slate-500 w-[60px] text-right">
          {timeString}
        </span>
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
        <span className="text-[13px] font-bold tabular-nums text-slate-500 w-[60px]">
          {totalString}
        </span>
      </div>

      <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-52 shrink-0 justify-center lg:justify-end order-2 lg:order-3">
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

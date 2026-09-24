import { useState } from 'react';
import { Activity, Play, Pause, Square, Undo2, Redo2, Minus, Plus, Copy, Check } from 'lucide-react';

export default function TopNav({ roomId, isPlaying, bpm, onTogglePlay, onStop, onChangeBpm, userCount, connStatus, you, onUndo, onRedo, canUndo, canRedo }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dotColor = connStatus === 'connected' ? '#22c55e' : connStatus === 'reconnecting' ? '#eab308' : '#ef4444';

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-5 shrink-0 z-30 shadow-sm">

      {/* ── Left: Logo + pills ──────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 select-none mr-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c6fcd,#5e60ce)' }}>
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-[17px] tracking-tight text-slate-900">BeatMux</span>
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-2">
          {/* Online */}
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
            {connStatus === 'connected' ? 'Online' : connStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'}
          </span>

          {/* Live */}
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100">
            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isPlaying ? 'animate-pulse' : ''}`} />
            {isPlaying ? 'Playing' : 'Live'}
          </span>
        </div>
      </div>

      {/* ── Centre: BPM + Transport ─────────────────────────────────── */}
      <div className="flex items-center gap-5">
        {/* BPM */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">BPM</span>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <button onClick={() => onChangeBpm(bpm - 1)} className="text-slate-400 hover:text-slate-700 transition-colors p-0.5">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm font-bold text-slate-800 tabular-nums w-8 text-center select-none">{bpm}</span>
            <button onClick={() => onChangeBpm(bpm + 1)} className="text-slate-400 hover:text-slate-700 transition-colors p-0.5">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Play/Stop removed here as they are in the bottom bar */}

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition-colors ${canUndo ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800' : 'text-slate-300 cursor-not-allowed'}`}
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition-colors ${canRedo ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800' : 'text-slate-300 cursor-not-allowed'}`}
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Right: Avatar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        {/* Pills */}
        <div className="flex items-center gap-2">
          {/* Collaborators */}
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100">
            <span className="flex -space-x-1">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-300 border border-white block" />
              <span className="w-3.5 h-3.5 rounded-full bg-violet-300 border border-white block" />
            </span>
            {userCount || 1} collaborator{userCount !== 1 ? 's' : ''}
          </span>

          {/* Room ID */}
          {roomId && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {roomId}
            </button>
          )}
        </div>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold select-none cursor-default shadow"
          style={{ background: 'linear-gradient(135deg,#7c6fcd,#5e60ce)' }}
          title={you?.displayName || 'You'}
        >
          {you?.displayName ? you.displayName.substring(0, 2).toUpperCase() : 'ME'}
        </div>
      </div>
    </header>
  );
}

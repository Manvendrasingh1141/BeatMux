/**
 * TrackRow — matches reference image styling exactly.
 * Dot colour + volume slider + M/S + editable label.
 */
import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import StepButton from './StepButton';

const TOTAL_STEPS = 16;

export default function TrackRow({
  track, steps, currentStep, isMuted, isSoloed, volume, quantize,
  onToggleStep, onToggleMute, onToggleSolo, onChangeVolume, onRenameTrack,
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(track.label);
  const inputRef = useRef(null);

  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editing]);

  const startEdit  = () => { setEditVal(track.label); setEditing(true); };
  const commitEdit = () => { const t = editVal.trim(); if (t && t !== track.label) onRenameTrack(track.key, t); setEditing(false); };
  const cancelEdit = () => { setEditVal(track.label); setEditing(false); };
  const onKeyDown  = (e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); };

  const quantizeDivisions = quantize === '1/4' ? 4 : quantize === '1/8' ? 2 : 1;
  const isStepEnabled = (index) => index % quantizeDivisions === 0;

  return (
    <div className="flex items-center gap-2 py-0.5">

      {/* ── Track info (label + slider + M/S) ─────────────────── */}
      <div className="w-[200px] shrink-0 flex items-center justify-between gap-2">

        {/* Dot + editable label */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 group">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${track.dot}`} />
          {editing ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                ref={inputRef} value={editVal} maxLength={20}
                onChange={(e) => setEditVal(e.target.value)}
                onKeyDown={onKeyDown} onBlur={commitEdit}
                className="w-full text-xs font-semibold border border-indigo-400 rounded px-1 py-0.5 outline-none bg-white text-slate-800"
              />
              <button onClick={commitEdit} className="text-emerald-500 shrink-0"><Check className="w-3 h-3" /></button>
              <button onClick={cancelEdit} className="text-slate-400 shrink-0"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <span
                onDoubleClick={startEdit}
                className={`text-xs font-semibold truncate cursor-default ${isMuted ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                title="Double-click to rename"
              >{track.label}</span>
              <button onClick={startEdit} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-indigo-500 transition-opacity shrink-0">
                <Pencil className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>

        {/* Volume + M/S */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="range" min={0} max={100} value={volume ?? 80}
            onChange={(e) => onChangeVolume(track.key, Number(e.target.value))}
            className="w-14 h-1 rounded-full cursor-pointer appearance-none"
            style={{ background: `linear-gradient(to right,#6c63ff ${volume ?? 80}%,#e2e8f0 ${volume ?? 80}%)` }}
            title={`${track.label} volume`}
          />
          <button
            onClick={() => onToggleMute(track.key)}
            className={`w-6 h-6 rounded-md text-[9px] font-bold transition-all ${isMuted ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >M</button>
          <button
            onClick={() => onToggleSolo(track.key)}
            className={`w-6 h-6 rounded-md text-[9px] font-bold transition-all ${isSoloed ? 'text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            style={isSoloed ? { background: 'linear-gradient(135deg,#6c63ff,#5e60ce)' } : {}}
          >S</button>
        </div>
      </div>

      {/* ── Step grid ─────────────────────────────────────────────── */}
      <div className="flex-1 flex gap-1 p-1 rounded-xl" style={{ background: '#f4f4fb' }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <StepButton
            key={i} stepNumber={i + 1}
            isActive={steps?.[i] ?? false}
            isCurrentStep={currentStep === i}
            isEnabled={isStepEnabled(i)}
            color={track.activeBtn}
            onClick={() => isStepEnabled(i) && onToggleStep(track.key, i)}
          />
        ))}
      </div>
    </div>
  );
}

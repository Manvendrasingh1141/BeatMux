import { useState } from 'react';
import { Grid3x3, Plus, Trash2, RotateCcw, ChevronDown, X } from 'lucide-react';
import TrackRow from './TrackRow';

const TOTAL_STEPS = 16;

export default function Sequencer({
  pattern, currentStep, muted, soloed, volumes, tracks,
  quantize, patternBank, resolution,
  onToggleStep, onToggleMute, onToggleSolo, onChangeVolume,
  onChangeQuantize, onChangePatternBank, onChangeResolution,
  onAddTrack, onRenameTrack, onClear, onReset,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');

  const handleAdd = () => {
    onAddTrack(newTrackName.trim() || 'New Track');
    setNewTrackName('');
    setShowAddModal(false);
  };
  const onKey = (e) => {
    if (e.key === 'Enter')  handleAdd();
    if (e.key === 'Escape') { setShowAddModal(false); setNewTrackName(''); }
  };

  const SelectBox = ({ value, onChange, children }) => (
    <div className="relative inline-flex items-center">
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-2.5 pr-7 py-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg outline-none hover:border-slate-300 focus:border-indigo-400 transition-colors cursor-pointer"
      >{children}</select>
      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
    </div>
  );

  return (
    <div className="bg-white/90 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col shrink-0">

      {/* ── Tab / toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 border-b border-slate-100">
        <div className="flex items-center">
          {/* Step Sequencer tab */}
          <button className="flex items-center gap-1.5 px-0 py-3 mr-4 text-[13px] font-bold text-indigo-600 border-b-2 border-indigo-600">
            <Grid3x3 className="w-3.5 h-3.5" />
            Step Sequencer
          </button>
          {/* Add Track */}
          <button
            onClick={() => { setShowAddModal(true); setNewTrackName(''); }}
            className="flex items-center gap-1 text-[12px] font-medium text-slate-400 hover:text-indigo-600 transition-colors py-3"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Track
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClear} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-all">
            <Trash2 className="w-3 h-3" /> Clear
          </button>
          <button onClick={onReset} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      {/* ── Controls row ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100">
        <SelectBox value={quantize} onChange={onChangeQuantize}>
          <option value="1/16">1/16</option>
          <option value="1/8">1/8</option>
          <option value="1/4">1/4</option>
        </SelectBox>
        <span className="text-[11px] font-semibold text-slate-400">Quantize</span>

        <div className="h-3 w-px bg-slate-200 mx-1" />

        <span className="text-[11px] font-semibold text-slate-400">Pattern:</span>
        <SelectBox value={patternBank} onChange={onChangePatternBank}>
          <option value="A">A (Default)</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </SelectBox>

        <div className="h-3 w-px bg-slate-200 mx-1" />

        <span className="text-[11px] font-semibold text-slate-400">Resolution:</span>
        <SelectBox value={resolution} onChange={onChangeResolution}>
          <option value="1/4 Beat">1/4 Beat</option>
          <option value="1/8 Beat">1/8 Beat</option>
        </SelectBox>
      </div>

      {/* ── Step grid ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 space-y-1.5 overflow-y-auto" style={{ maxHeight: '260px' }}>
        {/* Step numbers */}
        <div className="flex ml-[204px] gap-1 mb-0.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className={`flex-1 text-center text-[9px] font-bold ${currentStep === i ? 'text-indigo-500' : 'text-slate-400'}`}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Tracks */}
        {(tracks || []).map((track) => (
          <TrackRow
            key={track.key}
            track={track}
            steps={pattern[track.key] || Array(TOTAL_STEPS).fill(false)}
            currentStep={currentStep}
            isMuted={!!muted[track.key]}
            isSoloed={!!soloed[track.key]}
            volume={volumes[track.key] ?? 80}
            quantize={quantize}
            onToggleStep={onToggleStep}
            onToggleMute={onToggleMute}
            onToggleSolo={onToggleSolo}
            onChangeVolume={onChangeVolume}
            onRenameTrack={onRenameTrack}
          />
        ))}
      </div>

      {/* ── Add Track Modal ───────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add New Track</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Track name</label>
            <input
              autoFocus type="text" placeholder="e.g. Clap, Cowbell, Tom…"
              value={newTrackName} maxLength={20}
              onChange={(e) => setNewTrackName(e.target.value)} onKeyDown={onKey}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 bg-slate-50 focus:bg-white transition-all mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button
                onClick={handleAdd}
                className="flex-1 py-2 text-sm font-semibold text-white rounded-xl transition-colors"
                style={{ background: 'linear-gradient(135deg,#6c63ff,#5e60ce)', boxShadow: '0 4px 12px rgba(94,96,206,0.35)' }}
              >Add Track</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

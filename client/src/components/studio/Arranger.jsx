import { useState, useRef, useEffect } from 'react';
import { Minus, Plus, Music2 } from 'lucide-react';

const ARRANGER_COLORS = [
  { color: 'bg-rose-100',    accent: 'bg-rose-400',    border: 'border-rose-200/60'    },
  { color: 'bg-indigo-100',  accent: 'bg-indigo-400',  border: 'border-indigo-200/60'  },
  { color: 'bg-emerald-100', accent: 'bg-emerald-400', border: 'border-emerald-200/60' },
  { color: 'bg-amber-100',   accent: 'bg-amber-400',   border: 'border-amber-200/60'   },
  { color: 'bg-purple-100',  accent: 'bg-purple-400',  border: 'border-purple-200/60'  },
  { color: 'bg-cyan-100',    accent: 'bg-cyan-400',    border: 'border-cyan-200/60'    },
];

function makeWaveform(count, seed) {
  return Array.from({ length: count }, (_, i) => {
    const s = Math.sin(i * 0.8 + seed) * 14 + Math.cos(i * 0.4 + seed) * 6;
    return Math.max(4, Math.round(20 + s));
  });
}

// Generate plenty of waves so we don't run out
const TRACK_WAVES = Array.from({ length: 20 }).map((_, ti) => ({
  seg1: makeWaveform(60, ti * 1.3),
  seg2: makeWaveform(30, ti * 2.1 + 1),
}));

const TOTAL_BARS = 12;

export default function Arranger({ currentStep = -1, isPlaying = false, tracks = [], quantize = '1/16' }) {
  const [zoom, setZoom]    = useState(1);
  const timelineRef        = useRef(null);
  const leftRef            = useRef(null);

  // If tracks is empty, use default dummy ones so it doesn't break
  const displayTracks = tracks.length > 0 ? tracks : [
    { label: 'Drums', key: 'drums' },
    { label: 'Bass',  key: 'bass' },
    { label: 'Vocal', key: 'vocal' },
  ];

  const colWidth    = Math.round(zoom * 60);
  const totalWidth  = colWidth * TOTAL_BARS;
  const TOTAL_STEPS = 16;
  const stepWidth   = (colWidth * 8) / TOTAL_STEPS;
  const playheadPx  = isPlaying && currentStep >= 0 ? currentStep * stepWidth : -1;

  useEffect(() => {
    if (!timelineRef.current || playheadPx < 0) return;
    const el = timelineRef.current;
    const margin = 60;
    if (playheadPx < el.scrollLeft + margin) el.scrollLeft = Math.max(0, playheadPx - margin);
    else if (playheadPx > el.scrollLeft + el.clientWidth - margin)
      el.scrollLeft = playheadPx - el.clientWidth + margin;
  }, [playheadPx]);

  const handleZoom = (val) => setZoom(Math.round(Math.min(3, Math.max(0.3, val)) * 10) / 10);
  const markers = Array.from({ length: TOTAL_BARS }, (_, i) => i + 1);

  const syncScroll = (e) => {
    if (leftRef.current) leftRef.current.scrollTop = e.target.scrollTop;
  };

  return (
    <div className="bg-white/90 rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Arrangement</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Zoom</span>
          <button onClick={() => handleZoom(zoom - 0.1)} className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors">
            <Minus className="w-3 h-3" />
          </button>
          <div className="relative flex items-center">
            <input
              type="range" min={3} max={30} step={1}
              value={Math.round(zoom * 10)}
              onChange={(e) => handleZoom(Number(e.target.value) / 10)}
              className="w-24 h-1 rounded-full cursor-pointer appearance-none"
              style={{ background: `linear-gradient(to right, #6c63ff ${((zoom - 0.3) / 2.7) * 100}%, #e2e8f0 ${((zoom - 0.3) / 2.7) * 100}%)`, accentColor: '#6c63ff' }}
            />
          </div>
          <button onClick={() => handleZoom(zoom + 0.1)} className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors">
            <Plus className="w-3 h-3" />
          </button>
          <span className="text-[11px] text-slate-500 tabular-nums w-9 text-right font-semibold">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Fixed track headers */}
        <div className="w-36 shrink-0 border-r border-slate-100 bg-slate-50/50 overflow-hidden" ref={leftRef}>
          <div className="h-6 border-b border-slate-100" />
          {displayTracks.map((t, idx) => {
            const style = ARRANGER_COLORS[idx % ARRANGER_COLORS.length];
            return (
              <div key={t.key} className="h-16 border-b border-slate-100 px-3 flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg ${style.color} border ${style.border} flex items-center justify-center shrink-0`}>
                  <Music2 className="w-3 h-3 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate mb-1">{t.label}</p>
                  <div className="flex gap-0.5">
                    <button className="w-5 h-5 rounded text-[9px] font-bold bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-colors">M</button>
                    <button className="w-5 h-5 rounded text-[9px] font-bold bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-colors">S</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable timeline */}
        <div className="flex-1 overflow-auto" ref={timelineRef} onScroll={syncScroll}>
          <div style={{ width: `${totalWidth}px`, minWidth: '100%', position: 'relative' }}>

            {/* Bar markers */}
            <div className="h-6 flex border-b border-slate-100 bg-slate-50/20">
              {markers.map((n) => (
                <div key={n} className="shrink-0 border-l border-slate-100 pl-1.5 flex items-end pb-0.5 text-[9px] font-semibold text-slate-400" style={{ width: `${colWidth}px` }}>
                  {n}
                </div>
              ))}
            </div>

            <div 
              className="relative" 
              style={{
                backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px)`,
                backgroundSize: `${colWidth / (quantize === '1/4' ? 4 : quantize === '1/8' ? 8 : 16)}px 100%`
              }}
            >
              {/* Playhead */}
              {playheadPx >= 0 && (
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none"
                  style={{ left: `${playheadPx}px`, width: '2px', background: '#6c63ff', transition: 'left 0.05s linear', height: `${displayTracks.length * 64}px` }}
                >
                  <div style={{ position: 'absolute', top: 0, left: '-4px', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '7px solid #6c63ff' }} />
                </div>
              )}

              {/* Waveform lanes */}
              {displayTracks.map((t, ti) => {
                const w = TRACK_WAVES[ti % TRACK_WAVES.length];
                const style = ARRANGER_COLORS[ti % ARRANGER_COLORS.length];
                return (
                  <div key={t.key} className="h-16 border-b border-slate-100 flex items-center px-1 gap-1.5">
                    <div className={`h-11 ${style.color} border ${style.border} rounded-xl flex items-center px-2 overflow-hidden shrink-0`} style={{ width: `${colWidth * 5.5}px` }}>
                      <div className="w-full h-7 flex items-end gap-px">
                        {w.seg1.map((h, i) => <div key={i} className={`flex-1 ${style.accent} opacity-70 rounded-sm`} style={{ height: `${h}px` }} />)}
                      </div>
                    </div>
                    <div className={`h-11 ${style.color} border ${style.border} rounded-xl flex items-center px-2 overflow-hidden shrink-0`} style={{ width: `${colWidth * 3}px` }}>
                      <div className="w-full h-7 flex items-end gap-px">
                        {w.seg2.map((h, i) => <div key={i} className={`flex-1 ${style.accent} opacity-70 rounded-sm`} style={{ height: `${h}px` }} />)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

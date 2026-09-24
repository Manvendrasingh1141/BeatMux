import React from 'react';
import { useTimelineStore } from '../store/timeline.store';
import { timeToPixels, durationToPixels } from '../utils/timelineMath';
import ClipWaveform from './ClipWaveform';

/**
 * Shorten a filename to a clean, readable label.
 * "ElevenLabs_2026-06-29T19_08_36_Roohi - Breathy, Soft.mp3" → "Roohi - Breathy"
 */
const shortName = (name) => {
  if (!name) return 'Clip';
  // Strip extension
  let n = name.replace(/\.[^.]+$/, '');
  // Strip common prefixes like ElevenLabs_<timestamp>_
  n = n.replace(/^[A-Za-z]+_\d{4}[-_]\d{2}[-_]\d{2}T?\d{0,2}[-_]?\d{0,2}[-_]?\d{0,2}_?/i, '');
  // Strip leading underscores
  n = n.replace(/^[_\- ]+/, '');
  // If still too long, truncate
  if (n.length > 20) n = n.slice(0, 18) + '…';
  return n || 'Clip';
};

// Track color palette (matches the colors we assign to tracks)
const colorMap = {
  '#8b5cf6': { bg: 'bg-violet-500/80', border: 'border-violet-400' },
  '#0ea5e9': { bg: 'bg-sky-500/80', border: 'border-sky-400' },
  '#10b981': { bg: 'bg-emerald-500/80', border: 'border-emerald-400' },
};
const defaultColor = { bg: 'bg-indigo-500/80', border: 'border-indigo-400' };

const TimelineClip = ({ clip, onDragStart, onResizeStart, isDragging, isResizing }) => {
  const { pixelsPerSecond, selectedClipId, selectClip } = useTimelineStore();

  const left = timeToPixels(clip.startTime, pixelsPerSecond);
  const width = durationToPixels(clip.duration, pixelsPerSecond);
  const isSelected = selectedClipId === clip.id;

  const colors = colorMap[clip.color] || defaultColor;

  const handleMouseDown = (e) => {
    selectClip(clip.id);
    onDragStart(e, clip);
  };

  return (
    <div
      className={`absolute top-1 bottom-1 rounded-lg overflow-hidden cursor-move select-none border transition-shadow ${colors.bg} ${isSelected ? `${colors.border} border-2 z-20 shadow-lg` : 'border-white/20 z-10 hover:border-white/50 hover:shadow-md'}`}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 30)}px`,
        opacity: (isDragging || isResizing) ? 0.7 : 1
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Left Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 z-10"
        onMouseDown={(e) => {
          selectClip(clip.id);
          onResizeStart(e, clip, 'left');
        }}
      />

      {/* Content: short name at top, waveform fills the rest */}
      <div className="flex flex-col h-full pointer-events-none relative z-0">
        <div className="px-2 pt-1 text-[10px] font-bold text-white truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] leading-tight shrink-0">
          {shortName(clip.name)}
        </div>
        <div className="flex-1 px-1 pb-1 min-h-0">
          <ClipWaveform assetId={clip.assetId} duration={clip.duration} pixelsPerSecond={pixelsPerSecond} />
        </div>
      </div>

      {/* Right Resize Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 z-10"
        onMouseDown={(e) => {
          selectClip(clip.id);
          onResizeStart(e, clip, 'right');
        }}
      />
    </div>
  );
};

export default React.memo(TimelineClip);

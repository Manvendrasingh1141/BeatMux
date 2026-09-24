import React, { useEffect } from 'react';
import TimelineClip from './TimelineClip';
import { useTimelineStore } from '../store/timeline.store';
import { useMixerStore } from '../../mixer/store/mixer.store';
import { pixelsToTime } from '../utils/timelineMath';
import { snapTime } from '../utils/snap';

export const TrackHeader = ({ track, onSelect, isSelected }) => {
  const { initTrack, tracks: mixerTracks, toggleTrackMute, toggleTrackSolo, setTrackVolume, setTrackPan } = useMixerStore();

  useEffect(() => {
    initTrack(track.id);
  }, [track.id, initTrack]);

  const state = mixerTracks[track.id] || { muted: false, soloed: false, volumeDb: 0, pan: 0 };

  return (
    <div 
      className={`h-28 border-b border-white/10 flex flex-col justify-center p-2 bg-panel shrink-0 select-none transition-colors ${isSelected ? 'bg-white/5 border-l-2 border-l-primary' : 'hover:bg-white/5'}`}
      onClick={() => onSelect(track.id)}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-xs text-gray-200 truncate cursor-pointer">{track.name}</span>
      </div>
      
      {/* Mixer controls row */}
      <div className="flex space-x-1 mb-1">
        <button 
          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${state.soloed ? 'bg-yellow-500 text-black' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
          onClick={(e) => { e.stopPropagation(); toggleTrackSolo(track.id); }}
        >
          S
        </button>
        <button 
          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${state.muted ? 'bg-red-500 text-white' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
          onClick={(e) => { e.stopPropagation(); toggleTrackMute(track.id); }}
        >
          M
        </button>
      </div>

      <div className="flex flex-col space-y-1">
        <div className="flex items-center text-[9px] text-gray-500">
          <span className="w-5 text-right mr-1">Vol</span>
          <input 
            type="range" min="-60" max="6" step="1" 
            value={state.volumeDb} 
            onClick={e => e.stopPropagation()}
            onChange={e => setTrackVolume(track.id, parseFloat(e.target.value))}
            className="flex-1 h-1 bg-black rounded appearance-none"
          />
        </div>
        <div className="flex items-center text-[9px] text-gray-500">
          <span className="w-5 text-right mr-1">Pan</span>
          <input 
            type="range" min="-1" max="1" step="0.1" 
            value={state.pan} 
            onClick={e => e.stopPropagation()}
            onChange={e => setTrackPan(track.id, parseFloat(e.target.value))}
            className="flex-1 h-1 bg-black rounded appearance-none"
          />
        </div>
      </div>
    </div>
  );
};

export const TimelineTrack = ({ track, clips, dragProps, resizeProps }) => {
  const { addClip, pixelsPerSecond } = useTimelineStore();

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const assetData = e.dataTransfer.getData('application/json');
      if (!assetData) return;
      const asset = JSON.parse(assetData);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      let startTime = pixelsToTime(x, pixelsPerSecond);

      import('../../transport/store/transport.store').then(({ useTransportStore }) => {
        const { snapMode, bpm, timeSignature } = useTransportStore.getState();
        
        if (snapMode === 'BEAT') {
          import('../../transport/utils/musicalTime').then(({ snapTimeToBeat }) => {
             startTime = snapTimeToBeat(startTime, bpm);
             finalizeDrop(asset, startTime);
          });
          return;
        } else if (snapMode === 'BAR') {
          import('../../transport/utils/musicalTime').then(({ snapTimeToBar }) => {
             startTime = snapTimeToBar(startTime, bpm, timeSignature.numerator);
             finalizeDrop(asset, startTime);
          });
          return;
        }
        
        finalizeDrop(asset, startTime);
      });

      const finalizeDrop = (asset, time) => {
        const finalTime = Math.max(0, time);
        
        // Optimistic UI ID
        const optimisticId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newClip = {
          id: optimisticId,
          trackId: track.id,
          assetId: asset._id,
          name: asset.originalName,
          startTime: finalTime,
          duration: asset.duration || 1,
          offset: 0,
          color: track.color,
          selected: false
        };
        addClip(newClip);
        
        import('../../realtime/sync/timeline.sync').then(({ sendClipCreate, pendingMutations }) => {
          const mutId = sendClipCreate({
            trackId: track.id,
            assetId: asset._id,
            name: asset.originalName,
            startTime: finalTime,
            duration: asset.duration || 1,
            offset: 0,
            color: track.color
          });
          pendingMutations.set(mutId, { type: 'CREATE', optimisticId });
        });
      };
    } catch (err) {
      console.error('Failed to parse dropped asset', err);
    }
  };

  return (
    <div 
      className="h-28 border-b border-white/5 relative bg-black/10 group"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Track background guide lines can be added here if needed */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
      
      {clips.map(clip => (
        <TimelineClip 
          key={clip.id} 
          clip={clip} 
          onDragStart={dragProps.handleDragStart}
          onResizeStart={resizeProps.handleResizeStart}
          isDragging={dragProps.draggingClipId === clip.id}
          isResizing={resizeProps.resizingClipId === clip.id}
        />
      ))}
    </div>
  );
};

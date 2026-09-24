import { useState, useCallback, useEffect, useRef } from 'react';
import { useTimelineStore } from '../store/timeline.store';
import { useTransportStore } from '../../transport/store/transport.store';
import { pixelsToTime } from '../utils/timelineMath';
import { snapTimeToBeat, snapTimeToBar } from '../../transport/utils/musicalTime';

export const useTimelineDrag = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState(null); 

  const { pixelsPerSecond, moveClip } = useTimelineStore();
  const { snapMode, bpm, timeSignature } = useTransportStore();
  
  const stateRef = useRef({ pixelsPerSecond, snapMode, bpm, timeSignature });

  useEffect(() => {
    stateRef.current = { pixelsPerSecond, snapMode, bpm, timeSignature };
  }, [pixelsPerSecond, snapMode, bpm, timeSignature]);

  const handleDragStart = useCallback((e, clip) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragState({
      clipId: clip.id,
      originalStart: clip.startTime,
      startX: e.clientX,
      trackId: clip.trackId
    });
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || !dragState) return;

    const deltaX = e.clientX - dragState.startX;
    const { pixelsPerSecond, snapMode, bpm, timeSignature } = stateRef.current;
    
    let deltaTime = pixelsToTime(deltaX, pixelsPerSecond);
    let newStartTime = dragState.originalStart + deltaTime;

    if (snapMode === 'BEAT') {
      newStartTime = snapTimeToBeat(newStartTime, bpm);
    } else if (snapMode === 'BAR') {
      newStartTime = snapTimeToBar(newStartTime, bpm, timeSignature.numerator);
    }

    newStartTime = Math.max(0, newStartTime);
    moveClip(dragState.clipId, newStartTime, dragState.trackId);
  }, [isDragging, dragState, moveClip]);

  const handleDragEnd = useCallback(() => {
    if (isDragging && dragState) {
      setIsDragging(false);
      
      const clip = useTimelineStore.getState().clips.find(c => c.id === dragState.clipId);
      if (clip) {
        import('../../realtime/sync/timeline.sync').then(({ sendClipUpdate }) => {
          if (window.PerfMonitor) window.PerfMonitor.incEdit();
          sendClipUpdate(clip.id, { startTime: clip.startTime, trackId: clip.trackId });
        });
      }
      
      setDragState(null);
    }
  }, [isDragging, dragState]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  return { handleDragStart, isDragging, draggingClipId: dragState?.clipId };
};

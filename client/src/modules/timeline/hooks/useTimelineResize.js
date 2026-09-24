import { useState, useCallback, useEffect, useRef } from 'react';
import { useTimelineStore } from '../store/timeline.store';
import { useTransportStore } from '../../transport/store/transport.store';
import { pixelsToTime } from '../utils/timelineMath';
import { snapTimeToBeat, snapTimeToBar } from '../../transport/utils/musicalTime';

export const useTimelineResize = () => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeState, setResizeState] = useState(null); 

  const { pixelsPerSecond, resizeClip, clips } = useTimelineStore();
  const { snapMode, bpm, timeSignature } = useTransportStore();
  
  const stateRef = useRef({ pixelsPerSecond, snapMode, bpm, timeSignature, clips });

  useEffect(() => {
    stateRef.current = { pixelsPerSecond, snapMode, bpm, timeSignature, clips };
  }, [pixelsPerSecond, snapMode, bpm, timeSignature, clips]);

  const handleResizeStart = useCallback((e, clip, edge) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeState({
      clipId: clip.id,
      originalStart: clip.startTime,
      originalDuration: clip.duration,
      originalOffset: clip.offset || 0,
      startX: e.clientX,
      edge 
    });
  }, []);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !resizeState) return;

    const deltaX = e.clientX - resizeState.startX;
    const { pixelsPerSecond, snapMode, bpm, timeSignature } = stateRef.current;
    
    let deltaTime = pixelsToTime(deltaX, pixelsPerSecond);

    let newStart = resizeState.originalStart;
    let newDuration = resizeState.originalDuration;
    let newOffset = resizeState.originalOffset;

    if (resizeState.edge === 'right') {
      newDuration += deltaTime;
      if (snapMode === 'BEAT') {
        newDuration = Math.max(0.1, snapTimeToBeat(resizeState.originalStart + newDuration, bpm) - resizeState.originalStart);
      } else if (snapMode === 'BAR') {
        newDuration = Math.max(0.1, snapTimeToBar(resizeState.originalStart + newDuration, bpm, timeSignature.numerator) - resizeState.originalStart);
      }
    } else if (resizeState.edge === 'left') {
      newStart += deltaTime;
      
      if (snapMode === 'BEAT') {
        newStart = snapTimeToBeat(newStart, bpm);
      } else if (snapMode === 'BAR') {
        newStart = snapTimeToBar(newStart, bpm, timeSignature.numerator);
      }
      
      const timeDiff = newStart - resizeState.originalStart;
      newDuration = resizeState.originalDuration - timeDiff;
      newOffset = resizeState.originalOffset + timeDiff;
    }

    if (newDuration < 0.1) {
      newDuration = 0.1;
      if (resizeState.edge === 'left') {
        newStart = resizeState.originalStart + resizeState.originalDuration - 0.1;
        newOffset = resizeState.originalOffset + resizeState.originalDuration - 0.1;
      }
    }
    
    if (newStart < 0) {
      const diff = 0 - newStart;
      newStart = 0;
      newDuration -= diff;
      newOffset -= diff;
    }
    
    if (newOffset < 0) {
      const diff = 0 - newOffset;
      newOffset = 0;
      newStart += diff;
      newDuration -= diff;
    }

    resizeClip(resizeState.clipId, newStart, newDuration, newOffset);
  }, [isResizing, resizeState, resizeClip]);

  const handleResizeEnd = useCallback(() => {
    if (isResizing && resizeState) {
      setIsResizing(false);
      
      const clip = useTimelineStore.getState().clips.find(c => c.id === resizeState.clipId);
      if (clip) {
        import('../../realtime/sync/timeline.sync').then(({ sendClipUpdate }) => {
          if (window.PerfMonitor) window.PerfMonitor.incEdit();
          sendClipUpdate(clip.id, { 
            startTime: clip.startTime, 
            duration: clip.duration,
            offset: clip.offset
          });
        });
      }
      
      setResizeState(null);
    }
  }, [isResizing, resizeState]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    } else {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return { handleResizeStart, isResizing, resizingClipId: resizeState?.clipId };
};

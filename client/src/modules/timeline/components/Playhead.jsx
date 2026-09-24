import React, { useEffect, useRef } from 'react';
import { useTimelineStore } from '../store/timeline.store';
import { useTransportStore } from '../../transport/store/transport.store';
import { timeToPixels } from '../utils/timelineMath';

const Playhead = () => {
  const pixelsPerSecond = useTimelineStore(s => s.pixelsPerSecond);
  const headRef = useRef(null);

  useEffect(() => {
    // Subscribe directly to avoid React re-renders on every frame
    const unsubscribe = useTransportStore.subscribe(
      (state) => state.currentTime,
      (currentTime) => {
        if (headRef.current) {
          const x = timeToPixels(currentTime, pixelsPerSecond);
          // Use CSS transform for GPU acceleration instead of left
          headRef.current.style.transform = `translateX(${x}px)`;
        }
      }
    );
    
    // Initial position
    if (headRef.current) {
       const x = timeToPixels(useTransportStore.getState().currentTime, pixelsPerSecond);
       headRef.current.style.transform = `translateX(${x}px)`;
    }
    
    return unsubscribe;
  }, [pixelsPerSecond]);

  return (
    <div 
      ref={headRef}
      className="absolute top-0 bottom-0 z-40 pointer-events-none will-change-transform"
      style={{ left: 0 }}
    >
      {/* Triangle Head */}
      <div className="absolute top-0 -translate-x-1/2 w-3 h-3 bg-primary" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
      {/* Line */}
      <div className="absolute top-3 bottom-0 w-px bg-primary/80 -translate-x-1/2 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
    </div>
  );
};

export default React.memo(Playhead);

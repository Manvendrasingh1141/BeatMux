import React, { useRef, useEffect } from 'react';
import { useTimelineStore } from '../store/timeline.store';
import { useTimelineDrag } from '../hooks/useTimelineDrag';
import { useTimelineResize } from '../hooks/useTimelineResize';
import { audioEngine } from '../../audio/audio.engine';
import { useAssetStore } from '../../assets/store/asset.store';
import TimelineToolbar from './TimelineToolbar';
import TimelineRuler from './TimelineRuler';
import { TrackHeader, TimelineTrack } from './TimelineTrack';
import Playhead from './Playhead';

const Timeline = () => {
  const { 
    tracks, 
    clips, 
    duration, 
    pixelsPerSecond, 
    clearSelection,
    selectedTrackId,
    selectTrack 
  } = useTimelineStore();

  const dragProps = useTimelineDrag();
  const resizeProps = useTimelineResize();

  const scrollRef = useRef(null);
  const trackHeadersRef = useRef(null);

  // Sync vertical scroll between track headers and timeline content if needed,
  // but simpler layout: Track headers in a flex column, timeline lanes in a parallel flex column.
  const handleScroll = (e) => {
    if (trackHeadersRef.current) {
      trackHeadersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleBackgroundClick = () => {
    clearSelection();
  };

  const timelineWidth = duration * pixelsPerSecond;

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'Escape') {
        const { clearSelection } = useTimelineStore.getState();
        clearSelection();
        
        import('../../transport/store/transport.store').then(({ useTransportStore }) => {
          const { status, setStatus, setCurrentTime } = useTransportStore.getState();
          if (status === 'PLAYING') {
            audioEngine.stop();
            setStatus('STOPPED');
            setCurrentTime(0);
          }
        });
      }
      if (e.key === ' ') {
        e.preventDefault();
        import('../../transport/store/transport.store').then(({ useTransportStore }) => {
          const { status, setStatus, currentTime } = useTransportStore.getState();
          const { clips } = useTimelineStore.getState();
          const { assets } = useAssetStore.getState();
          
          if (status === 'PLAYING') {
            audioEngine.pause();
            setStatus('PAUSED');
          } else {
            const assetsMap = assets.reduce((acc, curr) => {
              acc[curr._id] = curr;
              return acc;
            }, {});
            audioEngine.play(clips, assetsMap, currentTime).then(() => {
              setStatus('PLAYING');
            }).catch(console.error);
          }
        });
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const { selectedClipId, removeClip } = useTimelineStore.getState();
        if (selectedClipId) {
          removeClip(selectedClipId);
          import('../../realtime/sync/timeline.sync').then(({ sendClipDelete }) => {
            sendClipDelete(selectedClipId);
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden relative">
      <TimelineToolbar />
      
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {/* Left Side: Track Headers */}
        <div 
          className="w-56 border-r border-white/10 flex flex-col bg-slate-900 z-20 shrink-0 overflow-y-auto overflow-x-hidden"
          ref={trackHeadersRef}
        >
          {/* Header spacer to align with ruler */}
          <div className="h-8 border-b border-white/10 shrink-0 bg-slate-800/80"></div>
          
          <div className="flex flex-col">
            {tracks.map(track => (
              <TrackHeader 
                key={track.id} 
                track={track} 
                isSelected={selectedTrackId === track.id}
                onSelect={selectTrack}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Timeline Viewport — scrolls both X and Y */}
        <div 
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-slate-900"
          ref={scrollRef}
          onScroll={handleScroll}
          onClick={handleBackgroundClick}
          style={{ minWidth: 0 }}
        >
          {/* A container that expands to full timeline width */}
          <div style={{ width: `${Math.max(timelineWidth, 2000)}px`, minHeight: '100%' }} className="relative flex flex-col">
            <TimelineRuler />
            
            <div className="relative flex-1">
              <Playhead />

              {/* Tracks */}
              {tracks.map(track => (
                <TimelineTrack 
                  key={track.id}
                  track={track}
                  clips={clips.filter(c => c.trackId === track.id)}
                  dragProps={dragProps}
                  resizeProps={resizeProps}
                />
              ))}
              
              {/* Bottom padding so playhead reaches bottom */}
              <div className="h-24 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;

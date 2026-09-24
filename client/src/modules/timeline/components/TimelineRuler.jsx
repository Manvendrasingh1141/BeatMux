import React, { useMemo } from 'react';
import { useTimelineStore } from '../store/timeline.store';
import { useTransportStore } from '../../transport/store/transport.store';
import { timeToPixels } from '../utils/timelineMath';
import { getBeatDuration, getBarDuration } from '../../transport/utils/musicalTime';

const TimelineRuler = () => {
  const { pixelsPerSecond, getDuration } = useTimelineStore();
  const { currentTime, setCurrentTime, bpm, timeSignature } = useTransportStore();
  const duration = getDuration();

  const handleRulerClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, x / pixelsPerSecond);
    
    setCurrentTime(time);
    
    import('../../transport/sync/transport.sync').then(s => s.syncSeek(time));
  };

  const ticks = useMemo(() => {
    const tickArray = [];
    const beatDur = getBeatDuration(bpm);
    const barDur = getBarDuration(bpm, timeSignature.numerator);

    const pixelsPerBeat = beatDur * pixelsPerSecond;
    const showBeats = pixelsPerBeat > 15;

    for (let t = 0; t <= duration; t += beatDur) {
      const isBar = Math.abs((t % barDur)) < 0.001; // float math safety
      
      if (!showBeats && !isBar) continue;

      tickArray.push({
        time: t,
        x: timeToPixels(t, pixelsPerSecond),
        isBar,
        label: isBar ? `${Math.floor(t / barDur) + 1}` : ''
      });
    }
    return tickArray;
  }, [duration, pixelsPerSecond, bpm, timeSignature.numerator]);

  return (
    <div 
      className="h-8 border-b border-white/10 bg-panel/80 sticky top-0 z-30 overflow-hidden cursor-text select-none"
      onClick={handleRulerClick}
    >
      <div className="relative h-full w-full" style={{ width: `${duration * pixelsPerSecond}px` }}>
        {ticks.map(tick => (
          <div key={tick.time} className="absolute top-0 bottom-0 flex flex-col" style={{ left: `${tick.x}px` }}>
            {tick.isBar ? (
              <>
                <div className="text-[10px] text-gray-400 font-mono ml-1 mt-1">Bar {tick.label}</div>
                <div className="w-px h-full bg-white/30" />
              </>
            ) : (
              <div className="w-px h-2 bg-white/10 mt-auto ml-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(TimelineRuler);

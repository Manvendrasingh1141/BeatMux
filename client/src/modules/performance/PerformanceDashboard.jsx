import React from 'react';
import { usePerformanceStore } from './performance.store';

const PerformanceDashboard = () => {
  const metrics = usePerformanceStore(state => state.metrics);
  
  // Only show if URL has ?debug=performance
  if (!window.location.search.includes('debug=performance')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur border border-white/20 p-4 rounded-lg z-50 text-xs font-mono text-green-400 w-64 shadow-2xl">
      <h3 className="text-white font-bold mb-2 border-b border-white/20 pb-1">Performance Diagnostics</h3>
      
      <div className="flex justify-between py-1">
        <span>WS RTT:</span>
        <span>{Math.round(metrics.wsRtt)} ms</span>
      </div>
      <div className="flex justify-between py-1">
        <span>Clock Offset:</span>
        <span>{Math.round(metrics.serverClockOffset)} ms</span>
      </div>
      <div className="flex justify-between py-1">
        <span>Server Process:</span>
        <span>{Math.round(metrics.lastServerProcessingTime)} ms</span>
      </div>
      <div className="flex justify-between py-1">
        <span>Sync Error:</span>
        <span>{Math.round(metrics.transportSyncError)} ms</span>
      </div>
      
      <div className="border-t border-white/20 my-1 pt-1 flex justify-between">
        <span>Audio Cache Hit:</span>
        <span>{metrics.audioCacheHits}</span>
      </div>
      <div className="flex justify-between py-1">
        <span>Audio Cache Miss:</span>
        <span>{metrics.audioCacheMisses}</span>
      </div>
      
      <div className="border-t border-white/20 my-1 pt-1 flex justify-between">
        <span>Timeline Edits:</span>
        <span>{metrics.timelineEdits}</span>
      </div>
      <div className="flex justify-between py-1">
        <span>Mutations Sent:</span>
        <span>{metrics.timelineMutationsSent}</span>
      </div>
    </div>
  );
};

export default PerformanceDashboard;

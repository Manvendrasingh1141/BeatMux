import { create } from 'zustand';

export const usePerformanceStore = create((set, get) => ({
  metrics: {
    wsRtt: 0,
    serverClockOffset: 0,
    timelineEdits: 0,
    timelineMutationsSent: 0,
    audioCacheHits: 0,
    audioCacheMisses: 0,
    lastServerProcessingTime: 0,
    transportSyncError: 0,
  },
  
  updateMetric: (key, value) => set(state => ({
    metrics: { ...state.metrics, [key]: value }
  })),
  
  incrementMetric: (key) => set(state => ({
    metrics: { ...state.metrics, [key]: (state.metrics[key] || 0) + 1 }
  }))
}));

// Setup global helpers for quick instrumentation
window.PerfMonitor = {
  recordRtt: (val) => usePerformanceStore.getState().updateMetric('wsRtt', val),
  recordOffset: (val) => usePerformanceStore.getState().updateMetric('serverClockOffset', val),
  recordServerProcessing: (val) => usePerformanceStore.getState().updateMetric('lastServerProcessingTime', val),
  recordSyncError: (val) => usePerformanceStore.getState().updateMetric('transportSyncError', val),
  
  incEdit: () => usePerformanceStore.getState().incrementMetric('timelineEdits'),
  incMutation: () => usePerformanceStore.getState().incrementMetric('timelineMutationsSent'),
  incCacheHit: () => usePerformanceStore.getState().incrementMetric('audioCacheHits'),
  incCacheMiss: () => usePerformanceStore.getState().incrementMetric('audioCacheMisses')
};

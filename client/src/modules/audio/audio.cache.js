import * as Tone from 'tone';

class AudioCache {
  constructor() {
    this.buffers = new Map(); // assetId -> Tone.ToneAudioBuffer
    this.loading = new Map(); // assetId -> Promise<ToneAudioBuffer>
  }

  async getBuffer(assetId, storageUrl) {
    // Return existing
    if (this.buffers.has(assetId)) {
      if (window.PerfMonitor) window.PerfMonitor.incCacheHit();
      return this.buffers.get(assetId);
    }
    
    // Return loading promise if already in progress
    if (this.loading.has(assetId)) {
      if (window.PerfMonitor) window.PerfMonitor.incCacheHit();
      return this.loading.get(assetId);
    }

    if (window.PerfMonitor) window.PerfMonitor.incCacheMiss();

    // Load new buffer
    const promise = new Promise((resolve, reject) => {
      const buffer = new Tone.ToneAudioBuffer(
        storageUrl,
        () => {
          this.buffers.set(assetId, buffer);
          this.loading.delete(assetId);
          resolve(buffer);
        },
        (error) => {
          this.loading.delete(assetId);
          reject(error);
        }
      );
    });

    this.loading.set(assetId, promise);
    return promise;
  }

  clear() {
    this.buffers.forEach(buffer => buffer.dispose());
    this.buffers.clear();
    this.loading.clear();
  }
}

export const audioCache = new AudioCache();

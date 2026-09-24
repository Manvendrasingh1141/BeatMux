import * as Tone from 'tone';
import { audioCache } from './audio.cache';

class AudioScheduler {
  constructor() {
    this.players = [];
  }

  async scheduleClips(clips, assetsMap) {
    this.clearSchedules();

    const loadPromises = clips.map(async (clip) => {
      const asset = assetsMap[clip.assetId];
      if (!asset) return;

      // Ensure buffer is loaded
      // We will proxy to the backend storage endpoint
      // Assuming asset.storageKey gives us the ID for raw file delivery, but for mock storage:
      // The uploadId / assetId mapped to storage
      const storageUrl = `${'/api'}/api/storage/waveforms/${asset._id}`.replace('waveforms', 'download'); 
      // wait, we didn't expose a raw audio download endpoint in Step 5!
      // Let's assume there is one, or we will add one. Let's use `/api/storage/audio/:assetId`.
      const audioUrl = `/api/storage/audio/${asset._id}`;

      try {
        const buffer = await audioCache.getBuffer(asset._id, audioUrl);
        
        // Route to mixer channel instead of destination
        import('../mixer/engine/mixer.engine').then(({ mixerEngine }) => {
          const channel = mixerEngine.getChannel(clip.trackId);
          const player = new Tone.Player(buffer).connect(channel);
          player.sync();
          
          let timelineStart = clip.startTime;
          let sourceOffset = clip.offset || 0;
          let playDuration = clip.duration;

          player.start(timelineStart, sourceOffset, playDuration);
          this.players.push(player);
        });

      } catch (err) {
        console.error(`Failed to schedule clip ${clip.id}`, err);
      }
    });

    await Promise.all(loadPromises);
  }

  clearSchedules() {
    this.players.forEach(player => {
      player.unsync();
      player.stop();
      player.dispose();
    });
    this.players = [];
  }
}

export const audioScheduler = new AudioScheduler();

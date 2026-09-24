import { wsClient } from '../../../realtime/websocket.client';
import { useTransportStore } from '../store/transport.store';
import { audioEngine } from '../../audio/audio.engine';
import { useAssetStore } from '../../assets/store/asset.store';
import { useTimelineStore } from '../../timeline/store/timeline.store';

// ── Local user sent this event → server echoes it back to ALL including sender
// So we only act if we are NOT the originator (track via a flag)
let localCommandId = null;

const generateCommandId = () => {
  const id = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return id;
};

// Play audio for this client (used by remote handler)
const startLocalAudio = async (position) => {
  try {
    if (!audioEngine.initialized) await audioEngine.initialize();
    const { clips } = useTimelineStore.getState();
    const { assets } = useAssetStore.getState();
    const assetsMap = {};
    assets.forEach(a => { assetsMap[a._id] = a; });
    await audioEngine.play(clips, assetsMap, position || 0);
  } catch (e) {
    console.error('Remote play failed:', e);
  }
};

export const setupTransportSyncListeners = () => {
  wsClient.subscribe('TRANSPORT_PLAY', (payload) => {
    const { setStatus, setCurrentTime } = useTransportStore.getState();
    const position = payload.position || 0;
    // Skip if we originated this command (we already started audio locally)
    if (payload.clientCommandId && payload.clientCommandId === localCommandId) return;
    setCurrentTime(position);
    setStatus('PLAYING');
    startLocalAudio(position);
  });

  wsClient.subscribe('TRANSPORT_PAUSE', (payload) => {
    if (payload.clientCommandId && payload.clientCommandId === localCommandId) return;
    const { setStatus, setCurrentTime } = useTransportStore.getState();
    if (payload.position !== undefined) setCurrentTime(payload.position);
    setStatus('PAUSED');
    audioEngine.pause();
  });

  wsClient.subscribe('TRANSPORT_STOP', (payload) => {
    if (payload.clientCommandId && payload.clientCommandId === localCommandId) return;
    const { setStatus, setCurrentTime } = useTransportStore.getState();
    setStatus('STOPPED');
    setCurrentTime(0);
    audioEngine.stop();
  });

  wsClient.subscribe('TRANSPORT_BPM_CHANGED', (payload) => {
    if (payload.clientCommandId && payload.clientCommandId === localCommandId) return;
    if (payload.bpm) {
      useTransportStore.getState().setBpm(payload.bpm);
      audioEngine.setBpm(payload.bpm);
    }
  });

  wsClient.subscribe('ROOM_JOINED', (payload) => {
    if (payload.transportState) {
      const ts = payload.transportState;
      if (ts.bpm) useTransportStore.getState().setBpm(ts.bpm);
    }
  });
};

export const syncPlay = (position) => {
  const id = generateCommandId();
  localCommandId = id;
  wsClient.send('TRANSPORT_PLAY', { position, clientCommandId: id });
};

export const syncPause = () => {
  const id = generateCommandId();
  localCommandId = id;
  wsClient.send('TRANSPORT_PAUSE', { clientCommandId: id });
};

export const syncStop = () => {
  const id = generateCommandId();
  localCommandId = id;
  wsClient.send('TRANSPORT_STOP', { clientCommandId: id });
};

export const syncSeek = (position) => {
  wsClient.send('TRANSPORT_SEEK', { position, clientCommandId: generateCommandId() });
};

export const syncSetBpm = (bpm) => {
  const id = generateCommandId();
  localCommandId = id;
  wsClient.send('TRANSPORT_SET_BPM', { bpm, clientCommandId: id });
};

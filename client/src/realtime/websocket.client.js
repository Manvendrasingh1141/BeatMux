import { WS_EVENTS } from './websocket.events';
import { useWebSocketStore } from './websocket.store';
import { useAuthStore } from '../auth/auth.store';
import { useRoomStore } from '../studio/room.store';

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.baseDelay = 1000;
    this.maxDelay = 16000;
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.pongTimeout = null;
    
    this.messageHandlers = new Map();
  }

  connect(roomCode) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return; // Already connected or connecting
    }

    useWebSocketStore.getState().setConnectionState('CONNECTING');

    const wsUrl = import.meta.env.VITE_WS_URL || (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws';
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.clearReconnectTimer();
      useWebSocketStore.getState().setConnectionState('CONNECTED');

      // Authenticate
      const token = useAuthStore.getState().accessToken;
      if (token) {
        this.send(WS_EVENTS.AUTH, { accessToken: token });
      }

      // We will wait for AUTH_SUCCESS before joining room
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data, roomCode);
    };

    this.ws.onclose = () => {
      this.handleDisconnect(roomCode);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Close will be called automatically after error in most cases
    };
  }

  handleDisconnect(roomCode) {
    this.clearPingTimers();
    useWebSocketStore.getState().setConnectionState('DISCONNECTED');
    this.ws = null;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      useWebSocketStore.getState().setConnectionState('RECONNECTING');
      
      const delay = Math.min(this.baseDelay * Math.pow(2, this.reconnectAttempts), this.maxDelay);
      const jitter = Math.random() * 500;
      
      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect(roomCode);
      }, delay + jitter);
    }
  }

  disconnect() {
    this.clearReconnectTimer();
    this.clearPingTimers();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    useWebSocketStore.getState().setConnectionState('DISCONNECTED');
    useWebSocketStore.getState().clearPresence();
  }

  send(type, payload = {}, requestId = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type,
        payload,
        requestId: requestId || crypto.randomUUID(),
        timestamp: Date.now()
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  handleMessage(rawData, currentRoomCode) {
    try {
      const parsed = JSON.parse(rawData);
      const { type, payload, timestamp } = parsed;
      const store = useWebSocketStore.getState();

      if (parsed._perf && window.PerfMonitor) {
        window.PerfMonitor.recordServerProcessing(parsed._perf.processed - parsed._perf.received);
      }

      if (type === WS_EVENTS.PONG) {
        if (parsed.timestamp) {
          const latency = Date.now() - parsed.timestamp;
          store.setLatency(latency);
        }
        if (parsed.serverTimestamp && parsed.requestId) {
          import('../modules/transport/sync/transport.clock').then(({ transportClock }) => {
            transportClock.updateOffset(parseInt(parsed.requestId, 10), parsed.serverTimestamp, Date.now());
          });
        }
        return;
      }

      if (type === WS_EVENTS.PING) {
        // Send our current time as requestId to get clock offset back in PONG
        this.send(WS_EVENTS.PONG, {}, Date.now().toString());
        return;
      }

      if (type === WS_EVENTS.AUTH_SUCCESS) {
        // Now join room
        import('../modules/timeline/store/timeline.store.js').then(({ useTimelineStore }) => {
          const version = useTimelineStore.getState().version;
          this.send(WS_EVENTS.ROOM_JOIN, { roomCode: currentRoomCode, lastKnownVersion: version || 0 });
        });
        return;
      }

      if (type === WS_EVENTS.ROOM_JOINED) {
        store.setPresence(payload.presence || []);
        return;
      }

      if (type === WS_EVENTS.USER_JOINED) {
        if (payload.user) {
          store.addUser({ ...payload.user, status: 'online' });
        }
        return;
      }

      if (type === WS_EVENTS.USER_LEFT) {
        if (payload.userId) {
          store.removeUser(payload.userId);
        }
        return;
      }

      if (type === WS_EVENTS.ERROR) {
        console.error('WebSocket Error:', payload);
        // Handle specific errors like auth failure
        if (payload.code === 'WS_AUTH_FAILED') {
          // Force logout or redirect
        }
        return;
      }

      // Handle custom subscriptions
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.forEach(fn => fn(payload, timestamp));
      }

    } catch (error) {
      console.error('Failed to parse WS message:', error);
    }
  }

  subscribe(type, callback) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type).add(callback);
  }

  unsubscribe(type, callback) {
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type).delete(callback);
    }
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  clearPingTimers() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
  }
}

export const wsClient = new WebSocketClient();

// Ephemeral in-memory transport state per room
const roomTransports = new Map();

export const initRoomTransport = (roomId) => {
  if (!roomTransports.has(roomId)) {
    roomTransports.set(roomId, {
      status: 'STOPPED', // 'PLAYING' | 'PAUSED' | 'STOPPED'
      position: 0,
      bpm: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      serverStartTime: null, // the timestamp when PLAY was executed
      startPosition: 0,      // the position in seconds when PLAY was executed
      revision: 0,
      updatedAt: Date.now()
    });
  }
  return roomTransports.get(roomId);
};

export const getRoomTransport = (roomId) => {
  return roomTransports.get(roomId) || initRoomTransport(roomId);
};

export const calculateCurrentPosition = (transport) => {
  if (transport.status !== 'PLAYING' || !transport.serverStartTime) {
    return transport.position;
  }
  const elapsedMs = Date.now() - transport.serverStartTime;
  return transport.startPosition + (elapsedMs / 1000);
};

export const updateRoomTransport = (roomId, updates) => {
  const transport = getRoomTransport(roomId);
  
  if (updates.status) transport.status = updates.status;
  if (updates.position !== undefined) {
    transport.position = updates.position;
    transport.startPosition = updates.position; // base for next play
  }
  if (updates.bpm !== undefined) transport.bpm = updates.bpm;
  if (updates.timeSignature) transport.timeSignature = updates.timeSignature;
  
  if (updates.serverStartTime !== undefined) {
    transport.serverStartTime = updates.serverStartTime;
  }

  transport.revision += 1;
  transport.updatedAt = Date.now();
  
  return transport;
};

export const clearRoomTransport = (roomId) => {
  roomTransports.delete(roomId);
};

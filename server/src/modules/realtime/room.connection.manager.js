class RoomConnectionManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> Set(sockets)
  }

  joinRoom(roomCode, socket) {
    if (!this.rooms.has(roomCode)) {
      this.rooms.set(roomCode, new Set());
      // First person connecting to this room locally -> subscribe
      import('./redis/redis.pubsub.js').then(({ subscribeToRoom }) => {
        subscribeToRoom(roomCode);
      });
    }
    this.rooms.get(roomCode).add(socket);
  }

  leaveRoom(roomCode, socket) {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.delete(socket);
      if (room.size === 0) {
        this.rooms.delete(roomCode);
        // Last person left this room locally -> unsubscribe
        import('./redis/redis.pubsub.js').then(({ unsubscribeFromRoom }) => {
          unsubscribeFromRoom(roomCode);
        });
      }
    }
  }

  getRoomSockets(roomCode) {
    return this.rooms.get(roomCode) || new Set();
  }

  broadcastToRoom(roomCode, message) {
    const sockets = this.getRoomSockets(roomCode);
    const payload = JSON.stringify(message);
    for (const socket of sockets) {
      if (socket.readyState === 1) { // WebSocket.OPEN
        socket.send(payload);
      }
    }
  }

  broadcastExcept(roomCode, excludeSocket, message) {
    const sockets = this.getRoomSockets(roomCode);
    const payload = JSON.stringify(message);
    for (const socket of sockets) {
      if (socket !== excludeSocket && socket.readyState === 1) {
        socket.send(payload);
      }
    }
  }
}

export const roomConnectionManager = new RoomConnectionManager();

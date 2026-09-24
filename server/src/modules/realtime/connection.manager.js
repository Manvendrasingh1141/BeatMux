class ConnectionManager {
  constructor() {
    this.connections = new Map(); // socket -> connection data
    this.userConnections = new Map(); // userId -> Set(sockets)
  }

  registerConnection(socket) {
    this.connections.set(socket, {
      userId: null,
      user: null,
      roomCode: null,
      lastPing: Date.now()
    });
  }

  unregisterConnection(socket) {
    const data = this.connections.get(socket);
    if (data && data.userId) {
      const userSockets = this.userConnections.get(data.userId);
      if (userSockets) {
        userSockets.delete(socket);
        if (userSockets.size === 0) {
          this.userConnections.delete(data.userId);
        }
      }
    }
    this.connections.delete(socket);
    return data;
  }

  authenticateConnection(socket, user) {
    const data = this.connections.get(socket);
    if (!data) return false;

    data.userId = user._id.toString();
    data.user = user;

    if (!this.userConnections.has(data.userId)) {
      this.userConnections.set(data.userId, new Set());
    }
    this.userConnections.get(data.userId).add(socket);
    
    return true;
  }

  updatePing(socket) {
    const data = this.connections.get(socket);
    if (data) {
      data.lastPing = Date.now();
    }
  }

  getConnectionData(socket) {
    return this.connections.get(socket);
  }

  setRoom(socket, roomCode) {
    const data = this.connections.get(socket);
    if (data) {
      data.roomCode = roomCode;
    }
  }
}

export const connectionManager = new ConnectionManager();

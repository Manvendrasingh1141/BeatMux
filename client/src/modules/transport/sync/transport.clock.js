export class TransportClock {
  constructor() {
    this.serverClockOffset = 0;
    this.roundTripTime = 0;
  }

  // Called when we receive a PONG
  updateOffset(clientSendTime, serverReceiveTime, clientReceiveTime) {
    const rtt = clientReceiveTime - clientSendTime;
    this.roundTripTime = rtt;
    
    // server time when it received the ping was serverReceiveTime.
    // Client estimated time at that exact moment is clientSendTime + (rtt / 2).
    // offset = ServerTime - ClientTime
    const offset = serverReceiveTime - (clientSendTime + rtt / 2);
    
    // Simple smoothing: Moving average
    if (this.serverClockOffset === 0) {
      this.serverClockOffset = offset;
    } else {
      this.serverClockOffset = (this.serverClockOffset * 0.8) + (offset * 0.2);
    }
  }

  getEstimatedServerTime() {
    return Date.now() + this.serverClockOffset;
  }

  getServerClockOffset() {
    return this.serverClockOffset;
  }
}

export const transportClock = new TransportClock();

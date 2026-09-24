import app from './src/app.js';
import config from './src/config/config.js';
import http from 'http';
import { initWebSocketServer } from './src/modules/realtime/websocket.server.js';
import { connectRedis, closeRedis } from './src/modules/realtime/redis/redis.client.js';

const PORT = config.PORT;

const server = http.createServer(app);
initWebSocketServer(server);

const startServer = async () => {
  await connectRedis();
  
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  server.close(async () => {
    console.log('HTTP server closed.');
    await closeRedis();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

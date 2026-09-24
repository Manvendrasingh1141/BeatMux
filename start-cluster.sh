#!/bin/bash

export REDIS_URL="redis://localhost:6379"

# Start Server A
PORT=3000 SERVER_INSTANCE_ID="server-a" npm start --prefix server &
SERVER_A_PID=$!

# Start Server B
PORT=3001 SERVER_INSTANCE_ID="server-b" npm start --prefix server &
SERVER_B_PID=$!

echo "Started Server A on port 3000 (PID: $SERVER_A_PID)"
echo "Started Server B on port 3001 (PID: $SERVER_B_PID)"

function cleanup {
  echo "Shutting down servers..."
  kill -SIGTERM $SERVER_A_PID
  kill -SIGTERM $SERVER_B_PID
  wait $SERVER_A_PID
  wait $SERVER_B_PID
  echo "Done."
}

trap cleanup SIGINT SIGTERM

wait

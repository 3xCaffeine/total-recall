#!/bin/bash
# Initialize Cosdata with admin key non-interactively

# Start Cosdata in background and wait for it to initialize
cosdata &
COSDATA_PID=$!

# Wait for Cosdata to start and prompt
sleep 5

# Try to authenticate with the known key
# First check if we can connect
for i in {1..30}; do
  if curl -s -f -X POST http://localhost:8443/auth/create-session \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"cosdata123"}' > /dev/null 2>&1; then
    echo "✓ Cosdata authenticated successfully"
    # Keep container running
    wait $COSDATA_PID
    exit 0
  fi
  echo "Waiting for Cosdata to be ready... ($i/30)"
  sleep 1
done

echo "✗ Cosdata initialization timeout"
kill $COSDATA_PID
exit 1

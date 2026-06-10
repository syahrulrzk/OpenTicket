#!/usr/bin/env bash
# Quick restart script for the backend.
# Usage: ./scripts/dev.sh
# Kills any process on port 3000, rebuilds TS, and starts node dist/main.js in background.

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"
LOG_FILE="/tmp/be.log"

cd "$BACKEND_DIR"

echo "▶ Killing any process on port 3000..."
fuser -k 3000/tcp 2>/dev/null || true
pkill -f "node dist/main.js" 2>/dev/null || true
sleep 1

echo "▶ Building TypeScript..."
rm -rf dist *.tsbuildinfo
./node_modules/.bin/tsc -p tsconfig.json

echo "▶ Starting backend on :3000 (log: $LOG_FILE)..."
nohup node dist/main.js > "$LOG_FILE" 2>&1 &
echo "  PID: $!"

# wait for boot
for i in {1..20}; do
  if grep -q "Application is running" "$LOG_FILE" 2>/dev/null; then
    echo "✅ Backend up"
    grep "Application is running" "$LOG_FILE" | tail -1
    exit 0
  fi
  sleep 0.5
done

echo "❌ Backend failed to start. Last 30 lines of log:"
tail -30 "$LOG_FILE"
exit 1

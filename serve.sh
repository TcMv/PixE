#!/bin/bash
# Pix.E Website — Local Dev Server
# Requires Python 3
# Usage: ./serve.sh

cd "$(dirname "$0")"
PORT="${1:-8080}"
echo "✦ Pix.E — Ghost in the Machine"
echo "✦ Server running at: http://localhost:$PORT"
echo "✦ Press Ctrl+C to stop"
python3 -m http.server "$PORT"

#!/usr/bin/env bash
set -u
echo "== toolchain =="
node -v 2>/dev/null || echo "no node"
python --version 2>/dev/null || python3 --version 2>/dev/null || echo "no python"
echo "== mkdir =="
mkdir -p assets/vendor
cd assets/vendor || exit 1
dl () {
  echo "-- $1"
  curl -sSL --max-time 90 -o "$1" "$2" && wc -c "$1" || echo "FAILED $1"
}
dl land-110m.json        https://unpkg.com/world-atlas@2.0.2/land-110m.json
dl countries-110m.json   https://unpkg.com/world-atlas@2.0.2/countries-110m.json
dl topojson-client.min.js https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js
dl d3.min.js             https://unpkg.com/d3@7.9.0/dist/d3.min.js
echo "== sizes =="
ls -la
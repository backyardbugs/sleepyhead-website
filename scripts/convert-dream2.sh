#!/usr/bin/env bash
# Convert Procreate Dreams HEVC .mov (with alpha) to web-friendly WebM for hammercookie.html
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/hammercookie"
TOOLS="$ROOT/.tools"
INPUT="$DIR/Dream 2.mov"
OUTPUT="$DIR/dream2.webm"
FFMPEG=""

if command -v ffmpeg >/dev/null 2>&1; then
  FFMPEG="ffmpeg"
elif [[ -x "$TOOLS/ffmpeg" ]]; then
  FFMPEG="$TOOLS/ffmpeg"
fi

if [[ -z "$FFMPEG" ]]; then
  echo "ffmpeg not found."
  echo ""
  echo "Install without Homebrew (one-time, ~80MB download):"
  echo ""
  echo "  cd $ROOT"
  echo "  mkdir -p .tools"
  echo "  curl -L https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip -o .tools/ffmpeg.zip"
  echo "  unzip -o .tools/ffmpeg.zip -d .tools"
  echo "  chmod +x .tools/ffmpeg"
  echo "  rm .tools/ffmpeg.zip"
  echo "  ./scripts/convert-dream2.sh"
  echo ""
  exit 1
fi

if [[ ! -f "$INPUT" ]]; then
  echo "Missing input: $INPUT"
  exit 1
fi

echo "Using: $FFMPEG"
echo "Converting to transparent WebM..."
"$FFMPEG" -y -i "$INPUT" \
  -c:v libvpx-vp9 \
  -pix_fmt yuva420p \
  -auto-alt-ref 0 \
  -b:v 0 \
  -crf 32 \
  -an \
  "$OUTPUT"

echo "Done: $OUTPUT"
ls -lh "$OUTPUT"

#!/bin/bash
# Organize Spirits GIFs and deploy to Neocities (via GitHub push).
set -e
cd "$(dirname "$0")/.."

echo "Organizing Spirits GIFs…"
/usr/bin/python3 scripts/organize-visual-gifs.py illustration spirits "Spirits"

echo "Committing and pushing…"
rm -f .git/index.lock
git add data/visual-work.json visualwork.html style.css scripts/organize-visual-gifs.py visuals/illustration/spirits/
git commit -m "Add Spirits illustration stack (animated GIFs)"
git -c http.postBuffer=524288000 push origin main

echo "Done. Check https://sleepytyler.neocities.org/visualwork.html in a minute."

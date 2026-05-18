#!/usr/bin/env python3
"""Convert High Press assets. Wrapper for convert-visual-project.py."""

import subprocess
import sys
from pathlib import Path

repo = Path(__file__).resolve().parents[1]
script = repo / "scripts" / "convert-visual-project.py"
sys.exit(
    subprocess.call(
        [sys.executable, str(script), "graphic-design", "high-press", "High Press"],
        cwd=str(repo),
    )
)

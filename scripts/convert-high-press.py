#!/usr/bin/env python3
"""Convert high-press uploads to cover.webp + numbered 01.webp, …"""

import json
import os
import re
from pathlib import Path

from PIL import Image

DIR = Path(__file__).resolve().parents[1] / "visuals" / "graphic-design" / "high-press"
MAX_EDGE = 2000
WEBP_QUALITY = 85
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".PNG", ".JPG", ".JPEG"}


def is_image(path: Path) -> bool:
    if path.name.startswith("._"):
        return False
    if path.suffix not in IMAGE_EXT and path.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
        return False
    return path.is_file()


def is_cover(path: Path) -> bool:
    stem = path.stem.lower()
    return stem == "cover"


def save_webp(src: Path, dest: Path) -> None:
    img = Image.open(src)
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        img = img.convert("RGBA")
    else:
        img = img.convert("RGB")
    w, h = img.size
    if max(w, h) > MAX_EDGE:
        scale = MAX_EDGE / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)


def main():
    sources = sorted([p for p in DIR.iterdir() if is_image(p)], key=lambda p: p.name.lower())
    cover_src = None
    rest = []
    for p in sources:
        if is_cover(p):
            cover_src = p
        else:
            rest.append(p)

    if not cover_src:
        raise SystemExit("No cover.PNG found in " + str(DIR))

    # Remove old numbered webp from prior runs
    for old in DIR.glob("*.webp"):
        if old.name == "cover.webp" or re.match(r"^\d{2}\.webp$", old.name):
            old.unlink()

    cover_dest = DIR / "cover.webp"
    save_webp(cover_src, cover_dest)
    print("cover:", cover_src.name, "->", cover_dest.name)

    images = ["visuals/graphic-design/high-press/cover.webp"]
  # gallery order: 01, 02, … (cover only on stack face; lightbox can include all)
    for i, src in enumerate(rest, start=1):
        dest = DIR / f"{i:02d}.webp"
        save_webp(src, dest)
        images.append(f"visuals/graphic-design/high-press/{dest.name}")
        print(f"{i:02d}:", src.name, "->", dest.name)

    # Remove source rasters (keep README)
    for p in sources:
        p.unlink()
        print("removed:", p.name)

    manifest_path = Path(__file__).resolve().parents[1] / "data" / "visual-work.json"
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    for item in data.get("graphicDesign", []):
        if item.get("id") == "high-press":
            item["cover"] = images[0]
            item["images"] = images
            item["tags"] = item.get("tags") or ["music", "band", "flyers", "branding"]
            break
    manifest_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("\nUpdated data/visual-work.json (%d images)" % len(images))


if __name__ == "__main__":
    main()

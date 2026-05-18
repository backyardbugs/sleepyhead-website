#!/usr/bin/env python3
"""
Convert a visual project folder to cover.webp + 01.webp, 02.webp, …

Usage:
  python3 scripts/convert-visual-project.py illustration sleepymemoir "Sleepy Memoir"
  python3 scripts/convert-visual-project.py graphic-design high-press "High Press"

Requires cover.png|jpg|jpeg|webp|gif (any common raster) named cover.*
"""

import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[1]
MAX_EDGE = 2000
WEBP_QUALITY = 85
RASTER_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".PNG", ".JPG", ".JPEG", ".GIF", ".WEBP"}

CATEGORY_MAP = {
    "illustration": ("illustration", "illustration"),
    "graphic-design": ("graphicDesign", "graphic-design"),
    "graphicdesign": ("graphicDesign", "graphic-design"),
    "comics": ("comics", "comics"),
}


def is_image(path: Path) -> bool:
    if path.name.startswith("._"):
        return False
    return path.is_file() and path.suffix in RASTER_SUFFIXES or path.suffix.lower() in {
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
    }


def is_cover(path: Path) -> bool:
    return path.stem.lower() == "cover"


def save_webp(src: Path, dest: Path) -> None:
    img = Image.open(src)
    if getattr(img, "is_animated", False):
        img.seek(0)
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
    parser = argparse.ArgumentParser(description="Convert visual project rasters to WebP")
    parser.add_argument("category", help="illustration | graphic-design | comics")
    parser.add_argument("project_id", help="folder name under visuals/<category>/")
    parser.add_argument("title", nargs="?", default=None, help="display title for new JSON entries")
    args = parser.parse_args()

    cat_key = args.category.lower()
    if cat_key not in CATEGORY_MAP:
        sys.exit("Unknown category. Use: illustration, graphic-design, comics")

    json_key, folder_cat = CATEGORY_MAP[cat_key]
    project_id = args.project_id.strip().lower().replace(" ", "-")
    title = (args.title or project_id.replace("-", " ").title()).strip()

    dir_path = REPO / "visuals" / folder_cat / project_id
    if not dir_path.is_dir():
        sys.exit("Folder not found: " + str(dir_path))

    prefix = f"visuals/{folder_cat}/{project_id}"
    sources = sorted([p for p in dir_path.iterdir() if is_image(p)], key=lambda p: p.name.lower())

    cover_src = next((p for p in sources if is_cover(p)), None)
    if not cover_src:
        sys.exit("No cover.* found in " + str(dir_path))

    rest = [p for p in sources if p is not cover_src]

    for old in dir_path.glob("*.webp"):
        if old.name == "cover.webp" or re.match(r"^\d{2}\.webp$", old.name):
            old.unlink()

    save_webp(cover_src, dir_path / "cover.webp")
    images = [f"{prefix}/cover.webp"]
    print("cover:", cover_src.name, "-> cover.webp")

    for i, src in enumerate(rest, start=1):
        dest = dir_path / f"{i:02d}.webp"
        save_webp(src, dest)
        images.append(f"{prefix}/{dest.name}")
        print(f"{i:02d}:", src.name, "->", dest.name)

    for p in sources:
        p.unlink()
        print("removed:", p.name)

    manifest_path = REPO / "data" / "visual-work.json"
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    items = data.setdefault(json_key, [])
    entry = next((x for x in items if x.get("id") == project_id), None)
    if entry:
        if entry.get("type") == "series":
            entry["cover"] = images[0]
            entry["pages"] = images
        else:
            entry["type"] = entry.get("type") or "stack"
            entry["cover"] = images[0]
            entry["images"] = images
    else:
        items.append(
            {
                "id": project_id,
                "type": "stack",
                "title": title,
                "subtitle": "",
                "tags": (
                    ["illustration"]
                    if json_key == "illustration"
                    else (["comics"] if json_key == "comics" else ["graphic-design"])
                ),
                "cover": images[0],
                "images": images,
            }
        )
        if json_key == "graphicDesign":
            items[-1]["tags"] = ["branding"]

    manifest_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("\nUpdated data/visual-work.json → %s.%s (%d images)" % (json_key, project_id, len(images)))


if __name__ == "__main__":
    main()

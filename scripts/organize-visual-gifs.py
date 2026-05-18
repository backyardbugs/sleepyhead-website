#!/usr/bin/env python3
"""
Organize a GIF project: cover.gif + 01.gif, 02.gif, … (no format conversion).

Usage:
  python3 scripts/organize-visual-gifs.py illustration spirits "Spirits"
"""

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
GIF_SUFFIXES = {".gif", ".GIF"}

CATEGORY_MAP = {
    "illustration": ("illustration", "illustration"),
    "graphic-design": ("graphicDesign", "graphic-design"),
    "comics": ("comics", "comics"),
}


def is_gif(path: Path) -> bool:
    return path.is_file() and not path.name.startswith("._") and path.suffix in GIF_SUFFIXES


def main():
    parser = argparse.ArgumentParser(description="Organize GIF visual project files")
    parser.add_argument("category", help="illustration | graphic-design | comics")
    parser.add_argument("project_id", help="folder name")
    parser.add_argument("title", nargs="?", default=None)
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
    sources = sorted([p for p in dir_path.iterdir() if is_gif(p)], key=lambda p: p.name.lower())

    cover_src = next((p for p in sources if p.stem.lower() == "cover"), None)
    if not cover_src:
        sys.exit("No cover.GIF found in " + str(dir_path))

    rest = [p for p in sources if p is not cover_src]

    for old in dir_path.glob("*.gif"):
        if old.name == "cover.gif" or re.match(r"^\d{2}\.gif$", old.name):
            old.unlink()

    cover_dest = dir_path / "cover.gif"
    if cover_src.resolve() != cover_dest.resolve():
        shutil.move(str(cover_src), str(cover_dest))
    print("cover:", cover_src.name, "-> cover.gif")

    images = [f"{prefix}/cover.gif"]
    for i, src in enumerate(rest, start=1):
        dest = dir_path / f"{i:02d}.gif"
        if src.exists():
            shutil.move(str(src), str(dest))
            print(f"{i:02d}:", src.name, "->", dest.name)
        images.append(f"{prefix}/{dest.name}")

    manifest_path = REPO / "data" / "visual-work.json"
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    items = data.setdefault(json_key, [])
    entry = next((x for x in items if x.get("id") == project_id), None)
    payload = {
        "id": project_id,
        "type": "stack",
        "title": title,
        "subtitle": "",
        "tags": ["illustration", "gif", "animation"] if json_key == "illustration" else ["gif"],
        "media": "gif",
        "cover": images[0],
        "images": images,
    }
    if entry:
        entry.update(payload)
    else:
        items.append(payload)

    manifest_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("\nUpdated data/visual-work.json → %s.%s (%d GIFs)" % (json_key, project_id, len(images)))


if __name__ == "__main__":
    main()

Visual work — where to put image files
======================================

Folder layout (one folder per project):

  visuals/illustration/<project-id>/
  visuals/graphic-design/<project-id>/
  visuals/comics/<project-id>/          (new comics; Greening stays in comics/greening/)

Inside each project folder:

  cover.webp     — shows on the site as the stack thumbnail
  01.webp        — first image when browsing the stack / series
  02.webp, …     — use two-digit numbers so files sort in order

Sorting = folder + JSON, not drag-and-drop on the site:
  • Order in data/visual-work.json (pages[] or images[] arrays)
  • Filenames 01, 02, 03 help you stay organized locally

Quick start (from repo root):

  node scripts/visual-work-scaffold.js illustration sleepymemoir "Sleepy Memoir"

After adding PNGs/JPGs and a cover.* file, convert to WebP:

  python3 scripts/convert-visual-project.py illustration sleepymemoir "Sleepy Memoir"
  python3 scripts/convert-visual-project.py graphic-design high-press "High Press"

Drop images into the folder it creates, paste the JSON into data/visual-work.json,
then:

  git add visuals/ data/visual-work.json
  git commit -m "Add High Press visual work"
  git push origin main

Push to main deploys to Neocities automatically (GitHub Action).

Tips:
  • Prefer WebP. PNG/JPG also work.
  • Resize before upload: ~1200px wide for flyers, ~2000px for comic pages.
  • Neocities free tier: avoid huge files (aim under ~1–2 MB per image).

#!/usr/bin/env node
/**
 * Scaffold a visual-work project folder + JSON snippet.
 *
 * Usage:
 *   node scripts/visual-work-scaffold.js illustration pixel-forest "Pixel forest"
 *   node scripts/visual-work-scaffold.js graphic-design high-press "High Press"
 *   node scripts/visual-work-scaffold.js comics my-strip "My strip" --type single
 *
 * Then drop images into the created folder (cover.webp, 01.webp, …),
 * paste the printed JSON into data/visual-work.json, commit, push.
 */

const fs = require('fs');
const path = require('path');

const VALID = {
  illustration: 'illustration',
  'graphic-design': 'graphicDesign',
  graphicdesign: 'graphicDesign',
  comics: 'comics'
};

const args = process.argv.slice(2);
const typeFlag = args.indexOf('--type');
const itemType = typeFlag >= 0 ? args[typeFlag + 1] : null;
if (typeFlag >= 0) {
  args.splice(typeFlag, 2);
}

const categoryArg = (args[0] || '').toLowerCase();
const projectId = (args[1] || '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
const title = args.slice(2).join(' ') || projectId;

const jsonKey = VALID[categoryArg];
if (!jsonKey || !projectId) {
  console.error(`
Usage:
  node scripts/visual-work-scaffold.js <category> <project-id> "<Title>"

Categories: illustration | graphic-design | comics

Options:
  --type stack   (default for illustration / graphic-design)
  --type single  (one image)
  --type series  (multi-page comic reader; comics only)

Examples:
  node scripts/visual-work-scaffold.js graphic-design high-press "High Press"
  node scripts/visual-work-scaffold.js illustration frog-pumpkin "Frog & pumpkin"
  node scripts/visual-work-scaffold.js comics daily-strip "Daily strip" --type single
`);
  process.exit(1);
}

const folderCategory =
  categoryArg === 'graphicdesign' ? 'graphic-design' : categoryArg;
const dir = path.join('visuals', folderCategory, projectId);

let resolvedType = itemType;
if (!resolvedType) {
  if (jsonKey === 'comics') {
    resolvedType = 'series';
  } else {
    resolvedType = 'stack';
  }
}

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'README.txt'),
    [
      'Drop images here:',
      '  cover.webp  — thumbnail on the visual work page (stack top card)',
      '  01.webp, 02.webp, … — gallery order (use two digits so files sort correctly)',
      '',
      'Tips:',
      '  - Export as WebP when possible (smaller, faster on Neocities)',
      '  - Keep long edge around 1600–2000px for comics, ~1200px for flyers',
      '  - Then add the JSON block printed by this script to data/visual-work.json'
    ].join('\n')
  );
}

const base = `visuals/${folderCategory}/${projectId}`;
const cover = `${base}/cover.webp`;

let entry;
if (resolvedType === 'series') {
  entry = {
    id: projectId,
    type: 'series',
    title,
    info: '',
    cover,
    pages: [cover, `${base}/01.webp`, `${base}/02.webp`]
  };
} else if (resolvedType === 'single') {
  entry = {
    id: projectId,
    type: 'single',
    title,
    cover: `${base}/01.webp`,
    image: `${base}/01.webp`
  };
} else {
  entry = {
    id: projectId,
    type: 'stack',
    title,
    subtitle: '',
    cover,
    images: [cover, `${base}/01.webp`, `${base}/02.webp`, `${base}/03.webp`]
  };
}

console.log('\nCreated folder:', dir);
console.log('\nPaste into data/visual-work.json → "' + jsonKey + '" array:\n');
console.log(JSON.stringify(entry, null, 2));
console.log('\nEdit paths after you add real filenames. Commit + push main to deploy.\n');

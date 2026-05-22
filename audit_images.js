const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\gilad\\smart_traveller_local';
const IMAGES_DIR = path.join(ROOT, 'assets', 'images');

// Step 1: Build set of all image filenames (lowercased)
function getAllImageFiles(dir) {
  const files = new Set();
  function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch(e) { return; }
    for (const entry of entries) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        // Also track subdirectory paths relative to IMAGES_DIR
      } else {
        const rel = path.relative(IMAGES_DIR, full).replace(/\\/g, '/');
        files.add(rel.toLowerCase());
        files.add(entry.name.toLowerCase()); // also just filename
      }
    }
  }
  walk(dir);
  return files;
}

// Step 2: Find all HTML files
function getAllHtmlFiles(dir) {
  const files = [];
  function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch(e) { return; }
    for (const entry of entries) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        // skip node_modules etc
        if (!['node_modules', '.git'].includes(entry.name)) walk(full);
      } else if (entry.name.endsWith('.html')) {
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

// Step 3: Extract all image references to assets/images/
function extractImageRefs(content) {
  const refs = [];

  // Patterns to match
  const patterns = [
    // src="...assets/images/..."
    /(?:src|data-src|data-thumb|data-image)\s*=\s*["']([^"']*assets\/images\/[^"']*)["']/gi,
    // url(...)  in style attributes or style tags
    /url\(\s*["']?([^"')]*assets\/images\/[^"')]+)["']?\s*\)/gi,
    // srcset
    /srcset\s*=\s*["']([^"']*)["']/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const val = match[1];
      if (pattern.source.includes('srcset')) {
        // srcset has multiple entries
        const parts = val.split(',').map(s => s.trim().split(/\s+/)[0]);
        for (const p of parts) {
          if (p.includes('assets/images/')) refs.push(p);
        }
      } else {
        refs.push(val);
      }
    }
  }

  return refs;
}

// Normalize a ref to just the part after assets/images/
function normalizeRef(ref) {
  const idx = ref.indexOf('assets/images/');
  if (idx === -1) return null;
  return ref.slice(idx + 'assets/images/'.length);
}

// Main
const imageFiles = getAllImageFiles(IMAGES_DIR);
console.log(`Total image files on disk: ${imageFiles.size}`);

// Also build a map of relative paths from images dir
const imageRelPaths = new Set();
function buildRelPaths(dir, base) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return; }
  for (const entry of entries) {
    const rel = base ? base + '/' + entry.name : entry.name;
    if (entry.isDirectory()) {
      buildRelPaths(path.join(dir, entry.name), rel);
    } else {
      imageRelPaths.add(rel.toLowerCase());
    }
  }
}
buildRelPaths(IMAGES_DIR, '');

const htmlFiles = getAllHtmlFiles(ROOT);
console.log(`Total HTML files found: ${htmlFiles.length}`);
htmlFiles.forEach(f => console.log('  ' + f.replace(ROOT, '')));

let totalRefs = 0;
const broken = [];

for (const htmlFile of htmlFiles) {
  let content;
  try { content = fs.readFileSync(htmlFile, 'utf8'); } catch(e) { continue; }

  const refs = extractImageRefs(content);
  totalRefs += refs.length;

  for (const ref of refs) {
    const after = normalizeRef(ref);
    if (!after) continue;

    // Remove query string or hash
    const clean = after.split('?')[0].split('#')[0];

    // Check existence: exact match in relPaths
    const exists = imageRelPaths.has(clean.toLowerCase());

    if (!exists) {
      broken.push({ file: htmlFile.replace(ROOT, ''), ref: ref.trim(), resolved: clean });
    }
  }
}

console.log(`\n=== AUDIT RESULTS ===`);
console.log(`Total image references found: ${totalRefs}`);
console.log(`Broken references (file not on disk): ${broken.length}`);

if (broken.length > 0) {
  console.log(`\nFirst ${Math.min(20, broken.length)} broken references:`);
  const shown = broken.slice(0, 20);
  for (const b of shown) {
    console.log(`  HTML: ${b.file}`);
    console.log(`    ref: ${b.ref}`);
    console.log(`    missing: assets/images/${b.resolved}`);
    console.log('');
  }

  if (broken.length > 20) {
    console.log(`... and ${broken.length - 20} more broken references.`);
  }

  // Group by missing file
  const byMissing = {};
  for (const b of broken) {
    if (!byMissing[b.resolved]) byMissing[b.resolved] = [];
    byMissing[b.resolved].push(b.file);
  }
  console.log(`\nUnique missing image files: ${Object.keys(byMissing).length}`);
  console.log(`Top missing files (appearing most often):`);
  const sorted = Object.entries(byMissing).sort((a,b) => b[1].length - a[1].length).slice(0, 15);
  for (const [file, htmls] of sorted) {
    console.log(`  ${file} (referenced in ${htmls.length} HTML files)`);
  }
}

// Capacity guard.
//
// GitHub Pages caps a published site at 1 GB and a source repository at 1 GB
// (recommended). The sample videos are what grow: every new batch of tasks
// adds tens of megabytes. This check runs in CI so the limit is noticed while
// there is still room to act, instead of when a deploy starts failing.
//
// Limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const SITE_LIMIT_MB = 1024;
const REPO_LIMIT_MB = 1024;
// Warn while there is still room to compress or move media, rather than at
// the point where the deploy breaks.
const WARN_RATIO = 0.7;

async function sizeOf(directory) {
  let total = 0;
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) total += await sizeOf(full);
    else total += (await fs.stat(full)).size;
  }
  return total;
}

async function folderSize(directory) {
  let total = 0;
  for (const dir of directory) {
    try {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) total += await sizeOf(full);
        else total += (await fs.stat(full)).size;
      }
    } catch { /* directory may not exist */ }
  }
  return total;
}

const mb = bytes => (bytes / 1024 / 1024).toFixed(1);
const siteBytes = await sizeOf(root);
const mediaBytes = await folderSize(['assets/v2v-samples', 'assets/generator-samples', 'assets/research']);
const repoBytes = await sizeOf('.git');

console.log('Site size:    ' + mb(siteBytes) + ' MB / ' + SITE_LIMIT_MB + ' MB');
console.log('Media size:   ' + mb(mediaBytes) + ' MB');
console.log('Repo (.git):  ' + mb(repoBytes) + ' MB / ' + REPO_LIMIT_MB + ' MB');

const failures = [];
if (siteBytes > SITE_LIMIT_MB * 1024 * 1024) {
  failures.push('Published site exceeds the 1 GB Pages limit.');
}
if (repoBytes > REPO_LIMIT_MB * 1024 * 1024) {
  failures.push('Repository exceeds the 1 GB recommended limit.');
}
if (siteBytes > SITE_LIMIT_MB * 1024 * 1024 * WARN_RATIO) {
  failures.push('Published site is past ' + Math.round(WARN_RATIO * 100) + '% of the limit. '
    + 'Compress the sample videos (node scripts/compress-videos.mjs) or move them to object storage.');
}

if (failures.length) {
  for (const failure of failures) console.error('FAIL: ' + failure);
  process.exitCode = 1;
} else {
  console.log('PASS: capacity within limits.');
}

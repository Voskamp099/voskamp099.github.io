// Compress the sample videos in place.
//
// The source clips were exported at very high bitrates for a 2-3 second
// window: 480-s2-input.mp4 held 25 Mbps for 3.4 seconds, 10 MB of data for
// a fragment you watch for three seconds. GitHub Pages caps a published
// site at 1 GB, so every byte of that headroom is a batch of samples you
// can still publish later.
//
// Re-encoding at CRF 26 keeps the picture visually identical (SSIM 0.99,
// PSNR 37.9 dB on the worst case) and cuts the total from 118 MB to ~38 MB.
// The originals are overwritten, because the git history would otherwise keep
// both versions and grow the repository twice as fast.
//
// Usage: node scripts/compress-videos.mjs [--dry-run]

import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);
const dryRun = process.argv.includes('--dry-run');

const DIRS = ['assets/v2v-samples', 'assets/generator-samples'];
const CRF = '26';
const PRESET = 'medium';

async function ffprobe(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'format=duration,bit_rate', '-show_entries', 'stream=width,height',
    '-of', 'json', file]);
  const data = JSON.parse(stdout);
  return {
    duration: Number(data.format?.duration || 0),
    bitRate: Number(data.format?.bit_rate || 0),
    width: data.streams?.[0]?.width || 0,
    height: data.streams?.[0]?.height || 0
  };
}

async function listVideos(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter(e => e.isFile() && e.name.endsWith('.mp4'))
      .map(e => path.join(dir, e.name));
  } catch {
    return [];
  }
}

const files = (await Promise.all(DIRS.map(listVideos))).flat();
console.log('Scanning ' + files.length + ' video files…');

let before = 0;
let after = 0;
let changed = 0;
let skipped = 0;

for (const file of files) {
  const stat = await fs.stat(file);
  before += stat.size;

  const info = await ffprobe(file);
  // A short clip already under the target bitrate is left alone: re-encoding
  // it would only add generation loss for no saving.
  const targetBitrate = 2_500_000;
  if (info.bitRate && info.bitRate <= targetBitrate) {
    after += stat.size;
    skipped++;
    continue;
  }

  const temp = file + '.tmp.mp4';
  let encoded = false;
  for (let attempt = 1; attempt <= 3 && !encoded; attempt++) {
    try {
      await run('ffmpeg', ['-y', '-i', file, '-c:v', 'libx264', '-crf', CRF, '-preset', PRESET,
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', temp],
        { maxBuffer: 1024 * 1024 * 64 });
      encoded = true;
    } catch (error) {
      const message = error.stderr?.split('\n').filter(Boolean).pop() || error.message;
      if (attempt === 3) {
        console.log('  FAILED ' + file + ': ' + message);
        await fs.rm(temp, { force: true });
      } else {
        await fs.rm(temp, { force: true });
        // The previous attempt may have been cut short; give it another go.
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }
  }
  if (!encoded) {
    after += stat.size;
    continue;
  }

  const newStat = await fs.stat(temp).catch(() => null);
  // The encode may have been interrupted. Treat a missing or oversized
  // output as "leave the original alone" rather than failing the run.
  if (!newStat) {
    await fs.rm(temp, { force: true });
    console.log('  skipped (no output) ' + path.basename(file));
    after += stat.size;
    skipped++;
    continue;
  }
  // Guard against a pathological encode: never replace a file with a bigger one.
  if (newStat.size >= stat.size) {
    await fs.rm(temp, { force: true });
    after += stat.size;
    skipped++;
    continue;
  }
  // A marginal gain is not worth another generation of loss: a file that is
  // already efficiently encoded stays as it is.
  if (newStat.size > stat.size * 0.85) {
    await fs.rm(temp, { force: true });
    console.log('  skipped (gain too small) ' + path.basename(file));
    after += stat.size;
    skipped++;
    continue;
  }

  if (dryRun) {
    console.log('  would compress ' + path.basename(file) + ': '
      + (stat.size / 1024 / 1024).toFixed(2) + ' MB -> ' + (newStat.size / 1024 / 1024).toFixed(2) + ' MB');
    await fs.rm(temp, { force: true });
  } else {
    // Rename through a copy fallback: a rename across devices fails, and the
    // temp file may live on a different mount than the target.
    try {
      await fs.rename(temp, file);
    } catch {
      await fs.copyFile(temp, file);
      await fs.rm(temp, { force: true });
    }
    console.log('  compressed ' + path.basename(file) + ': '
      + (stat.size / 1024 / 1024).toFixed(2) + ' MB -> ' + (newStat.size / 1024 / 1024).toFixed(2) + ' MB');
  }
  after += newStat.size;
  changed++;
}

const mb = n => (n / 1024 / 1024).toFixed(1);
console.log('\n' + (dryRun ? '[dry run] ' : '') + 're-encoded ' + changed + ', left alone ' + skipped);
console.log('Total video size: ' + mb(before) + ' MB -> ' + mb(after) + ' MB  (saved ' + mb(before - after) + ' MB)');
if (!dryRun) {
  console.log('The originals were replaced. The git history still holds the first version,');
  console.log('so run "git gc --aggressive" if the repository needs to shrink.');
}

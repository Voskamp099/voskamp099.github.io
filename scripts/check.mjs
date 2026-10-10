import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const lists = await Promise.all(entries.map(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return lists.flat();
}
const files = await walk(root);
const unwanted = new RegExp(['zhao', '[\\s_-]*', 'xin'].join(''), 'i');
const unwantedChinese = String.fromCodePoint(0x8d75, 0x99a8);
let links = 0;
for (const file of files) {
  if (!/\.(html|css|js|xml|txt|svg)$/.test(file)) continue;
  const text = await fs.readFile(file, 'utf8');
  if (unwanted.test(text) || text.includes(unwantedChinese) || text.includes('zx-lang') || text.includes('zx-theme')) throw new Error('Unexpected old identity in ' + path.relative(root, file));
  if (/\/Users\//.test(text)) throw new Error('Local path in published output');
  if (!file.endsWith('.html')) continue;
  if (!text.includes('lang="zh-CN"') || !text.includes('lang="en"')) throw new Error('Missing bilingual markup in ' + file);
  for (const match of text.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|data:)/.test(href)) continue;
    const url = new URL(href.replaceAll('&amp;', '&'), 'https://example.test/' + path.relative(root, file));
    let target = path.join(root, decodeURIComponent(url.pathname));
    if (!target.startsWith(root + path.sep) && target !== root) throw new Error('Link escaped output');
    if (url.pathname.endsWith('/')) target = path.join(target, 'index.html');
    await fs.access(target);
    if (url.hash && target.endsWith('.html')) {
      const destination = await fs.readFile(target, 'utf8');
      if (!destination.includes('id="' + decodeURIComponent(url.hash.slice(1)) + '"')) throw new Error('Missing anchor: ' + href);
    }
    links++;
  }
}
if (!files.some(file => file.endsWith('/feed.xml')) || !files.some(file => file.endsWith('/sitemap.xml'))) throw new Error('Missing feed or sitemap');
console.log('PASS: ' + links + ' internal links/assets; bilingual pages; identity and local-path checks.');

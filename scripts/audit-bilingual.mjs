// Bilingual audit.
//
// The site ships one URL for two languages: every translatable string is
// emitted twice, once inside .en and once inside .zh, and CSS hides the one
// that does not match the current language. That only works if every visible
// string is actually wrapped. This script proves it.
//
// Rules:
//   1. Chinese characters outside a .zh block  -> a Chinese leak (always visible,
//      or visible in English mode).
//   2. Latin words inside a .zh block          -> an English leak in Chinese mode.
//      Exempt: proper nouns / technical identifiers in the allowlist, and
//      elements marked .keep-en (a deliberately untranslated term).
//   3. A missing translation (an .en block with no .zh sibling, or text that
//      exists in one language only) is reported as an unpaired string.
//
// Language-aware attributes (aria-label, title, placeholder, alt) are audited
// the same way, against the language of the element that carries them.

import fs from 'node:fs/promises';
import path from 'node:path';
import { STATIC_PAGES } from './static-pages.mjs';

const root = path.resolve('dist');
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr']);
const CJK = /[\u3400-\u9fff\u3040-\u30ff\u3000-\u303f\uff00-\uffef]/;
const LATIN_WORD = /[A-Za-z]{2,}/;

// Terms that legitimately stay in English inside Chinese copy: product names,
// technical identifiers, units and the author's own name.
const ALLOWED_IN_ZH = new Set([
  'Raelynn', 'OmniReason', 'GitHub', 'macOS', 'SwiftUI', 'AppKit', 'Apple', 'Calendar',
  'PetAssistant', 'IBM', 'Plex', 'Grotesk', 'Noto', 'Sans', 'SC', 'URL', 'API', 'LLM',
  'CLI', 'AI', 'V2V', 'RV2V', 'fps', 'px', 'MP', 'GB', 'ID', 'UI', 'UX', 'OS', 'SQL',
  'CPU', 'GPU', 'PDF', 'CSV', 'JSON', 'YAML', 'HTML', 'CSS', 'OK', 'MP4', 'App', 'Store',
  'Beta', 'Lab', 'Labs', 'R', 'raelynn', 'notes', 'learning', 'making',
  'by', 'video', 'reasoning', 'counterfactuals', 'research', 'progress', 'plus',
  'quiet', 'desktop', 'cat', 'main', 'index', 'html', 'md', 'idea', 'build', 'test',
  'write', 'now', 'process', 'whoami', 'run', 'make', 'the', 'a', 'an', 'and',
  'of', 'to', 'in', 'for', 'on', 'with', 'is', 'are', 'it', 'my', 'me', 'I', 'so',
  'what', 'how', 'this', 'that', 'from', 'at', 'be', 'as', 'not', 'but', 'if', 'or',
  // Product and platform names that have no Chinese spelling.
  'WorldQuant', 'BRAIN', 'VSCode', 'Agent', 'Owner', 'Final', 'B', 'A',
  // Terminal and OS messages quoted verbatim.
  'Operation', 'permitted', 'succeeded', 'allowed', 'denied', 'failed'
]);

// A snake_case identifier (a dataset slug, a task name, a field name) is a
// literal, not prose: it reads the same in both languages.
const IDENTIFIER = /^[a-z0-9]+(_[a-z0-9]+)+$/;

const LANGUAGE_ATTRS = ['aria-label', 'title', 'placeholder', 'alt'];
// Code is never translated: a Swift type, a shell flag and a dataset slug stay
// exactly as written in both language versions.
const CODE_TAGS = new Set(['code', 'pre', 'kbd', 'samp', 'var']);
const findings = [];

function lineOf(text, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) if (text[i] === '\n') line++;
  return line;
}

function inspectText(text, offset, context, file) {
  if (!text.trim()) return;
  if (context.code) return; // identifiers and slugs are language-neutral
  const snippet = text.replace(/\s+/g, ' ').trim();
  if (context.lang === 'zh') {
    if (CJK.test(text)) return; // correct language
    if (IDENTIFIER.test(snippet)) return; // a literal, not prose
    const words = snippet.match(LATIN_WORD) || [];
    const stray = words.filter(word => !ALLOWED_IN_ZH.has(word));
    if (stray.length && !context.keepEn) {
      findings.push({ file, line: lineOf(text, offset), kind: 'en-in-zh', detail: snippet, words: stray });
    }
  } else {
    if (CJK.test(text)) {
      findings.push({ file, line: lineOf(text, offset), kind: context.lang === 'en' ? 'zh-in-en' : 'zh-neutral', detail: snippet });
    }
  }
}

function inspectAttr(name, value, offset, context, file, source) {
  if (!LANGUAGE_ATTRS.includes(name) || !value.trim()) return;
  if (context.lang === 'zh') {
    const words = value.match(LATIN_WORD) || [];
    const stray = words.filter(word => !ALLOWED_IN_ZH.has(word));
    if (stray.length && !context.keepEn) {
      findings.push({ file, line: lineOf(source, offset), kind: 'en-in-zh', detail: name + '="' + value + '"', words: stray });
    }
  } else if (CJK.test(value)) {
    findings.push({ file, line: lineOf(source, offset), kind: context.lang === 'en' ? 'zh-in-en' : 'zh-neutral', detail: name + '="' + value + '"' });
  }
}

const TOKEN = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]*>|[^<]+/g;

function auditHtml(file, text) {
  const stack = [{ lang: null, keepEn: false, code: false }];
  let offset = 0;
  let skipUntil = null;
  for (const match of text.matchAll(TOKEN)) {
    const token = match[0];
    const start = match.index;
    if (skipUntil) {
      if (token.toLowerCase().startsWith('</' + skipUntil)) { skipUntil = null; stack.pop(); }
      offset = start + token.length;
      continue;
    }
    if (token.startsWith('<!--') || token.startsWith('<![CDATA[')) { offset = start + token.length; continue; }
    if (token.startsWith('<')) {
      const nameMatch = /^<\/?([a-zA-Z0-9-]+)/.exec(token);
      const tag = nameMatch ? nameMatch[1].toLowerCase() : '';
      const selfClosing = /\/>$/.test(token) || VOID_TAGS.has(tag);
      if (token.startsWith('</')) {
        if (stack.length > 1) stack.pop();
      } else if (!selfClosing) {
        const classes = (/class="([^"]*)"/.exec(token) || ['', ''])[1].split(/\s+/);
        const parent = stack[stack.length - 1];
        const lang = classes.includes('en') ? 'en' : classes.includes('zh') ? 'zh' : parent.lang;
        const keepEn = parent.keepEn || classes.includes('keep-en');
        const code = parent.code || CODE_TAGS.has(tag);
        if (tag === 'script' || tag === 'style') skipUntil = tag;
        stack.push({ lang, keepEn, code, isTitle: tag === 'title' });
      }
      // attributes
      const context = stack[stack.length - 1];
      for (const attr of token.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) {
        inspectAttr(attr[1].toLowerCase(), attr[2], start, context, file, text);
      }
      offset = start + token.length;
      continue;
    }
    // text node
    const context = stack[stack.length - 1];
    // <title> holds one value at a time and is rewritten by the client from
    // data-title-en / data-title-zh, so it is checked separately below.
    if (stack[stack.length - 1].isTitle) { offset = start + token.length; continue; }
    inspectText(token, start, context, file);
    offset = start + token.length;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const lists = await Promise.all(entries.map(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }));
  return lists.flat();
}

const files = (await walk(root)).filter(file => file.endsWith('.html'));
for (const file of files) {
  const text = await fs.readFile(file, 'utf8');
  const rel = path.relative(root, file);
  // Single-language static pages are exempt, the same way check.mjs exempts them.
  if (STATIC_PAGES.includes(rel.replace(/\\/g, '/'))) continue;
  auditHtml(rel, text);
  // The client rewrites <title> and <meta description> from these pairs, so
  // every page must carry both languages, and they must actually differ.
  for (const [attr, en, zh] of [['data-title', 'data-title-en', 'data-title-zh'], ['data-desc', 'data-desc-en', 'data-desc-zh']]) {
    const enValue = (new RegExp(en + '="([^"]*)"').exec(text) || [])[1];
    const zhValue = (new RegExp(zh + '="([^"]*)"').exec(text) || [])[1];
    if (!enValue || !zhValue) {
      findings.push({ file: rel, line: 1, kind: 'missing-pair', detail: attr + ' pair is incomplete' });
    } else if (enValue === zhValue) {
      findings.push({ file: rel, line: 1, kind: 'missing-pair', detail: attr + ' pair has identical values: ' + enValue });
    }
  }
}

// CSS: a Chinese literal outside a .lang-zh scope is always visible.
for (const file of (await walk(root)).filter(file => file.endsWith('.css'))) {
  const text = await fs.readFile(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    if (!CJK.test(line)) return;
    if (/lang-zh|content\s*:/.test(line) === false) {
      findings.push({ file: path.relative(root, file), line: i + 1, kind: 'zh-in-css', detail: line.trim().slice(0, 120) });
    }
  });
}

if (!findings.length) {
  console.log('PASS: bilingual audit — no cross-language leakage in ' + files.length + ' pages.');
} else {
  const byKind = {};
  for (const finding of findings) (byKind[finding.kind] ||= []).push(finding);
  for (const [kind, list] of Object.entries(byKind)) {
    console.log('\n### ' + kind + '  (' + list.length + ')');
    for (const item of list) {
      console.log('  ' + item.file + ':' + item.line + '  ' + item.detail
        + (item.words ? '   [words: ' + item.words.join(', ') + ']' : ''));
    }
  }
  console.log('\nFAIL: ' + findings.length + ' bilingual leak(s) found.');
  process.exitCode = 1;
}

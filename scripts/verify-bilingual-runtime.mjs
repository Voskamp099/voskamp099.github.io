// Runtime bilingual verification.
//
// The static audit proves the markup is correct. This proves the browser
// actually shows one language and only one language, in both directions,
// on every page type.

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8141';
const PAGES = [
  '/',
  '/sample-of-work/',
  '/sample-of-work/omni-reason/',
  '/sample-of-work/counterfactuals/',
  '/sample-of-work/appendix-task-480/',
  '/sample-of-work/task-275/',
  '/sample-of-work/generator-case6a-feather/',
  '/writing/building-petassistant/',
  '/writing/v2v-rv2v-reasoning-data/',
  '/404.html'
];

const CJK = /[\u3400-\u9fff\u3040-\u30ff]/;

(async () => {
  const browser = await chromium.launch();
  let failures = 0;

  for (const lang of ['en', 'zh']) {
    for (const path of PAGES) {
      const context = await browser.newContext({ locale: lang === 'zh' ? 'zh-CN' : 'en-US' });
      const page = await context.newPage();
      await page.addInitScript(l => localStorage.setItem('raelynn-language', l), lang);
      await page.goto(BASE + path, { waitUntil: 'networkidle' });

      // Every visible text node, after the browser has applied the stylesheet.
      const visible = await page.evaluate(() => {
        const out = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent.replace(/\s+/g, ' ').trim();
          if (!text) continue;
          const parent = node.parentElement;
          if (!parent) continue;
          const style = getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
          if (parent.closest('script, style, template')) continue;
          const rect = parent.getBoundingClientRect();
          if (!rect.width && !rect.height) continue;
          out.push({ text, inZh: !!parent.closest('.zh'), inEn: !!parent.closest('.en'), code: !!parent.closest('code, pre') });
        }
        return out;
      });

      // Visible attributes that carry text.
      const attrs = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('[aria-label], [placeholder], [title]')) {
          const style = getComputedStyle(el);
          if (style.display === 'none') continue;
          for (const attr of ['aria-label', 'placeholder', 'title']) {
            const value = el.getAttribute(attr);
            if (!value || !value.trim()) continue;
            out.push({ attr, value, inZh: !!el.closest('.zh'), inEn: !!el.closest('.en') });
          }
        }
        return out;
      });

      const problems = [];
      // Identifiers, dataset slugs, licences and proper nouns read the same in
      // both languages, so they are not leaks in either direction.
      const NEUTRAL = /^(raelynn|notes|~|OkInk|OakInk|epfl|nlp|CAVE|Commonsense|Anomalies|Visual|Environments|CC|BY|SA|kelvin|github|com|swiftui|macos|worldquant|brain|agent|owner|final|control|option|command|whoami|cat|now\.md|process\.md|idea|build|test|write|PetAssistant|OmniReason|fps|px|x|mp|cvpr|v\d|\d+)$/i;
      // A shell command line is code: "cat now.md" stays as written.
      const SHELL_LINE = /^\$?\s*(whoami|cat|ls|git|npm|node|python3?)\b/;
      const IDENT = /^[a-z0-9]+([_-][a-z0-9]+)+$/;
      for (const item of visible) {
        if (item.code) continue;
        const hasCjk = CJK.test(item.text);
        if (lang === 'en' && hasCjk) problems.push('visible Chinese: ' + item.text.slice(0, 80));
        if (lang === 'zh' && !hasCjk && /[A-Za-z]{3,}/.test(item.text)) {
          if (IDENT.test(item.text.trim())) continue;
          if (SHELL_LINE.test(item.text.trim())) continue;
          const words = item.text.match(/[A-Za-z]{3,}/g) || [];
          const stray = words.filter(w => !NEUTRAL.test(w));
          if (stray.length && !item.inEn) problems.push('visible English: ' + item.text.slice(0, 80));
        }
      }
      for (const item of attrs) {
        const hasCjk = CJK.test(item.value);
        if (lang === 'en' && hasCjk) problems.push('attr ' + item.attr + ' Chinese: ' + item.value);
        if (lang === 'zh' && !hasCjk && /[A-Za-z]{3,}/.test(item.value)) {
          const words = item.value.match(/[A-Za-z]{3,}/g) || [];
          const stray = words.filter(w => !NEUTRAL.test(w));
          if (stray.length) problems.push('attr ' + item.attr + ' English: ' + item.value);
        }
      }

      const title = await page.title();
      if (lang === 'en' && CJK.test(title)) problems.push('title Chinese: ' + title);
      if (lang === 'zh' && !CJK.test(title)) problems.push('title not Chinese: ' + title);

      const htmlLang = await page.getAttribute('html', 'lang');
      const expectedLang = lang === 'zh' ? 'zh-CN' : 'en';
      if (htmlLang !== expectedLang) problems.push('html lang=' + htmlLang);

      const desc = await page.getAttribute('meta[name="description"]', 'content');
      if (lang === 'en' && CJK.test(desc || '')) problems.push('meta description Chinese: ' + desc);
      if (lang === 'zh' && !CJK.test(desc || '')) problems.push('meta description not Chinese: ' + desc);

      const status = problems.length ? 'FAIL' : 'ok  ';
      console.log(status + ' [' + lang + '] ' + path);
      for (const p of problems) { console.log('       ! ' + p); failures++; }
      await context.close();
    }
  }

  await browser.close();
  console.log(failures ? '\nFAIL: ' + failures + ' runtime issue(s).' : '\nPASS: runtime language rendering is clean in both directions.');
  process.exit(failures ? 1 : 0);
})();

import fs from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';

const origin = 'https://voskamp099.github.io';
const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const b = (en, zh) => '<span class="en" lang="en">' + esc(en) + '</span><span class="zh" lang="zh-CN">' + esc(zh) + '</span>';
const files = (await fs.readdir('content/posts')).filter(file => file.endsWith('.json')).sort().reverse();
const posts = await Promise.all(files.map(async file => {
  const post = JSON.parse(await fs.readFile(path.join('content/posts', file), 'utf8'));
  if (!/^[a-z0-9-]+$/.test(post.slug) || !/^\d{4}-\d{2}-\d{2}$/.test(post.date)) throw new Error('Invalid post metadata: ' + file);
  const body = {};
  for (const language of ['en', 'zh']) {
    if (!post.title[language] || !post.summary[language]) throw new Error('Missing translation: ' + file);
    if (!/^[a-z0-9.-]+\.md$/.test(post.body[language])) throw new Error('Invalid body path');
    body[language] = md.render(await fs.readFile(path.join('content/posts', post.body[language]), 'utf8'));
  }
  return { ...post, html: body };
}));
await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir('dist/assets', { recursive: true });
await fs.cp('assets', 'dist/assets', { recursive: true });
const header = '<a class="skip" href="#main">' + b('Skip to content', '跳到正文') + '</a>'
  + '<header class="topbar"><a class="path" href="/">~/<b>raelynn</b> / notes</a>'
  + '<nav id="siteNav" aria-label="Main navigation">'
  + '<a href="/#writing">' + b('writing', '文章') + '</a><a href="/#projects">' + b('projects', '项目') + '</a>'
  + '<a href="/#about">' + b('about', '关于') + '</a><a href="https://github.com/Voskamp099">GitHub ↗</a></nav>'
  + '<button class="toggle" id="themeBtn" type="button" aria-label="切换到深色模式">◐</button>'
  + '<button class="toggle" id="langBtn" type="button" aria-label="Switch to English">EN</button>'
  + '<button class="toggle menu-toggle" id="menuBtn" type="button" aria-label="导航菜单" aria-controls="siteNav" aria-expanded="false">☰</button></header>';
const footer = '<footer><div class="wrap footer-row"><span>~/raelynn · ' + b('Build. Learn. Write.', '做东西，学东西，写下来。')
  + '</span><div><a href="/feed.xml">RSS</a><a href="https://github.com/Voskamp099">GitHub ↗</a><a href="/#main">' + b('Back to top ↑', '回到顶部 ↑') + '</a></div></div></footer>';
function layout({ titleEn, titleZh, description, route = '/', body, article = false }) {
  return '<!doctype html><html lang="zh-CN" class="lang-zh theme-light" data-title-en="' + esc(titleEn) + '" data-title-zh="' + esc(titleZh)
    + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titleZh) + '</title>'
    + '<meta name="description" content="' + esc(description) + '"><meta name="author" content="Raelynn">'
    + '<link rel="canonical" href="' + origin + route + '"><meta property="og:type" content="' + (article ? 'article' : 'website') + '">'
    + '<meta property="og:title" content="' + esc(titleZh) + '"><meta property="og:description" content="' + esc(description) + '">'
    + '<meta property="og:url" content="' + origin + route + '"><meta property="og:image" content="' + origin + '/assets/petassistant.png">'
    + '<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="Raelynn · Notes" href="/feed.xml">'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">'
    + '<link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/blog.css"><script src="/assets/site.js" defer></script></head><body>'
    + header + body + footer + '</body></html>';
}
const cards = posts.map(post => '<a class="article-card" data-article data-categories="' + esc(post.categories.join(' ')) + '" data-search="'
  + esc([post.title.en, post.title.zh, post.summary.en, post.summary.zh, ...post.tags].join(' ')) + '" href="/writing/' + post.slug + '/">'
  + '<time datetime="' + post.date + '">' + post.date + '</time><div><h3>' + b(post.title.en, post.title.zh) + '</h3><p>'
  + b(post.summary.en, post.summary.zh) + '</p><div class="tags">' + post.tags.map(tag => '<span>' + esc(tag) + '</span>').join('')
  + '</div></div><span class="arrow" aria-hidden="true">↗</span></a>').join('');
const home = '<main id="main"><section class="hero"><div class="wrap hero-grid"><div>'
  + '<div class="monogram" aria-hidden="true">R</div><p class="role">' + b('Projects / technical notes / building with AI', '项目 / 技术笔记 / 与 AI 协作') + '</p>'
  + '<h1 class="name">Raelynn<svg class="underline" viewBox="0 0 240 14" fill="none" aria-hidden="true"><path d="M2 9 C60 3,120 13,238 5" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/></svg></h1>'
  + '<h2 class="hero-title">' + b('Build things. Write things down.', '把想法做出来，把过程写下来。') + '</h2>'
  + '<p class="hero-intro">' + b('Notes from making small tools, learning how they work, and improving them through everyday use.', '记录小工具从想法到能用的过程，也记录调试、取舍和日常使用中的发现。') + '</p>'
  + '<div class="hero-cta"><a class="btn btn--solid" href="#writing">' + b('Read the notes →', '读开发笔记 →') + '</a>'
  + '<a class="btn btn--ghost" href="#projects">' + b('Explore projects ↗', '看看项目 ↗') + '</a></div></div>'
  + '<aside class="terminal" aria-label="Current notebook"><div class="bar" aria-hidden="true"><i></i><i></i><i></i><span>notes — raelynn</span></div>'
  + '<div><span class="pr">$</span> whoami</div><div class="output">raelynn <span class="cm">/ ' + b('learning by making', '在做东西的过程中学习') + '</span></div>'
  + '<div><span class="pr">$</span> cat now.md</div><div class="output">PetAssistant<br><span class="cm">' + b('a quiet cat for the desktop', '一只安静的桌面猫') + '</span></div>'
  + '<div><span class="pr">$</span> cat process.md</div><div class="output">' + b('idea → build → test → write', '想法 → 实现 → 验证 → 记录') + '</div>'
  + '<div><span class="pr">$</span> <span class="blink" aria-hidden="true"></span></div><div class="terminal-note">' + b('A notebook for things in progress.', '把进行中的东西，慢慢记下来。') + '</div></aside></div></section>'
  + '<section id="writing"><div class="wrap"><div class="kicker">01 — ' + b('Writing', '文章') + '</div><div class="section-head"><div><h2 class="sec">'
  + b('From the notebook', '最近写下的') + '</h2><p class="sec-sub">' + b('Specific problems, practical decisions, and lessons from building.', '具体的问题、实际的选择，以及做完以后学到的东西。') + '</p></div><a class="section-link" href="/feed.xml">RSS ↗</a></div>'
  + '<div class="article-toolbar"><label class="search-field"><span aria-hidden="true">⌕</span><span class="visually-hidden">' + b('Search articles', '搜索文章') + '</span><input id="articleSearch" type="search" placeholder="搜索标题、内容简介或标签…"></label>'
  + '<div class="filters" aria-label="Article categories"><button class="filter" data-filter="all" aria-pressed="true">' + b('All', '全部') + '</button><button class="filter" data-filter="macos" aria-pressed="false">macOS</button><button class="filter" data-filter="ai" aria-pressed="false">' + b('AI collaboration', 'AI 协作') + '</button></div></div>'
  + '<div class="article-list">' + cards + '</div><p class="empty-state" id="searchEmpty" hidden>' + b('No matching notes. Try another keyword or category.', '没有找到匹配的文章，试试其他关键词或分类。') + '</p><p class="search-status" id="searchCount" aria-live="polite">'
  + posts.length + ' 篇文章</p></div></section>'
  + '<section id="projects"><div class="wrap"><div class="kicker">02 — ' + b('Projects', '项目') + '</div><h2 class="sec">' + b('Things taking shape', '正在做的东西') + '</h2><p class="sec-sub">'
  + b('Small ideas, turned into something I can use.', '从自己的使用场景出发，做一些能用的小东西。') + '</p><article class="project-feature"><div><div class="tags"><span>'
  + b('PERSONAL PROTOTYPE', '个人原型') + '</span></div><h3>PetAssistant</h3><p>' + b('A desktop cat that reads my calendar and to-do list once, then stays quietly in place. Built collaboratively with AI.', '点一下读日程，再点一下看待办，读完留在原地。和 AI 一起做的一只安静桌面猫。')
  + '</p><div class="meta"><span>SwiftUI</span><span>AppKit</span><span>Apple Calendar</span><span>macOS 14+</span></div><a class="section-link" href="/writing/building-petassistant/">'
  + b('Read the build story →', '读项目记录 →') + '</a></div><figure><img src="/assets/petassistant.png" alt="PetAssistant desktop cat" width="200" height="200" loading="lazy"><figcaption>'
  + b('The current static cat image.', '目前使用的静态猫图。') + '</figcaption></figure></article></div></section>'
  + '<section id="about"><div class="wrap"><div class="kicker">03 — ' + b('About', '关于') + '</div><h2 class="sec">' + b('A place to think in public', '给做东西的过程留一个地方') + '</h2><div class="about-grid"><div><p>'
  + b("I'm Raelynn. This is where I share technical notes and projects as I build and learn.", '我是 Raelynn。这里用来分享我边做边学的技术笔记和项目。')
  + '</p><p>' + b("I care about the behavior behind the feature list: what someone sees, what happens after a click, and whether a tool fits everyday life.", '我关心功能真正用起来的样子：屏幕上能不能看见，点完以后会发生什么，以及它是否适合日常使用。')
  + '</p><a class="section-link" href="https://github.com/Voskamp099">' + b('Find me on GitHub ↗', '在 GitHub 找到我 ↗') + '</a></div><aside class="note"><h3>// '
  + b('what goes in here', '这里记录什么') + '</h3><ul><li>' + b('Projects and demos', '项目与演示') + '</li><li>' + b('Debugging notes', '调试记录') + '</li><li>' + b('Working with AI', '与 AI 协作') + '</li></ul></aside></div></div></section></main>';
await fs.writeFile('dist/index.html', layout({ titleEn: 'Raelynn — Projects & Notes', titleZh: 'Raelynn — 项目与技术笔记', description: 'Raelynn 的项目与中英文技术笔记：小工具、macOS 开发，以及和 AI 一起做东西的过程。', body: home }));
for (const post of posts) {
  const route = '/writing/' + post.slug + '/';
  const body = '<main id="main" class="wrap"><article><header class="article-header"><a class="back" href="/#writing">← '
    + b('All notes', '全部文章') + '</a><div class="article-meta"><time datetime="' + post.date + '">' + post.date + '</time> · Raelynn · '
    + b('Written with AI assistance', '与 AI 协作整理') + '</div><h1>' + b(post.title.en, post.title.zh) + '</h1><p class="article-deck">'
    + b(post.summary.en, post.summary.zh) + '</p><div class="tags">' + post.tags.map(tag => '<span>' + esc(tag) + '</span>').join('') + '</div></header><div class="article-body">'
    + '<div class="en" lang="en">' + post.html.en + '</div><div class="zh" lang="zh-CN">' + post.html.zh + '</div><div class="article-end"><a class="back" href="/#writing">← '
    + b('Back to the notebook', '回到文章列表') + '</a></div></div></article></main>';
  await fs.mkdir('dist' + route, { recursive: true });
  await fs.writeFile('dist' + route + 'index.html', layout({ titleEn: post.title.en + ' — Raelynn', titleZh: post.title.zh + ' — Raelynn', description: post.summary.zh, route, body, article: true }));
}
const notFound = '<main id="main" class="wrap"><section><div class="kicker">404</div><h1 class="sec">' + b('This page is not here.', '这一页还不存在。') + '</h1><p class="sec-sub">'
  + b('The link may have moved. Head back to the notebook.', '链接可能已经变化，回主页看看最新的文章吧。') + '</p><a class="btn btn--solid" href="/">'
  + b('Back home →', '回到主页 →') + '</a></section></main>';
await fs.writeFile('dist/404.html', layout({ titleEn: 'Page not found — Raelynn', titleZh: '页面不存在 — Raelynn', description: 'Return to Raelynn’s notebook.', route: '/404.html', body: notFound }));
await fs.writeFile('dist/.nojekyll', '');
await fs.writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + origin + '/sitemap.xml\n');
const routes = ['/', ...posts.map(post => '/writing/' + post.slug + '/')];
await fs.writeFile('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  + routes.map(route => '<url><loc>' + origin + route + '</loc></url>').join('') + '</urlset>');
await fs.writeFile('dist/feed.xml', '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Raelynn — 项目与技术笔记</title><link>' + origin
  + '</link><description>Projects, technical notes, and building with AI.</description><language>zh-CN</language>'
  + posts.map(post => '<item><title>' + esc(post.title.zh) + '</title><link>' + origin + '/writing/' + post.slug + '/</link><guid isPermaLink="true">'
    + origin + '/writing/' + post.slug + '/</guid><description>' + esc(post.summary.zh) + '</description><pubDate>' + new Date(post.date + 'T00:00:00+08:00').toUTCString() + '</pubDate></item>').join('')
  + '</channel></rss>');
console.log('Built bilingual homepage, ' + posts.length + ' articles, 404, RSS, and sitemap in dist/.');

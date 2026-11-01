import fs from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import { STATIC_PAGES } from './static-pages.mjs';

const origin = 'https://voskamp099.github.io';
const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const b = (en, zh) => '<span class="en" lang="en">' + esc(en) + '</span><span class="zh" lang="zh-CN">' + esc(zh) + '</span>';
const library = JSON.parse(await fs.readFile(path.join('content', 'tag-library.json'), 'utf8'));
const tagById = new Map(library.tags.map(tag => [tag.id, tag]));
const CATEGORY_LABELS = {
  research: { en: 'Research', zh: '研究' },
  quant: { en: 'Quant', zh: '量化' },
  ai: { en: 'AI collaboration', zh: 'AI 协作' },
  macos: { en: 'macOS', zh: 'macOS' },
  growth: { en: 'Growth', zh: '成长' }
};
const CATEGORY_ORDER = ['research', 'quant', 'ai', 'macos', 'growth'];
const categoryLabel = id => CATEGORY_LABELS[id] || null;
// A post body can ask for one or more clips with a %%VIDEO:path|path%% line.
// The markdown renderer escapes raw HTML, so the request travels as plain text
// and is turned into a video row here.
const videoRow = files => '<div class="video-row">' + files.map(file =>
  '<video controls preload="metadata" playsinline muted src="/' + file.replace(/^\//, '') + '"></video>').join('') + '</div>';
const files = (await fs.readdir('content/posts')).filter(file => file.endsWith('.json')).sort().reverse();
const posts = await Promise.all(files.map(async file => {
  const post = JSON.parse(await fs.readFile(path.join('content/posts', file), 'utf8'));
  if (!/^[a-z0-9-]+$/.test(post.slug) || !/^\d{4}-\d{2}-\d{2}$/.test(post.date)) throw new Error('Invalid post metadata: ' + file);
  const body = {};
  for (const language of ['en', 'zh']) {
    if (!post.title[language] || !post.summary[language]) throw new Error('Missing translation: ' + file);
    if (!/^[a-z0-9.-]+\.md$/.test(post.body[language])) throw new Error('Invalid body path');
    body[language] = md.render(await fs.readFile(path.join('content/posts', post.body[language]), 'utf8'))
      .replace(/<p>%%VIDEO:([^<]+)%%<\/p>/g, (match, files) => videoRow(files.split('|').map(file => file.trim()).filter(Boolean)));
  }
  const tags = post.tags.map(id => {
    const tag = tagById.get(id);
    if (!tag) throw new Error('Unknown tag "' + id + '" in ' + file);
    return tag;
  });
  if (tags.length !== library.perPost) throw new Error('Post ' + file + ' needs exactly ' + library.perPost + ' tags from content/tag-library.json');
  return { ...post, tags, html: body };
}));
await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir('dist/assets', { recursive: true });
await fs.cp('assets', 'dist/assets', { recursive: true });

for (const page of STATIC_PAGES) {
  const exists = await fs.stat(page).then(() => true).catch(() => false);
  if (exists) await fs.cp(page, 'dist/' + page);
}
const header = '<a class="skip" href="#main">' + b('Skip to content', '跳到正文') + '</a>'
  + '<header class="topbar"><a class="path" href="/">~/<b>raelynn</b> / notes</a>'
  + '<nav id="siteNav" aria-label="Main navigation">'
  + '<a href="/#writing">' + b('writing', '文章') + '</a><a href="/#projects">' + b('projects', '项目') + '</a>'
  + '<a href="/sample-of-work/">' + b('samples', '样本') + '</a><a href="/#about">' + b('about', '关于') + '</a><a href="https://github.com/Voskamp099">GitHub ↗</a></nav>'
  + '<button class="toggle" id="themeBtn" type="button" aria-label="切换到深色模式">◐</button>'
  + '<button class="toggle" id="langBtn" type="button" aria-label="Switch to English">EN</button>'
  + '<button class="toggle menu-toggle" id="menuBtn" type="button" aria-label="导航菜单" aria-controls="siteNav" aria-expanded="false">☰</button></header>';
const footer = '<footer><div class="wrap footer-row"><span>~/raelynn · ' + b('Build. Learn. Write.', '做东西，学东西，写下来。')
  + '</span><div><a href="https://github.com/Voskamp099">GitHub ↗</a><a href="/#main">' + b('Back to top ↑', '回到顶部 ↑') + '</a></div></div></footer>';
function layout({ titleEn, titleZh, description, route = '/', body, article = false, redirectTo = '' }) {
  return '<!doctype html><html lang="zh-CN" class="lang-zh theme-light" data-title-en="' + esc(titleEn) + '" data-title-zh="' + esc(titleZh)
    + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titleZh) + '</title>'
    + '<meta name="description" content="' + esc(description) + '"><meta name="author" content="Raelynn">'
    + (redirectTo ? '<meta http-equiv="refresh" content="0;url=' + esc(redirectTo) + '">' : '')
    + '<link rel="canonical" href="' + origin + route + '"><meta property="og:type" content="' + (article ? 'article' : 'website') + '">'
    + '<meta property="og:title" content="' + esc(titleZh) + '"><meta property="og:description" content="' + esc(description) + '">'
    + '<meta property="og:url" content="' + origin + route + '"><meta property="og:image" content="' + origin + '/assets/petassistant.png">'
    + '<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="Raelynn · Notes" href="/feed.xml">'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">'
    + '<link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/blog.css"><script src="/assets/site.js" defer></script></head><body>'
    + header + body + footer + '</body></html>';
}
const usedCategories = new Set(posts.flatMap(post => post.categories));
const filterButtons = ['all', ...CATEGORY_ORDER.filter(id => usedCategories.has(id))].map(id => id === 'all'
  ? '<button class="filter" data-filter="all" aria-pressed="true">' + b('All', '全部') + '</button>'
  : '<button class="filter" data-filter="' + id + '" aria-pressed="false">' + b(categoryLabel(id).en, categoryLabel(id).zh) + '</button>').join('');
const cards = posts.map(post => '<a class="article-card" data-article data-categories="' + esc(post.categories.join(' ')) + '" data-search="'
  + esc([post.title.en, post.title.zh, post.summary.en, post.summary.zh, ...post.tags.flatMap(tag => [tag.en, tag.zh])].join(' ')) + '" href="/writing/' + post.slug + '/">'
  + '<time datetime="' + post.date + '">' + post.date + '</time><div>' + (categoryLabel(post.categories[0]) ? '<span class="kind">' + b(categoryLabel(post.categories[0]).en, categoryLabel(post.categories[0]).zh) + '</span>' : '') + '<h3>' + b(post.title.en, post.title.zh) + '</h3><p>'
  + b(post.summary.en, post.summary.zh) + '</p><div class="tags">' + post.tags.map(tag => '<span>' + b(tag.en, tag.zh) + '</span>').join('')
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
  + b('From the notebook', '最近写下的') + '</h2><p class="sec-sub">' + b('Project notes, research write-ups, and lessons from building.', '项目记录、研究笔记，以及做东西过程中学到的东西。') + '</p></div></div>'
  + '<div class="article-toolbar"><label class="search-field"><span aria-hidden="true">⌕</span><span class="visually-hidden">' + b('Search articles', '搜索文章') + '</span><input id="articleSearch" type="search" placeholder="搜索标题、内容简介或标签…"></label>'
  + '<div class="filters" aria-label="Article categories">' + filterButtons + '</div></div>'
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
    + b('All notes', '全部文章') + '</a><div class="article-meta"><time datetime="' + post.date + '">' + post.date + '</time> · Raelynn</div><h1>' + b(post.title.en, post.title.zh) + '</h1><p class="article-deck">'
    + b(post.summary.en, post.summary.zh) + '</p><div class="tags">' + post.tags.map(tag => '<span>' + b(tag.en, tag.zh) + '</span>').join('') + '</div></header><div class="article-body">'
    + '<div class="en" lang="en">' + post.html.en + '</div><div class="zh" lang="zh-CN">' + post.html.zh + '</div><div class="article-end"><a class="back" href="/#writing">← '
    + b('Back to the notebook', '回到文章列表') + '</a></div></div></article></main>';
  await fs.mkdir('dist' + route, { recursive: true });
  await fs.writeFile('dist' + route + 'index.html', layout({ titleEn: post.title.en + ' — Raelynn', titleZh: post.title.zh + ' — Raelynn', description: post.summary.zh, route, body, article: true }));
}
// Keep the former debugging article URL usable after merging it into the project record.
if (posts.some(post => post.slug === 'building-petassistant')) {
  const route = '/writing/building-petassistant/';
  const body = '<main id="main" class="wrap"><section><h1 class="sec">' + b('This note is now part of the PetAssistant project.', '这篇调试笔记已合并到 PetAssistant 项目记录。')
    + '</h1><a class="btn btn--solid" href="' + route + '">' + b('Read the complete project →', '阅读完整项目记录 →') + '</a></section></main>';
  await fs.mkdir('dist/writing/swiftui-caption-state', { recursive: true });
  await fs.writeFile('dist/writing/swiftui-caption-state/index.html', layout({ titleEn: 'PetAssistant — Raelynn', titleZh: 'PetAssistant — Raelynn', description: 'Read the complete PetAssistant project record.', route, body, redirectTo: route }));
}
// The sample catalogue is a page of its own: the artefacts, one entry per
// task and one entry per generator. The articles carry the method; these
// pages carry the material, and each page can be shared on its own.
const sampleEntries = JSON.parse(await fs.readFile(path.join('content', 'v2v-task-samples.json'), 'utf8'));
const generatorEntries = JSON.parse(await fs.readFile(path.join('content', 'counterfactual-samples.json'), 'utf8'));
const appendix480 = JSON.parse(await fs.readFile(path.join('content', 'v2v-task-480-appendix.json'), 'utf8'));
for (const entry of sampleEntries) {
  if (!/^\d{3}$/.test(entry.id)) throw new Error('Invalid sample id: ' + entry.id);
  if (!entry.prompt || !entry.prompt.trim()) throw new Error('Sample ' + entry.id + ' has no prompt');
  if (!entry.prompt_zh || !entry.prompt_zh.trim()) throw new Error('Sample ' + entry.id + ' has no Chinese prompt');
  if (!entry.name_zh || !entry.title_en) throw new Error('Sample ' + entry.id + ' has no bilingual title');
  if (entry.media && !entry.media_files) throw new Error('Sample ' + entry.id + ' is marked as media but has no files');
  if (entry.media_files && !entry.posters) throw new Error('Sample ' + entry.id + ' has no poster');
}
for (const entry of generatorEntries) {
  if (!entry.id || !entry.phenomenon) throw new Error('Invalid generator entry: ' + entry.id);
  if (!entry.media_files) throw new Error('Generator ' + entry.id + ' has no media');
}
const MODALITY = {
  v2v: b('Video to Video', '视频到视频'),
  rv2v: b('Reference Video to Video', '参考视频到视频')
};
// Every clip sits in the same box on the page, so a reference asset and an
// input clip read as the same object and the frames are never cropped.
const videoFigure = (file, poster, label) => '<figure class="sample-figure"><video controls preload="metadata" playsinline muted poster="/'
  + poster.replace(/^\//, '') + '" src="/' + file.replace(/^\//, '') + '"></video><figcaption>' + label + '</figcaption></figure>';
const promptBlock = (promptEn, promptZh) => '<div class="prompt-block">'
  + '<div class="en prompt-label">Prompt</div><div class="zh prompt-label">提示词</div>'
  + '<pre class="en prompt-text" lang="en">' + esc(promptEn) + '</pre>'
  + '<pre class="zh prompt-text" lang="zh-CN">' + esc(promptZh) + '</pre></div>';
const playButton = group => '<button type="button" class="sample-play" data-play="' + group + '">'
  + b('Play together', '同时播放') + '</button>';
const sampleCard = entry => {
  const kind = MODALITY[entry.modality];
  const head = '<div class="sample-head"><span class="sample-id">' + entry.id + '</span>'
    + '<div class="sample-headtext"><h2>' + b(entry.title_en, entry.name_zh) + '</h2>'
    + '<p class="sample-slug">' + esc(entry.name) + '</p></div>'
    + '<span class="sample-kind">' + kind + '</span>' + playButton('task-' + entry.id) + '</div>';
  const description = '<p class="sample-desc">' + b(entry.description.en, entry.description.zh) + '</p>';
  let media;
  if (entry.media) {
    const reference = entry.media_files.reference
      ? '<div class="sample-row sample-row--reference">' + videoFigure(entry.media_files.reference, entry.posters.reference,
          b('Reference asset', '参考素材') + ' · ' + esc(entry.reference_files.join(', '))) + '</div>'
      : '';
    media = '<div class="sample-media">' + reference
      + '<div class="sample-row sample-row--pair">'
      + videoFigure(entry.media_files.input, entry.posters.input, b('Input', '输入'))
      + videoFigure(entry.media_files.target, entry.posters.target, b('Target', '目标'))
      + '</div></div>';
  } else {
    media = '<p class="sample-note">' + b(entry.note ? entry.note.en : '', entry.note ? entry.note.zh : '') + '</p>';
  }
  const prompt = promptBlock(entry.prompt, entry.prompt_zh);
  const facts = [];
  if (entry.frames) facts.push(entry.frames + ' frames');
  if (entry.fps) facts.push(entry.fps + ' fps');
  if (entry.resolution) facts.push(entry.resolution);
  const source = entry.source_url
    ? '<a href="' + esc(entry.source_url) + '" rel="noopener">' + esc(entry.source) + '</a>'
    : esc(entry.source);
  facts.push(b('Source: ', '来源：') + source);
  const licence = entry.licence_url
    ? '<a href="' + esc(entry.licence_url) + '" rel="noopener">' + esc(entry.licence) + '</a>'
    : esc(entry.licence);
  facts.push(b('Licence: ', '授权：') + licence);
  if (entry.citation) facts.push(b('Cite as: ', '引用：') + esc(entry.citation));
  const more = entry.id === '480'
    ? '<a class="sample-more" href="/sample-of-work/task-480/">' + b('Eight samples of this task →', '这一任务的八条样本 →') + '</a>'
    : '';
  const meta = '<p class="sample-meta">' + facts.join(' · ') + more + '</p>';
  return '<article class="sample-card" id="task-' + entry.id + '">' + head + description + media + prompt + meta + '</article>';
};
const generatorCard = entry => {
  const head = '<div class="sample-head"><span class="sample-id">' + esc(entry.id.replace(/^pr\d+-/, '')) + '</span>'
    + '<div class="sample-headtext"><h2>' + b(entry.title.en, entry.title.zh) + '</h2>'
    + '<p class="sample-slug">' + esc(entry.phenomenon) + '</p></div>'
    + '<span class="sample-kind">' + b('Counterfactual generator', '反事实生成器') + '</span></div>';
  const description = '<p class="sample-desc">' + b(entry.description.en, entry.description.zh) + '</p>';
  const media = '<div class="sample-media"><div class="sample-row sample-row--pair">'
    + videoFigure(entry.media_files.true, entry.posters.true, b('True', '真值'))
    + videoFigure(entry.media_files.counterfactual, entry.posters.counterfactual, b('Counterfactual', '反事实'))
    + '</div></div>';
  const meta = '<p class="sample-meta">' + b('Phenomenon: ', '现象标识：') + esc(entry.phenomenon) + '</p>';
  return '<article class="sample-card generator-card" id="generator-' + entry.id + '">' + head + description + media + meta + '</article>';
};
const sampleIndex = entries => '<div class="sample-index">' + entries.map(entry =>
  '<a href="#task-' + entry.id + '">' + entry.id + '</a>').join('') + '</div>';
const generatorIndex = entries => '<div class="sample-index">' + entries.map(entry =>
  '<a href="#generator-' + entry.id + '">' + entry.id.replace(/^pr\d+-/, '') + '</a>').join('') + '</div>';
const tocRow = items => '<nav class="sample-toc">' + items.map(item =>
  '<a href="' + item.href + '"><span class="n">' + item.n + '</span><span class="t">' + item.en
  + '</span><span class="tz">' + item.zh + '</span></a>').join('') + '</nav>';
const v2vTasks = sampleEntries.filter(entry => entry.modality === 'v2v');
const rv2vTasks = sampleEntries.filter(entry => entry.modality === 'rv2v');
const sampleToc = tocRow([
  { n: '01', en: 'Video to Video', zh: '视频到视频', href: '#video-to-video' },
  { n: '02', en: 'Reference Video to Video', zh: '参考视频到视频', href: '#reference-video-to-video' },
  { n: '03', en: 'Counterfactual generators', zh: '反事实生成器', href: '/counterfactual-samples/' },
  { n: 'A', en: 'Appendix — Task 480', zh: '附录——480 号任务', href: '/sample-of-work/task-480/' }
]);
const playScript = `<script>
(() => {
  const all = () => Array.from(document.querySelectorAll('main video'));
  const pause = document.getElementById('pauseAll');
  if (pause) pause.addEventListener('click', () => { for (const video of all()) video.pause(); });
  for (const button of document.querySelectorAll('[data-play]')) {
    button.addEventListener('click', () => {
      const scope = button.closest('.sample-card') || document;
      const videos = Array.from(scope.querySelectorAll('video'));
      for (const video of videos) {
        video.currentTime = 0;
        const started = video.play();
        if (started && started.catch) started.catch(() => {});
      }
    });
  }
})();
</script>`;
const sampleBody = '<main id="main" class="wrap"><header class="article-header"><a class="back" href="/#writing">← '
  + b('All notes', '全部文章') + '</a><div class="article-meta">' + b('Sample of work', '作品样本') + ' · '
  + sampleEntries.length + ' ' + b('tasks', '个任务') + ' · ' + generatorEntries.length + ' '
  + b('generators', '个生成器') + '</div><h1>' + b('Sample of work', '作品样本')
  + '</h1><p class="article-deck">' + b('One real sample per task: the videos, the prompt that defines the task, the source dataset and the licence.',
      '每个任务一条真实样本：视频、定义任务的提示词、来源数据集与授权。')
  + '</p><div class="sample-toolbar"><button type="button" id="pauseAll" class="sample-button">' + b('Pause all', '全部暂停') + '</button></div></header>'
  + sampleToc
  + '<section id="video-to-video" class="sample-section"><div class="kicker">01 — ' + b('Video to Video', '视频到视频') + '</div>'
  + '<h2 class="sec">' + b('One sample per task', '每个任务一条样本') + '</h2>'
  + '<div class="sample-list">' + sampleIndex(v2vTasks) + v2vTasks.map(sampleCard).join('') + '</div></section>'
  + '<section id="reference-video-to-video" class="sample-section"><div class="kicker">02 — ' + b('Reference Video to Video', '参考视频到视频') + '</div>'
  + '<h2 class="sec">' + b('One sample per task', '每个任务一条样本') + '</h2>'
  + '<div class="sample-list">' + sampleIndex(rv2vTasks) + rv2vTasks.map(sampleCard).join('') + '</div></section>'
  + '<section id="more-pages" class="sample-section"><div class="kicker">03 — ' + b('More pages', '更多页面') + '</div>'
  + '<h2 class="sec">' + b('The rest of the material', '剩下的材料') + '</h2>'
  + '<div class="sample-links">'
  + '<a class="sample-link" href="/counterfactual-samples/"><span>' + b('Counterfactual generators', '反事实生成器') + '</span><em>'
  + b(generatorEntries.length + ' generators, one clip pair each', generatorEntries.length + ' 个生成器，每个一条真值与反事实对照') + '</em></a>'
  + '<a class="sample-link" href="/sample-of-work/task-480/"><span>' + b('Appendix — Task 480', '附录——480 号任务') + '</span><em>'
  + b('Eight samples of one task, side by side', '同一个任务的八条样本并排比较') + '</em></a>'
  + '</div></section>'
  + '<div class="article-end"><a class="back" href="/#writing">← ' + b('Back to the notebook', '回到文章列表') + '</a></div></main>' + playScript;
await fs.mkdir('dist/sample-of-work', { recursive: true });
await fs.writeFile('dist/sample-of-work/index.html', layout({ titleEn: 'Sample of work — Raelynn', titleZh: '作品样本 — Raelynn', description: '每个视频推理任务的一条真实样本。', route: '/sample-of-work/', body: sampleBody }));
// The counterfactual generators live on their own page.
const generatorBody = '<main id="main" class="wrap"><header class="article-header"><a class="back" href="/sample-of-work/">← '
  + b('Sample of work', '作品样本') + '</a><div class="article-meta">' + b('Counterfactual generators', '反事实生成器') + ' · '
  + generatorEntries.length + ' ' + b('generators', '个生成器') + '</div><h1>' + b('Counterfactual generators', '反事实生成器')
  + '</h1><p class="article-deck">' + b('One pair of clips per generator: the true run and the counterfactual run, where one physical law is changed.',
      '每个生成器一对视频：真值一遍，反事实一遍，中间只改一条物理规律。')
  + '</p></header>'
  + tocRow([{ n: '01', en: 'Counterfactual generators', zh: '反事实生成器', href: '#generators' },
      { n: 'A', en: 'Video reasoning tasks', zh: '视频推理任务', href: '/sample-of-work/' }])
  + '<section id="generators" class="sample-section"><div class="sample-list">'
  + generatorIndex(generatorEntries) + generatorEntries.map(generatorCard).join('') + '</div></section>'
  + '<div class="article-end"><a class="back" href="/sample-of-work/">← ' + b('Back to the samples', '回到作品样本') + '</a></div></main>' + playScript;
await fs.mkdir('dist/counterfactual-samples', { recursive: true });
await fs.writeFile('dist/counterfactual-samples/index.html', layout({ titleEn: 'Counterfactual generators — Raelynn', titleZh: '反事实生成器 — Raelynn', description: '每个反事实生成器的一条真值与反事实对照样本。', route: '/counterfactual-samples/', body: generatorBody }));
// The appendix: eight samples of one task, so the variety is visible.
const appendixCard = (row, index) => '<article class="sample-card appendix-card" id="sample-' + row.index + '">'
  + '<div class="sample-head"><span class="sample-id">' + String(row.index).padStart(2, '0') + '</span>'
  + '<div class="sample-headtext"><h2>' + b('Sample ' + row.index, '样本 ' + row.index) + '</h2>'
  + '<p class="sample-slug">' + esc(row.dataset) + ' · ' + esc(row.source_sample) + '</p></div>'
  + playButton('sample-' + row.index) + '</div>'
  + '<div class="sample-media"><div class="sample-row sample-row--pair">'
  + videoFigure(row.media_files.input, row.posters.input, b('Input', '输入'))
  + videoFigure(row.media_files.target, row.posters.target, b('Target', '目标'))
  + '</div></div>'
  + '<p class="sample-meta">' + [row.resolution, row.fps + ' fps', row.frames + ' frames',
      b('Source: ', '来源：') + esc(row.dataset),
      b('Licence: ', '授权：') + '<a href="' + esc(appendix480.licence_url) + '" rel="noopener">' + esc(appendix480.licence) + '</a>',
      b('Cite as: ', '引用：') + esc(appendix480.citation)].join(' · ') + '</p></article>';
const appendixBody = '<main id="main" class="wrap"><header class="article-header"><a class="back" href="/sample-of-work/">← '
  + b('Sample of work', '作品样本') + '</a><div class="article-meta">' + b('Appendix', '附录') + ' · Task 480 · '
  + appendix480.samples.length + ' ' + b('samples', '条样本') + '</div><h1>' + b(appendix480.title.en, appendix480.title.zh)
  + '</h1><p class="article-deck">' + b(appendix480.intro.en, appendix480.intro.zh) + '</p>'
  + '<div class="sample-toolbar"><button type="button" id="pauseAll" class="sample-button">' + b('Pause all', '全部暂停') + '</button></div></header>'
  + tocRow([{ n: '01', en: 'Video to Video', zh: '视频到视频', href: '/sample-of-work/#video-to-video' },
      { n: 'A', en: 'Task 480, eight samples', zh: '480 号任务，八条样本', href: '#samples' }])
  + '<section id="samples" class="sample-section"><div class="sample-list">'
  + '<div class="sample-index">' + appendix480.samples.map(row => '<a href="#sample-' + row.index + '">'
    + String(row.index).padStart(2, '0') + '</a>').join('') + '</div>'
  + appendix480.samples.map(appendixCard).join('') + '</div></section>'
  + '<div class="article-end"><a class="back" href="/sample-of-work/">← ' + b('Back to the samples', '回到作品样本') + '</a></div></main>' + playScript;
await fs.mkdir('dist/sample-of-work/task-480', { recursive: true });
await fs.writeFile('dist/sample-of-work/task-480/index.html', layout({ titleEn: 'Appendix — Task 480 — Raelynn', titleZh: '附录——480 号任务 — Raelynn', description: '480 号任务的八条真实样本。', route: '/sample-of-work/task-480/', body: appendixBody }));
// The former address stays usable and points at the new page.
await fs.mkdir('dist/v2v-task-samples', { recursive: true });
await fs.writeFile('dist/v2v-task-samples/index.html', layout({ titleEn: 'Sample of work — Raelynn', titleZh: '作品样本 — Raelynn', description: '作品样本页。', route: '/sample-of-work/', body: '<main id="main" class="wrap"><section><h1 class="sec">' + b('This page moved to the sample of work page.', '这一页已并入作品样本页。')
  + '</h1><a class="btn btn--solid" href="/sample-of-work/">' + b('Open the sample of work page →', '打开作品样本页 →') + '</a></section></main>', redirectTo: '/sample-of-work/' }));

const notFound = '<main id="main" class="wrap"><section><div class="kicker">404</div><h1 class="sec">' + b('This page is not here.', '这一页还不存在。') + '</h1><p class="sec-sub">'
  + b('The link may have moved. Head back to the notebook.', '链接可能已经变化，回主页看看最新的文章吧。') + '</p><a class="btn btn--solid" href="/">'
  + b('Back home →', '回到主页 →') + '</a></section></main>';
await fs.writeFile('dist/404.html', layout({ titleEn: 'Page not found — Raelynn', titleZh: '页面不存在 — Raelynn', description: 'Return to Raelynn’s notebook.', route: '/404.html', body: notFound }));
await fs.writeFile('dist/.nojekyll', '');
await fs.writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + origin + '/sitemap.xml\n');
const routes = ['/', '/sample-of-work/', '/counterfactual-samples/', '/sample-of-work/task-480/', ...posts.map(post => '/writing/' + post.slug + '/')];
await fs.writeFile('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  + routes.map(route => '<url><loc>' + origin + route + '</loc></url>').join('') + '</urlset>');
await fs.writeFile('dist/feed.xml', '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Raelynn — 项目与技术笔记</title><link>' + origin
  + '</link><description>Projects, technical notes, and building with AI.</description><language>zh-CN</language>'
  + posts.map(post => '<item><title>' + esc(post.title.zh) + '</title><link>' + origin + '/writing/' + post.slug + '/</link><guid isPermaLink="true">'
    + origin + '/writing/' + post.slug + '/</guid><description>' + esc(post.summary.zh) + '</description><pubDate>' + new Date(post.date + 'T00:00:00+08:00').toUTCString() + '</pubDate></item>').join('')
  + '</channel></rss>');
console.log('Built bilingual homepage, ' + posts.length + ' articles, 404, RSS, and sitemap in dist/.');

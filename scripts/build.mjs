import fs from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import { STATIC_PAGES } from './static-pages.mjs';

const origin = 'https://voskamp099.github.io';
const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const b = (en, zh) => '<span class="en" lang="en">' + esc(en) + '</span><span class="zh" lang="zh-CN">' + esc(zh) + '</span>';
// Attributes that carry text cannot use the .en/.zh pair, because an attribute
// holds one value at a time. They ship both languages as data-attributes and
// the client picks the one that matches the visible language.
const al = (en, zh) => 'data-label-en="' + esc(en) + '" data-label-zh="' + esc(zh) + '"';
const tip = (en, zh) => 'data-tip-en="' + esc(en) + '" data-tip-zh="' + esc(zh) + '"';
const library = JSON.parse(await fs.readFile(path.join('content', 'tag-library.json'), 'utf8'));
const tagById = new Map(library.tags.map(tag => [tag.id, tag]));
const CATEGORY_LABELS = {
  research: { en: 'Research', zh: '研究' },
  quant: { en: 'Quant', zh: '量化' },
  ai: { en: 'AI collaboration', zh: 'AI 协作' },
  macos: { en: 'macOS', zh: 'macOS' },
  growth: { en: 'Growth', zh: '成长' },
  practice: { en: 'Practice', zh: '实践' }
};
const CATEGORY_ORDER = ['research', 'quant', 'ai', 'macos', 'growth', 'practice'];
const categoryLabel = id => CATEGORY_LABELS[id] || null;
// A post body can ask for one or more clips with a %%VIDEO:path|path%% line.
// The markdown renderer escapes raw HTML, so the request travels as plain text
// and is turned into a video row here.
const videoRow = files => '<div class="video-row">' + files.map(file =>
  '<video controls preload="metadata" playsinline muted src="/' + file.replace(/^\//, '') + '"></video>').join('') + '</div>';
// The delivered set of one case: the true clip, the counterfactual clip, the
// formal binary mask and the QA overlay, in one row. The caption of each
// column is the same label the review page uses, in both languages.
const panelRow = files => '<div class="panel-row">' + files.map((file, index) =>
  '<figure class="panel-cell"><video controls preload="metadata" playsinline muted src="/' + file.replace(/^\//, '') + '"></video>'
  + '<figcaption>' + [b('True', '真值'), b('Counterfactual', '反事实'), b('Formal Mask', '正式掩膜'), b('QA overlay', '审核叠加层')][index] + '</figcaption></figure>').join('') + '</div>';
const files = (await fs.readdir('content/posts')).filter(file => file.endsWith('.json')).sort().reverse();
const posts = await Promise.all(files.map(async file => {
  const post = JSON.parse(await fs.readFile(path.join('content/posts', file), 'utf8'));
  if (!/^[a-z0-9-]+$/.test(post.slug) || !/^\d{4}-\d{2}-\d{2}$/.test(post.date)) throw new Error('Invalid post metadata: ' + file);
  const body = {};
  for (const language of ['en', 'zh']) {
    if (!post.title[language] || !post.summary[language]) throw new Error('Missing translation: ' + file);
    if (!/^[a-z0-9.-]+\.md$/.test(post.body[language])) throw new Error('Invalid body path');
    body[language] = md.render(await fs.readFile(path.join('content/posts', post.body[language]), 'utf8'))
      .replace(/<p>%%VIDEO:([^<]+)%%<\/p>/g, (match, files) => videoRow(files.split('|').map(file => file.trim()).filter(Boolean)))
      .replace(/<p>%%PANELS:([^<]+)%%<\/p>/g, (match, files) => panelRow(files.split('|').map(file => file.trim()).filter(Boolean)));
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
  + '<nav id="siteNav" ' + al('Main navigation', '主导航') + '>'
  + '<a href="/#writing">' + b('writing', '文章') + '</a><a href="/#projects">' + b('projects', '项目') + '</a>'
  + '<a href="/#practice">' + b('practice', '实践') + '</a>'
  + '<a href="/sample-of-work/">' + b('samples', '样本') + '</a><a href="/#about">' + b('about', '关于') + '</a><a href="https://github.com/Voskamp099">GitHub ↗</a></nav>'
  + '<button class="toggle" id="themeBtn" type="button" ' + al('Switch to dark theme', '切换到深色模式') + '>◐</button>'
  + '<button class="toggle" id="langBtn" type="button" ' + al('Switch to Chinese', '切换到英文') + '><span aria-hidden="true">🌐</span> <span class="code">EN</span></button>'
  + '<button class="toggle card-btn" id="cardBtn" type="button" ' + al('Name card', '名片') + ' aria-haspopup="dialog" ' + tip('Name card', '名片') + '>R</button>'
  + '<button class="toggle menu-toggle" id="menuBtn" type="button" ' + al('Navigation menu', '导航菜单') + ' aria-controls="siteNav" aria-expanded="false">☰</button></header>'
  + '<div class="namecard" id="namecard" aria-hidden="true">'
  + '<div class="namecard__backdrop" data-nc-close></div>'
  + '<div class="namecard__panel" role="dialog" aria-modal="true" aria-labelledby="ncName">'
  + '<button class="namecard__close" type="button" id="ncClose" ' + al('Close the name card', '关闭名片') + '>×</button>'
  + '<div class="namecard__mono" aria-hidden="true">R</div>'
  + '<p class="namecard__name" id="ncName">Raelynn</p>'
  + '<p class="namecard__tag">' + b('learning by making', '在做东西的过程中学习') + '</p>'
  + '<p class="namecard__bio">' + b('Notes on video-reasoning research, quant experiments, and building small tools with AI.', '记录视频推理研究、量化实验，以及与 AI 协作做小工具的过程。') + '</p>'
  + '<div class="namecard__links">'
  + '<a href="https://github.com/Voskamp099" target="_blank" rel="noopener">GitHub ↗</a>'
  + '<a href="/sample-of-work/">' + b('Samples', '样本') + '</a>'
  + '<a href="/#writing">' + b('Notes', '文章') + '</a></div>'
  + '<a class="namecard__save" id="ncSave" href="#" download="raelynn.vcf">' + b('Save contact ↓', '保存联系人 ↓') + '</a>'
  + '</div></div>';
const footer = '<footer><div class="wrap footer-row"><span>~/raelynn · ' + b('Build. Learn. Write.', '做东西，学东西，写下来。')
  + '</span><div><a href="https://github.com/Voskamp099">GitHub ↗</a><a href="/#main">' + b('Back to top ↑', '回到顶部 ↑') + '</a></div></div></footer>';
function layout({ titleEn, titleZh, description, descriptionEn, route = '/', body, article = false, redirectTo = '' }) {
  const descEn = descriptionEn || description;
  return '<!doctype html><html lang="zh-CN" class="lang-zh theme-light" data-title-en="' + esc(titleEn) + '" data-title-zh="' + esc(titleZh)
    + '" data-desc-en="' + esc(descEn) + '" data-desc-zh="' + esc(description) + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titleZh) + '</title>'
    + '<meta name="description" content="' + esc(description) + '" data-content-en="' + esc(descEn) + '" data-content-zh="' + esc(description) + '"><meta name="author" content="Raelynn">'
    + (redirectTo ? '<meta http-equiv="refresh" content="0;url=' + esc(redirectTo) + '">' : '')
    + '<link rel="canonical" href="' + origin + route + '"><meta property="og:type" content="' + (article ? 'article' : 'website') + '">'
    + '<meta property="og:title" content="' + esc(titleZh) + '" data-content-en="' + esc(titleEn) + '" data-content-zh="' + esc(titleZh) + '">'
    + '<meta property="og:description" content="' + esc(description) + '" data-content-en="' + esc(descEn) + '" data-content-zh="' + esc(description) + '">'
    + '<meta property="og:url" content="' + origin + route + '"><meta property="og:image" content="' + origin + '/assets/petassistant.png">'
    + '<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="Raelynn · Notes" href="/feed.xml">'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">'
    + '<link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/blog.css">'
    // Set the language before first paint: the stored preference wins, and the
    // browser default is English. Without this the page would paint in Chinese
    // and then flip, which reads as a flash of the wrong language.
    + '<script>(function(){var r=document.documentElement,l;try{l=localStorage.getItem("raelynn-language")}catch(e){}'
    + 'if(l!=="en"&&l!=="zh"){l=(navigator.language||"en").toLowerCase().indexOf("zh")===0?"zh":"en"}'
    + 'r.classList.remove("lang-en","lang-zh");r.classList.add("lang-"+l);r.lang=l==="zh"?"zh-CN":"en";'
    + 'document.title=r.dataset[l==="zh"?"titleZh":"titleEn"];})();</script>'
    + '<script src="/assets/site.js" defer></script></head><body>'
    + header + body + footer + '</body></html>';
}
const usedCategories = new Set(posts.flatMap(post => post.categories));
// The practice areas are listed on the homepage even when no note carries the
// category yet, so the filter always offers it.
const practiceAreas = [
  {
    kind: { en: 'PRODUCT', zh: '产品' },
    title: { en: 'Product management', zh: '产品管理' },
    body: {
      en: 'Deciding what to build and what to leave out: framing the problem, cutting scope, and writing the requirement that survives contact with reality.',
      zh: '决定做什么、不做什么：定义问题、砍掉范围，写下经得起现实检验的需求。'
    },
    tags: [
      { en: 'Scoping', zh: '范围界定' },
      { en: 'Requirements', zh: '需求定义' },
      { en: 'Trade-offs', zh: '取舍' }
    ]
  },
  {
    kind: { en: 'MARKETING', zh: '市场' },
    title: { en: 'Marketing', zh: '市场营销' },
    body: {
      en: 'Getting to the sentence that makes someone try it: positioning, the message behind the feature list, and the channel that actually reaches the right person.',
      zh: '找到那句让人愿意试一试的话：定位、功能清单背后的信息，以及真正触达对的人的那个渠道。'
    },
    tags: [
      { en: 'Positioning', zh: '定位' },
      { en: 'Messaging', zh: '信息传达' },
      { en: 'Go-to-market', zh: '市场进入' }
    ]
  },
  {
    kind: { en: 'INDUSTRY', zh: '行业' },
    title: { en: 'Industry research', zh: '行业研究' },
    body: {
      en: 'Reading a market closely enough to be useful: how the players are structured, where the money moves, and which parts of the picture are still badly drawn.',
      zh: '把一个市场读到能用：参与者如何分层，钱往哪里流，以及图景里哪些部分仍然画得很糙。'
    },
    tags: [
      { en: 'Market structure', zh: '市场结构' },
      { en: 'Competitive analysis', zh: '竞争分析' },
      { en: 'Sector trends', zh: '行业趋势' }
    ]
  }
];
const filterButtons = ['all', ...CATEGORY_ORDER.filter(id => usedCategories.has(id) || id === 'practice')].map(id => id === 'all'
  ? '<button class="filter" data-filter="all" aria-pressed="true">' + b('All', '全部') + '</button>'
  : '<button class="filter" data-filter="' + id + '" aria-pressed="false">' + b(categoryLabel(id).en, categoryLabel(id).zh) + '</button>').join('');
const cards = posts.map(post => '<a class="article-card" data-article data-categories="' + esc(post.categories.join(' ')) + '" data-search="'
  + esc([post.title.en, post.title.zh, post.summary.en, post.summary.zh, ...post.tags.flatMap(tag => [tag.en, tag.zh])].join(' ')) + '" href="/writing/' + post.slug + '/">'
  + '<time datetime="' + post.date + '">' + post.date + '</time><div>' + (categoryLabel(post.categories[0]) ? '<span class="kind">' + b(categoryLabel(post.categories[0]).en, categoryLabel(post.categories[0]).zh) + '</span>' : '') + '<h3>' + b(post.title.en, post.title.zh) + '</h3><p>'
  + b(post.summary.en, post.summary.zh) + '</p><div class="tags">' + post.tags.map(tag => '<span>' + b(tag.en, tag.zh) + '</span>').join('')
  + '</div></div><span class="arrow" aria-hidden="true">↗</span></a>').join('');
const home = '<main id="main"><section class="hero"><div class="wrap hero-grid"><div>'
  + '<div class="monogram" aria-hidden="true">R</div><p class="role">' + b('Technical reports / projects / product and market work', '技术报告 / 项目 / 产品与市场') + '</p>'
  + '<h1 class="name">Raelynn<svg class="underline" viewBox="0 0 240 14" fill="none" aria-hidden="true"><path d="M2 9 C60 3,120 13,238 5" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/></svg></h1>'
  + '<h2 class="hero-title">' + b('Build things. Write things down.', '把想法做出来，把过程写下来。') + '</h2>'
  + '<p class="hero-intro">' + b('Notes from making small tools, learning how they work, and improving them through everyday use.', '记录小工具从想法到能用的过程，也记录调试、取舍和日常使用中的发现。') + '</p>'
  + '<div class="hero-cta"><a class="btn btn--solid" href="#writing">' + b('Read the notes →', '读开发笔记 →') + '</a>'
  + '<a class="btn btn--ghost" href="#projects">' + b('Explore projects ↗', '看看项目 ↗') + '</a></div></div>'
  + '<aside class="terminal" ' + al('Current notebook', '当前笔记') + '><div class="bar" aria-hidden="true"><i></i><i></i><i></i><span>notes — raelynn</span></div>'
  + '<div><span class="pr">$</span> whoami</div><div class="output">raelynn <span class="cm">/ ' + b('learning by making', '在做东西的过程中学习') + '</span></div>'
  + '<div><span class="pr">$</span> cat now.md</div><div class="output">' + b('video reasoning · counterfactuals', '视频推理 · 反事实生成') + '<br><span class="cm">' + b('research in progress — plus a quiet desktop cat', '进行中的研究 —— 外加一只安静的桌面猫') + '</span></div>'
  + '<div><span class="pr">$</span> cat process.md</div><div class="output">' + b('idea → build → test → write', '想法 → 实现 → 验证 → 记录') + '</div>'
  + '<div><span class="pr">$</span> <span class="blink" aria-hidden="true"></span></div><div class="terminal-note">' + b('A notebook for things in progress.', '把进行中的东西，慢慢记下来。') + '</div></aside></div></section>'
  + '<section id="writing"><div class="wrap"><div class="kicker">01 — ' + b('Writing', '文章') + '</div><div class="section-head"><div><h2 class="sec">'
  + b('From the notebook', '最近写下的') + '</h2><p class="sec-sub">' + b('Project notes, research write-ups, and lessons from building.', '项目记录、研究笔记，以及做东西过程中学到的东西。') + '</p></div></div>'
  + '<div class="article-toolbar"><label class="search-field"><span aria-hidden="true">⌕</span><span class="visually-hidden">' + b('Search articles', '搜索文章') + '</span><input id="articleSearch" type="search" ' + al('Search titles, summaries, or tags', '搜索标题、内容简介或标签') + '></label>'
  + '<div class="filters" ' + al('Article categories', '文章分类') + '>' + filterButtons + '</div></div>'
  + '<div class="article-list">' + cards + '</div><p class="empty-state" id="searchEmpty" hidden>' + b('No matching notes. Try another keyword or category.', '没有找到匹配的文章，试试其他关键词或分类。') + '</p><p class="search-status" id="searchCount" aria-live="polite">'
  + posts.length + ' ' + b('articles', '篇文章') + '</p></div></section>'
  + '<section id="projects"><div class="wrap"><div class="kicker">02 — ' + b('Projects', '项目') + '</div><h2 class="sec">' + b('Things taking shape', '正在做的东西') + '</h2><p class="sec-sub">'
  + b('Where research meets small tools — I care more about how something behaves in daily use than its feature list.', '研究和小工具交汇的地方 —— 比起功能清单，我更在意它真正用起来的样子。') + '</p>'
  + '<article class="project-feature"><div><div class="tags"><span>' + b('RESEARCH', '研究') + '</span><span>' + b('OMNIREASON', 'OmniReason') + '</span></div><h3>'
  + b('OmniReason', 'OmniReason') + '</h3><p>'
  + b('Video-to-video reasoning research (V2V + RV2V), with a catalogue of counterfactual generators. Every entry shows the videos, the prompt that defines the task, and its source licence.', '视频到视频推理研究（V2V + RV2V），并附一个反事实生成器目录。每条都附上视频、定义任务的提示词，以及来源许可。')
  + '</p><div class="meta"><span>' + b('Video understanding', '视频理解') + '</span><span>' + b('Counterfactuals', '反事实') + '</span><span>' + b('Datasets', '数据集') + '</span></div><a class="section-link" href="/sample-of-work/omni-reason/">'
  + b('Explore the catalogue →', '浏览样本目录 →') + '</a></div><figure><div class="project-glyph" aria-hidden="true">▶</div><figcaption>'
  + b('One page per task.', '每个任务一页。') + '</figcaption></figure></article>'
  + '<article class="project-secondary"><div class="ps-head"><div class="tags"><span>' + b('macOS', 'macOS') + '</span><span>' + b('SIDE PROJECT', '小项目') + '</span></div><h3>PetAssistant</h3></div><p>'
  + b('A quiet desktop cat that reads my calendar once, then stays put. Built collaboratively with AI.', '一只安静的桌面猫，读一次日程就待在原地。和 AI 一起做的。')
  + '</p><a class="section-link" href="/writing/building-petassistant/">' + b('Read the build story →', '读项目记录 →') + '</a></article>'
  + '</div></section>'
  + '<section id="practice"><div class="wrap"><div class="kicker">03 — ' + b('Practice', '实践') + '</div><h2 class="sec">'
  + b('Beyond the technical work', '技术之外的那一部分') + '</h2><p class="sec-sub">'
  +       b('Most of this site is technical reporting. Some of it is not: the product, go-to-market and market-structure work that sits around the engineering. I write these up the same way — what was decided, and why.',
      '这个站点大部分是技术报告，也有一些不是：围绕工程之外的产品、市场与行业结构工作。我用同样的方式记录——决定了什么，以及为什么。')
  + '</p><div class="practice-grid">'
  + practiceAreas.map(area => '<article class="practice-card" data-categories="practice">'
    + '<div class="practice-head"><span class="practice-kind">' + b(area.kind.en, area.kind.zh) + '</span><h3>' + b(area.title.en, area.title.zh) + '</h3></div>'
    + '<p>' + b(area.body.en, area.body.zh) + '</p>'
    + '<div class="practice-tags">' + area.tags.map(tag => '<span>' + b(tag.en, tag.zh) + '</span>').join('') + '</div>'
    + '</article>').join('')
  + '</div><p class="practice-note">' + b('These are working areas, not case studies yet. When something reaches a stage worth writing down, it moves up into the notes above.',
      '这些是正在进行的方向，还不是案例。等某件事进展到值得写下来的程度，就会移到上面的文章里。') + '</p></div></section>'
  + '<section id="about"><div class="wrap"><div class="kicker">04 — ' + b('About', '关于') + '</div><h2 class="sec">' + b('A place to think in public', '给做东西的过程留一个地方') + '</h2><div class="about-grid"><div><p>'
  + b("I'm Raelynn. This is where I share technical notes and projects as I build and learn.", '我是 Raelynn。这里用来分享我边做边学的技术笔记和项目。')
  + '</p><p>' + b("I care about the behavior behind the feature list: what someone sees, what happens after a click, and whether a tool fits everyday life.", '我关心功能真正用起来的样子：屏幕上能不能看见，点完以后会发生什么，以及它是否适合日常使用。')
  + '</p><a class="section-link" href="https://github.com/Voskamp099">' + b('Find me on GitHub ↗', '在 GitHub 找到我 ↗') + '</a></div><aside class="note"><h3>// '
  + b('what goes in here', '这里记录什么') + '</h3><ul><li>' + b('Projects and demos', '项目与演示') + '</li><li>' + b('Debugging notes', '调试记录') + '</li><li>' + b('Working with AI', '与 AI 协作') + '</li><li>' + b('Product, marketing, industry', '产品、市场与行业') + '</li></ul></aside></div></div></section></main>';
await fs.writeFile('dist/index.html', layout({ titleEn: 'Raelynn — Projects & Notes', titleZh: 'Raelynn — 项目与技术笔记', description: 'Raelynn 的项目与中英文技术笔记：小工具、macOS 开发，以及和 AI 一起做东西的过程。', descriptionEn: 'Raelynn\u2019s projects and bilingual technical notes: small tools, macOS work, and building with AI.', body: home }));
for (const post of posts) {
  const route = '/writing/' + post.slug + '/';
  const body = '<main id="main" class="wrap"><article><header class="article-header"><a class="back" href="/#writing">← '
    + b('All notes', '全部文章') + '</a><div class="article-meta"><time datetime="' + post.date + '">' + post.date + '</time> · Raelynn</div><h1>' + b(post.title.en, post.title.zh) + '</h1><p class="article-deck">'
    + b(post.summary.en, post.summary.zh) + '</p><div class="tags">' + post.tags.map(tag => '<span>' + b(tag.en, tag.zh) + '</span>').join('') + '</div></header><div class="article-body">'
    + '<div class="en" lang="en">' + post.html.en + '</div><div class="zh" lang="zh-CN">' + post.html.zh + '</div><div class="article-end"><a class="back" href="/#writing">← '
    + b('Back to the notebook', '回到文章列表') + '</a></div></div></article></main>';
  await fs.mkdir('dist' + route, { recursive: true });
  await fs.writeFile('dist' + route + 'index.html', layout({ titleEn: post.title.en + ' — Raelynn', titleZh: post.title.zh + ' — Raelynn', description: post.summary.zh, descriptionEn: post.summary.en, route, body, article: true }));
}
// Keep the former debugging article URL usable after merging it into the project record.
if (posts.some(post => post.slug === 'building-petassistant')) {
  const route = '/writing/building-petassistant/';
  const body = '<main id="main" class="wrap"><section><h1 class="sec">' + b('This note is now part of the PetAssistant project.', '这篇调试笔记已合并到 PetAssistant 项目记录。')
    + '</h1><a class="btn btn--solid" href="' + route + '">' + b('Read the complete project →', '阅读完整项目记录 →') + '</a></section></main>';
  await fs.mkdir('dist/writing/swiftui-caption-state', { recursive: true });
  await fs.writeFile('dist/writing/swiftui-caption-state/index.html', layout({ titleEn: 'PetAssistant — Raelynn', titleZh: 'PetAssistant 项目记录 — Raelynn', description: '阅读完整的 PetAssistant 项目记录。', descriptionEn: 'Read the complete PetAssistant project record.', route, body, redirectTo: route }));
}
// The sample catalogue is a directory: /sample-of-work/ lists every task and
// every counterfactual generator, and each entry opens on a page of its own.
// The articles carry the method; these pages carry the material.
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
const slugOf = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const taskPath = entry => '/sample-of-work/task-' + entry.id + '/';
const generatorPath = entry => '/sample-of-work/generator-' + slugOf(entry.id) + '/';
// Every clip sits in the same box on the page, so a reference asset and an
// input clip read as the same object and the frames are never cropped.
const videoFigure = (file, poster, label) => '<figure class="sample-figure"><video controls preload="metadata" playsinline muted poster="/'
  + poster.replace(/^\//, '') + '" src="/' + file.replace(/^\//, '') + '"></video><figcaption>' + label + '</figcaption></figure>';
const promptBlock = (promptEn, promptZh) => '<div class="prompt-block">'
  + '<div class="en prompt-label">Prompt</div><div class="zh prompt-label">提示词</div>'
  + '<pre class="en prompt-text" lang="en">' + esc(promptEn) + '</pre>'
  + '<pre class="zh prompt-text" lang="zh-CN">' + esc(promptZh) + '</pre></div>';
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
const mediaBlock = entry => {
  if (!entry.media) return '<p class="sample-note">' + b(entry.note ? entry.note.en : '', entry.note ? entry.note.zh : '') + '</p>';
  const reference = entry.media_files.reference
    ? '<div class="sample-row sample-row--reference">' + videoFigure(entry.media_files.reference, entry.posters.reference,
        b('Reference asset', '参考素材') + ' · ' + esc(entry.reference_files.join(', '))) + '</div>'
    : '';
  return '<div class="sample-media">' + reference + '<div class="sample-row sample-row--pair">'
    + videoFigure(entry.media_files.input, entry.posters.input, b('Input', '输入'))
    + videoFigure(entry.media_files.target, entry.posters.target, b('Target', '目标'))
    + '</div></div>';
};
const factLine = entry => {
  const facts = [];
  if (entry.frames) facts.push(entry.frames + ' ' + b('frames', '帧'));
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
  return facts.join(' · ');
};
// One page per task.
const taskPage = entry => {
  const head = '<header class="article-header"><a class="back" href="/sample-of-work/omni-reason/#task-' + entry.id + '">← '
    + b('OmniReason', 'OmniReason') + '</a><div class="article-meta">' + b('Task', '任务') + ' ' + entry.id + ' · ' + MODALITY[entry.modality]
    + '</div><h1>' + b(entry.title_en, entry.name_zh) + '</h1>'
    + '<p class="sample-slug">' + esc(entry.name) + '</p>'
    + '<p class="article-deck">' + b(entry.description.en, entry.description.zh) + '</p></header>'
    + '<div class="sample-toolbar"><button type="button" class="sample-button" data-play="task-' + entry.id + '">'
    + b('Play together', '同时播放') + '</button>'
    + '<button type="button" id="pauseAll" class="sample-button">' + b('Pause all', '全部暂停') + '</button></div>'
    + '<article class="sample-card" id="task-' + entry.id + '">'
    + mediaBlock(entry)
    + promptBlock(entry.prompt, entry.prompt_zh)
    + '<p class="sample-meta">' + factLine(entry) + '</p>'
    + (entry.id === '480'
      ? '<p class="sample-meta"><a class="sample-more" href="/sample-of-work/appendix-task-480/">'
        + b('Eight samples of this task →', '这一任务的八条样本 →') + '</a></p>'
      : '')
    + '</article>'
    + '<div class="article-end"><a class="back" href="/sample-of-work/omni-reason/">← ' + b('Back to OmniReason', '回到 OmniReason') + '</a></div>';
  return layout({ titleEn: entry.title_en + ' — Raelynn', titleZh: entry.name_zh + ' — Raelynn',
    description: entry.description.zh, descriptionEn: entry.description.en, route: taskPath(entry), body: '<main id="main" class="wrap">' + head + '</main>' + playScript });
};
// One page per counterfactual generator.
// The videos show the true clip and the counterfactual one. The four-panel
// figure adds what the videos cannot: the binary mask the generator applied
// and the QA overlay marking the region it changed, so the change can be
// read directly instead of inferred by watching the two clips side by side.
const generatorPage = entry => {
  // A generator that reached main carries the delivered four-stream set, and
  // the page shows all four in one row: the true clip, the counterfactual
  // clip, the formal binary mask and the QA overlay.
  const PANEL_LABELS = [b('True', '真值'), b('Counterfactual', '反事实'),
    b('Formal Mask', '正式掩膜'), b('QA overlay', '审核叠加层')];
  const panelStream = entry.panels && entry.media_files.mask && entry.media_files.overlay
    ? '<div class="sample-row sample-row--quad">'
      + entry.panels.map((panel, index) => videoFigure(entry.media_files[panel], entry.posters[panel], PANEL_LABELS[index])).join('')
      + '</div>'
    : '<div class="sample-row sample-row--pair">'
      + videoFigure(entry.media_files.true, entry.posters.true, b('True', '真值'))
      + videoFigure(entry.media_files.counterfactual, entry.posters.counterfactual, b('Counterfactual', '反事实'))
      + '</div>';
  const media = '<div class="sample-media">' + panelStream + '</div>';
  const panels = entry.figure
    ? '<figure class="sample-panels"><img src="/' + entry.figure.replace(/^\//, '') + '" alt="'
      + esc('Four panels for the same clip: the true frame, the counterfactual frame, the binary mask the generator applied, and the QA overlay marking the changed region.')
      + '" data-alt-en="'
      + esc('Four panels for the same clip: the true frame, the counterfactual frame, the binary mask the generator applied, and the QA overlay marking the changed region.')
      + '" data-alt-zh="' + esc('同一个片段的四格对照：真值画面、反事实画面、生成器施加的二值掩膜，以及标出变化区域的审核叠加层。')
      + '" loading="lazy"><figcaption>'
      + b('True · Counterfactual · Mask · QA overlay', '真值 · 反事实 · 掩膜 · 审核叠加层')
      + '</figcaption></figure>'
    : '';
  const head = '<header class="article-header"><a class="back" href="/sample-of-work/counterfactuals/#generator-' + entry.id + '">← '
    + b('Counterfactual generators', '反事实生成器') + '</a><div class="article-meta">' + b('Counterfactual generator', '反事实生成器')
    + '</div><h1>' + b(entry.title.en, entry.title.zh) + '</h1>'
    + '<p class="sample-slug">' + esc(entry.phenomenon) + '</p>'
    + '<p class="article-deck">' + b(entry.description.en, entry.description.zh) + '</p></header>'
    + '<div class="sample-toolbar"><button type="button" class="sample-button" data-play="generator-' + entry.id + '">'
    + b('Play together', '同时播放') + '</button>'
    + '<button type="button" id="pauseAll" class="sample-button">' + b('Pause all', '全部暂停') + '</button></div>'
    + '<article class="sample-card generator-card" id="generator-' + entry.id + '">'
    + media
    + panels
    + '<p class="sample-meta">' + b('Phenomenon: ', '现象标识：') + esc(entry.phenomenon) + '</p>'
    + '</article>'
    + '<div class="article-end"><a class="back" href="/sample-of-work/counterfactuals/">← ' + b('Back to the generators', '回到生成器列表') + '</a></div>';
  return layout({ titleEn: entry.title.en + ' — Raelynn', titleZh: entry.title.zh + ' — Raelynn',
    description: entry.description.zh, descriptionEn: entry.description.en, route: generatorPath(entry), body: '<main id="main" class="wrap">' + head + '</main>' + playScript });
};
// The directory rows are the same list as the writing section: a code on the
// left, a chip, a title, one line of description, and a chip row.
// chip is either plain text (a slug, escaped here) or ready-made HTML (a
// bilingual pair), so callers pass { raw: true } for the latter.
const directoryRow = (href, id, lead, kind, title, description, chip, cat = '', raw = false) => '<a class="article-card" href="' + href + '" id="' + id + (cat ? '" data-categories="' + cat + '"' : '') + '">'
  + '<span class="lead">' + esc(lead) + '</span><div><span class="kind">' + kind + '</span>'
  + '<h3>' + title + '</h3><p>' + description + '</p>'
  + '<div class="tags"><span>' + (raw ? chip : esc(chip)) + '</span></div></div>'
  + '<span class="arrow" aria-hidden="true">↗</span></a>';
const taskDirectoryRow = entry => directoryRow(taskPath(entry), 'task-' + entry.id, entry.id,
  MODALITY[entry.modality], b(entry.title_en, entry.name_zh), b(entry.description.en, entry.description.zh), entry.name, entry.modality);
const generatorDirectoryRow = entry => directoryRow(generatorPath(entry), 'generator-' + entry.id,
  entry.id.replace(/^case/, ''), b('Counterfactual generator', '反事实生成器'),
  b(entry.title.en, entry.title.zh), b(entry.description.en, entry.description.zh), entry.phenomenon, 'counterfactual');
const v2vTasks = sampleEntries.filter(entry => entry.modality === 'v2v');
const rv2vTasks = sampleEntries.filter(entry => entry.modality === 'rv2v');
// The catalogue is a table of contents, not a long scroll: the index lists the
// three collections, and each collection opens on a page of its own.
// The collections are listed the same way the entries inside them are: one
// card per row, stacked vertically. A horizontal strip of three tiles reads
// like a banner rather than like a directory.
const collectionRow = (href, id, lead, kind, title, description, chip, cat, count) => directoryRow(href, id, lead, kind, title, description, chip, cat, true)
  .replace('</div></div><span class="arrow"', '<span class="count">' + count + '</span></div></div><span class="arrow"');
const sampleToc = '<div class="sample-directory">'
  + collectionRow('/sample-of-work/omni-reason/', 'collection-omni-reason', '01',
      b('Video reasoning', '视频推理'), b('OmniReason', 'OmniReason'),
      b('Video-to-video reasoning tasks. Each task carries an input, a target, and the prompt that defines it, in two modalities: Video to Video and Reference Video to Video.',
        '视频到视频推理任务。每个任务都带输入、目标，以及定义它的提示词，分两种模态：视频到视频与参考视频到视频。'),
      esc('v2v · rv2v'), 'research', sampleEntries.length + ' ' + b('tasks', '个任务'))
  + collectionRow('/sample-of-work/counterfactuals/', 'collection-counterfactuals', '02',
      b('Counterfactual', '反事实'), b('Counterfactual generators', '反事实生成器'),
      b('One sample per generator: the true clip beside the counterfactual one, so the change the generator introduces is visible at a glance.',
        '每个生成器一条样本：真值片段与反事实片段并排，让生成器引入的变化一眼可见。'),
      b('Counterfactual', '反事实'), 'counterfactual', generatorEntries.length + ' ' + b('generators', '个生成器'))
  + collectionRow('/sample-of-work/appendix-task-480/', 'collection-appendix', 'A',
      b('Appendix', '附录'), b('Appendix — Task 480', '附录——480 号任务'),
      b('Eight samples of one task, from eight different source frames, side by side.',
        '同一个任务的八条样本，来自八个不同的源画面，并排比较。'),
      esc('cave_video_commonsense_anomaly_localization'), 'appendix', appendix480.samples.length + ' ' + b('samples', '条样本'))
  + '</div>';
const directoryBody = '<main id="main" class="wrap"><header class="article-header"><a class="back" href="/#writing">← '
  + b('All notes', '全部文章') + '</a><div class="article-meta">' + b('Sample directory', '样本目录') + ' · '
  + sampleEntries.length + ' ' + b('tasks', '个任务') + ' · ' + generatorEntries.length + ' '
  + b('generators', '个生成器') + '</div><h1>' + b('Sample of work', '作品样本')
  + '</h1><p class="article-deck">' + b('A catalogue in three collections. Each collection opens on its own page, and every task inside it opens on a page of its own: the videos, the prompt that defines the task, the source dataset and the licence.',
      '一份分成三个集合的目录。每个集合点开是独立的一页，集合里的每个任务再点开又是独立的一页：视频、定义任务的提示词、来源数据集与授权。')
  + '</p></header>' + sampleToc
  // The collections used to be anchors on this page. Keep the ids so old
  // links still resolve, and send them to the collection that replaced them.
  + '<div class="sample-legacy"><span id="omni-reason"></span><span id="generators"></span></div>'
  + '<div class="article-end"><a class="back" href="/#writing">← ' + b('Back to the notebook', '回到文章列表') + '</a></div></main>';
await fs.mkdir('dist/sample-of-work', { recursive: true });
await fs.writeFile('dist/sample-of-work/index.html', layout({ titleEn: 'Sample of work — Raelynn', titleZh: '作品样本 — Raelynn', description: '视频推理任务与反事实生成器的样本目录，每条一个页面。', descriptionEn: 'A directory of video-reasoning tasks and counterfactual generators, one entry per page.', route: '/sample-of-work/', body: directoryBody }));
// Collection pages: each holds its own list, and every row still leads to a
// page of its own.
const collectionHeader = (back, meta, title, deck) => '<main id="main" class="wrap"><header class="article-header"><a class="back" href="'
  + back + '">← ' + b('Sample directory', '样本目录') + '</a><div class="article-meta">' + meta + '</div><h1>' + title
  + '</h1><p class="article-deck">' + deck + '</p></header>';
const omniReasonBody = collectionHeader('/sample-of-work/',
    b('Collection 01', '集合 01') + ' · ' + b('OmniReason', 'OmniReason') + ' · ' + sampleEntries.length + ' ' + b('tasks', '个任务'),
    b('OmniReason', 'OmniReason'),
    b('Video-to-video reasoning: each task carries an input, a target, and the prompt that defines it. Two modalities — Video to Video and Reference Video to Video. Pick a task to open it on its own page.',
        '视频到视频推理：每个任务都带输入、目标，以及定义它的提示词。两种模态——视频到视频与参考视频到视频。点开任意一个任务即是它自己的一页。'))
  + '<section class="sample-section"><div class="sample-directory">' + v2vTasks.map(taskDirectoryRow).join('') + rv2vTasks.map(taskDirectoryRow).join('') + '</div></section>'
  + '<div class="article-end"><a class="back" href="/sample-of-work/">← ' + b('Back to the directory', '回到目录') + '</a></div></main>';
await fs.mkdir('dist/sample-of-work/omni-reason', { recursive: true });
await fs.writeFile('dist/sample-of-work/omni-reason/index.html', layout({ titleEn: 'OmniReason — Raelynn', titleZh: 'OmniReason 视频推理样本 — Raelynn', description: '视频到视频推理任务样本目录，每条一个页面。', descriptionEn: 'A directory of video-to-video reasoning tasks, one entry per page.', route: '/sample-of-work/omni-reason/', body: omniReasonBody }));
const counterfactualBody = collectionHeader('/sample-of-work/',
    b('Collection 02', '集合 02') + ' · ' + b('Counterfactual generators', '反事实生成器') + ' · ' + generatorEntries.length + ' ' + b('generators', '个生成器'),
    b('Counterfactual generators', '反事实生成器'),
    b('One sample per generator: the true clip beside the counterfactual one, so the change the generator introduces is visible at a glance. Pick a generator to open it on its own page.',
        '每个生成器一条样本：真值片段与反事实片段并排，让生成器引入的变化一眼可见。点开任意一个生成器即是它自己的一页。'))
  + '<section class="sample-section"><div class="sample-directory">' + generatorEntries.map(generatorDirectoryRow).join('') + '</div></section>'
  + '<div class="article-end"><a class="back" href="/sample-of-work/">← ' + b('Back to the directory', '回到目录') + '</a></div></main>';
await fs.mkdir('dist/sample-of-work/counterfactuals', { recursive: true });
await fs.writeFile('dist/sample-of-work/counterfactuals/index.html', layout({ titleEn: 'Counterfactual generators — Raelynn', titleZh: '反事实生成器 — Raelynn', description: '反事实生成器样本目录，每条一个页面。', descriptionEn: 'A directory of counterfactual generators, one entry per page.', route: '/sample-of-work/counterfactuals/', body: counterfactualBody }));
for (const entry of sampleEntries) {
  const target = path.join('dist', taskPath(entry).replace(/^\//, ''), 'index.html');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, taskPage(entry));
}
for (const entry of generatorEntries) {
  const target = path.join('dist', generatorPath(entry).replace(/^\//, ''), 'index.html');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, generatorPage(entry));
}
// The appendix: eight samples of one task, so the variety is visible.
const appendixCard = row => '<article class="sample-card appendix-card" id="sample-' + row.index + '">'
  + '<div class="sample-row sample-row--pair">'
  + videoFigure(row.media_files.input, row.posters.input, b('Input', '输入'))
  + videoFigure(row.media_files.target, row.posters.target, b('Target', '目标'))
  + '</div>'
  + '<p class="sample-meta">' + [row.resolution, row.fps + ' fps', row.frames + ' ' + b('frames', '帧'),
      b('Source: ', '来源：') + esc(row.dataset),
      b('Licence: ', '授权：') + '<a href="' + esc(appendix480.licence_url) + '" rel="noopener">' + esc(appendix480.licence) + '</a>',
      b('Cite as: ', '引用：') + esc(appendix480.citation)].join(' · ') + '</p></article>';
const appendixBody = '<main id="main" class="wrap"><header class="article-header"><a class="back" href="/sample-of-work/">← '
  + b('Sample directory', '样本目录') + '</a><div class="article-meta">' + b('Appendix', '附录') + ' · ' + b('Task', '任务') + ' 480 · '
  + appendix480.samples.length + ' ' + b('samples', '条样本') + '</div><h1>' + b(appendix480.title.en, appendix480.title.zh)
  + '</h1><p class="article-deck">' + b(appendix480.intro.en, appendix480.intro.zh) + '</p>'
  + '<div class="sample-toolbar"><button type="button" id="pauseAll" class="sample-button">' + b('Pause all', '全部暂停') + '</button></div></header>'
  + '<section id="samples" class="sample-section"><div class="sample-list">'
  + appendix480.samples.map(appendixCard).join('') + '</div></section>'
  + '<div class="article-end"><a class="back" href="/sample-of-work/">← ' + b('Back to the directory', '回到目录') + '</a></div></main>' + playScript;
await fs.mkdir('dist/sample-of-work/appendix-task-480', { recursive: true });
await fs.writeFile('dist/sample-of-work/appendix-task-480/index.html', layout({ titleEn: 'Appendix — Task 480 — Raelynn', titleZh: '附录——480 号任务 — Raelynn', description: '480 号任务的八条真实样本。', descriptionEn: 'Eight real samples of task 480.', route: '/sample-of-work/appendix-task-480/', body: appendixBody }));
// The former generator page points at the generator collection.
await fs.mkdir('dist/counterfactual-samples', { recursive: true });
await fs.writeFile('dist/counterfactual-samples/index.html', layout({ titleEn: 'Counterfactual generators — Raelynn', titleZh: '反事实生成器 — Raelynn', description: '反事实生成器样本目录。', descriptionEn: 'A directory of counterfactual generator samples.', route: '/sample-of-work/counterfactuals/', body: '<main id="main" class="wrap"><section><h1 class="sec">'
  + b('The generators now live in the sample directory.', '生成器样本已并入作品样本目录。')
  + '</h1><a class="btn btn--solid" href="/sample-of-work/counterfactuals/">' + b('Open the generator list →', '打开生成器列表 →') + '</a></section></main>', redirectTo: '/sample-of-work/counterfactuals/' }));
// The former address stays usable and points at the directory.
await fs.mkdir('dist/v2v-task-samples', { recursive: true });
await fs.writeFile('dist/v2v-task-samples/index.html', layout({ titleEn: 'Sample of work — Raelynn', titleZh: '作品样本 — Raelynn', description: '作品样本页。', descriptionEn: 'The sample of work page.', route: '/sample-of-work/', body: '<main id="main" class="wrap"><section><h1 class="sec">' + b('This page moved to the sample directory.', '这一页已并入作品样本目录。')
  + '</h1><a class="btn btn--solid" href="/sample-of-work/">' + b('Open the sample directory →', '打开作品样本目录 →') + '</a></section></main>', redirectTo: '/sample-of-work/' }));
const sampleRoutes = ['/sample-of-work/', '/sample-of-work/omni-reason/', '/sample-of-work/counterfactuals/',
  '/sample-of-work/appendix-task-480/',
  ...sampleEntries.map(taskPath), ...generatorEntries.map(generatorPath)];

const notFound = '<main id="main" class="wrap"><section><div class="kicker">404</div><h1 class="sec">' + b('This page is not here.', '这一页还不存在。') + '</h1><p class="sec-sub">'
  + b('The link may have moved. Head back to the notebook.', '链接可能已经变化，回主页看看最新的文章吧。') + '</p><a class="btn btn--solid" href="/">'
  + b('Back home →', '回到主页 →') + '</a></section></main>';
await fs.writeFile('dist/404.html', layout({ titleEn: 'Page not found — Raelynn', titleZh: '页面不存在 — Raelynn', description: '回到 Raelynn 的笔记。', descriptionEn: 'Return to Raelynn’s notebook.', route: '/404.html', body: notFound }));
await fs.writeFile('dist/.nojekyll', '');
await fs.writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + origin + '/sitemap.xml\n');
const routes = ['/', ...sampleRoutes, ...posts.map(post => '/writing/' + post.slug + '/')];
await fs.writeFile('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  + routes.map(route => '<url><loc>' + origin + route + '</loc></url>').join('') + '</urlset>');
await fs.writeFile('dist/feed.xml', '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Raelynn — 项目与技术笔记</title><link>' + origin
  + '</link><description>Projects, technical notes, and building with AI.</description><language>zh-CN</language>'
  + posts.map(post => '<item><title>' + esc(post.title.zh) + '</title><link>' + origin + '/writing/' + post.slug + '/</link><guid isPermaLink="true">'
    + origin + '/writing/' + post.slug + '/</guid><description>' + esc(post.summary.zh) + '</description><pubDate>' + new Date(post.date + 'T00:00:00+08:00').toUTCString() + '</pubDate></item>').join('')
  + '</channel></rss>');
console.log('Built bilingual homepage, ' + posts.length + ' articles, 404, RSS, and sitemap in dist/.');

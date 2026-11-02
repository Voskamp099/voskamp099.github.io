(() => {
  const root = document.documentElement;
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const languageButton = document.getElementById('langBtn');
  const themeButton = document.getElementById('themeBtn');
  const menuButton = document.getElementById('menuBtn');
  const nav = document.getElementById('siteNav');
  const search = document.getElementById('articleSearch');
  const count = document.getElementById('searchCount');
  const cards = [...document.querySelectorAll('[data-article]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  let category = 'all';
  let language = read('raelynn-language') || (navigator.language.startsWith('zh') ? 'zh' : 'en');
  let theme = read('raelynn-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  function updateSearch() {
    const query = (search?.value || '').trim().toLocaleLowerCase();
    let visible = 0;
    for (const card of cards) {
      const match = (!query || card.dataset.search.toLocaleLowerCase().includes(query))
        && (category === 'all' || card.dataset.categories.split(' ').includes(category));
      card.hidden = !match;
      if (match) visible++;
    }
    if (count) count.textContent = language === 'zh' ? visible + ' 篇文章' : visible + (visible === 1 ? ' article' : ' articles');
    const empty = document.getElementById('searchEmpty');
    if (empty) empty.hidden = visible !== 0;
  }
  function render() {
    root.classList.remove('lang-en', 'lang-zh', 'theme-light', 'theme-dark');
    root.classList.add('lang-' + language, 'theme-' + theme);
    root.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = root.dataset[language === 'zh' ? 'titleZh' : 'titleEn'];
    // The button shows the language code currently in use. Both codes are
    // Latin, so an English page and a Chinese page each show only Latin
    // characters, and the accessible name says "switch language" in the
    // language currently on screen.
    languageButton.textContent = language === 'zh' ? 'ZH' : 'EN';
    languageButton.setAttribute('title', language === 'zh' ? '切换语言' : 'Switch language');
    languageButton.setAttribute('aria-label', language === 'zh' ? '切换语言' : 'Switch language');
    themeButton.textContent = theme === 'dark' ? '☀' : '◐';
    themeButton.setAttribute('aria-label', language === 'zh'
      ? (theme === 'dark' ? '切换到浅色模式' : '切换到深色模式')
      : (theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'));
    // Attributes cannot carry the .en/.zh pair, so the build ships both
    // languages as data-attributes and this writes the visible one in.
    for (const element of document.querySelectorAll('[data-label-en][data-label-zh]')) {
      element.setAttribute('aria-label', element.dataset[language === 'zh' ? 'labelZh' : 'labelEn']);
    }
    for (const element of document.querySelectorAll('[data-tip-en][data-tip-zh]')) {
      element.setAttribute('title', element.dataset[language === 'zh' ? 'tipZh' : 'tipEn']);
    }
    // An image alt is one string, so the Chinese wording ships alongside and
    // is written in when the page is in Chinese.
    for (const element of document.querySelectorAll('img[alt][data-alt-zh]')) {
      if (!element.dataset.altEn) element.dataset.altEn = element.getAttribute('alt');
      element.setAttribute('alt', language === 'zh' ? element.dataset.altZh : element.dataset.altEn);
    }
    for (const element of document.querySelectorAll('meta[data-content-en][data-content-zh]')) {
      element.setAttribute('content', element.dataset[language === 'zh' ? 'contentZh' : 'contentEn']);
    }
    if (search) search.setAttribute('placeholder', language === 'zh' ? '搜索标题、内容简介或标签…' : 'Search titles, summaries, or tags…');
    if (menuButton) menuButton.setAttribute('aria-label', language === 'zh' ? '导航菜单' : 'Navigation menu');
    updateSearch();
  }
  languageButton.addEventListener('click', () => {
    language = language === 'zh' ? 'en' : 'zh';
    save('raelynn-language', language);
    render();
  });
  themeButton.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    save('raelynn-theme', theme);
    render();
  });
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  function closeMenu() {
    menuButton?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
  }
  nav?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  search?.addEventListener('input', updateSearch);
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    updateSearch();
  }));
  if (!['zh', 'en'].includes(language)) language = 'zh';
  if (!['light', 'dark'].includes(theme)) theme = 'light';
  render();
})();

// ---- name card modal ----
(() => {
  const btn = document.getElementById('cardBtn');
  const modal = document.getElementById('namecard');
  if (!btn || !modal) return;
  const closeBtn = modal.querySelector('#ncClose');
  const backdrop = modal.querySelector('[data-nc-close]');
  const saveBtn = document.getElementById('ncSave');
  const vcard = [
    'BEGIN:VCARD', 'VERSION:3.0',
    'FN:Raelynn', 'N:Raelynn;;;;',
    'TITLE:learning by making',
    'URL:https://voskamp099.github.io/',
    'URL:https://github.com/Voskamp099',
    'NOTE:Notes on video-reasoning research, quant experiments, and building small tools with AI.',
    'END:VCARD'
  ].join('\r\n');
  if (saveBtn) saveBtn.href = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(vcard);
  let lastFocus = null;
  const open = () => {
    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    closeBtn?.focus();
  };
  const close = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    lastFocus?.focus();
  };
  btn.addEventListener('click', () => modal.classList.contains('open') ? close() : open());
  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
})();

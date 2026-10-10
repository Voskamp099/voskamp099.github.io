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
    languageButton.textContent = language === 'zh' ? 'EN' : '中文';
    languageButton.setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换到中文');
    themeButton.textContent = theme === 'dark' ? '☀' : '◐';
    themeButton.setAttribute('aria-label', language === 'zh'
      ? (theme === 'dark' ? '切换到浅色模式' : '切换到深色模式')
      : (theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'));
    search?.setAttribute('placeholder', language === 'zh' ? '搜索标题、内容简介或标签…' : 'Search titles, summaries, or tags…');
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

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
    // The button names the language it switches to, which is the convention
    // everyone already knows: read it as "switch to ZH". Both codes are
    // Latin, so neither page shows the other language's script. The globe
    // mark carries the meaning for anyone who does not read the code.
    const code = languageButton.querySelector('.code');
    if (code) code.textContent = language === 'zh' ? 'EN' : 'ZH';
    languageButton.setAttribute('title', language === 'zh' ? '切换到英文' : 'Switch to Chinese');
    languageButton.setAttribute('aria-label', language === 'zh' ? '切换到英文' : 'Switch to Chinese');
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
    for (const element of document.querySelectorAll('.gate-input')) {
      element.setAttribute('placeholder', language === 'zh' ? '访问码' : 'Access code');
    }
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

// ---- sample players ----
// The play buttons live here rather than in the page markup: a gated page is
// injected into the document after the code is entered, and a script tag
// inside injected markup does not run.
function bindSamplePlayers() {
  const pause = document.getElementById('pauseAll');
  if (pause && !pause.dataset.bound) {
    pause.dataset.bound = '1';
    pause.addEventListener('click', () => {
      for (const video of document.querySelectorAll('main video')) video.pause();
    });
  }
  for (const button of document.querySelectorAll('[data-play]')) {
    if (button.dataset.bound) continue;
    button.dataset.bound = '1';
    button.addEventListener('click', () => {
      const scope = button.closest('.sample-card') || document;
      for (const video of scope.querySelectorAll('video')) {
        video.currentTime = 0;
        const started = video.play();
        if (started && started.catch) started.catch(() => {});
      }
    });
  }
}
bindSamplePlayers();

// ---- access gate ----
(() => {
  const root = document.documentElement;
  const config = window.RAELYNN_GATE;
  if (!config) return;
  const STORAGE_KEY = 'raelynn-access-code';
  const button = document.getElementById('gateBtn');
  const popup = document.getElementById('gatePop');
  const host = document.querySelector('[data-gate-payload]');
  let key = null;

  const readCode = () => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } };
  const writeCode = code => { try { localStorage.setItem(STORAGE_KEY, code); } catch {} };
  const clearCode = () => { try { localStorage.removeItem(STORAGE_KEY); } catch {} };
  const base64ToBytes = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));

  // The key is stretched from the code with PBKDF2, the same way and with the
  // same salt as the build did it. Two hundred thousand rounds is what makes
  // guessing the code offline cost real time.
  async function deriveKey(code) {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: base64ToBytes(config.salt), iterations: config.iterations, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']);
  }

  // The stored form is iv | ciphertext | tag, which is the order WebCrypto
  // expects for an AES-GCM buffer.
  async function decrypt(candidate, bytes) {
    const iv = bytes.slice(0, 12);
    const body = bytes.slice(12);
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, candidate, body));
  }

  async function fetchBytes(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Cannot read ' + url);
    return new Uint8Array(await response.arrayBuffer());
  }

  // The error line is bilingual in the markup, so it is shown and hidden rather
  // than rewritten: rewriting it would put one language on both pages.
  const showError = show => {
    for (const element of document.querySelectorAll('[data-gate-error]')) element.hidden = !show;
  };

  function setState(state) {
    root.classList.remove('gate-locked', 'gate-unlocking', 'gate-open');
    root.classList.add('gate-' + state);
    if (host) host.dataset.gateState = state;
  }

  function openPopup() {
    if (!popup) return;
    popup.hidden = false;
    button?.setAttribute('aria-expanded', 'true');
    popup.querySelector('[data-gate-input]')?.focus();
  }

  function closePopup() {
    if (!popup) return;
    popup.hidden = true;
    button?.setAttribute('aria-expanded', 'false');
  }

  // Check the code against the canary: a known block encrypted with the same
  // key. If it comes out right, the code was right.
  async function openWith(code) {
    if (!code) return false;
    try {
      const candidate = await deriveKey(code);
      const canary = await decrypt(candidate, await fetchBytes(config.canary));
      if (new TextDecoder().decode(canary) !== config.canaryText) return false;
      key = candidate;
      writeCode(code);
      return true;
    } catch {
      return false;
    }
  }

  // Swap the ciphertext for the real thing: the page payload first, then the
  // media it points at.
  async function openPage() {
    if (host) {
      host.dataset.gateState = 'unlocking';
      const plain = await decrypt(key, await fetchBytes(host.dataset.gatePayload));
      host.innerHTML = new TextDecoder().decode(plain);
      host.removeAttribute('data-gate-payload');
    }
    await loadMedia(document);
    root.classList.remove('gate-locked', 'gate-unlocking');
    root.classList.add('gate-open');
    if (host) host.removeAttribute('data-gate-state');
    const mark = button?.querySelector('span');
    if (mark) mark.textContent = '🔓';
    button?.classList.add('is-open');
    button?.setAttribute('aria-label', root.lang === 'zh-CN' ? '锁定样本集合' : 'Lock the sample collection');
    closePopup();
    bindSamplePlayers();
  }

  // A video paints its own surface over the CSS background, so the lock on a
  // waiting clip is a poster rather than a background image. The poster is
  // scaled to the frame, so the lock is drawn small inside a wide canvas to
  // keep it the size of a lock and not the size of the frame.
  const lockPoster = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240' fill='none' stroke='%23e9e4d8' stroke-width='6' stroke-linecap='round'%3E%3Cg transform='translate(96,96) scale(2)'%3E%3Crect x='4.5' y='10.5' width='15' height='10' rx='2'/%3E%3Cpath d='M8 10.5V7.5a4 4 0 0 1 8 0v3'/%3E%3C/g%3E%3C/svg%3E";

  const markLocked = element => {
    if (element.tagName === 'VIDEO') element.setAttribute('poster', lockPoster);
    else element.classList.add('is-locked');
  };

  async function loadMedia(scope) {
    for (const element of scope.querySelectorAll('[data-src]')) {
      if (element.dataset.loaded) continue;
      element.dataset.loaded = '1';
      markLocked(element);
      try {
        const plain = await decrypt(key, await fetchBytes(element.dataset.src));
        const url = URL.createObjectURL(new Blob([plain], { type: element.dataset.srcMime || 'application/octet-stream' }));
        element.src = url;
        element.classList.remove('is-locked');
        element.classList.add('is-loaded');
        if (element.dataset.poster) {
          const posterPlain = await decrypt(key, await fetchBytes(element.dataset.poster));
          element.poster = URL.createObjectURL(new Blob([posterPlain], { type: element.dataset.posterMime || 'image/jpeg' }));
        } else {
          element.removeAttribute('poster');
        }
      } catch {
        delete element.dataset.loaded;
      }
    }
  }

  async function submit(code) {
    showError(false);
    if (!(await openWith(code))) {
      showError(true);
      return;
    }
    await openPage();
  }

  for (const form of document.querySelectorAll('[data-gate-form]')) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      submit((form.querySelector('[data-gate-input]')?.value || '').trim());
    });
  }
  for (const element of document.querySelectorAll('[data-gate-submit]')) {
    element.addEventListener('click', () => {
      const scope = element.closest('.gate-pop') || document;
      submit((scope.querySelector('[data-gate-input]')?.value || '').trim());
    });
  }
  button?.addEventListener('click', () => {
    if (root.classList.contains('gate-open')) {
      // Locking again clears the stored code and reloads, so the page goes
      // back to the state a visitor without the code sees.
      clearCode();
      location.reload();
      return;
    }
    if (popup?.hidden) openPopup();
    else closePopup();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && popup && !popup.hidden) closePopup();
  });
  document.addEventListener('click', event => {
    if (!popup || popup.hidden) return;
    if (!event.target.closest('.gate-wrap')) closePopup();
  });

  // A visitor who already has the code should not meet the lock again.
  (async () => {
    // Protected media on a public page waits in its locked frame.
    for (const element of document.querySelectorAll('[data-src]')) markLocked(element);
    const stored = readCode();
    if (!stored) {
      setState('locked');
      return;
    }
    if (await openWith(stored)) {
      await openPage();
      return;
    }
    clearCode();
    setState('locked');
  })();
})();

/**
 * common.js — Airbnb Renewal
 * 다크모드 · 글씨크기 · 위시리스트 상태를 모든 페이지에서 공유합니다.
 * <head> 최상단에 <script src="common.js"></script> 로 로드하세요.
 */

// ── 1. FLASH 방지: DOM 파싱 전에 즉시 실행 ─────────────────────────
(function () {
  const theme    = localStorage.getItem('ab_theme')    || 'light';
  const fontSize = localStorage.getItem('ab_fontsize') || 'medium';
  document.documentElement.setAttribute('data-theme',    theme);
  document.documentElement.setAttribute('data-fontsize', fontSize);
})();

// ── 2. THEME MANAGER ────────────────────────────────────────────────
const ThemeManager = {
  get()     { return localStorage.getItem('ab_theme') || 'light'; },
  isDark()  { return this.get() === 'dark'; },

  set(theme) {
    localStorage.setItem('ab_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  },

  toggle()  { this.set(this.isDark() ? 'light' : 'dark'); },
};

// ── 3. FONT SIZE MANAGER ─────────────────────────────────────────────
const FontSizeManager = {
  _map:    { small: '13px', medium: '15px', large: '17px', xlarge: '19px' },
  _labels: { small: '작게', medium: '보통', large: '크게',  xlarge: '매우 크게' },

  get()       { return localStorage.getItem('ab_fontsize') || 'medium'; },
  getLabel()  { return this._labels[this.get()] || '보통'; },

  set(size) {
    localStorage.setItem('ab_fontsize', size);
    document.documentElement.setAttribute('data-fontsize', size);
    if (document.body) document.body.style.fontSize = this._map[size] || '15px';
  },

  apply() {
    const size = this.get();
    if (document.body) document.body.style.fontSize = this._map[size] || '15px';
  },
};

// ── 4. WISHLIST MANAGER ──────────────────────────────────────────────
const WishlistManager = {
  _key: 'ab_wishlist',

  get() {
    try { return JSON.parse(localStorage.getItem(this._key)) || []; }
    catch { return []; }
  },

  has(id) { return this.get().includes(String(id)); },

  toggle(id) {
    const list = this.get();
    const sid  = String(id);
    const idx  = list.indexOf(sid);
    if (idx === -1) list.push(sid);
    else list.splice(idx, 1);
    localStorage.setItem(this._key, JSON.stringify(list));
    document.dispatchEvent(new CustomEvent('wishlistchange', {
      detail: { id: sid, liked: idx === -1 },
    }));
    return idx === -1; // true = 추가됨
  },

  count() { return this.get().length; },
};

// ── 5. 탭 간 실시간 동기화 ────────────────────────────────────────────
window.addEventListener('storage', e => {
  if (e.key === 'ab_theme') {
    document.documentElement.setAttribute('data-theme', e.newValue || 'light');
  }
  if (e.key === 'ab_fontsize') {
    document.documentElement.setAttribute('data-fontsize', e.newValue || 'medium');
    FontSizeManager.apply();
  }
});

// ── 6. DOMContentLoaded: 글씨크기 적용 ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  FontSizeManager.apply();
});

// ── 7. PWA 서비스워커 등록 ────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/airbnb-renewal/sw.js')
      .catch(() => {}); // 로컬 개발 환경에서는 무시
  });
}

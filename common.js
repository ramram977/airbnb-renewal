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

// ── 8. PWA 안전 영역 CSS 주입 (Galaxy / iPhone 노치 대응) ──────────────
(function () {
  const style = document.createElement('style');
  style.textContent = `
    /* ── 공통: html/body 배경색 통일 (상하단 여백 색상 일치) ── */
    html { background: #F5F4F1; }
    html[data-theme="dark"] { background: #141414; }

    /* ── PWA: CSS 미디어쿼리 방식 ── */
    @media (display-mode: standalone) {
      .header, .srch-header, .msg-header, .chat-header,
      .detail-header, .book-header, .profile-header {
        padding-top: calc(env(safe-area-inset-top, 44px) + 4px) !important;
      }
      .map-search {
        top: calc(env(safe-area-inset-top, 44px) + 4px) !important;
      }
      .bottom-nav {
        height: auto !important;
        min-height: 56px !important;
        padding-top: 8px !important;
        padding-bottom: calc(env(safe-area-inset-bottom, 20px) + 10px) !important;
        align-items: flex-start !important;
      }
      .bottom-bar {
        padding-bottom: calc(env(safe-area-inset-bottom, 20px) + 14px) !important;
      }
      .input-bar {
        padding-bottom: calc(env(safe-area-inset-bottom, 20px) + 10px) !important;
      }
      body {
        padding-bottom: calc(72px + env(safe-area-inset-bottom, 20px)) !important;
      }
    }

    /* ── PWA: JS 감지 fallback (html.pwa 클래스) ── */
    html.pwa .header, html.pwa .srch-header, html.pwa .msg-header,
    html.pwa .chat-header, html.pwa .detail-header,
    html.pwa .book-header, html.pwa .profile-header {
      padding-top: calc(env(safe-area-inset-top, 44px) + 4px) !important;
    }
    html.pwa .map-search {
      top: calc(env(safe-area-inset-top, 44px) + 4px) !important;
    }
    html.pwa .bottom-nav {
      height: auto !important;
      min-height: 56px !important;
      padding-top: 8px !important;
      padding-bottom: calc(env(safe-area-inset-bottom, 20px) + 10px) !important;
      align-items: flex-start !important;
    }
    html.pwa .bottom-bar {
      padding-bottom: calc(env(safe-area-inset-bottom, 20px) + 14px) !important;
    }
    html.pwa .input-bar {
      padding-bottom: calc(env(safe-area-inset-bottom, 20px) + 10px) !important;
    }
    html.pwa body {
      padding-bottom: calc(72px + env(safe-area-inset-bottom, 20px)) !important;
    }
  `;
  document.head.appendChild(style);

  // JS로 standalone 모드 감지 → html.pwa 클래스 추가 (Samsung Chrome 대응)
  function applyPwaClass() {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.startsWith('android-app://');
    if (isStandalone) document.documentElement.classList.add('pwa');
  }
  applyPwaClass();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPwaClass);
  }
})();

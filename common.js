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

// ── 5. MICRO-INTERACTION ─────────────────────────────────────────────
const MicroInteraction = {
  init() {
    this._pills();
    this._cards();
    this._delayNav(); // 카드·검색바 클릭 시 효과가 보인 뒤에 이동
  },

  _pills() {
    document.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        pill.classList.remove('_spring');
        void pill.offsetWidth; // reflow → restart animation
        pill.classList.add('_spring');
      });
      pill.addEventListener('animationend', () => pill.classList.remove('_spring'));
    });
  },

  _cards() {
    // pointerdown 에서 즉시 시각 피드백 (클릭 판정 전에 미리 보여줌)
    document.addEventListener('pointerdown', e => {
      const card = e.target.closest('.card, .list-card');
      if (card) card.classList.add('_pressed');

      const bar = e.target.closest('.search-bar, .srch-bar');
      if (bar) bar.classList.add('_glow');
    }, { passive: true });

    const clearFeedback = () => {
      document.querySelectorAll('.card._pressed, .list-card._pressed')
        .forEach(c => c.classList.remove('_pressed'));
      document.querySelectorAll('.search-bar._glow, .srch-bar._glow')
        .forEach(b => b.classList.remove('_glow'));
    };
    document.addEventListener('pointercancel', clearFeedback, { passive: true });
  },

  _delayNav() {
    // 캡처 단계에서 클릭을 가로채 — onclick 보다 먼저 실행
    document.addEventListener('click', e => {
      const el = e.target.closest('.card, .list-card, .search-bar, .srch-bar');
      if (!el) return;

      const fn = el.getAttribute('onclick') || '';
      const m  = fn.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
      if (!m) return;

      e.stopImmediatePropagation(); // onclick 이 직접 실행되지 않도록 차단
      const dest = m[1];

      // 효과가 눈에 보일 시간(170 ms) 만큼 대기 후 이동
      setTimeout(() => { location.href = dest; }, 170);
    }, true /* capture */);
  },
};

// ── 6. 탭 간 실시간 동기화 ────────────────────────────────────────────
window.addEventListener('storage', e => {
  if (e.key === 'ab_theme') {
    document.documentElement.setAttribute('data-theme', e.newValue || 'light');
  }
  if (e.key === 'ab_fontsize') {
    document.documentElement.setAttribute('data-fontsize', e.newValue || 'medium');
    FontSizeManager.apply();
  }
});

// ── 6. DOMContentLoaded: 글씨크기 적용 + 마이크로 인터랙션 ────────────
document.addEventListener('DOMContentLoaded', () => {
  FontSizeManager.apply();
  MicroInteraction.init();
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

    /* ── 마이크로 인터랙션 ── */

    /* 카테고리 필 — 스프링 스케일 */
    @keyframes _pill-spring {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.07); }
      72%  { transform: scale(0.97); }
      100% { transform: scale(1); }
    }
    .pill._spring {
      animation: _pill-spring 0.30s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    /* 편의시설 아이콘 — 눌림 + 튀기 */
    @keyframes _amenity-pop {
      0%   { transform: scale(1); }
      35%  { transform: scale(0.88); }
      68%  { transform: scale(1.08); }
      100% { transform: scale(1); }
    }
    .amenity-icon._pop {
      animation: _amenity-pop 0.26s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      cursor: pointer;
    }

    /* 숙소 카드 — 터치 시 살짝 들어가는 느낌 */
    .card {
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .card._pressed {
      transform: scale(0.97) !important;
      box-shadow: 0 1px 8px rgba(0,0,0,.07) !important;
    }

    /* 검색바 — 포커스 글로우 */
    .search-bar, .srch-bar {
      transition: box-shadow 0.15s ease;
    }
    .search-bar._glow, .srch-bar._glow {
      box-shadow: 0 0 0 3px rgba(232,160,32,.22), 0 2px 16px rgba(0,0,0,.10) !important;
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

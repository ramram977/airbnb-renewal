const CACHE = 'stay-v22';

const ASSETS = [
  '/airbnb-renewal/',
  '/airbnb-renewal/index.html',
  '/airbnb-renewal/search.html',
  '/airbnb-renewal/map.html',
  '/airbnb-renewal/detail.html',
  '/airbnb-renewal/booking.html',
  '/airbnb-renewal/messages.html',
  '/airbnb-renewal/chat.html',
  '/airbnb-renewal/profile.html',
  '/airbnb-renewal/common.js',
  '/airbnb-renewal/trip.html',
  '/airbnb-renewal/manifest.json',
  '/airbnb-renewal/data/rooms.json',
  '/airbnb-renewal/data/amenities.json',
  '/airbnb-renewal/data/reviews.json',
  '/airbnb-renewal/data/keywords.json',
  '/airbnb-renewal/data/rules.json',
  '/airbnb-renewal/data/search_listings.json',
  '/airbnb-renewal/data/conversations.json',
  '/airbnb-renewal/data/messages.json',
  '/airbnb-renewal/icons/icon-192.png',
  '/airbnb-renewal/icons/icon-512.png',
  '/airbnb-renewal/rooms/room1.jpg',
  '/airbnb-renewal/rooms/room2.jpg',
  '/airbnb-renewal/rooms/room3.jpg',
  '/airbnb-renewal/rooms/room4.jpg',
  '/airbnb-renewal/rooms/room5.jpg',
  '/airbnb-renewal/rooms/room6.jpg',
  '/airbnb-renewal/rooms/room7.jpg',
  '/airbnb-renewal/rooms/room8.jpg',
  '/airbnb-renewal/rooms/room9.jpg',
  '/airbnb-renewal/rooms/room10.jpg',
  '/airbnb-renewal/rooms/room11.jpg',
  '/airbnb-renewal/rooms/room12.jpg',
  '/airbnb-renewal/rooms/room13.jpg',
  '/airbnb-renewal/rooms/room14.jpg',
  '/airbnb-renewal/rooms/room15.jpg',
];

// 설치: 모든 에셋 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 삭제 후 모든 탭에 갱신 신호
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      // claim() 이후 열려 있는 모든 탭에 controllerchange 를 발생시켜 자동 새로고침
  );
});

// 요청 처리: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', e => {
  // 카카오맵 API 등 외부 요청은 캐시 안 함
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // 정상 응답만 캐시에 저장
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // 오프라인이고 캐시도 없을 때 index.html 반환
        if (e.request.destination === 'document')
          return caches.match('/airbnb-renewal/index.html');
      });
    })
  );
});

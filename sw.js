const CACHE_NAME = 'stock-report-v1';

// 앱 셸(App Shell) — 오프라인에서도 기본 UI가 뜨도록 캐싱
const SHELL_URLS = [
  './',
  './index.html'
];

// 설치: 앱 셸 캐싱
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 제거
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 네트워크 우선 전략: 실시간 데이터 우선, 오프라인 시 캐시 fallback
self.addEventListener('fetch', event => {
  // 외부 API / TradingView 위젯은 캐싱하지 않음
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // index.html은 캐시 업데이트
        if (event.request.url.includes('index.html') || event.request.url.endsWith('/')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

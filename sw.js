// sw.js
const CACHE_NAME = 'kanban-v1';
const urlsToCache = [
  '/todolist/',
  '/todolist/index.html',      // 你的主HTML文件名
  '/todolist/manifest.json',
  // 如果有外部CSS/JS文件，也需列出（目前都在HTML内，无需额外）
];

// 安装阶段：缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存资源');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // 立即激活
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截请求：优先从缓存读取，失败再网络请求（策略：stale-while-revalidate）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // 后台更新缓存（保持最新）
          fetch(event.request).then(networkResponse => {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse);
            });
          }).catch(() => {});
          return response;
        }
        return fetch(event.request);
      })
      .catch(() => {
        // 离线时返回默认页面（可选）
        return caches.match('/todolist/index.html');
      })
  );
});

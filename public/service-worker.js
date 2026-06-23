/**
 * PawSync Pro Service Worker
 * 
 * 离线支持:
 * - Cache-first 策略：静态资源优先从缓存加载
 * - Network-first 策略：API 请求优先网络，失败时回退到缓存
 * - Background Sync：离线数据队列，恢复网络后自动同步
 * - Push 通知处理：在 SW 中处理 FCM 推送（Web 端）
 * - 离线回退页面：网络不可用时展示友好的离线提示
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `pawsync-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `pawsync-dynamic-${CACHE_VERSION}`;
const API_CACHE = `pawsync-api-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// 静态资源列表（构建时会被 Vite 注入）
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/privacy-policy.html',
];

// 同步队列存储键
const SYNC_QUEUE_KEY = 'pawsync-sync-queue';
const SYNC_TAG = 'pawsync-sync';

// ─── 安装事件 ────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // 强制激活新的 SW
      return self.skipWaiting();
    })
  );
});

// ─── 激活事件 ────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // 删除旧版本缓存
            return name.startsWith('pawsync-') && 
                   name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE && 
                   name !== API_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // 接管所有客户端
      return self.clients.claim();
    })
  );
});

// ─── Fetch 事件 ───────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    // 对于 POST/PUT/DELETE，如果是离线状态，加入同步队列
    if (!navigator.onLine && request.url.includes('/api/')) {
      event.respondWith(handleOfflineMutation(request));
      return;
    }
    return;
  }

  // 跳过 chrome-extension 等非 HTTP 请求
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API 请求：Network-first 策略
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // 静态资源：Cache-first 策略
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 其他动态内容：Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ─── 缓存策略 ─────────────────────────────────────────────────

/**
 * Cache-first：优先从缓存读取，缓存未命中时请求网络
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // 网络不可用，返回离线页面（仅对导航请求）
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE);
      const offlineResponse = await cache.match(OFFLINE_PAGE);
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network-first：优先网络请求，失败时回退缓存
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(
      JSON.stringify({ error: 'Network error', offline: true }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * Stale-while-revalidate：立即返回缓存，同时更新缓存
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // 网络失败，返回 null
    return null;
  });

  return cachedResponse || fetchPromise;
}

// ─── 离线变更处理 ────────────────────────────────────────────

/**
 * 处理离线状态下的 POST/PUT/DELETE 请求
 * 将请求加入同步队列，恢复网络后自动同步
 */
async function handleOfflineMutation(request) {
  try {
    const body = await request.clone().text();
    const queue = await getSyncQueue();
    queue.push({
      id: generateId(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now(),
    });
    await saveSyncQueue(queue);

    // 注册 background sync
    if ('sync' in self.registration) {
      await self.registration.sync.register(SYNC_TAG);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        offline: true, 
        message: '操作已保存，将在恢复网络后同步' 
      }),
      { 
        status: 202, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Offline storage failed' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// ─── Background Sync ──────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    console.log('[SW] Background sync triggered');
    event.waitUntil(processSyncQueue());
  }
});

/**
 * 处理同步队列中的离线请求
 */
async function processSyncQueue() {
  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  console.log(`[SW] Processing ${queue.length} queued requests`);

  const failedItems = [];

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });

      if (!response.ok) {
        failedItems.push(item);
      }
    } catch (error) {
      failedItems.push(item);
    }
  }

  // 保留失败的请求，下次重试
  await saveSyncQueue(failedItems);

  if (failedItems.length > 0) {
    console.log(`[SW] ${failedItems.length} items failed, will retry later`);
  } else {
    console.log('[SW] Sync queue processed successfully');
    // 通知所有客户端同步完成
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'sync-complete',
        timestamp: Date.now(),
      });
    });
  }
}

// ─── Push 通知处理 ───────────────────────────────────────────

self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: 'PawSync Pro',
    body: '您有一条新消息',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: {},
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      data = {
        title: pushData.title || data.title,
        body: pushData.body || data.body,
        icon: pushData.icon || data.icon,
        badge: pushData.badge || data.badge,
        data: pushData.data || {},
        actions: pushData.actions || [],
      };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions,
    requireInteraction: data.data?.priority === 'high' || data.data?.priority === 'critical',
    tag: data.data?.tag || 'pawsync-push',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options).then(() => {
      // 通知所有打开的客户端有新推送
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'push',
            payload: {
              title: data.title,
              body: data.body,
              data: data.data,
            },
          });
        });
      });
    })
  );
});

// ─── 通知点击处理 ────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  const notificationData = event.notification.data || {};

  // 确定导航目标
  let targetUrl = '/';
  if (notificationData.route) {
    targetUrl = notificationData.route;
  } else if (notificationData.petId) {
    targetUrl = `/pets/${notificationData.petId}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // 如果已有打开的窗口，聚焦并导航
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'push',
            payload: notificationData,
          });
          return client.focus();
        }
      }
      // 否则打开新窗口
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── 离线页面生成 ────────────────────────────────────────────

/**
 * 动态生成离线回退页面
 */
function generateOfflinePage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PawSync Pro - 离线模式</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .offline-container {
      text-align: center;
      padding: 2rem;
    }
    .offline-icon {
      font-size: 80px;
      margin-bottom: 1rem;
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }
    p {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .retry-btn {
      background: white;
      color: #667eea;
      border: none;
      padding: 12px 32px;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .retry-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .status-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ff6b6b;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .offline-features {
      margin-top: 2rem;
      text-align: left;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 1.5rem;
      max-width: 400px;
    }
    .offline-features h3 {
      margin-bottom: 0.75rem;
      font-size: 1rem;
      opacity: 0.8;
    }
    .offline-features ul {
      list-style: none;
    }
    .offline-features li {
      padding: 0.3rem 0;
      font-size: 0.9rem;
      opacity: 0.85;
    }
    .offline-features li::before {
      content: "✓ ";
      color: #51cf66;
    }
  </style>
</head>
<body>
  <div class="offline-container">
    <div class="offline-icon">🐾</div>
    <h1>PawSync Pro</h1>
    <p><span class="status-dot"></span>当前处于离线模式</p>
    <p>请检查您的网络连接后重试<br>您仍可查看已缓存的健康数据和宠物档案</p>
    <button class="retry-btn" onclick="location.reload()">重新连接</button>
    <div class="offline-features">
      <h3>离线可用功能</h3>
      <ul>
        <li>查看宠物档案</li>
        <li>浏览健康记录</li>
        <li>查看提醒列表</li>
        <li>保存离线草稿</li>
      </ul>
    </div>
  </div>
  <script>
    // 监听网络恢复
    window.addEventListener('online', () => {
      location.reload();
    });
  </script>
</body>
</html>`;
}

// ─── 缓存离线页面 ────────────────────────────────────────────

caches.open(STATIC_CACHE).then((cache) => {
  const offlinePage = new Response(generateOfflinePage(), {
    headers: { 'Content-Type': 'text/html' },
  });
  cache.put(OFFLINE_PAGE, offlinePage);
});

// ─── 工具函数 ────────────────────────────────────────────────

function isStaticAsset(url) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.ico', '.woff', '.woff2', '.ttf', '.eot', '.webp', '.json'
  ];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext)) ||
         url.pathname === '/' ||
         url.pathname === '/index.html';
}

async function getSyncQueue() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = await cache.match(SYNC_QUEUE_KEY);
    if (response) {
      return response.json();
    }
  } catch {
    // ignore
  }
  return [];
}

async function saveSyncQueue(queue) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const response = new Response(JSON.stringify(queue), {
    headers: { 'Content-Type': 'application/json' },
  });
  await cache.put(SYNC_QUEUE_KEY, response);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
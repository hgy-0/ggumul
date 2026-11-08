// 푸시 알림 전용 서비스 워커 v2

self.addEventListener('install', (event) => {
  console.log('[push-sw] installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[push-sw] activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[push-sw] push received', event);
  if (!event.data) return;

  let title = '꾸물';
  let options = {};

  try {
    const payload = event.data.json();
    title = payload.title || '꾸물';
    options = {
      body: payload.body || '',
      icon: payload.icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: payload.data,
      silent: false,
      vibrate: [200, 100, 200],
    };
  } catch (e) {
    options = { body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // 열려있는 앱 페이지에 알림음 재생 요청
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'push-received' }));
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

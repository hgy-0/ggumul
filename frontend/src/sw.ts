/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute, NavigationRoute } from 'workbox-routing';

declare let self: ServiceWorkerGlobalScope;

// Workbox precaching
self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation fallback
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || '꾸물';
    const options: NotificationOptions = {
      body: payload.body || '',
      icon: payload.icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: payload.data,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // JSON 파싱 실패 시 텍스트로 표시
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('꾸물', { body: text }),
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열려있는 창이 있으면 포커스
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 창 열기
      return self.clients.openWindow('/');
    }),
  );
});

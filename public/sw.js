self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'Notification';
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      tag: data.tag || 'gym-alert',
      requireInteraction: Boolean(data.requireInteraction),
      data: { url: data.url || '/', ...data.data }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  let urlToOpen = event.notification.data?.url || '/';

  // Handle specific review_prompt deep linking
  if (event.notification.data?.type === 'review_prompt' && event.notification.data?.memberId) {
    urlToOpen = `/members?openMember=${event.notification.data.memberId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'New order', {
      body: data.body || 'You have a new order',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.tag || 'new-order',
      renotify: true,
      data: { url: '/staff/vendor' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes('/staff/vendor'))
      if (existing) return existing.focus()
      return clients.openWindow('/staff/vendor')
    })
  )
})

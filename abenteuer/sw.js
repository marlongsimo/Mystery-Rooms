/* Mythara ist nach mythara-dungeon.de umgezogen. Dieser Service Worker räumt den alten Zwischenspeicher weg und meldet sich ab. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("mythara-")) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url);
})()));

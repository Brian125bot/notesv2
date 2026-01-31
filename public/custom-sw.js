
// Custom Service Worker logic for Notes App
// Handles Background Sync, Push Notifications, and API offline fallback

const CACHE_NAME = "notes-app-v2";

// Fetch - handle API offline fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests to /api/
  // Non-GET requests are handled by application logic + Background Sync
  if (request.method === "GET" && url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // Return offline response for API calls
          return new Response(
            JSON.stringify({ error: "Offline", offline: true }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        })
    );
  }
  // For other requests, let Next-PWA / Workbox handle them
});

// Background Sync - handle queued sync actions
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag);

  if (event.tag === "sync-notes") {
    event.waitUntil(processSyncQueue());
  }
});

// Process the sync queue
async function processSyncQueue() {
  try {
    // Notify all clients to trigger sync
    const clients = await self.clients.matchAll();
    
    clients.forEach((client) => {
      client.postMessage({
        type: "TRIGGER_SYNC",
        timestamp: Date.now(),
      });
    });

    console.log("Sync triggered in clients:", clients.length);
  } catch (error) {
    console.error("Background sync failed:", error);
    throw error; // Rethrow to signal failure for retry
  }
}

// Push - handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  
  const options = {
    body: data.body || "You have updates",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: data.tag || "notes-sync",
    requireInteraction: false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "Notes App",
      options
    )
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});

// Handle messages from the main app
self.addEventListener("message", (event) => {
  console.log("SW received message:", event.data);

  switch (event.data?.type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "GET_VERSION":
      event.ports[0]?.postMessage({ version: CACHE_NAME });
      break;

    case "PING":
      event.ports[0]?.postMessage({ pong: true, timestamp: Date.now() });
      break;

    default:
      console.log("Unknown message type:", event.data?.type);
  }
});

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "notes-sync") {
    event.waitUntil(processSyncQueue());
  }
});

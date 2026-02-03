// Service Worker for BN-Aura PWA
// Provides offline functionality and caching strategies

const CACHE_NAME = 'bnaura-v1';
const STATIC_CACHE_NAME = 'bnaura-static-v1';
const DYNAMIC_CACHE_NAME = 'bnaura-dynamic-v1';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/analytics',
  '/customers',
  '/ai-analysis',
  '/manifest.json',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main-app.js',
  '/_next/static/chunks/app/_not-found.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API routes that can be cached
const CACHEABLE_API_ROUTES = [
  '/api/admin/management',
  '/api/user/profile',
  '/api/analytics/dashboard'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request.url)) {
    // Cache first for static assets
    event.respondWith(cacheFirst(request));
  } else if (isAPIRoute(request.url)) {
    // Network first for API routes
    event.respondWith(networkFirst(request));
  } else if (isNavigation(request)) {
    // Network first for navigation requests
    event.respondWith(networkFirst(request));
  } else {
    // Stale while revalidate for other requests
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data?.text() || 'New notification from BN-Aura',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open BN-Aura',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('BN-Aura', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync-analytics') {
    event.waitUntil(syncAnalyticsData());
  }
});

// Caching strategies
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    const network = await fetch(request);
    if (network.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, network.clone());
    }
    return network;
  } catch (error) {
    console.log('Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const network = await fetch(request);
    if (network.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, network.clone());
    }
    return network;
  } catch (error) {
    console.log('Network first failed, trying cache:', error);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page for navigation requests
    if (isNavigation(request)) {
      return caches.match('/') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cached = await cache.match(request);
  
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  
  return cached || network;
}

// Helper functions
function isStaticAsset(url) {
  return url.includes('/_next/static/') || 
         url.includes('/icons/') || 
         url.includes('/images/') ||
         url.endsWith('.css') ||
         url.endsWith('.js') ||
         url.endsWith('.png') ||
         url.endsWith('.jpg') ||
         url.endsWith('.svg');
}

function isAPIRoute(url) {
  return url.includes('/api/');
}

function isNavigation(request) {
  return request.mode === 'navigate';
}

// Background sync functions
async function syncAnalyticsData() {
  try {
    // Get cached analytics events
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedEvents = await cache.match('/analytics-events');
    
    if (cachedEvents) {
      const events = await cachedEvents.json();
      
      // Send events to server
      await fetch('/api/analytics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });
      
      // Clear cached events
      await cache.delete('/analytics-events');
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    // Handle cache updates
    console.log('Service Worker: Cache update requested');
  }
});

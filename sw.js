// VERSI DITINGKATKAN - Untuk Memaksa Reset Cache
const CACHE_NAME = 'lebah-kreatif-v2';
const urlsToCache = [
  './',
  './index.html',
  './admin.html',
  './manifest.json',
  './logo.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Memaksa SW baru segera aktif
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Menyimpan cache versi baru...');
        return cache.addAll(urlsToCache).catch(err => console.log('Ada file gagal dicache:', err));
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // HAPUS CACHE VERSI LAMA SEKARANG JUGA
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Ambil alih kontrol klien (browser) segera
  );
});

// STRATEGI NETWORK-FIRST (Ambil dari internet dulu, kalau offline baru pakai cache)
self.addEventListener('fetch', event => {
  // Biarkan API Supabase langsung ke internet (Jangan pernah di-cache)
  if (event.request.url.includes('supabase.co')) {
      return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      // Jika berhasil memuat file terbaru dari server, simpan/update ke cache
      if(response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
          });
      }
      return response;
    }).catch(() => {
      // Jika internet putus, tampilkan dari memori Cache
      return caches.match(event.request);
    })
  );
});
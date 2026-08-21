// public/sw.js
const CACHE_NAME = 'pwa-cache-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker terinstall');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker aktif');
});

self.addEventListener('fetch', (event) => {
  // Tempat menangani caching jika diperlukan nanti
});
// Cache name
const CACHE_NAME = 'my-cache-v-002';

// Files to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.png',
  '/Quran.jpg',
  '/poster.jpg',
  'https://quran.com/bn',
  'https://www.iqa.info',
  'https://fonts.googleapis.com/css?family=Noto+Sans+Bengali:300,400,700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://fonts.maateen.me/apona-lohit/font.css'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    }).catch(err => console.error('Cache open failed:', err))
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }).catch(err => console.error('Fetch failed:', err))
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
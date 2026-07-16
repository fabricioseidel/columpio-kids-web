// Service worker mínimo: habilita la instalación como PWA.
// La app requiere conexión (los datos viven en Supabase); solo se cachean
// los estáticos del shell para acelerar la carga.
const CACHE = 'ck-static-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Solo cache-first para estáticos propios (js/css/imágenes del build)
  const isStatic =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/'))
  if (!isStatic) return
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request)
      if (cached) return cached
      const res = await fetch(event.request)
      if (res.ok) cache.put(event.request, res.clone())
      return res
    }),
  )
})

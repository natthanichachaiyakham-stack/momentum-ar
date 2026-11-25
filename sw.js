// เก็บไฟล์ของสื่อ AR ไว้ในเครื่อง: เปิดครั้งต่อไปได้แม้เน็ตอ่อนหรือหลุด
// หน้าเว็บและไฟล์ของเราใช้เวอร์ชันล่าสุดจากเน็ตก่อนเสมอ (แก้ไฟล์แล้วนักเรียนเห็นทันที) ถ้าเน็ตใช้ไม่ได้จึงใช้ไฟล์ที่เก็บไว้
const CACHE = 'momentum-ar-v1';
const CDN = /(^|\.)cdn\.jsdelivr\.net$|(^|\.)unpkg\.com$|^fonts\.(googleapis|gstatic)\.com$|^ajax\.googleapis\.com$/;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (CDN.test(url.hostname)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE), hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    })());
    return;
  }
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const isPage = req.mode === 'navigate';
    try {
      const net = fetch(req);
      const res = isPage ? await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 6000))]) : await net;
      if (res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(req, { ignoreSearch: isPage });
      if (hit) return hit;
      return fetch(req);
    }
  })());
});

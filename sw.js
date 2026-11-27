const C='bmm-v7',S=['./','./index.html','./manifest.webmanifest','./logo.png','./artistes.js','./commerce.js','./plateforme.js','./bling-ui.css','./accueil.js','./lecteur.js','./beatmakers.js','./abonnements.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(S)))});
self.addEventListener('activate',e=>e.waitUntil(clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  const ok=u.origin===location.origin||u.hostname.includes('jsdelivr')||u.pathname.includes('/storage/v1/object/public/');
  if(!ok)return;
  e.respondWith(fetch(r).then(x=>{if(x.ok){const k=x.clone();caches.open(C).then(c=>c.put(r,k))}return x}).catch(()=>caches.match(r)));
});

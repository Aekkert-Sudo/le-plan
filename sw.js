const C='leplan-202611101902';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const nav=e.request.mode==='navigate';
  e.respondWith((async()=>{
    const cache=await caches.open(C);
    if(nav){try{const r=await fetch(e.request);if(r&&r.ok)cache.put('index.html',r.clone());return r;}catch(err){return (await cache.match('index.html'))||Response.error();}}
    const hit=await cache.match(e.request,{ignoreSearch:true});if(hit)return hit;
    try{const r=await fetch(e.request);if(r&&r.ok&&new URL(e.request.url).origin===location.origin)cache.put(e.request,r.clone());return r;}catch(err){return Response.error();}
  })());
});

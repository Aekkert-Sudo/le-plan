const C='lebesch-20261111090518';
const ROOT=new URL('./',self.location).pathname;
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
const OWN=FILES.map(f=>new URL(f,self.location).pathname);
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.indexOf('lebesch-')===0&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin||OWN.indexOf(u.pathname)<0)return; // other apps and sub-folders are not ours
  const nav=e.request.mode==='navigate';
  e.respondWith((async()=>{
    const cache=await caches.open(C);
    if(nav){try{const r=await fetch(e.request);if(r&&r.ok)cache.put('index.html',r.clone());return r;}catch(err){return (await cache.match('index.html'))||Response.error();}}
    const hit=await cache.match(e.request,{ignoreSearch:true});if(hit)return hit;
    try{const r=await fetch(e.request);if(r&&r.ok)cache.put(e.request,r.clone());return r;}catch(err){return Response.error();}
  })());
});

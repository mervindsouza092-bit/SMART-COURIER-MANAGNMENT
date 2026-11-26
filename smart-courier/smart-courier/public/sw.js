// SMART COURIER service worker: offline app shell + last-seen data for the lists a courier needs.
const SHELL='sc-shell-v1',API_C='sc-api-v1',PRE=['/','/index.html','/manifest.webmanifest','/icon-192.png']
const DATA=/\/api\/(shipments|addresses|courier\/earnings|auth\/me|notifications|tickets|couriers)(\/|\?|$)/
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(PRE)));self.skipWaiting()})
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==SHELL&&k!==API_C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))})
self.addEventListener('message',e=>{if(e.data==='clear')caches.delete(API_C)})  // sent on logout so the next person on this device never sees old data
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return
  const u=new URL(r.url)
  if(DATA.test(u.pathname)){
    const key=u.href+(u.search?'&':'?')+'_u='+(r.headers.get('authorization')||'').slice(-12)  // cached per logged-in user
    e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(API_C).then(ch=>ch.put(key,c))}return res})
      .catch(()=>caches.open(API_C).then(ch=>ch.match(key)).then(hit=>hit||new Response(JSON.stringify({detail:'You are offline.'}),{status:503,headers:{'Content-Type':'application/json'}}))))
    return
  }
  if(u.origin!==location.origin)return
  if(r.mode==='navigate'){e.respondWith(fetch(r).catch(()=>caches.match('/index.html')));return}
  if(u.pathname.startsWith('/assets/'))e.respondWith(caches.open(SHELL).then(ch=>ch.match(r).then(hit=>hit||fetch(r).then(res=>{ch.put(r,res.clone());return res}))))
})

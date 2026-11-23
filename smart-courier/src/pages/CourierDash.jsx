import {useState,useEffect,useRef} from 'react'
import {Navigation,Play,Square,Route as RouteIcon} from 'lucide-react'
import {api,useApi} from '../api'
import {useApp,Badge} from '../ui'
import {Head,Table} from './Dash'
import LiveMap,{icons,route} from '../Map'
const NEXT={Pending:'Picked Up','Picked Up':'In Transit','In Transit':'Out for Delivery','Out for Delivery':'Delivered'}
const ok=p=>p&&p[0]!=null
export default function CourierDash(){
  const {toast}=useApp(),{data,err,reload}=useApi('/shipments'),[mode,setMode]=useState('off'),[pos,setPos]=useState(null),[sel,setSel]=useState(null),[line,setLine]=useState([]),[plan,setPlan]=useState(null),[pend,setPend]=useState(null),fileRef=useRef()
  const active=(data||[]).filter(s=>!['Delivered','Cancelled'].includes(s.status)),cur=active.find(s=>s.id===sel)||active[0]
  const send=p=>{setPos(p);api('/couriers/me/location',{method:'POST',body:{lat:p[0],lng:p[1]}}).catch(()=>{})}
  useEffect(()=>{if(cur&&ok(cur.pickup_pos)&&ok(cur.dest_pos))route(cur.pickup_pos,cur.dest_pos).then(r=>setLine(r?r.pts:[]))},[cur?.id])
  useEffect(()=>{
    if(mode==='gps'){
      if(!navigator.geolocation){toast('GPS is not available on this device');setMode('off');return}
      const w=navigator.geolocation.watchPosition(p=>send([p.coords.latitude,p.coords.longitude]),()=>{toast('Location permission denied');setMode('off')},{enableHighAccuracy:true})
      return()=>navigator.geolocation.clearWatch(w)
    }
    if(mode==='demo'&&cur&&ok(cur.pickup_pos)){
      let i=0,pts=[]
      route(cur.pickup_pos,cur.dest_pos).then(r=>{pts=r?r.pts:[cur.pickup_pos,cur.dest_pos]})
      const t=setInterval(()=>{if(!pts.length)return;if(i<pts.length){send(pts[i]);i+=Math.max(1,Math.floor(pts.length/60))}else{setMode('off');toast('Demo drive finished')}},1500)
      return()=>clearInterval(t)
    }
  },[mode,cur?.id])
  const shrink=f=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>{const k=Math.min(1,800/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=im.width*k;cv.height=im.height*k;cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);res(cv.toDataURL('image/jpeg',.6))};im.onerror=rej;im.src=URL.createObjectURL(f)})
  const onPhoto=async e=>{
    const f=e.target.files[0];e.target.value='';if(!f||!pend)return
    const s=pend;setPend(null)
    try{await api(`/shipments/${s.id}/proof`,{method:'POST',body:{image:await shrink(f)}});toast('Delivery photo saved');await move(s)}catch(x){toast(x.message)}
  }
  const adv=s=>{if(NEXT[s.status]==='Delivered'&&!s.has_proof){setPend(s);fileRef.current.click();return}return move(s)}
  const move=s=>{
    const fin=NEXT[s.status]==='Delivered',otp=fin?window.prompt('Enter the 4-digit delivery OTP from the customer'):undefined
    if(fin&&!otp)return
    return api(`/shipments/${s.id}/status`,{method:'PATCH',body:{status:NEXT[s.status],otp}}).then(()=>{toast(`${s.tracking_id} → ${NEXT[s.status]}`);setPlan(null);reload()}).catch(x=>toast(x.message))
  }
  const optimize=async()=>{
    const st=active.filter(s=>ok(s.dest_pos));if(st.length<2)return toast('You need at least 2 active deliveries with map locations')
    const depot=pos||st[0].pickup_pos
    try{
      const r=await api('/ai/optimize-route',{method:'POST',body:{depot:{id:'depot',lat:depot[0],lng:depot[1]},stops:st.map(s=>({id:String(s.id),lat:s.dest_pos[0],lng:s.dest_pos[1]}))}})
      const by=Object.fromEntries(st.map(s=>[String(s.id),s]))
      setPlan({...r,list:r.order.map(id=>by[id]),line:[depot,...r.order.map(id=>by[id].dest_pos)]});toast(`Route optimized: ${r.saved_pct}% shorter`)
    }catch(x){toast(x.message)}
  }
  const mk=[pos&&{pos,icon:icons.courier,label:'You (live)'},cur&&ok(cur.pickup_pos)&&{pos:cur.pickup_pos,icon:icons.pickup,label:'Pickup · '+cur.pickup},cur&&ok(cur.dest_pos)&&{pos:cur.dest_pos,icon:icons.dest,label:'Drop · '+cur.destination}].filter(Boolean)
  const mk2=plan?[...mk.filter(m=>m.label==='You (live)'),...plan.list.map((s,i)=>({pos:s.dest_pos,icon:icons.dest,label:`Stop ${i+1} · ${s.destination}`}))]:mk
  return <div><Head t="MY DELIVERIES" sub={mode==='off'?'LOCATION SHARING OFF':mode==='gps'?'SHARING LIVE GPS':'DEMO DRIVE RUNNING'}/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    <div className="flex flex-wrap gap-2 mb-4"><input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto}/><button className="btn" onClick={()=>setMode('gps')}><Navigation size={16}/>SHARE LIVE GPS</button><button className="btn2" onClick={optimize}><RouteIcon size={16}/>OPTIMIZE ROUTE</button><button className="btn2" onClick={()=>setMode('demo')}><Play size={16}/>DEMO DRIVE</button>{mode!=='off'&&<button className="btn2" onClick={()=>setMode('off')}><Square size={16}/>STOP</button>}</div>
    {plan&&<div className="glass p-3 mb-4 text-sm"><b className="gt">OPTIMIZED ROUTE</b> · {plan.before_km} km → <b className="text-emerald-300">{plan.after_km} km</b> ({plan.saved_pct}% shorter)<div className="text-white/70 mt-1">{plan.list.map((s,i)=>`${i+1}. ${s.destination}`).join('  →  ')}</div></div>}
    {mk2.length>0&&<div className="mb-4"><LiveMap markers={mk2} line={plan?plan.line:line} h={320}/></div>}
    {active.length?<Table heads={['Tracking ID','Route','Distance','Status','Action']}>{active.map(s=><tr key={s.id} onClick={()=>setSel(s.id)} className={`border-t border-white/5 cursor-pointer ${cur?.id===s.id?'bg-cyan-400/10':''}`}><td className="p-3 text-cyan-300">{s.tracking_id}</td><td className="p-3">{s.pickup} → {s.destination}</td><td className="p-3">{s.distance_km?s.distance_km.toFixed(1)+' km':'–'}</td><td className="p-3"><Badge s={s.status}/></td><td className="p-3">{NEXT[s.status]&&<button className="text-cyan-300" onClick={e=>{e.stopPropagation();adv(s)}}>MARK {NEXT[s.status].toUpperCase()}</button>}</td></tr>)}</Table>
    :<div className="glass p-10 text-center text-white/60">No active deliveries assigned to you.</div>}
  </div>
}

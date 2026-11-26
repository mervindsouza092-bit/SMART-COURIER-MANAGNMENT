import {useState,useEffect} from 'react'
import {motion} from 'framer-motion'
import {STAGES,stageOf} from '../data'
import {api,wsUrl,getToken} from '../api'
import {Badge,Empty} from '../ui'
import LiveMap,{icons,route} from '../Map'
const ok=p=>p&&p[0]!=null
export default function Tracking(){
  const [q,setQ]=useState(new URLSearchParams(location.search).get('id')||''),[s,setS]=useState(null),[bad,setBad]=useState(false),[line,setLine]=useState([]),[idle,setIdle]=useState(false),[live,setLive]=useState(false)
  const load=async v=>{try{setS(await api('/track/'+encodeURIComponent(v.trim())));setBad(false);setIdle(false)}catch{setS(null);setBad(true)}}
  const go=()=>q.trim()&&load(q)
  useEffect(()=>{
    if(q.trim())return void load(q)
    api('/shipments').then(l=>{const m=l.find(x=>!['Delivered','Cancelled'].includes(x.status))||l[0];if(m){setQ(m.tracking_id);load(m.tracking_id)}else setIdle(true)}).catch(()=>setIdle(true))
  },[])
  useEffect(()=>{if(!s)return;const t=setInterval(()=>api('/track/'+s.tracking_id).then(setS).catch(()=>{}),10000);return()=>clearInterval(t)},[s?.tracking_id])
  useEffect(()=>{
    if(!s||!s.courier_pos||['Delivered','Cancelled','Failed'].includes(s.status))return
    let ws;try{ws=new WebSocket(wsUrl('/ws/track/'+s.tracking_id+'?token='+getToken()))}catch{return}
    ws.onopen=()=>setLive(true);ws.onclose=()=>setLive(false)
    ws.onmessage=e=>{const p=JSON.parse(e.data);setS(v=>v?{...v,courier_pos:[p.lat,p.lng]}:v)}
    return()=>ws.close()
  },[s?.tracking_id,!!s?.courier_pos])
  useEffect(()=>{if(s&&ok(s.pickup_pos)&&ok(s.dest_pos))route(s.pickup_pos,s.dest_pos).then(r=>setLine(r?r.pts:[s.pickup_pos,s.dest_pos]))},[s?.tracking_id])
  const i=s?stageOf[s.status]??0:0
  const mk=s?[ok(s.pickup_pos)&&{pos:s.pickup_pos,icon:icons.pickup,label:'Pickup · '+s.pickup},ok(s.dest_pos)&&{pos:s.dest_pos,icon:icons.dest,label:'Destination · '+s.destination},ok(s.courier_pos)&&{pos:s.courier_pos,icon:icons.courier,label:'Courier · '+s.courier+' (live)',smooth:true}].filter(Boolean):[]
  return <div className="max-w-4xl mx-auto">
    <h1 className="text-2xl font-black gt mb-1 inline-block">LIVE PACKAGE TRACKING</h1><p className="text-xs text-white/50 mb-4">You can track your own packages only.</p>
    <div className="flex gap-2 mb-4"><input className="inp" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="ENTER YOUR TRACKING ID"/><button className="btn whitespace-nowrap" onClick={go}>LOCATE PACKAGE</button></div>
    {bad?<Empty kind="search" title="Package not found" text={`We couldn’t find “${q}” in your account. You can only track your own packages.`}/>
    :idle?<Empty kind="box" title="No packages to track" text="Book a courier first, or enter a tracking ID."/>
    :!s?<p className="text-white/50">Loading…</p>:<>
      <div className="mb-4 popin">{mk.length?<LiveMap markers={mk} line={line}/>:<div className="glass p-6 text-white/60 text-sm">This shipment has no map coordinates.</div>}
        <p className="text-xs text-white/40 mt-1">{ok(s.courier_pos)?(live?'🟢 Live: the truck moves in real time.':'Courier position refreshes every 10 seconds.'):'Waiting for the courier to share a location.'}</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">{[['PACKAGE ID',s.tracking_id],['STATUS',<Badge s={s.status}/>],['PRIORITY',<Badge s={s.priority}/>],['DISTANCE',s.distance_km?s.distance_km.toFixed(1)+' KM':'–'],['ETA',s.eta_min?s.eta_min+' min':'–']].map(([l,v],k)=><motion.div key={l} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:k*.07}} className="glass stat p-3"><div className="text-xs text-white/50 tracking-widest">{l}</div><div className="font-bold mt-1 text-sm">{v}</div></motion.div>)}</div>
      <div className="glass p-5 relative">
        <div className="absolute left-[27px] top-7 bottom-7 w-0.5 bg-white/10"><motion.div className="w-full bg-cyan-400" initial={{height:0}} animate={{height:`${i/5*100}%`}} transition={{duration:1.2}}/></div>
        {STAGES.map((t,k)=><motion.div key={t} initial={{opacity:0,x:-14}} animate={{opacity:1,x:0}} transition={{delay:.1+k*.08}} className="flex gap-4 items-center mb-5 last:mb-0 relative">
          <motion.span animate={k===i?{boxShadow:['0 0 0 #22d3ee','0 0 18px #22d3ee','0 0 0 #22d3ee']}:{}} transition={{repeat:Infinity,duration:1.6}} className={`w-4 h-4 rounded-full ${k<=i?'bg-cyan-400':'bg-[#1b2234]'}`}/>
          <span className={k<=i?'text-white':'text-white/40'}>{t}</span></motion.div>)}
      </div></>}
  </div>
}

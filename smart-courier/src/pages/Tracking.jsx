import {useState,useEffect} from 'react'
import {motion} from 'framer-motion'
import {SearchX} from 'lucide-react'
import {STAGES,stageOf} from '../data'
import {api} from '../api'
import {Badge,Empty} from '../ui'
import LiveMap,{icons,route} from '../Map'
const ok=p=>p&&p[0]!=null
export default function Tracking(){
  const [q,setQ]=useState(new URLSearchParams(location.search).get('id')||'SC-2026-94821'),[s,setS]=useState(null),[bad,setBad]=useState(false),[line,setLine]=useState([])
  const go=async()=>{try{setS(await api('/track/'+encodeURIComponent(q.trim())));setBad(false)}catch{setBad(true)}}
  useEffect(()=>{go()},[])
  useEffect(()=>{if(!s)return;const t=setInterval(()=>api('/track/'+s.tracking_id).then(setS).catch(()=>{}),5000);return()=>clearInterval(t)},[s?.tracking_id])
  useEffect(()=>{if(s&&ok(s.pickup_pos)&&ok(s.dest_pos))route(s.pickup_pos,s.dest_pos).then(r=>setLine(r?r.pts:[s.pickup_pos,s.dest_pos]))},[s?.tracking_id])
  const i=s?stageOf[s.status]??0:0
  const mk=s?[ok(s.pickup_pos)&&{pos:s.pickup_pos,icon:icons.pickup,label:'Pickup · '+s.pickup},ok(s.dest_pos)&&{pos:s.dest_pos,icon:icons.dest,label:'Destination · '+s.destination},ok(s.courier_pos)&&{pos:s.courier_pos,icon:icons.courier,label:'Courier · '+s.courier+' (live)'}].filter(Boolean):[]
  return <div className="max-w-4xl mx-auto">
    <h1 className="text-2xl font-black gt mb-4">LIVE PACKAGE TRACKING</h1>
    <div className="flex gap-2 mb-4"><input className="inp" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="ENTER TRACKING ID"/><button className="btn whitespace-nowrap" onClick={go}>LOCATE PACKAGE</button></div>
    {!s&&!bad?<p className="text-white/50">Loading…</p>:bad?<Empty kind="search" title="Package not found" text={`No package found for “${q}”. Check the ID and try again.`}/>:<>
      <div className="mb-4">{mk.length?<LiveMap markers={mk} line={line}/>:<div className="glass p-6 text-white/60 text-sm">This shipment has no map coordinates.</div>}
        <p className="text-xs text-white/40 mt-1">{ok(s.courier_pos)?'Courier position updates every 5 seconds.':'Waiting for the courier to share a location.'}</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">{[['PACKAGE ID',s.tracking_id],['STATUS',<Badge s={s.status}/>],['DISTANCE',s.distance_km?s.distance_km.toFixed(1)+' KM':'–'],['ETA',s.eta_min?s.eta_min+' min':'–']].map(([l,v])=><div key={l} className="glass p-3"><div className="text-xs text-white/50 tracking-widest">{l}</div><div className="font-bold mt-1 text-sm">{v}</div></div>)}</div>
      <div className="glass p-5 relative">
        <div className="absolute left-[27px] top-7 bottom-7 w-0.5 bg-white/10"><motion.div className="w-full bg-cyan-400" initial={{height:0}} animate={{height:`${i/5*100}%`}} transition={{duration:1.2}}/></div>
        {STAGES.map((t,k)=><div key={t} className="flex gap-4 items-center mb-5 last:mb-0 relative">
          <motion.span animate={k===i?{boxShadow:['0 0 0 #22d3ee','0 0 18px #22d3ee','0 0 0 #22d3ee']}:{}} transition={{repeat:Infinity,duration:1.6}} className={`w-4 h-4 rounded-full ${k<=i?'bg-cyan-400':'bg-[#1b2234]'}`}/>
          <span className={k<=i?'text-white':'text-white/40'}>{t}</span></div>)}
      </div></>}
  </div>
}

import {useState} from 'react'
import {motion} from 'framer-motion'
import {api,useApi} from '../api'
import {useApp,Badge,Empty,Counter} from '../ui'
import {Head,Table} from './Dash'
const Wait=({d,e})=>e?<p className="text-red-400 mb-3">{e}</p>:d===null?<p className="text-white/50">Loading…</p>:null
export function WhatIf(){
  const {data,err}=useApi('/admin/whatif'),[s,setS]=useState({extra:0,demand:0,cap:6,cost:900})
  if(!data)return <Wait d={data} e={err}/>
  const calc=(cour,dem)=>{
    const lam=data.orders_per_day*(1+dem/100),cap=Math.max(cour,0)*s.cap,rho=cap?Math.min(lam/cap,.97):.97
    const minutes=Math.round(data.base_minutes*(1+rho*rho/(1-rho))),risk=Math.round(Math.min(95,Math.max(0,(rho-.7)*200))),cost=Math.max(cour,0)*s.cost,rev=lam*data.avg_price
    return{cour:Math.max(cour,0),lam:+lam.toFixed(1),rho:Math.round(rho*100),minutes,risk,cost:Math.round(cost),per:lam?Math.round(cost/lam):0,rev:Math.round(rev),profit:Math.round(rev/1.18-cost)}
  }
  const a=calc(data.couriers,0),b=calc(data.couriers+s.extra,s.demand)
  let need=1;while(need<80&&calc(need,s.demand).minutes>data.base_minutes*1.3)need++
  const rows=[['Online couriers','cour',0],['Orders per day','lam',0],['Courier utilisation (%)','rho',-1],['Avg delivery time (min)','minutes',-1],['Orders at risk of delay (%)','risk',-1],['Courier cost per day (₹)','cost',-1],['Cost per delivery (₹)','per',-1],['Revenue per day (₹)','rev',1],['Contribution per day (₹)','profit',1]]
  const Sl=({k,l,min,max,step=1})=><label className="text-xs text-white/60 block">{l}: <b className="text-white">{s[k]}</b><input type="range" min={min} max={max} step={step} value={s[k]} onChange={e=>setS({...s,[k]:+e.target.value})} className="w-full"/></label>
  return <div><Head t="WHAT-IF SIMULATION" sub="TEST A CHANGE BEFORE YOU MAKE IT"/>
    <div className="grid lg:grid-cols-3 gap-4">
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="glass p-5 space-y-4"><div className="font-bold">Scenario</div>
        <Sl k="extra" l="Add or remove couriers" min={-Math.max(data.couriers-1,0)} max={15}/><Sl k="demand" l="Change in demand (%)" min={-50} max={150} step={5}/><Sl k="cap" l="Deliveries per courier per day" min={2} max={30}/><Sl k="cost" l="Courier cost per day (₹)" min={300} max={2000} step={50}/>
        <p className="text-xs text-white/40">Based on your last 14 days: {data.orders_per_day} orders a day, average ₹{data.avg_price} and {data.avg_km} km. A simple queue model estimates delays, so treat the results as a guide.</p></motion.div>
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.1}} className="glass p-5 lg:col-span-2"><div className="font-bold mb-3">Today vs scenario</div>
        <div className="mb-4"><div className="flex justify-between text-xs text-white/60 mb-1"><span>Courier utilisation</span><span>{a.rho}% → {b.rho}%</span></div><div className="h-2.5 rounded bg-white/10 overflow-hidden"><motion.div className={b.rho>85?'h-full bg-red-400':b.rho>65?'h-full bg-amber-300':'h-full bg-emerald-400'} animate={{width:b.rho+'%'}}/></div></div>
        <Table heads={['Metric','Today','Scenario','Change']}>{rows.map(([l,k,good])=>{const dlt=b[k]-a[k],ok=good===0?null:(dlt*good>0);return <tr key={k} className="border-t border-white/5"><td className="p-3">{l}</td><td className="p-3">{a[k].toLocaleString('en-IN')}</td><td className="p-3 font-bold">{b[k].toLocaleString('en-IN')}</td><td className={`p-3 ${ok===null||dlt===0?'text-white/50':ok?'text-emerald-300':'text-red-300'}`}>{dlt>0?'+':''}{dlt.toLocaleString('en-IN')}</td></tr>})}</Table>
        <p className="text-sm mt-4">💡 To keep average delivery time within 30% of today’s base time at this demand, you need about <b className="gt"><Counter to={need}/> couriers</b>.</p></motion.div>
    </div></div>
}
export function Fraud(){
  const {data,err,reload}=useApi('/admin/fraud'),list=data||[]
  const tone={high:'bg-red-400/15 text-red-300',medium:'bg-amber-400/15 text-amber-300'}
  return <div><Head t="FRAUD AND ANOMALY ALERTS" sub={`${list.length} ALERTS`}/>
    <Wait d={data} e={err}/>
    <div className="mb-4"><button className="btn2" onClick={reload}>↻ REFRESH</button></div>
    {list.length?<div className="space-y-2">{list.map((a,i)=><motion.div key={i} initial={{opacity:0,x:-14}} animate={{opacity:1,x:0}} transition={{delay:Math.min(i,10)*.04}} className="glass p-4 flex flex-wrap items-center gap-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${tone[a.severity]}`}>{a.severity}</span><div className="flex-1 min-w-[200px]"><b>{a.type}</b> · {a.subject}<div className="text-sm text-white/60">{a.detail}</div></div></motion.div>)}</div>
    :data!==null&&<Empty kind="search" title="No suspicious activity" text="Cancellation patterns, cash-on-delivery behaviour and GPS jumps look normal."/>}
    <p className="text-xs text-white/40 mt-4">Rules: 3+ cancellations (half of bookings or more) in 30 days; 2+ cancelled or failed cash-on-delivery orders; more than ₹10,000 cash on delivery in 7 days; GPS moves above 150 km/h between two fixes.</p></div>
}
export function Reattempts(){
  const {toast}=useApp(),{data,err,reload}=useApi('/admin/reattempts'),list=data||[]
  const go=(id,when)=>api(`/admin/reattempts/${id}/schedule`,{method:'POST',body:{when}}).then(()=>{toast('Redelivery scheduled');reload()}).catch(x=>toast(x.message))
  return <div><Head t="REATTEMPT PLANNER" sub={`${list.length} FAILED DELIVERIES`}/>
    <Wait d={data} e={err}/>
    {list.length?<div className="grid lg:grid-cols-2 gap-4">{list.map((f,i)=><motion.div key={f.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*.06}} className="glass p-5">
      <div className="flex justify-between"><b className="text-cyan-300">{f.tracking_id}</b><Badge s="Failed"/></div><div className="text-sm text-white/70 mt-1">{f.customer} · {f.destination}</div>
      <div className="text-xs text-white/50 mt-1">Previous courier: {f.previous_courier||'–'} · Best match now: {f.best_match||'none free'}</div>
      <div className="text-xs text-white/60 mt-3 mb-2">Best times for tomorrow, based on when this customer and others receive parcels:</div>
      <div className="flex flex-wrap gap-2">{f.slots.map(sl=><button key={sl.when} className={sl.recommended?'btn !py-1.5 text-xs':'btn2 !py-1.5 text-xs'} onClick={()=>go(f.id,sl.when)}>{sl.recommended?'⭐ ':''}{sl.label}</button>)}</div></motion.div>)}</div>
    :data!==null&&<Empty kind="box" title="No failed deliveries" text="When a courier marks a parcel as failed, it shows up here with the best time for a second attempt."/>}</div>
}
export function Safety(){
  const {toast}=useApp(),{data,err,reload}=useApi('/admin/safety'),list=data||[]
  const demo=()=>api('/admin/safety/demo',{method:'POST'}).then(()=>{toast('Demo data generated');reload()}).catch(x=>toast(x.message))
  return <div><Head t="SHIFT AND SAFETY MONITOR" sub="LAST 24 HOURS OF REAL GPS DATA"/>
    <Wait d={data} e={err}/>
    <div className="flex flex-wrap gap-2 mb-4"><button className="btn2" onClick={reload}>↻ REFRESH</button><button className="btn2" onClick={demo}>GENERATE DEMO DATA</button></div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{list.map((c,i)=><motion.div key={c.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*.06}} className="glass stat p-5">
      <div className="flex justify-between items-start"><div><b>{c.name}</b><div className="text-xs text-white/50">{c.vehicle}</div></div><div className="flex flex-wrap gap-1 justify-end">{c.flags.length?c.flags.map(f=><span key={f} className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-400/15 text-red-300">{f}</span>):<span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/15 text-emerald-300">OK</span>}</div></div>
      <div className="grid grid-cols-3 gap-2 text-center mt-4"><div><b className="block text-xl gt">{c.shift_hours}h</b><span className="text-[11px] text-white/50">shift</span></div><div><b className="block text-xl gt">{c.top_speed}</b><span className="text-[11px] text-white/50">top km/h</span></div><div><b className="block text-xl gt">{c.speeding_events}</b><span className="text-[11px] text-white/50">speeding</span></div></div>
      <div className="text-[11px] text-white/40 mt-3">{c.pings} GPS points</div></motion.div>)}</div>
    {data!==null&&!list.some(c=>c.pings)&&<div className="mt-4"><Empty kind="wifi" title="No GPS history yet" text="Couriers who use “Share live GPS” build this history. Demo drives are not recorded. Use Generate Demo Data to see how alerts look."/></div>}
    <p className="text-xs text-white/40 mt-4">Flags: long shift = more than 9 hours of activity in 24 hours; speeding = 3 or more readings above 70 km/h.</p></div>
}
export function AuditLog(){
  const [q,setQ]=useState(''),{data,err}=useApi('/admin/audit?q='+encodeURIComponent(q)),list=data||[]
  return <div><Head t="ACTIVITY LOG" sub="WHO CHANGED WHAT"/>
    <Wait d={data} e={err}/>
    <input className="inp mb-3" placeholder="Search by person or action…" value={q} onChange={e=>setQ(e.target.value)}/>
    {list.length?<Table heads={['When','Who','Action','Details']}>{list.map(a=><tr key={a.id} className="border-t border-white/5"><td className="p-3 whitespace-nowrap">{new Date(a.at).toLocaleString()}</td><td className="p-3">{a.actor}</td><td className="p-3 text-cyan-300">{a.action}</td><td className="p-3 text-white/50 text-xs">{a.detail}</td></tr>)}</Table>
    :data!==null&&<Empty kind="search" title="No activity yet" text="Changes made by admins, and locked logins, are recorded here."/>}
    <p className="text-xs text-white/40 mt-3">Logins lock for 15 minutes after 5 wrong passwords. The lock resets if the server restarts.</p></div>
}

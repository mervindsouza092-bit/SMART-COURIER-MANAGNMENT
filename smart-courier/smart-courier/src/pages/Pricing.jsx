import {useState,useEffect} from 'react'
import {motion} from 'framer-motion'
import {api,useApi} from '../api'
import {useApp,Counter,Badge} from '../ui'
import {Head} from './Dash'
const FIELDS=[['base','Base charge (₹)'],['per_kg','Per kg (₹)'],['per_km','Per km (₹)'],['fee','Delivery fee (₹)'],['min_charge','Minimum charge (₹)'],['tax_pct','Tax (%)'],['rush_pct','Rush-hour surcharge (%)'],['weather_pct','Rain surge (%)'],['demand_pct','High-demand surge (%)'],['courier_pct','Courier payout (% of fare)']]
export default function Pricing(){
  const {toast}=useApp(),{data,err}=useApi('/pricing'),[p,setP]=useState(null),[ex,setEx]=useState({w:2,km:12}),[busy,setBusy]=useState(false)
  useEffect(()=>{if(data)setP({...data,multipliers:{...data.multipliers}})},[data])
  if(err)return <p className="text-red-400">{err}</p>
  if(!p)return <p className="text-white/50">Loading…</p>
  const v=k=>+p[k]||0
  const price=pr=>{const c=Math.max((v('base')+ex.w*v('per_kg')+ex.km*v('per_km'))*(+p.multipliers[pr]||1),v('min_charge'));return Math.round((c+v('fee'))*(1+v('tax_pct')/100))}
  const save=()=>{
    setBusy(true)
    api('/admin/pricing',{method:'PUT',body:{base:v('base'),per_kg:v('per_kg'),per_km:v('per_km'),fee:v('fee'),min_charge:v('min_charge'),tax_pct:v('tax_pct'),rush_pct:v('rush_pct'),weather_pct:v('weather_pct'),demand_pct:v('demand_pct'),courier_pct:v('courier_pct'),multipliers:Object.fromEntries(Object.entries(p.multipliers).map(([k,x])=>[k,+x]))}})
      .then(()=>toast('Pricing saved. New bookings use these prices')).catch(x=>toast(x.message)).finally(()=>setBusy(false))
  }
  return <div><Head t="PRICING" sub="SET WHAT CUSTOMERS PAY"/>
    {Object.keys(p.live_surge||{}).length>0&&<motion.div initial={{opacity:0}} animate={{opacity:1}} className="glass p-3 mb-4 text-sm text-amber-300">⚡ Live surge active right now: {Object.entries(p.live_surge).map(([k,x])=>`${k} +${x}%`).join(', ')}</motion.div>}
    <div className="grid lg:grid-cols-2 gap-4">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass p-5"><div className="font-bold mb-3">Rates</div>
        <div className="grid grid-cols-2 gap-3">{FIELDS.map(([k,l],i)=><motion.label key={k} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.05*i}} className="text-xs text-white/60">{l}<input className="inp mt-1" type="number" min="0" step="any" value={p[k]} onChange={e=>setP({...p,[k]:e.target.value})}/></motion.label>)}</div>
        <p className="text-xs text-white/40 mt-3">Price = (base + weight × per kg + distance × per km) × priority multiplier, at least the minimum charge, plus the delivery fee and tax. Surcharges add up: rush hour (8 to 10 am, 5 to 8 pm IST), rain (live weather near Vasai-Virar) and high demand (more than 3 open parcels per online courier, scaling up to the full percentage at 6). Set a surcharge to 0 to switch it off.</p></motion.div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1}} className="glass p-5"><div className="font-bold mb-3">Priority levels</div>
        {p.priorities.map((pr,i)=><motion.div key={pr} initial={{opacity:0,x:-14}} animate={{opacity:1,x:0}} transition={{delay:.1+i*.06}} className="flex items-center justify-between gap-3 py-2 border-t border-white/10"><div><Badge s={pr}/><div className="text-xs text-white/50 mt-1">{p.etas[pr]}</div></div>
          <label className="text-xs text-white/60 flex items-center gap-2">× <input className="inp !w-24 !py-1.5" type="number" min="0.1" max="10" step="0.05" value={p.multipliers[pr]} onChange={e=>setP({...p,multipliers:{...p.multipliers,[pr]:e.target.value}})}/></label></motion.div>)}</motion.div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.2}} className="glass p-5 lg:col-span-2"><div className="font-bold mb-3">Price preview</div>
        <div className="grid sm:grid-cols-2 gap-4 mb-4"><label className="text-xs text-white/60">Weight: {ex.w} kg<input type="range" min="0.5" max="30" step="0.5" value={ex.w} onChange={e=>setEx({...ex,w:+e.target.value})} className="w-full"/></label><label className="text-xs text-white/60">Distance: {ex.km} km<input type="range" min="1" max="60" step="1" value={ex.km} onChange={e=>setEx({...ex,km:+e.target.value})} className="w-full"/></label></div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{p.priorities.map(pr=><div key={pr} className="glass stat p-3 text-center"><Badge s={pr}/><div className="text-xl font-black gt mt-2 inline-block"><Counter to={price(pr)} prefix="₹"/></div></div>)}</div></motion.div>
    </div>
    <div className="flex justify-end mt-4"><button className="btn" disabled={busy} onClick={save}>{busy?'SAVING…':'SAVE PRICING'}</button></div>
  </div>
}

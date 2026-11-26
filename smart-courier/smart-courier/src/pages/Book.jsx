import {useState,useEffect} from 'react'
import {motion} from 'framer-motion'
import {Check} from 'lucide-react'
import {useApp} from '../ui'
import {api,download} from '../api'
import {geocode,route} from '../Map'
import {payNow} from '../pay'
const steps=[['Pickup Details',['Pickup Address']],['Delivery Details',['Delivery Address']],['Package Details',['Package Type','Package Weight (kg)','Package Size']],['Delivery Priority',[]],['Payment',[]]]
const ICON={Highest:'⚡',High:'🔥',Normal:'📦',Low:'🐢',Lowest:'🌱'}
const localNow=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)
export default function Book(){
  const {user,toast}=useApp(),[n,setN]=useState(0),[f,setF]=useState({}),[prio,setPrio]=useState('Normal'),[quotes,setQuotes]=useState([]),[pay,setPay]=useState('UPI')
  const [done,setDone]=useState(false),[err,setErr]=useState(''),[tid,setTid]=useState(''),[otp,setOtp]=useState(''),[sid,setSid]=useState(0),[unpaid,setUnpaid]=useState(false),[pos,setPos]=useState({}),[km,setKm]=useState(0),[busy,setBusy]=useState(false)
  const [saved,setSaved]=useState([]),[when,setWhen]=useState('now'),[at,setAt]=useState(''),[code,setCode]=useState(''),[promo,setPromo]=useState(null)
  const loadSaved=()=>api('/addresses').then(setSaved).catch(()=>{})
  useEffect(()=>{loadSaved()},[])
  const w=parseFloat(f['Package Weight (kg)'])||1,q=quotes.find(x=>x.priority===prio)||{cost:0,fee:0,tax:0,total:0},final=Math.max(q.total-(promo?.discount||0),0)
  const key=n?'dest':'pick',field=n?'Delivery Address':'Pickup Address'
  const useMine=()=>navigator.geolocation?.getCurrentPosition(async p=>{const {latitude:lat,longitude:lng}=p.coords;let name=`${lat.toFixed(4)}, ${lng.toFixed(4)}`;try{name=(await(await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)).json()).display_name||name}catch{}setF(v=>({...v,'Pickup Address':name}));setPos(v=>({...v,pick:{lat,lng,name,q:name}}))},()=>setErr('Location permission denied. Please type the address instead.'))
  const useSaved=a=>{setF(v=>({...v,[field]:a.address}));if(a.lat!=null)setPos(v=>({...v,[key]:{lat:a.lat,lng:a.lng,name:a.address,q:a.address}}))}
  const saveAs=label=>{const g=pos[key];api('/addresses',{method:'POST',body:{label,address:f[field],lat:g?.lat??null,lng:g?.lng??null}}).then(()=>{toast(`Saved as ${label}`);loadSaved()}).catch(x=>toast(x.message))}
  const applyPromo=()=>api('/promo/check',{method:'POST',body:{code,amount:q.total}}).then(r=>{setPromo(r);toast(`${r.code} applied`)}).catch(x=>{setPromo(null);setErr(x.message)})
  const next=async()=>{
    if(steps[n][1].some(k=>!f[k]?.trim()))return setErr('Please fill all fields.')
    if(n===0&&when==='later'&&!at)return setErr('Choose a pickup date and time, or pick up as soon as possible.')
    setErr('')
    if(n<2){
      setBusy(true)
      let g=pos[key]&&pos[key].q===f[field]?pos[key]:null
      if(!g){const r=await geocode(f[field]);if(!r){setBusy(false);return setErr('We could not find that address on the map. Add the area or city name.')}g={...r,q:f[field]};setPos(p=>({...p,[key]:g}))}
      if(n===1){const r=await route([pos.pick.lat,pos.pick.lng],[g.lat,g.lng]);setKm(r?r.km:0)}
      setBusy(false)
    }
    if(n===2){setBusy(true);try{setQuotes(await api('/pricing/quote',{method:'POST',body:{weight:w,distance_km:km}}))}catch(x){setBusy(false);return setErr(x.message)}setBusy(false)}
    if(n<4){setN(n+1);return}
    try{
      const r=await api('/shipments',{method:'POST',body:{pickup:f['Pickup Address'],destination:f['Delivery Address'],package:f['Package Type'],weight:w,plat:pos.pick.lat,plng:pos.pick.lng,dlat:pos.dest.lat,dlng:pos.dest.lng,distance_km:km,payment_method:pay,priority:prio,scheduled_for:when==='later'?at:null,promo:promo?.code||null}})
      setTid(r.tracking_id);setOtp(r.otp);setSid(r.id)
      if(r.payment_status==='Paid'||pay==='Cash on Delivery')toast(pay==='Cash on Delivery'?'Booking confirmed. Pay cash on delivery':'Booking confirmed')
      else{try{await payNow(r.id,user);toast('Payment successful. Courier assigned')}catch(x){setUnpaid(true);toast(x.message)}}
      setDone(true)
    }catch(x){setErr(x.message)}
  }
  if(done)return <motion.div initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}} className="glass max-w-md mx-auto p-10 text-center"><div className="w-16 h-16 rounded-full bg-emerald-400/20 grid place-items-center mx-auto mb-3"><Check className="text-emerald-300" size={34}/></div>
    <div className="text-xl font-black gt inline-block">{unpaid?'PAYMENT PENDING':pay==='Cash on Delivery'?'BOOKING CONFIRMED':'PAYMENT SUCCESSFUL'}</div>
    <p className="text-white/60 mt-2">Tracking ID: {tid}<br/>Priority: {prio}{when==='later'&&<><br/>Pickup: {new Date(at).toLocaleString()}</>}<br/>Delivery OTP: <b className="text-cyan-300 tracking-widest">{otp}</b><br/><span className="text-xs">Share this code with the courier only when you receive the parcel.</span><br/>
      <button className="btn mt-4" onClick={()=>download(`/shipments/${sid}/invoice`,`invoice-${tid}.pdf`).catch(x=>toast(x.message))}>DOWNLOAD INVOICE & QR LABEL</button>
      {unpaid&&<button className="btn2 mt-3 ml-2" onClick={()=>payNow(sid,user).then(()=>{setUnpaid(false);toast('Payment successful')}).catch(x=>toast(x.message))}>PAY NOW</button>}<br/>
      ₹{final} · {unpaid?'not paid yet':pay==='Cash on Delivery'?'cash on delivery':`paid via ${pay}`}</p></motion.div>
  return <div className="max-w-2xl mx-auto">
    <h1 className="text-2xl font-black gt mb-4 inline-block">BOOK COURIER</h1>
    <div className="flex gap-1 mb-5">{steps.map((s,i)=><div key={s[0]} className="flex-1"><motion.div className="h-1 rounded bg-white/10 overflow-hidden"><motion.div className="h-full bg-cyan-400" animate={{width:i<=n?'100%':'0%'}}/></motion.div><div className={`text-[10px] mt-1 hidden sm:block ${i<=n?'text-cyan-300':'text-white/40'}`}>STEP 0{i+1}</div></div>)}</div>
    <div className="glass p-6 space-y-3"><div className="font-bold">{steps[n][0]}</div>
      {n<2&&saved.length>0&&<div className="flex flex-wrap gap-2">{saved.map(a=><button key={a.id} className="btn2 !py-1 !px-3 text-xs" onClick={()=>useSaved(a)}>🏠 {a.label}</button>)}</div>}
      {steps[n][1].map(k=><input key={k} className="inp" placeholder={k} value={f[k]||''} onChange={e=>setF({...f,[k]:e.target.value})}/>)}
      {n===0&&<button className="btn2 text-sm" onClick={useMine}>📍 USE MY CURRENT LOCATION</button>}
      {n<2&&pos[key]&&pos[key].q===f[field]&&<div className="flex flex-wrap items-center gap-2"><p className="text-xs text-emerald-300 flex-1 min-w-[200px]">Found on map: {pos[key].name}</p>{['Home','Office'].map(l=><button key={l} className="btn2 !py-1 !px-3 text-xs" onClick={()=>saveAs(l)}>💾 Save as {l}</button>)}</div>}
      {n===0&&<div className="space-y-2"><div className="flex gap-2"><button className={when==='now'?'btn !py-1.5 text-xs':'btn2 !py-1.5 text-xs'} onClick={()=>setWhen('now')}>⚡ PICK UP ASAP</button><button className={when==='later'?'btn !py-1.5 text-xs':'btn2 !py-1.5 text-xs'} onClick={()=>setWhen('later')}>🕒 SCHEDULE PICKUP</button></div>
        {when==='later'&&<input type="datetime-local" className="inp" min={localNow()} value={at} onChange={e=>setAt(e.target.value)}/>}</div>}
      {n===3&&quotes[0]?.surge_pct>0&&<p className="text-xs text-amber-300">⚡ Prices include a +{quotes[0].surge_pct}% surge ({quotes[0].surge.join(', ')}).</p>}
      {n===3&&<div className="space-y-2">{quotes.map((o,i)=><motion.button key={o.priority} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*.07}} whileHover={{x:4}} onClick={()=>{setPrio(o.priority);setPromo(null)}} className={`glass w-full p-3 text-left flex items-center justify-between ${prio===o.priority?'!border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,.35)]':''}`}><span className="flex items-center gap-3"><span className="text-xl">{ICON[o.priority]}</span><span><b>{o.priority} priority</b><span className="block text-xs text-white/50">{o.eta}</span></span></span><span className="text-cyan-300 font-bold">₹{o.total}</span></motion.button>)}</div>}
      {n===4&&<><div className="text-sm space-y-1">{[[`Shipment cost (${km.toFixed(1)} km, ${prio} priority)`,q.cost],['Delivery fee',q.fee],['Tax',q.tax]].map(([l,v])=><div key={l} className="flex justify-between"><span className="text-white/60">{l}</span>₹{v}</div>)}
        {promo&&<div className="flex justify-between text-emerald-300"><span>Promo {promo.code}</span>−₹{promo.discount}</div>}
        <div className="flex justify-between font-bold border-t border-white/10 pt-2">Total<span className="gt">₹{final}</span></div></div>
        <div className="flex gap-2"><input className="inp" placeholder="Promo code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/><button className="btn2" onClick={applyPromo} disabled={!code.trim()}>APPLY</button></div>
        <div className="flex gap-2">{['UPI','Card','Cash on Delivery'].map(p=><button key={p} onClick={()=>setPay(p)} className={pay===p?'btn !py-2 text-xs':'btn2 !py-2 text-xs'}>{p}</button>)}</div></>}
      {err&&<p className="text-red-400 text-sm">{err}</p>}
      <div className="flex justify-between pt-2">{n>0?<button className="btn2" onClick={()=>setN(n-1)}>BACK</button>:<span/>}<button className="btn" disabled={busy} onClick={next}>{busy?'PLEASE WAIT…':n===4?'CONFIRM PAYMENT':'CONTINUE'}</button></div>
    </div></div>
}

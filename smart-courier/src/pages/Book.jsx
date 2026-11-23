import {useState} from 'react'
import {motion} from 'framer-motion'
import {Check} from 'lucide-react'
import {useApp} from '../ui'
import {api,download} from '../api'
import {geocode,route} from '../Map'
import {payNow} from '../pay'
import {couriers} from '../data'
const steps=[['Pickup Details',['Pickup Address','Preferred Pickup Time']],['Delivery Details',['Delivery Address']],['Package Details',['Package Type','Package Weight (kg)','Package Size']],['Courier Selection',[]],['Payment',[]]]
export default function Book(){
  const {user,toast}=useApp(),[n,setN]=useState(0),[f,setF]=useState({}),[cr,setCr]=useState(''),[pay,setPay]=useState('UPI'),[done,setDone]=useState(false),[tid,setTid]=useState(''),[otp,setOtp]=useState(''),[sid,setSid]=useState(0),[unpaid,setUnpaid]=useState(false),[pos,setPos]=useState({}),[km,setKm]=useState(0),[busy,setBusy]=useState(false),[err,setErr]=useState('')
  const w=parseFloat(f['Package Weight (kg)'])||1,cost=Math.round(80+w*25+km*8),fee=49,tax=Math.round((cost+fee)*.18),total=Math.round(cost+fee+tax)
  const useMine=()=>navigator.geolocation?.getCurrentPosition(async p=>{const {latitude:lat,longitude:lng}=p.coords;let name=`${lat.toFixed(4)}, ${lng.toFixed(4)}`;try{name=(await(await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)).json()).display_name||name}catch{}setF(v=>({...v,'Pickup Address':name}));setPos(v=>({...v,pick:{lat,lng,name,q:name}}))},()=>setErr('Location permission denied. Please type the address instead.'))
  const next=async()=>{
    if(steps[n][1].some(k=>!f[k]?.trim()))return setErr('Please fill all fields.')
    if(n===3&&!cr)return setErr('Select a courier.')
    setErr('')
    if(n<2){setBusy(true);const key=n?'dest':'pick',addr=f[n?'Delivery Address':'Pickup Address']
      let g=pos[key]&&pos[key].q===addr?pos[key]:null
      if(!g){const r=await geocode(addr);if(!r){setBusy(false);return setErr('We could not find that address on the map. Add the area or city name.')}g={...r,q:addr};setPos(p=>({...p,[key]:g}))}
      if(n===1){const r=await route([pos.pick.lat,pos.pick.lng],[g.lat,g.lng]);setKm(r?r.km:0)}
      setBusy(false)}
    if(n<4)setN(n+1);else{try{const r=await api('/shipments',{method:'POST',body:{pickup:f['Pickup Address'],destination:f['Delivery Address'],package:f['Package Type'],weight:w,plat:pos.pick.lat,plng:pos.pick.lng,dlat:pos.dest.lat,dlng:pos.dest.lng,distance_km:km,payment_method:pay}});setTid(r.tracking_id);setOtp(r.otp);setSid(r.id)
      if(pay==='Cash on Delivery')toast('Booking confirmed. Pay cash on delivery')
      else{try{await payNow(r.id,user);toast('Payment successful. Courier assigned')}catch(x){setUnpaid(true);toast(x.message)}}
      setDone(true)}catch(x){setErr(x.message)}}
  }
  if(done)return <motion.div initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}} className="glass max-w-md mx-auto p-10 text-center"><div className="w-16 h-16 rounded-full bg-emerald-400/20 grid place-items-center mx-auto mb-3"><Check className="text-emerald-300" size={34}/></div><div className="text-xl font-black gt">{unpaid?'PAYMENT PENDING':pay==='Cash on Delivery'?'BOOKING CONFIRMED':'PAYMENT SUCCESSFUL'}</div><p className="text-white/60 mt-2">Tracking ID: {tid}<br/>Delivery OTP: <b className="text-cyan-300 tracking-widest">{otp}</b><br/><span className="text-xs">Share this code with the courier only when you receive the parcel.</span><br/><button className="btn mt-4" onClick={()=>download(`/shipments/${sid}/invoice`,`invoice-${tid}.pdf`).catch(x=>toast(x.message))}>DOWNLOAD INVOICE & QR LABEL</button>{unpaid&&<button className="btn2 mt-3 ml-2" onClick={()=>payNow(sid,user).then(()=>{setUnpaid(false);toast('Payment successful')}).catch(x=>toast(x.message))}>PAY NOW</button>}<br/>₹{total} · {unpaid?'not paid yet':pay==='Cash on Delivery'?'cash on delivery':`paid via ${pay}`}</p></motion.div>
  return <div className="max-w-2xl mx-auto">
    <h1 className="text-2xl font-black gt mb-4">BOOK COURIER</h1>
    <div className="flex gap-1 mb-5">{steps.map((s,i)=><div key={s[0]} className="flex-1"><motion.div className="h-1 rounded bg-white/10 overflow-hidden"><motion.div className="h-full bg-cyan-400" animate={{width:i<=n?'100%':'0%'}}/></motion.div><div className={`text-[10px] mt-1 hidden sm:block ${i<=n?'text-cyan-300':'text-white/40'}`}>STEP 0{i+1}</div></div>)}</div>
    <div className="glass p-6 space-y-3"><div className="font-bold">{steps[n][0]}</div>
      {steps[n][1].map(k=><input key={k} className="inp" placeholder={k} value={f[k]||''} onChange={e=>setF({...f,[k]:e.target.value})}/>)}
      {n===0&&<button className="btn2 text-sm" onClick={useMine}>📍 USE MY CURRENT LOCATION</button>}
      {n<2&&pos[n?'dest':'pick']&&<p className="text-xs text-emerald-300">Found on map: {pos[n?'dest':'pick'].name}</p>}
      {n===3&&couriers.filter(c=>c.status!=='Offline').map(c=><button key={c.id} onClick={()=>setCr(c.id)} className={`glass w-full p-3 text-left flex justify-between ${cr===c.id?'!border-cyan-300':''}`}><span>{c.name} · {c.vehicle}</span><span className="text-cyan-300">{c.perf}%</span></button>)}
      {n===4&&<><div className="text-sm space-y-1">{[[`Shipment cost (${km.toFixed(1)} km)`,cost],['Delivery fee',fee],['Tax (18%)',tax]].map(([l,v])=><div key={l} className="flex justify-between"><span className="text-white/60">{l}</span>₹{v}</div>)}<div className="flex justify-between font-bold border-t border-white/10 pt-2">Total<span className="gt">₹{total}</span></div></div>
        <div className="flex gap-2">{['UPI','Card','Cash on Delivery'].map(p=><button key={p} onClick={()=>setPay(p)} className={pay===p?'btn !py-2 text-xs':'btn2 !py-2 text-xs'}>{p}</button>)}</div></>}
      {err&&<p className="text-red-400 text-sm">{err}</p>}
      <div className="flex justify-between pt-2">{n>0?<button className="btn2" onClick={()=>setN(n-1)}>BACK</button>:<span/>}<button className="btn" disabled={busy} onClick={next}>{busy?'LOCATING…':n===4?'CONFIRM PAYMENT':'CONTINUE'}</button></div>
    </div></div>
}

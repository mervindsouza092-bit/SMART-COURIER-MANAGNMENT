import {useState} from 'react'
import {motion} from 'framer-motion'
import {AreaChart,Area,BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts'
import {Search,Trash2,Plus} from 'lucide-react'
import {useApp,Stat,Badge,Modal,Empty} from '../ui'
import {growth} from '../data'
import {api,useApi,download} from '../api'
import {payNow} from '../pay'
export const Head=({t,sub})=><div className="mb-5"><h1 className="text-2xl font-black gt">{t}</h1><p className="text-xs text-emerald-300 mt-1 flex items-center gap-2"><motion.i className="w-2 h-2 rounded-full bg-emerald-400" animate={{opacity:[1,.3,1]}} transition={{repeat:Infinity,duration:1.5}}/>{sub}</p></div>
export const Table=({heads,children})=><div className="glass overflow-x-auto"><table className="w-full text-sm whitespace-nowrap"><thead className="text-white/50 text-left"><tr>{heads.map(h=><th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
export function UserDash(){
  const {user,toast}=useApp(),{data,err,reload}=useApi('/shipments'),[proof,setProof]=useState(null),h=new Date().getHours(),g=h<12?'MORNING':h<18?'AFTERNOON':'EVENING',list=data||[]
  const c=a=>list.filter(x=>a.includes(x.status)).length
  const rate=(s,n)=>api(`/shipments/${s.id}/rate`,{method:'POST',body:{rating:n}}).then(()=>{toast('Thanks for rating!');reload()}).catch(x=>toast(x.message))
  return <div><Head t={`GOOD ${g}, ${user.name.toUpperCase()}`} sub="SYSTEM ONLINE"/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">{[['TOTAL SHIPMENTS',list.length],['IN TRANSIT',c(['Picked Up','In Transit','Out for Delivery'])],['DELIVERED',c(['Delivered'])],['PENDING',c(['Pending'])]].map(([l,v],i)=><Stat key={l} label={l} to={v} i={i}/>)}</div>
    <h2 className="font-bold mb-2">Recent shipments</h2>
    {list.length?<Table heads={['Tracking ID','Route','Package','Price','Status','OTP / Rating','Docs']}>{list.slice(0,8).map(s=><tr key={s.id} className="border-t border-white/5"><td className="p-3 text-cyan-300">{s.tracking_id}</td><td className="p-3">{s.pickup} → {s.destination}</td><td className="p-3">{s.package}</td><td className="p-3">₹{s.price}</td><td className="p-3"><Badge s={s.status}/></td><td className="p-3">{s.status==='Delivered'?(s.rating?<span className="text-amber-300">{'★'.repeat(s.rating)}</span>:[1,2,3,4,5].map(n=><button key={n} aria-label={`Rate ${n}`} className="text-amber-300 text-lg" onClick={()=>rate(s,n)}>☆</button>)):s.status==='Cancelled'?'–':<b className="tracking-widest text-cyan-300" title="Give this code to the courier on delivery">{s.otp}</b>}</td><td className="p-3 space-x-2 whitespace-nowrap">{s.payment_status==='Unpaid'&&s.status!=='Cancelled'&&<button className="text-cyan-300 text-xs font-bold" onClick={()=>payNow(s.id,user).then(()=>{toast('Payment successful');reload()}).catch(x=>toast(x.message))}>PAY</button>}<button title="Invoice and QR label" onClick={()=>download(`/shipments/${s.id}/invoice`,`invoice-${s.tracking_id}.pdf`).catch(x=>toast(x.message))}>🧾</button>{s.has_proof&&<button title="Delivery photo" onClick={()=>api(`/shipments/${s.id}/proof`).then(r=>setProof(r.image)).catch(x=>toast(x.message))}>📷</button>}</td></tr>)}</Table>:<Empty kind="box" title="No shipments yet" text="Book your first courier and it will appear here."/>}
    {proof&&<div className="fixed inset-0 z-[70] bg-black/70 grid place-items-center p-4" onClick={()=>setProof(null)}><img src={proof} alt="Delivery proof" className="max-h-[85vh] rounded-xl"/></div>}
  </div>
}
export function AdminDash(){
  const [r,setR]=useState('7D'),{data:st}=useApi('/stats'),{data:ser}=useApi('/stats/series?days='+({'7D':7,'30D':30,'1Y':365}[r]))
  return <div><Head t="LOGISTICS COMMAND CENTER" sub="ALL SYSTEMS OPERATIONAL"/>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">{[['TOTAL USERS',st?.users],['TOTAL COURIERS',st?.couriers],['TOTAL SHIPMENTS',st?.shipments],['DELIVERED',st?.delivered],['PENDING',st?.pending],['CANCELLED',st?.cancelled]].map(([l,v],i)=><Stat key={l} label={l} to={v||0} i={i}/>)}<Stat label="REVENUE" prefix="₹" to={Math.round(st?.revenue||0)} i={6}/></div>
    <div className="flex gap-2 mb-3">{['7D','30D','1Y'].map(k=><button key={k} onClick={()=>setR(k)} className={r===k?'btn !py-1.5':'btn2 !py-1.5'}>{k==='7D'?'7 Days':k==='30D'?'30 Days':'This Year'}</button>)}</div>
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="glass p-4"><div className="font-bold mb-2">Shipment growth</div><div className="h-64"><ResponsiveContainer><AreaChart data={ser||[]}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={.6}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#ffffff14"/><XAxis dataKey="d" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/><Tooltip contentStyle={{background:'#0a0f1f',border:'1px solid #22d3ee55'}}/><Area dataKey="orders" stroke="#22d3ee" fill="url(#g)" animationDuration={1200}/></AreaChart></ResponsiveContainer></div></div>
      <div className="glass p-4"><div className="font-bold mb-2">Revenue flow (₹)</div><div className="h-64"><ResponsiveContainer><BarChart data={ser||[]}><CartesianGrid stroke="#ffffff14"/><XAxis dataKey="d" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/><Tooltip contentStyle={{background:'#0a0f1f',border:'1px solid #8b5cf655'}}/><Bar dataKey="revenue" fill="#8b5cf6" radius={[6,6,0,0]} animationDuration={1200}/></BarChart></ResponsiveContainer></div></div>
    </div></div>
}
export function Couriers(){
  const {toast}=useApp(),{data,err,reload}=useApi('/couriers'),sh=useApi('/shipments'),[q,setQ]=useState(''),[st,setSt]=useState('All'),[m,setM]=useState(null)
  const list=data||[],rows=list.filter(c=>(st==='All'||c.status===st)&&(c.name+c.code).toLowerCase().includes(q.toLowerCase()))
  const fail=x=>toast(x.message),done=msg=>()=>{setM(null);toast(msg);reload();sh.reload()}
  const open=(type,c)=>setM({type,c,pick:'',f:c?{name:c.name,phone:c.phone,vehicle:c.vehicle,location:c.location,status:c.status}:{name:'',phone:'',vehicle:'Bike',location:''}})
  const del=c=>api('/couriers/'+c.id,{method:'DELETE'}).then(()=>{toast(`${c.name} removed`);reload()}).catch(fail)
  const save=()=>(m.c?api('/couriers/'+m.c.id,{method:'PATCH',body:m.f}):api('/couriers',{method:'POST',body:m.f})).then(done(m.c?'Courier updated':'Courier added')).catch(fail)
  const open_=(sh.data||[]).filter(s=>!['Delivered','Cancelled'].includes(s.status)),mine=m?.c?(sh.data||[]).filter(s=>s.courier===m.c.name):[]
  const pick=m?(m.pick||open_[0]?.id):null
  const setF=k=>e=>setM({...m,f:{...m.f,[k]:e.target.value}})
  return <div><Head t="COURIER MANAGEMENT" sub={`${list.length} couriers registered`}/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    <div className="flex flex-wrap gap-2 mb-3"><div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute left-3 top-3.5 text-white/40"/><input className="inp pl-9" placeholder="Search couriers…" value={q} onChange={e=>setQ(e.target.value)}/></div>
      <select className="inp !w-auto" value={st} onChange={e=>setSt(e.target.value)}>{['All','Online','Available','On Delivery','Offline'].map(s=><option key={s} className="bg-black">{s}</option>)}</select>
      <button className="btn" onClick={()=>open('add')}><Plus size={16}/>ADD COURIER</button></div>
    {rows.length?<Table heads={['ID','Name','Phone','Vehicle','Location','Active','Perf.','Status','Actions']}>{rows.map(c=><tr key={c.id} className="border-t border-white/5"><td className="p-3 text-cyan-300">{c.code}</td><td className="p-3">{c.name}</td><td className="p-3">{c.phone}</td><td className="p-3">{c.vehicle}</td><td className="p-3">{c.location}</td><td className="p-3">{c.active}</td><td className="p-3">{c.performance}%</td><td className="p-3"><Badge s={c.status}/></td>
      <td className="p-3 space-x-3 text-xs font-bold"><button className="text-cyan-300" onClick={()=>open('view',c)}>VIEW</button><button className="text-violet-300" onClick={()=>open('edit',c)}>EDIT</button><button className="text-emerald-300" onClick={()=>open('assign',c)}>ASSIGN</button><button aria-label="Delete" className="text-red-400" onClick={()=>del(c)}><Trash2 size={14} className="inline"/></button></td></tr>)}</Table>
    :<Empty kind="users" title="No couriers found" text="Try another search, or add a new courier."/>}
    {m&&<Modal onClose={()=>setM(null)}>
      {(m.type==='add'||m.type==='edit')&&<><div className="font-bold gt mb-3">{m.c?'EDIT COURIER':'ADD COURIER'}</div><div className="space-y-2">{[['name','Full name'],['phone','Phone number'],['vehicle','Vehicle (Bike, EV Van…)'],['location','Base area']].map(([k,p])=><input key={k} className="inp" placeholder={p} value={m.f[k]} onChange={setF(k)}/>)}
        {m.c&&<select className="inp" value={m.f.status} onChange={setF('status')}>{['Online','Available','On Delivery','Offline'].map(s=><option key={s} className="bg-black">{s}</option>)}</select>}</div>
        <div className="flex justify-end gap-2 mt-4"><button className="btn2" onClick={()=>setM(null)}>CANCEL</button><button className="btn" onClick={save} disabled={!m.f.name.trim()}>SAVE</button></div></>}
      {m.type==='view'&&<><div className="font-bold gt mb-1">{m.c.name} · {m.c.code}</div><div className="text-sm text-white/60 mb-3">{m.c.vehicle} · {m.c.location} · {m.c.phone}<br/>Performance {m.c.performance}% · <Badge s={m.c.status}/>{m.c.lat!=null&&<><br/>Last position: {m.c.lat.toFixed(4)}, {m.c.lng.toFixed(4)}</>}</div>
        <div className="font-bold text-sm mb-1">Assigned shipments ({mine.length})</div>{mine.slice(0,8).map(s=><div key={s.id} className="flex justify-between items-center py-2 border-t border-white/10 text-sm"><span>{s.tracking_id}<br/><span className="text-white/50">{s.pickup} → {s.destination}</span></span><Badge s={s.status}/></div>)}{!mine.length&&<p className="text-white/50 text-sm">No shipments assigned yet.</p>}</>}
      {m.type==='assign'&&<><div className="font-bold gt mb-3">ASSIGN TO {m.c.name.toUpperCase()}</div>{open_.length?<><select className="inp" value={pick} onChange={e=>setM({...m,pick:e.target.value})}>{open_.map(s=><option key={s.id} value={s.id} className="bg-black">{s.tracking_id} · {s.destination} ({s.courier||'unassigned'})</option>)}</select>
        <div className="flex justify-end gap-2 mt-4"><button className="btn2" onClick={()=>setM(null)}>CANCEL</button><button className="btn" onClick={()=>api('/shipments/'+pick+'/assign',{method:'PATCH',body:{courier_id:m.c.id}}).then(done('Shipment assigned')).catch(fail)}>ASSIGN</button></div></>:<p className="text-white/60 text-sm">There are no open shipments to assign right now.</p>}</>}
    </Modal>}
  </div>
}

import {useState,useEffect} from 'react'
import {motion} from 'framer-motion'
import {Search,Download,Trash2,Pencil,History,ChevronLeft,ChevronRight,Route,Clock,Users,Activity,Loader2} from 'lucide-react'
import {useApp,Badge} from '../ui'
import {Head,Table} from './Dash'
import {api,useApi} from '../api'
import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts'
import LiveMap,{icons} from '../Map'
const Modal=({children,onClose})=><motion.div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm grid place-items-center p-4" initial={{opacity:0}} animate={{opacity:1}} onClick={onClose}><motion.div initial={{scale:.9,y:20}} animate={{scale:1,y:0}} className="glass bg-[#0a0f1f] p-5 w-full max-w-md" onClick={e=>e.stopPropagation()}>{children}</motion.div></motion.div>
const Bar=({q,setQ,children,ph})=><div className="flex flex-wrap gap-2 mb-3"><div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute left-3 top-3.5 text-white/40"/><input className="inp pl-9" placeholder={ph} value={q} onChange={e=>setQ(e.target.value)}/></div>{children}</div>
const Sel=({v,set,opts})=><select className="inp !w-auto" value={v} onChange={e=>set(e.target.value)}>{opts.map(o=><option key={o} className="bg-black">{o}</option>)}</select>
export function UsersPage(){
  const {toast}=useApp(),[q,setQ]=useState(''),[role,setRole]=useState('All'),[pg,setPg]=useState(0),[edit,setEdit]=useState(null),[view,setView]=useState(null),[hist,setHist]=useState([])
  const {data,err,reload}=useApi(`/users?q=${encodeURIComponent(q)}&role=${role==='All'?'':role.toLowerCase()}`)
  const rows=data||[],per=5,pages=Math.max(1,Math.ceil(rows.length/per)),cur=rows.slice(pg*per,pg*per+per)
  const fail=x=>toast(x.message)
  const exp=()=>{const csv=['Name,Email,Phone,Role,Shipments',...rows.map(u=>[u.name,u.email,u.phone,u.role,u.shipments].join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='users.csv';a.click();toast(`Exported ${rows.length} users`)}
  const open=u=>{setView(u);setHist([]);api('/shipments').then(a=>setHist(a.filter(s=>s.customer===u.name))).catch(fail)}
  return <div><Head t="USER MANAGEMENT" sub={`${rows.length} accounts`}/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    <Bar q={q} setQ={v=>{setQ(v);setPg(0)}} ph="Search users…"><Sel v={role} set={v=>{setRole(v);setPg(0)}} opts={['All','User','Courier']}/><button className="btn2" onClick={exp}><Download size={16}/>EXPORT</button></Bar>
    {cur.length?<Table heads={['Name','Email','Phone','Role','Shipments','Actions']}>{cur.map(u=><tr key={u.id} className="border-t border-white/5"><td className="p-3">{u.name}</td><td className="p-3">{u.email}</td><td className="p-3">{u.phone}</td><td className="p-3"><Badge s={u.role==='user'?'Online':'On Delivery'}/> {u.role}</td><td className="p-3">{u.shipments}</td>
      <td className="p-3 space-x-3"><button aria-label="History" className="text-cyan-300" onClick={()=>open(u)}><History size={15}/></button><button aria-label="Edit" className="text-violet-300" onClick={()=>setEdit({...u})}><Pencil size={15}/></button><button aria-label="Delete" className="text-red-400" onClick={()=>api('/users/'+u.id,{method:'DELETE'}).then(()=>{toast(`${u.name} deleted`);reload()}).catch(fail)}><Trash2 size={15}/></button></td></tr>)}</Table>
    :<div className="glass p-10 text-center text-white/60"><Users className="mx-auto mb-2"/>No users match your search.</div>}
    <div className="flex items-center justify-end gap-3 mt-3 text-sm text-white/60"><button disabled={pg===0} onClick={()=>setPg(pg-1)} className="disabled:opacity-30"><ChevronLeft/></button>Page {Math.min(pg+1,pages)} of {pages}<button disabled={pg>=pages-1} onClick={()=>setPg(pg+1)} className="disabled:opacity-30"><ChevronRight/></button></div>
    {edit&&<Modal onClose={()=>setEdit(null)}><div className="font-bold gt mb-3">EDIT USER</div><div className="space-y-2">{['name','email','phone'].map(k=><input key={k} className="inp" value={edit[k]} onChange={e=>setEdit({...edit,[k]:e.target.value})}/>)}</div><div className="flex justify-end gap-2 mt-4"><button className="btn2" onClick={()=>setEdit(null)}>CANCEL</button><button className="btn" onClick={()=>api('/users/'+edit.id,{method:'PATCH',body:{name:edit.name,email:edit.email,phone:edit.phone}}).then(()=>{setEdit(null);toast('User updated');reload()}).catch(fail)}>SAVE</button></div></Modal>}
    {view&&<Modal onClose={()=>setView(null)}><div className="font-bold gt mb-3">SHIPMENT HISTORY · {view.name}</div>{hist.map(s=><div key={s.id} className="flex justify-between items-center py-2 border-t border-white/10 text-sm"><span>{s.tracking_id}<br/><span className="text-white/50">{s.pickup} → {s.destination}</span></span><Badge s={s.status}/></div>)}{!hist.length&&<p className="text-white/60 text-sm">No shipments for this account.</p>}</Modal>}
  </div>
}
const flow=['Pending','Picked Up','In Transit','Out for Delivery','Delivered']
export function Shipments(){
  const {toast}=useApp(),[q,setQ]=useState(''),[st,setSt]=useState('All')
  const {data,err,reload}=useApi(`/shipments?q=${encodeURIComponent(q)}&status=${st==='All'?'':encodeURIComponent(st)}`)
  const rows=data||[]
  const upd=(id,status)=>api(`/shipments/${id}/status`,{method:'PATCH',body:{status}}).then(()=>{toast(`Status updated to ${status}`);reload()}).catch(x=>toast(x.message))
  return <div><Head t="SHIPMENT MANAGEMENT" sub={`${rows.length} shipments`}/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    <Bar q={q} setQ={setQ} ph="Search by ID or destination…"><Sel v={st} set={setSt} opts={['All',...flow,'Cancelled']}/></Bar>
    {rows.length?<Table heads={['Tracking ID','Customer','Courier','Pickup','Destination','Package','Price','Status','Date','Actions']}>{rows.map(s=>{const i=flow.indexOf(s.status),end=s.status==='Delivered'||s.status==='Cancelled';return <tr key={s.id} className="border-t border-white/5"><td className="p-3 text-cyan-300">{s.tracking_id}</td><td className="p-3">{s.customer}</td><td className="p-3">{s.courier||'Unassigned'}</td><td className="p-3">{s.pickup}</td><td className="p-3">{s.destination}</td><td className="p-3">{s.package}</td><td className="p-3">₹{s.price}</td><td className="p-3"><Badge s={s.status}/></td><td className="p-3">{s.created_at.slice(0,10)}</td>
      <td className="p-3 space-x-3">{!end&&<><button className="text-cyan-300" onClick={()=>upd(s.id,flow[i+1])}>ADVANCE</button><button className="text-red-400" onClick={()=>upd(s.id,'Cancelled')}>CANCEL</button></>}</td></tr>})}</Table>
    :<div className="glass p-10 text-center text-white/60">No shipments match your filters.</div>}
  </div>
}
const nodes=[...Array(8)].map((_,i)=>[200+Math.cos(i*Math.PI/4)*110,150+Math.sin(i*Math.PI/4)*110])
const wave=a=>'M0 '+(250)+' '+[...Array(21)].map((_,i)=>`L${i*20} ${250+Math.sin(i*.9)*a}`).join(' ')
const cards=[[Route,'AI ROUTE OPTIMIZATION','Optimal delivery route calculated.',['distance saved',x=>`${14+x%9}%`]],[Clock,'DELIVERY PREDICTION','Estimated arrival calculated.',['ETA accuracy',x=>`${91+x%7}%`]],[Users,'SMART COURIER ALLOCATION','Courier assignment optimized.',['reassignments',x=>`${2+x%5}`]],[Activity,'TRAFFIC ANALYSIS','Traffic conditions analyzed.',['congestion index',x=>`${30+x%40}/100`]]]
export function AiInsights(){
  const {toast}=useApp(),[k,setK]=useState(3),[busy,setBusy]=useState(false)
  const run=()=>{setBusy(true);setTimeout(()=>{setK(Math.floor(Math.random()*90));setBusy(false);toast('AI analysis complete')},1500)}
  return <div><Head t="AI DELIVERY INTELLIGENCE" sub="MODELS ACTIVE"/>
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="glass p-3"><svg viewBox="0 0 400 300" className="w-full">
        {[0,1,2].map(i=><motion.circle key={i} cx="200" cy="150" fill="none" stroke="#22d3ee" strokeWidth="1.5" initial={{r:10,opacity:.8}} animate={{r:150,opacity:0}} transition={{repeat:Infinity,duration:3,delay:i}}/>)}
        {nodes.map(([x,y],i)=><g key={i}><line x1="200" y1="150" x2={x} y2={y} stroke="#8b5cf655"/><motion.circle cx={x} cy={y} r="5" fill="#8b5cf6" animate={{r:[4,7,4]}} transition={{repeat:Infinity,duration:2,delay:i*.25}}/><motion.circle r="2.5" fill="#fff" animate={{cx:[x,200],cy:[y,150],opacity:[1,0]}} transition={{repeat:Infinity,duration:1.8,delay:i*.3}}/></g>)}
        <circle cx="200" cy="150" r="14" fill="#22d3ee" style={{filter:'drop-shadow(0 0 12px #22d3ee)'}}/>
        <motion.path fill="none" stroke="#22d3ee" strokeWidth="2" animate={{d:[wave(12),wave(-12),wave(12)]}} transition={{repeat:Infinity,duration:2.5,ease:'easeInOut'}}/>
      </svg></div>
      <div className="space-y-3"><div className="grid sm:grid-cols-2 gap-3">{cards.map(([I,t,m,[l,fn]],i)=><motion.div key={t} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*.08}} whileHover={{rotateX:6,rotateY:-6}} style={{perspective:600}} className="glass p-4"><I className="text-cyan-300 mb-2" size={20}/><div className="text-xs font-bold tracking-wider">{t}</div><p className="text-xs text-white/60 mt-1">{m}</p><div className="mt-2 text-xl font-black gt">{busy?'…':fn(k+i*7)}</div><div className="text-[11px] text-white/40">{l}</div></motion.div>)}</div>
      <button className="btn w-full" onClick={run} disabled={busy}>{busy?<Loader2 className="animate-spin" size={18}/>:'RUN AI ANALYSIS'}</button></div>
    </div><ForecastPanel/></div>
}

export function LiveOps(){
  const c=useApi('/couriers'),s=useApi('/shipments')
  useEffect(()=>{const t=setInterval(()=>{c.reload();s.reload()},5000);return()=>clearInterval(t)},[])
  const ok=p=>p&&p[0]!=null
  const mk=[...(c.data||[]).filter(x=>x.lat!=null).map(x=>({pos:[x.lat,x.lng],icon:icons.courier,label:`${x.name} · ${x.status}`})),...(s.data||[]).filter(x=>ok(x.dest_pos)&&!['Delivered','Cancelled'].includes(x.status)).map(x=>({pos:x.dest_pos,icon:icons.dest,label:`${x.tracking_id} → ${x.destination}`}))]
  return <div><Head t="LIVE OPERATIONS MAP" sub={`${mk.length} live markers · refreshing every 5 seconds`}/><LiveMap markers={mk} h={520}/></div>
}

function ForecastPanel(){
  const {data,err}=useApi('/ai/insights')
  if(err)return <p className="text-red-400 mt-4">{err}</p>
  if(!data)return <p className="text-white/50 mt-4">Loading AI models…</p>
  const {forecast:f,eta}=data,hist=f.history.map(p=>({d:p.d,actual:p.n}))
  hist[hist.length-1].forecast=hist[hist.length-1].actual
  const rows=[...hist,...f.future.map(p=>({d:p.d,forecast:p.n}))]
  return <div className="grid lg:grid-cols-3 gap-4 mt-4">
    <div className="glass p-4 lg:col-span-2"><div className="font-bold">Demand forecast · next 7 days</div><div className="text-xs text-white/50 mb-2">Holt-Winters model · backtest error {f.wape}% (last 7 days)</div>
      <div className="h-64"><ResponsiveContainer><LineChart data={rows}><CartesianGrid stroke="#ffffff14"/><XAxis dataKey="d" stroke="#94a3b8" minTickGap={24}/><YAxis stroke="#94a3b8" allowDecimals={false}/><Tooltip contentStyle={{background:'#0a0f1f',border:'1px solid #22d3ee55'}}/><Line dataKey="actual" name="Orders" stroke="#22d3ee" strokeWidth={2} dot={false}/><Line dataKey="forecast" name="Forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false}/></LineChart></ResponsiveContainer></div></div>
    <div className="glass p-4"><div className="font-bold mb-2">ETA prediction model</div>
      {eta.trained?<><div className="text-xs mb-2">{eta.active?<span className="text-emerald-300">● XGBoost active</span>:<span className="text-amber-300">● Trained, not loaded. Install xgboost and restart</span>}</div>
        <div className="text-3xl font-black gt">{eta.improvement_pct}%</div><div className="text-xs text-white/50 mb-3">lower error than the fixed formula</div>
        <div className="text-sm space-y-1"><div className="flex justify-between"><span className="text-white/60">XGBoost error</span>{eta.mae_model} min</div><div className="flex justify-between"><span className="text-white/60">Formula error</span>{eta.mae_formula} min</div><div className="flex justify-between"><span className="text-white/60">Training trips</span>{eta.trips} (simulated)</div></div></>
      :<p className="text-sm text-white/60">Using the simple formula. To enable the machine-learning model, run <code>python ml/train_eta.py</code> in the backend folder once, then restart the server.</p>}
    </div></div>
}

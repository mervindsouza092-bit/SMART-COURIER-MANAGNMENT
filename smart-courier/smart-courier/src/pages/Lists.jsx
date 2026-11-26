import {useState} from 'react'
import {Link} from 'react-router-dom'
import {api,useApi,download} from '../api'
import {useApp,Badge,Empty} from '../ui'
import {payNow} from '../pay'
import {Head,Table} from './Dash'
const TITLE={all:'MY SHIPMENTS',history:'DELIVERY HISTORY',payments:'PAYMENTS'}
export function MyShipments({mode='all'}){
  const {user,toast}=useApp(),{data,err,reload}=useApi('/shipments'),[q,setQ]=useState(''),[st,setSt]=useState('All')
  const key=mode==='payments'?'payment_status':'status'
  const rows=(data||[]).filter(s=>(mode!=='history'||['Delivered','Cancelled'].includes(s.status))&&(st==='All'||s[key]===st)&&(s.tracking_id+s.pickup+s.destination).toLowerCase().includes(q.toLowerCase()))
  const opts=mode==='payments'?['All','Paid','Unpaid','COD']:mode==='history'?['All','Delivered','Cancelled']:['All','Pending','Picked Up','In Transit','Out for Delivery','Delivered','Cancelled']
  const heads={all:['Tracking ID','Route','Package','Price','Status','Date','Track'],history:['Tracking ID','Route','Price','Status','Rating','Date','Invoice'],payments:['Tracking ID','Method','Amount','Payment','Date','Action']}[mode]
  const inv=s=><button title="Invoice and QR label" onClick={()=>download(`/shipments/${s.id}/invoice`,`invoice-${s.tracking_id}.pdf`).catch(x=>toast(x.message))}>🧾</button>
  const pay=s=>payNow(s.id,user).then(()=>{toast('Payment successful');reload()}).catch(x=>toast(x.message))
  const hasRet=s=>(data||[]).some(x=>x.return_of===s.id)
  const ret=s=>{if(!window.confirm('Request a return pickup for '+s.tracking_id+'? A new shipment goes from your delivery address back to the original pickup address.'))return;api(`/shipments/${s.id}/return`,{method:'POST',body:{reason:'Customer return',payment_method:'UPI'}}).then(r=>{toast('Return booked: '+r.tracking_id+'. Pay it from the Payments page.');reload()}).catch(x=>toast(x.message))}
  const row=s=>{
    const d=s.created_at.slice(0,10),id=<td className="p-3 text-cyan-300">{s.tracking_id}</td>,route=<td className="p-3">{s.pickup} → {s.destination}</td>
    if(mode==='history')return <tr key={s.id} className="border-t border-white/5">{id}{route}<td className="p-3">₹{s.price}</td><td className="p-3"><Badge s={s.status}/></td><td className="p-3 text-amber-300">{s.rating?'★'.repeat(s.rating):'–'}</td><td className="p-3">{d}</td><td className="p-3 space-x-3 whitespace-nowrap">{inv(s)}{s.status==='Delivered'&&!s.is_return&&!hasRet(s)&&<button className="text-violet-300 text-xs font-bold" onClick={()=>ret(s)}>↩ RETURN</button>}</td></tr>
    if(mode==='payments')return <tr key={s.id} className="border-t border-white/5">{id}<td className="p-3">{s.payment_method}</td><td className="p-3">₹{s.price}</td><td className="p-3"><Badge s={s.payment_status}/></td><td className="p-3">{d}</td><td className="p-3 space-x-3">{s.payment_status==='Unpaid'&&s.status!=='Cancelled'&&<button className="text-cyan-300 font-bold" onClick={()=>pay(s)}>PAY NOW</button>}{inv(s)}</td></tr>
    return <tr key={s.id} className="border-t border-white/5">{id}{route}<td className="p-3">{s.package} <Badge s={s.priority}/>{s.is_return&&<span className="text-xs text-violet-300"> ↩ return</span>}</td><td className="p-3">₹{s.price}</td><td className="p-3"><Badge s={s.status}/></td><td className="p-3">{s.scheduled_for?'🕒 '+new Date(s.scheduled_for).toLocaleString():d}</td><td className="p-3"><Link className="text-cyan-300" to={`/tracking?id=${s.tracking_id}`}>TRACK</Link></td></tr>
  }
  const empty={all:['box','No shipments yet','Book a courier and your shipments will appear here.'],history:['box','No delivery history yet','Delivered and cancelled shipments will appear here.'],payments:['card','No payments yet','Payments for your bookings will appear here.']}[mode]
  return <div><Head t={TITLE[mode]} sub={`${rows.length} records · total ₹${rows.reduce((a,s)=>a+s.price,0).toLocaleString('en-IN')}`}/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    <div className="flex flex-wrap gap-2 mb-3"><input className="inp flex-1 min-w-[200px]" placeholder="Search by ID or place…" value={q} onChange={e=>setQ(e.target.value)}/><select className="inp !w-auto" value={st} onChange={e=>setSt(e.target.value)}>{opts.map(o=><option key={o} className="bg-black">{o}</option>)}</select></div>
    {rows.length?<Table heads={heads}>{rows.map(row)}</Table>:data===null&&!err?<p className="text-white/50">Loading…</p>:<Empty kind={empty[0]} title={empty[1]} text={empty[2]}/>}
  </div>
}
export function NotificationsPage(){
  const {data,err,reload}=useApi('/notifications'),list=data||[]
  return <div className="max-w-2xl mx-auto"><Head t="NOTIFICATIONS" sub={`${list.filter(n=>!n.read).length} unread`}/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    <div className="flex justify-end mb-3"><button className="btn2" onClick={()=>api('/notifications/read-all',{method:'POST'}).then(reload)}>MARK ALL READ</button></div>
    {list.length?<div className="space-y-2">{list.map(n=><div key={n.id} className={`glass p-3 ${n.read?'opacity-60':''}`}><b>{n.title}</b><div className="text-sm text-white/70">{n.message}</div><div className="text-[11px] text-white/40 mt-1">{new Date(n.created_at).toLocaleString()}</div></div>)}</div>:data===null&&!err?<p className="text-white/50">Loading…</p>:<Empty kind="bell" title="No notifications yet" text="Updates about your parcels will appear here."/>}
  </div>
}

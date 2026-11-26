import {useState} from 'react'
import {PieChart,Pie,Cell,Tooltip,ResponsiveContainer,BarChart,Bar,XAxis,YAxis,CartesianGrid,Legend} from 'recharts'
import {useApi} from '../api'
import {Stat,Badge,Empty} from '../ui'
import {Head,Table} from './Dash'
const COLORS=['#22d3ee','#8b5cf6','#3b82f6','#34d399','#f59e0b','#ef4444']
const tip={contentStyle:{background:'#0a0f1f',border:'1px solid #22d3ee55'}}
export function PaymentsAdmin(){
  const {data,err}=useApi('/shipments'),[q,setQ]=useState(''),[f,setF]=useState('All')
  const list=data||[],sum=p=>Math.round(list.filter(s=>s.payment_status===p&&s.status!=='Cancelled').reduce((a,s)=>a+s.price,0))
  const rows=list.filter(s=>(f==='All'||s.payment_status===f)&&(s.tracking_id+(s.customer||'')).toLowerCase().includes(q.toLowerCase()))
  return <div><Head t="PAYMENTS" sub={`${list.length} transactions`}/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4"><Stat label="COLLECTED ONLINE" prefix="₹" to={sum('Paid')} i={0}/><Stat label="AWAITING PAYMENT" prefix="₹" to={sum('Unpaid')} i={1}/><Stat label="CASH ON DELIVERY" prefix="₹" to={sum('COD')} i={2}/><Stat label="TRANSACTIONS" to={list.length} i={3}/></div>
    <div className="flex flex-wrap gap-2 mb-3"><input className="inp flex-1 min-w-[200px]" placeholder="Search by ID or customer…" value={q} onChange={e=>setQ(e.target.value)}/><select className="inp !w-auto" value={f} onChange={e=>setF(e.target.value)}>{['All','Paid','Unpaid','COD'].map(o=><option key={o} className="bg-black">{o}</option>)}</select></div>
    {rows.length?<Table heads={['Tracking ID','Customer','Method','Amount','Payment','Date']}>{rows.slice(0,100).map(s=><tr key={s.id} className="border-t border-white/5"><td className="p-3 text-cyan-300">{s.tracking_id}</td><td className="p-3">{s.customer}</td><td className="p-3">{s.payment_method}</td><td className="p-3">₹{s.price}</td><td className="p-3"><Badge s={s.payment_status}/></td><td className="p-3">{s.created_at.slice(0,10)}</td></tr>)}</Table>:<Empty kind="card" title="No payments found" text="Try a different search or filter."/>}
  </div>
}
export function AnalyticsAdmin(){
  const {data,err}=useApi('/shipments'),list=data||[]
  const count=f=>Object.entries(list.reduce((a,s)=>{const k=f(s);a[k]=(a[k]||0)+1;return a},{}))
  const status=count(s=>s.status).map(([name,value])=>({name,value}))
  const dest=count(s=>s.destination).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,n])=>({name,n}))
  const rev=Object.entries(list.filter(s=>s.status!=='Cancelled').reduce((a,s)=>{const k=s.courier||'Unassigned';a[k]=(a[k]||0)+s.price;return a},{})).map(([name,revenue])=>({name,revenue:Math.round(revenue)}))
  const rated=list.filter(s=>s.rating),n=list.length||1
  const kpi=[['DELIVERED RATE',Math.round(list.filter(s=>s.status==='Delivered').length/n*100)+'%'],['CANCELLED RATE',Math.round(list.filter(s=>s.status==='Cancelled').length/n*100)+'%'],['AVG RATING',rated.length?(rated.reduce((a,s)=>a+s.rating,0)/rated.length).toFixed(1)+' ★':'–'],['AVG DISTANCE',(list.reduce((a,s)=>a+s.distance_km,0)/n).toFixed(1)+' km']]
  return <div><Head t="ANALYTICS" sub={`Based on ${list.length} shipments`}/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">{kpi.map(([l,v])=><div key={l} className="glass p-4"><div className="text-xs tracking-widest text-white/50">{l}</div><div className="text-2xl font-black gt mt-1">{v}</div></div>)}</div>
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="glass p-4"><div className="font-bold mb-2">Shipments by status</div><div className="h-64"><ResponsiveContainer><PieChart><Pie data={status} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} animationDuration={1000}>{status.map((_,i)=><Cell key={i} fill={COLORS[i%6]}/>)}</Pie><Tooltip {...tip}/><Legend/></PieChart></ResponsiveContainer></div></div>
      <div className="glass p-4"><div className="font-bold mb-2">Top destinations</div><div className="h-64"><ResponsiveContainer><BarChart data={dest} layout="vertical"><CartesianGrid stroke="#ffffff14"/><XAxis type="number" stroke="#94a3b8" allowDecimals={false}/><YAxis type="category" dataKey="name" stroke="#94a3b8" width={90}/><Tooltip {...tip}/><Bar dataKey="n" name="Shipments" fill="#22d3ee" radius={[0,6,6,0]} animationDuration={1000}/></BarChart></ResponsiveContainer></div></div>
      <div className="glass p-4 lg:col-span-2"><div className="font-bold mb-2">Revenue by courier (₹)</div><div className="h-64"><ResponsiveContainer><BarChart data={rev}><CartesianGrid stroke="#ffffff14"/><XAxis dataKey="name" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/><Tooltip {...tip}/><Bar dataKey="revenue" fill="#8b5cf6" radius={[6,6,0,0]} animationDuration={1000}/></BarChart></ResponsiveContainer></div></div>
    </div></div>
}

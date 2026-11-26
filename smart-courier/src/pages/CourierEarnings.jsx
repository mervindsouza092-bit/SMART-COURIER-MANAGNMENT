import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts'
import {useApi} from '../api'
import {Stat,Empty} from '../ui'
import {Head,Table} from './Dash'
export default function CourierEarnings(){
  const {data,err}=useApi('/courier/earnings?days=14')
  if(err)return <p className="text-red-400">{err}</p>
  if(!data)return <p className="text-white/50">Loading…</p>
  const rows=[...data.daily].reverse().filter(r=>r.deliveries>0)
  return <div><Head t="MY EARNINGS" sub={`YOU EARN ${data.pct}% OF EACH FARE`}/>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4"><Stat label="TODAY" prefix="₹" to={Math.round(data.today.earnings)} i={0}/><Stat label="DELIVERIES TODAY" to={data.today.deliveries} i={1}/><Stat label="LAST 7 DAYS" prefix="₹" to={data.week} i={2}/><Stat label="LAST 14 DAYS" prefix="₹" to={data.period} i={3}/></div>
    <div className="glass p-4 mb-4"><div className="font-bold mb-2">Daily earnings (₹){data.rating&&<span className="text-amber-300 text-sm font-normal ml-3">Rating {data.rating} ★</span>}</div><div className="h-64"><ResponsiveContainer><BarChart data={data.daily}><CartesianGrid stroke="#ffffff14"/><XAxis dataKey="label" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/><Tooltip contentStyle={{background:'#0a0f1f',border:'1px solid #22d3ee55'}}/><Bar dataKey="earnings" name="Earnings" fill="#22d3ee" radius={[6,6,0,0]} animationDuration={900}/></BarChart></ResponsiveContainer></div></div>
    {rows.length?<Table heads={['Date','Deliveries','Distance (km)','Earnings']}>{rows.map(r=><tr key={r.date} className="border-t border-white/5"><td className="p-3">{r.label}</td><td className="p-3">{r.deliveries}</td><td className="p-3">{r.km}</td><td className="p-3 text-cyan-300 font-bold">₹{r.earnings.toLocaleString('en-IN')}</td></tr>)}</Table>
    :<Empty kind="card" title="No deliveries yet" text="Completed deliveries show up here as daily earnings."/>}</div>
}

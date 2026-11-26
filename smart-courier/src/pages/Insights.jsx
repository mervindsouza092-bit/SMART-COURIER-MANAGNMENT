import {useState} from 'react'
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts'
import {Sparkles} from 'lucide-react'
import {api,useApi} from '../api'
import {useApp,Empty} from '../ui'
import {Head,Table} from './Dash'
const EX=['Which area had the most cancelled deliveries?','Revenue by courier this month','Which courier completed the most deliveries last week?','How many shipments are pending?','Average rating by courier','Top destinations today']
export function AskData(){
  const {toast}=useApp(),[q,setQ]=useState(''),[r,setR]=useState(null),[busy,setBusy]=useState(false)
  const ask=async t=>{
    const v=(t??q).trim();if(v.length<3)return toast('Type a question first')
    setQ(v);setBusy(true)
    try{setR(await api('/admin/ask',{method:'POST',body:{question:v}}))}catch(x){toast(x.message)}
    setBusy(false)
  }
  return <div className="max-w-3xl mx-auto"><Head t="ASK YOUR DATA" sub="PLAIN-ENGLISH ANALYTICS"/>
    <div className="flex gap-2 mb-3"><input className="inp" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ask()} placeholder="Ask anything about your shipments…"/><button className="btn whitespace-nowrap" disabled={busy} onClick={()=>ask()}><Sparkles size={16}/>{busy?'THINKING…':'ASK'}</button></div>
    <div className="flex flex-wrap gap-2 mb-5">{EX.map(e=><button key={e} className="btn2 !py-1.5 !px-3 text-xs" onClick={()=>ask(e)}>{e}</button>)}</div>
    {r?<div className="glass p-5"><div className="flex items-center gap-2 mb-1"><span className="font-bold gt">{r.title}</span><span className="text-[10px] border border-white/15 rounded-full px-2 text-white/50">{r.engine==='llm'?'Claude':'Rules'}</span></div><p className="text-sm text-white/80 mb-4">{r.answer}</p>
      {r.rows.length>0&&<div className="h-64"><ResponsiveContainer><BarChart data={r.rows} layout="vertical"><CartesianGrid stroke="#ffffff14"/><XAxis type="number" stroke="#94a3b8"/><YAxis type="category" dataKey="name" stroke="#94a3b8" width={110}/><Tooltip contentStyle={{background:'#0a0f1f',border:'1px solid #22d3ee55'}}/><Bar dataKey="value" fill="#22d3ee" radius={[0,6,6,0]} animationDuration={900}/></BarChart></ResponsiveContainer></div>}</div>
    :<Empty kind="search" title="Ask a question" text="Try one of the examples above. Answers come from your live shipment data."/>}
  </div>
}
export function Leaderboard(){
  const [days,setDays]=useState(30),{data,err}=useApi('/leaderboard?days='+days),list=data||[]
  const medal=['#fbbf24','#cbd5e1','#d97706']
  return <div><Head t="COURIER LEADERBOARD" sub={`LAST ${days} DAYS`}/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    <div className="flex gap-2 mb-4">{[7,30,90].map(d=><button key={d} className={days===d?'btn !py-1.5':'btn2 !py-1.5'} onClick={()=>setDays(d)}>{d} days</button>)}</div>
    {list.length?<><div className="grid sm:grid-cols-3 gap-3 mb-4">{list.slice(0,3).map((c,i)=><div key={c.id} className="glass stat p-5 text-center"><div className="text-3xl font-black" style={{color:medal[i]}}>#{i+1}</div><div className="font-bold mt-1">{c.name}</div><div className="text-xs text-white/50">{c.vehicle}</div>
      <div className="grid grid-cols-3 gap-1 text-xs mt-3"><div><b className="block text-base">{c.deliveries}</b><span className="text-white/50">delivered</span></div><div><b className="block text-base">{c.rating?c.rating+' ★':'–'}</b><span className="text-white/50">rating</span></div><div><b className="block text-base">{c.completion}%</b><span className="text-white/50">completed</span></div></div></div>)}</div>
      <Table heads={['Rank','Courier','Deliveries','Assigned','Completion','Rating','Score']}>{list.map((c,i)=><tr key={c.id} className="border-t border-white/5"><td className="p-3 font-bold" style={{color:medal[i]||'#94a3b8'}}>#{i+1}</td><td className="p-3">{c.name}</td><td className="p-3">{c.deliveries}</td><td className="p-3">{c.assigned}</td><td className="p-3">{c.completion}%</td><td className="p-3 text-amber-300">{c.rating?c.rating+' ★':'–'}</td><td className="p-3 text-cyan-300 font-bold">{c.score}</td></tr>)}</Table></>
    :data===null&&!err?<p className="text-white/50">Loading…</p>:<Empty kind="users" title="No courier activity" text="Delivered shipments will rank your couriers here."/>}
  </div>
}

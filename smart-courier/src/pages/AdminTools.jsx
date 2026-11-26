import {useState} from 'react'
import {api,useApi} from '../api'
import {useApp,Badge,Empty} from '../ui'
import {Head,Table} from './Dash'
export function Promos(){
  const {toast}=useApp(),{data,err,reload}=useApi('/admin/promos'),[f,setF]=useState({code:'',kind:'percent',value:'',min_order:'0',max_uses:'0',days:''}),list=data||[]
  const set=k=>e=>setF({...f,[k]:e.target.value})
  const create=()=>api('/admin/promos',{method:'POST',body:{code:f.code.toUpperCase(),kind:f.kind,value:+f.value,min_order:+f.min_order||0,max_uses:+f.max_uses||0,days:f.days?+f.days:null}}).then(()=>{toast('Promo code created');setF({...f,code:'',value:''});reload()}).catch(x=>toast(x.message))
  return <div><Head t="PROMO CODES" sub="DISCOUNTS FOR CUSTOMERS"/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    <div className="glass p-5 mb-4"><div className="font-bold mb-3">Create a code</div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        <label className="text-xs text-white/60">Code<input className="inp mt-1" placeholder="DIWALI20" value={f.code} onChange={e=>setF({...f,code:e.target.value.toUpperCase()})}/></label>
        <label className="text-xs text-white/60">Type<select className="inp mt-1" value={f.kind} onChange={set('kind')}><option value="percent">Percent (%)</option><option value="flat">Flat (₹)</option></select></label>
        <label className="text-xs text-white/60">Value<input className="inp mt-1" type="number" min="0" value={f.value} onChange={set('value')}/></label>
        <label className="text-xs text-white/60">Min order (₹)<input className="inp mt-1" type="number" min="0" value={f.min_order} onChange={set('min_order')}/></label>
        <label className="text-xs text-white/60">Max uses (0 = ∞)<input className="inp mt-1" type="number" min="0" value={f.max_uses} onChange={set('max_uses')}/></label>
        <label className="text-xs text-white/60">Valid for (days)<input className="inp mt-1" type="number" min="1" placeholder="no expiry" value={f.days} onChange={set('days')}/></label></div>
      <div className="flex justify-end mt-3"><button className="btn" onClick={create} disabled={!f.code||!f.value}>CREATE CODE</button></div></div>
    {list.length?<Table heads={['Code','Discount','Min order','Used','Expires','Status','Actions']}>{list.map(p=><tr key={p.code} className="border-t border-white/5"><td className="p-3 text-cyan-300 font-bold">{p.code}</td><td className="p-3">{p.kind==='percent'?`${p.value}%`:`₹${p.value}`}</td><td className="p-3">₹{p.min_order}</td><td className="p-3">{p.used}{p.max_uses?` / ${p.max_uses}`:''}</td><td className="p-3">{p.expires?new Date(p.expires).toLocaleDateString():'Never'}</td><td className="p-3"><Badge s={p.active?'Online':'Offline'}/></td>
      <td className="p-3 space-x-3 text-xs font-bold"><button className="text-violet-300" onClick={()=>api('/admin/promos/'+p.code,{method:'PATCH'}).then(reload).catch(x=>toast(x.message))}>{p.active?'DISABLE':'ENABLE'}</button><button className="text-red-400" onClick={()=>api('/admin/promos/'+p.code,{method:'DELETE'}).then(()=>{toast('Code deleted');reload()}).catch(x=>toast(x.message))}>DELETE</button></td></tr>)}</Table>
    :data===null&&!err?<p className="text-white/50">Loading…</p>:<Empty kind="card" title="No promo codes" text="Create your first code above."/>}
  </div>
}

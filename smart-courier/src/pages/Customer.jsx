import {useState} from 'react'
import {api,useApi} from '../api'
import {useApp,Badge,Empty,Modal} from '../ui'
import {Head,Table} from './Dash'
export function Support(){
  const {user,toast}=useApp(),admin=user.role==='admin',{data,err,reload}=useApi('/tickets'),mine=useApi('/shipments'),[th,setTh]=useState(null),[nw,setNw]=useState(null),[txt,setTxt]=useState('')
  const open=id=>api('/tickets/'+id).then(setTh).catch(x=>toast(x.message))
  const send=()=>{if(!txt.trim())return;api(`/tickets/${th.id}/reply`,{method:'POST',body:{text:txt}}).then(()=>{setTxt('');open(th.id);reload()}).catch(x=>toast(x.message))}
  const close=()=>api(`/tickets/${th.id}/close`,{method:'POST'}).then(()=>{setTh(null);toast('Ticket closed');reload()}).catch(x=>toast(x.message))
  const create=()=>api('/tickets',{method:'POST',body:{subject:nw.subject,message:nw.message,shipment_id:nw.shipment_id?+nw.shipment_id:null}}).then(()=>{setNw(null);toast('Your ticket was sent to support');reload()}).catch(x=>toast(x.message))
  const list=data||[]
  return <div><Head t={admin?'SUPPORT TICKETS':'HELP AND SUPPORT'} sub={`${list.length} tickets`}/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    {!admin&&<div className="mb-4"><button className="btn" onClick={()=>setNw({subject:'',message:'',shipment_id:''})}>+ NEW TICKET</button></div>}
    {list.length?<Table heads={['#','Subject',admin?'Customer':'Parcel','Last message','Status','Updated']}>{list.map(t=><tr key={t.id} className="border-t border-white/5 cursor-pointer" onClick={()=>open(t.id)}><td className="p-3 text-cyan-300">#{t.id}</td><td className="p-3">{t.subject}</td><td className="p-3">{admin?t.customer:(t.tracking_id||'–')}</td><td className="p-3 text-white/60 max-w-[220px] truncate">{t.last}</td><td className="p-3"><Badge s={t.status}/></td><td className="p-3">{new Date(t.updated_at).toLocaleDateString()}</td></tr>)}</Table>
    :data===null&&!err?<p className="text-white/50">Loading…</p>:<Empty kind="bell" title="No tickets yet" text={admin?'Customer complaints and questions will appear here.':'Have a problem with a delivery? Create a ticket and our team will reply.'}/>}
    {nw&&<Modal onClose={()=>setNw(null)}><div className="font-bold gt mb-3">NEW SUPPORT TICKET</div><div className="space-y-2">
      <input className="inp" placeholder="Subject" value={nw.subject} onChange={e=>setNw({...nw,subject:e.target.value})}/>
      <select className="inp" value={nw.shipment_id} onChange={e=>setNw({...nw,shipment_id:e.target.value})}><option value="">Not about a specific parcel</option>{(mine.data||[]).map(s=><option key={s.id} value={s.id}>{s.tracking_id} · {s.destination}</option>)}</select>
      <textarea className="inp min-h-[110px]" placeholder="Describe the problem…" value={nw.message} onChange={e=>setNw({...nw,message:e.target.value})}/></div>
      <div className="flex justify-end gap-2 mt-4"><button className="btn2" onClick={()=>setNw(null)}>CANCEL</button><button className="btn" onClick={create}>SEND</button></div></Modal>}
    {th&&<Modal onClose={()=>setTh(null)}><div className="flex justify-between items-start gap-2 mb-2"><div><div className="font-bold gt">#{th.id} · {th.subject}</div><div className="text-xs text-white/50">{th.customer}{th.tracking_id&&` · ${th.tracking_id}`}</div></div><Badge s={th.status}/></div>
      <div className="space-y-2 my-3 max-h-72 overflow-y-auto">{th.messages.map(m=><div key={m.id} className={`p-2 rounded-xl text-sm max-w-[88%] ${m.role==='admin'?'bg-cyan-400/15':'bg-white/10 ml-auto'}`}><div className="text-[11px] text-white/50">{m.sender} · {new Date(m.created_at).toLocaleString()}</div>{m.text}</div>)}</div>
      {th.status!=='Closed'?<><textarea className="inp min-h-[70px]" placeholder="Write a reply…" value={txt} onChange={e=>setTxt(e.target.value)}/><div className="flex justify-between mt-3"><button className="btn2" onClick={close}>CLOSE TICKET</button><button className="btn" onClick={send}>SEND REPLY</button></div></>:<p className="text-xs text-white/50">This ticket is closed.</p>}</Modal>}
  </div>
}
export function Addresses(){
  const {toast}=useApp(),{data,err,reload}=useApi('/addresses'),list=data||[]
  return <div className="max-w-2xl mx-auto"><Head t="SAVED ADDRESSES" sub="FASTER BOOKING"/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    {list.length?<div className="space-y-2">{list.map(a=><div key={a.id} className="glass p-4 flex items-center justify-between gap-3"><div><b>🏠 {a.label}</b><div className="text-sm text-white/60">{a.address}</div></div><button className="text-red-400 text-sm" onClick={()=>api('/addresses/'+a.id,{method:'DELETE'}).then(()=>{toast('Address removed');reload()}).catch(x=>toast(x.message))}>DELETE</button></div>)}</div>
    :data===null&&!err?<p className="text-white/50">Loading…</p>:<Empty kind="box" title="No saved addresses" text="While booking, tap “Save as Home” or “Save as Office” after your address is found on the map."/>}
  </div>
}

import {useState} from 'react'
import {api,useApi} from '../api'
import {useApp,Badge,Empty,Modal} from '../ui'
import {Head,Table} from './Dash'
export default function Kyc(){
  const {toast}=useApp(),[st,setSt]=useState('Pending'),{data,err,reload}=useApi('/admin/kyc?status='+(st==='All'?'':st)),[sel,setSel]=useState(null),[img,setImg]=useState(null),[note,setNote]=useState('')
  const list=data||[]
  const view=kind=>api(`/admin/kyc/${sel.courier_id}/doc/${kind}`).then(r=>setImg(r.image)).catch(x=>toast(x.message))
  const decide=ap=>api(`/admin/kyc/${sel.courier_id}/decision`,{method:'POST',body:{approve:ap,note}}).then(()=>{toast(ap?'Courier approved':'Courier sent back');setSel(null);setNote('');reload()}).catch(x=>toast(x.message))
  const yes=v=><span className={v?'text-emerald-300':'text-red-300'}>{v?'verified':'not verified'}</span>
  return <div><Head t="COURIER VERIFICATION" sub={`${list.length} APPLICATIONS`}/>
    {err&&<p className="text-red-400 mb-3">{err}</p>}
    <div className="flex gap-2 mb-4">{['Pending','Approved','Rejected','All'].map(s=><button key={s} className={st===s?'btn !py-1.5 text-xs':'btn2 !py-1.5 text-xs'} onClick={()=>setSt(s)}>{s}</button>)}</div>
    {list.length?<Table heads={['Courier','Contact','Vehicle','ID','Status','Applied','']}>{list.map(k=><tr key={k.courier_id} className="border-t border-white/5"><td className="p-3">{k.name}</td><td className="p-3 text-xs">{k.email}<br/>{k.phone}</td><td className="p-3">{k.vehicle_type} · {k.vehicle_no}</td><td className="p-3">{k.id_type} {k.id_masked}</td><td className="p-3"><Badge s={k.status}/></td><td className="p-3">{new Date(k.created_at).toLocaleDateString()}</td>
      <td className="p-3"><button className="text-cyan-300 font-bold text-xs" onClick={()=>{setSel(k);setNote(k.note||'')}}>REVIEW</button></td></tr>)}</Table>
    :data===null&&!err?<p className="text-white/50">Loading…</p>:<Empty kind="users" title="No applications here" text="New courier sign-ups appear here for review."/>}
    {sel&&<Modal onClose={()=>setSel(null)}><div className="font-bold gt mb-2 inline-block">{sel.name}</div>
      <dl className="text-sm space-y-1 mb-3"><div>Email: {sel.email} ({yes(sel.email_verified)})</div><div>Phone: {sel.phone} ({yes(sel.phone_verified)})</div><div>Vehicle: {sel.vehicle_type}, {sel.vehicle_no}</div><div>Licence: {sel.licence_masked}</div><div>{sel.id_type}: {sel.id_masked}</div><div>Address: {sel.address}</div></dl>
      <div className="flex gap-2 mb-3"><button className="btn2 !py-1.5 text-xs" onClick={()=>view('id')}>VIEW ID PHOTO</button><button className="btn2 !py-1.5 text-xs" onClick={()=>view('addr')}>VIEW ADDRESS PROOF</button></div>
      <textarea className="inp min-h-[60px]" placeholder="Note to the courier (required when sending back)" value={note} onChange={e=>setNote(e.target.value)}/>
      <div className="flex justify-end gap-2 mt-3"><button className="btn2" onClick={()=>decide(false)}>SEND BACK</button><button className="btn" onClick={()=>decide(true)}>APPROVE</button></div></Modal>}
    {img&&<div className="fixed inset-0 z-[80] bg-black/80 grid place-items-center p-4" onClick={()=>setImg(null)}><img src={img} alt="Document" className="max-h-[88vh] rounded-xl"/></div>}
  </div>
}

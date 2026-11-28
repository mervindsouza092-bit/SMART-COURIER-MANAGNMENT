import {useState} from 'react'
import {Upload,Check} from 'lucide-react'
import {shrink} from '../img'
import {api,useApi} from '../api'
import {useApp,Modal} from '../ui'
export const VEH=['Bike','Scooter','EV Scooter','EV Van','Mini Truck'],IDS=['Aadhaar','PAN','Voter ID','Driving Licence']
export const EMPTY_KYC={vehicle_type:'Bike',vehicle_no:'',licence_no:'',id_type:'Aadhaar',id_no:'',address:'',id_doc:'',addr_doc:''}
export function KycFields({f,setF,setErr}){
  const set=k=>e=>setF(v=>({...v,[k]:e.target.value}))
  const pick=k=>async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;setF(v=>({...v,[k]:'…'}));try{const d=await shrink(file,1000,.7);setF(v=>({...v,[k]:d}))}catch(x){setF(v=>({...v,[k]:''}));setErr(x.message)}}
  const doc=(k,label)=><label className="glass !rounded-xl p-3 flex items-center gap-3 cursor-pointer"><input type="file" accept="image/*" capture="environment" hidden onChange={pick(k)}/>
    {f[k]&&f[k]!=='…'?<img src={f[k]} alt="" className="w-12 h-12 rounded object-cover"/>:<Upload size={20} className="text-cyan-300"/>}
    <span className="text-sm">{f[k]==='…'?'Processing…':label}{f[k]&&f[k]!=='…'&&<Check size={14} className="inline ml-1 text-emerald-300"/>}</span></label>
  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3"><select className="inp" value={f.vehicle_type} onChange={set('vehicle_type')}>{VEH.map(v=><option key={v}>{v}</option>)}</select><input className="inp uppercase" placeholder="Vehicle number (MH04AB1234)" value={f.vehicle_no} onChange={set('vehicle_no')}/></div>
    <input className="inp uppercase" placeholder="Driving licence number" value={f.licence_no} onChange={set('licence_no')}/>
    <div className="grid grid-cols-2 gap-3"><select className="inp" value={f.id_type} onChange={set('id_type')}>{IDS.map(v=><option key={v}>{v}</option>)}</select><input className="inp uppercase" placeholder={`${f.id_type} number`} value={f.id_no} onChange={set('id_no')}/></div>
    <textarea className="inp min-h-[70px]" placeholder="Your full residential address" value={f.address} onChange={set('address')}/>
    {doc('id_doc','Photo of your ID')}{doc('addr_doc','Photo of an address proof')}
    <p className="text-xs text-white/40">Your ID number is kept only in masked form. Photos are stored securely and only an admin can open them. An admin reviews everything before you receive deliveries.</p>
  </div>
}
export function KycBanner(){
  const {toast}=useApp(),{data,reload}=useApi('/courier/kyc'),[open,setOpen]=useState(false),[f,setF]=useState(EMPTY_KYC),[err,setErr]=useState(''),[busy,setBusy]=useState(false)
  if(!data||data.status==='Approved')return null
  const send=()=>{setBusy(true);setErr('');api('/courier/kyc',{method:'POST',body:f}).then(()=>{setOpen(false);toast('Details sent for review');reload()}).catch(x=>setErr(x.message)).finally(()=>setBusy(false))}
  const rej=data.status==='Rejected'
  return <><div className={`glass p-3 mb-4 text-sm ${rej?'text-red-300':'text-amber-300'}`}>{rej?<>Your verification needs changes: {data.note} <button className="underline font-bold ml-1" onClick={()=>setOpen(true)}>SEND NEW DETAILS</button></>:'Your account is waiting for admin verification. You will start receiving deliveries once it is approved.'}</div>
    {open&&<Modal onClose={()=>setOpen(false)}><div className="font-bold gt mb-3 inline-block">UPDATE VERIFICATION DETAILS</div><KycFields f={f} setF={setF} setErr={setErr}/>{err&&<p className="text-red-400 text-sm mt-2">{err}</p>}
      <div className="flex justify-end gap-2 mt-4"><button className="btn2" onClick={()=>setOpen(false)}>CANCEL</button><button className="btn" disabled={busy} onClick={send}>{busy?'SENDING…':'SEND'}</button></div></Modal>}</>
}

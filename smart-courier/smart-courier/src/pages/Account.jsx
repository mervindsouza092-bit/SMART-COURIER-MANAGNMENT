import {useState} from 'react'
import {motion} from 'framer-motion'
import {api} from '../api'
import {useApp} from '../ui'
import {Head} from './Dash'
import {Prefs} from '../Prefs'
const Sw=({on,set,label,sub})=><button onClick={()=>set(!on)} role="switch" aria-checked={on} className="flex items-center justify-between w-full py-3 border-t border-white/10 text-left"><span>{label}<span className="block text-xs text-white/50">{sub}</span></span><span className={`w-11 h-6 rounded-full p-0.5 flex transition ${on?'bg-cyan-400':'bg-white/15'}`}><motion.span layout className={`block w-5 h-5 rounded-full bg-white ${on?'ml-auto':''}`}/></span></button>
export function Profile(){
  const {user,setUser,toast}=useApp(),[f,setF]=useState({name:user.name,phone:user.phone||''}),[edit,setEdit]=useState(false)
  const save=()=>api('/auth/me',{method:'PATCH',body:f}).then(u=>{setUser(u);setEdit(false);toast('Profile updated')}).catch(x=>toast(x.message))
  return <div className="max-w-xl mx-auto"><Head t="MY PROFILE" sub={`${user.role.toUpperCase()} ACCOUNT`}/>
    <div className="glass p-6"><div className="flex items-center gap-4 mb-5"><div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 grid place-items-center text-2xl font-black">{user.name[0].toUpperCase()}</div><div><div className="text-xl font-bold">{user.name}</div><div className="text-white/60 text-sm">{user.email}</div></div></div>
    {edit?<div className="space-y-2"><input className="inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/><input className="inp" placeholder="Phone number" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/><div className="flex gap-2"><button className="btn" onClick={save}>SAVE</button><button className="btn2" onClick={()=>setEdit(false)}>CANCEL</button></div></div>
    :<><dl className="text-sm space-y-2">{[['Phone',user.phone||'Not set'],['Account type',user.role],['Email',user.email]].map(([k,v])=><div key={k} className="flex justify-between border-t border-white/10 pt-2"><dt className="text-white/50">{k}</dt><dd>{v}</dd></div>)}</dl><button className="btn mt-4" onClick={()=>setEdit(true)}>EDIT PROFILE</button></>}</div></div>
}
const KEY='sc_prefs',DEF={push:true,email:true,sms:false}
const load=()=>{try{return{...DEF,...JSON.parse(localStorage.getItem(KEY))}}catch{return DEF}}
export function Settings(){
  const {user,setUser,toast}=useApp(),[p,setP]=useState(load),[pw,setPw]=useState({current:'',next:''})
  const set=k=>v=>{const n={...p,[k]:v};setP(n);try{localStorage.setItem(KEY,JSON.stringify(n))}catch{}}
  const save=b=>api('/auth/me',{method:'PATCH',body:b}).then(u=>{setUser(u);toast('Preference saved')}).catch(x=>toast(x.message))
  const change=()=>api('/auth/change-password',{method:'POST',body:{current:pw.current,new:pw.next}}).then(()=>{toast('Password changed');setPw({current:'',next:''})}).catch(x=>toast(x.message))
  return <div className="max-w-xl mx-auto space-y-4"><Head t="SETTINGS" sub="PREFERENCES SAVED ON THIS DEVICE"/>
    <div className="glass p-5"><div className="font-bold mb-3">Appearance and language</div><Prefs/><p className="text-xs text-white/40 mt-3">Hindi and Marathi translate the main screens. Some messages stay in English.</p></div>
    <div className="glass p-5"><div className="font-bold mb-2">Notifications</div>
      <Sw on={p.push} set={set('push')} label="In-app notifications" sub="Status changes and delivery updates"/>
      <Sw on={user.notify_email!==false} set={v=>save({notify_email:v})} label="Email alerts" sub="Receive updates by email"/>
      <Sw on={!!user.notify_sms} set={v=>save({notify_sms:v})} label="SMS alerts" sub="Needs a phone number in your profile"/></div>
    <div className="glass p-5 space-y-2"><div className="font-bold mb-1">Security · change password</div>
      <input className="inp" type="password" placeholder="Current password" value={pw.current} onChange={e=>setPw({...pw,current:e.target.value})}/>
      <input className="inp" type="password" placeholder="New password (6+ characters)" value={pw.next} onChange={e=>setPw({...pw,next:e.target.value})}/>
      <button className="btn" onClick={change}>UPDATE PASSWORD</button></div></div>
}

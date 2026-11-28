import {useState,useEffect} from 'react'
import {motion,useAnimation} from 'framer-motion'
import {Link,useNavigate} from 'react-router-dom'
import {Loader2,Check,User,Truck,Eye,EyeOff} from 'lucide-react'
import {useApp} from '../ui'
import {Prefs} from '../Prefs'
import {api,setToken} from '../api'
import {KycFields,EMPTY_KYC} from './KycForm'
const roles=[['user','USER','Book and track deliveries.',User],['courier','COURIER','Manage assigned deliveries.',Truck]]
const titles={login:['WELCOME BACK','Access your smart delivery network.'],register:['CREATE YOUR SMART COURIER ACCOUNT','Join the intelligent delivery network.'],forgot:['RESET ACCESS','Enter your email address.']}
const rules=[['8+ characters',p=>p.length>=8],['Uppercase letter',p=>/[A-Z]/.test(p)],['Lowercase letter',p=>/[a-z]/.test(p)],['A number',p=>/\d/.test(p)]]
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/
export default function Auth({mode}){
  const {setUser,toast}=useApp(),nav=useNavigate(),shake=useAnimation()
  const [f,setF]=useState({name:'',email:'',phone:'',pw:'',pw2:'',...EMPTY_KYC}),[role,setRole]=useState('user'),[err,setErr]=useState(''),[st,setSt]=useState('idle'),[show,setShow]=useState(false),[step,setStep]=useState(0)
  const [ver,setVer]=useState(null),[codes,setCodes]=useState({email:'',phone:''}),[ok,setOk]=useState({}),[cool,setCool]=useState(0),[pend,setPend]=useState(null),[link,setLink]=useState('')
  const set=k=>e=>setF({...f,[k]:e.target.value})
  const courier=mode==='register'&&role==='courier',pwOk=rules.every(([,t])=>t(f.pw))
  const fail=m=>{setErr(m);shake.start({x:[0,-10,10,-10,10,0],transition:{duration:.4}})}
  useEffect(()=>{if(cool<=0)return;const t=setTimeout(()=>setCool(cool-1),1000);return()=>clearTimeout(t)},[cool])
  const finish=d=>{setToken(d.token);setSt('done');setTimeout(()=>{setUser(d.user);toast(`Welcome, ${d.user.name}`);nav(d.user.role==='admin'?'/admin/dashboard':d.user.role==='courier'?'/courier':'/dashboard')},500)}
  const openOtp=info=>{setVer(info);setCodes({email:'',phone:''});setOk({});setCool(30);setErr('');setSt('idle')}
  async function submit(e){
    e.preventDefault();setErr('')
    if(!EMAIL.test(f.email))return fail('Enter a valid email address.')
    if(mode==='forgot'){setSt('load');try{const r=await api('/auth/forgot',{method:'POST',body:{email:f.email}});setLink(r.dev_link||'');setSt('done')}catch(x){setSt('idle');fail(x.message)}return}
    if(!f.pw)return fail('Enter your password.')
    if(mode==='login'){
      setSt('load')
      try{finish(await api('/auth/login',{method:'POST',body:{email:f.email,password:f.pw}}))}
      catch(x){
        setSt('idle')
        if(x.message.startsWith('NOT_VERIFIED:')){
          const need=x.message.slice(13).split(',');const dev={}
          try{for(const ch of need){const r=await api('/auth/resend',{method:'POST',body:{email:f.email,channel:ch}});dev[ch]=r.dev};openOtp({email:f.email,masked:f.email,phoneMasked:need.includes('phone')?'your phone':null,need,required:need,dev})}catch(y){fail(y.message)}
        }else fail(x.message)
      }
      return
    }
    if(f.name.trim().length<2)return fail('Enter your full name.')
    const ph=f.phone.replace(/\D/g,'').slice(-10)
    if((courier||f.phone.trim())&&!/^[6-9]\d{9}$/.test(ph))return fail('Enter a valid 10-digit mobile number.')
    if(!pwOk)return fail('Choose a stronger password: 8+ characters with an uppercase letter, a lowercase letter and a number.')
    if(f.pw!==f.pw2)return fail('Passwords do not match.')
    if(courier&&step===0){setStep(1);return}
    if(courier&&(!f.vehicle_no||!f.licence_no||!f.id_no||f.address.trim().length<10||!f.id_doc||!f.addr_doc))return fail('Fill in every vehicle and ID field and add both photos.')
    setSt('load')
    try{
      const r=await api('/auth/register',{method:'POST',body:{name:f.name,email:f.email,phone:f.phone.trim()?ph:'',password:f.pw,role,kyc:courier?{vehicle_type:f.vehicle_type,vehicle_no:f.vehicle_no,licence_no:f.licence_no,id_type:f.id_type,id_no:f.id_no,address:f.address,id_doc:f.id_doc,addr_doc:f.addr_doc}:null}})
      openOtp({email:f.email,masked:r.verify.email,phoneMasked:r.verify.phone,need:['email',...(r.verify.phone?['phone']:[])],required:['email',...(r.verify.phone_required?['phone']:[])],dev:r.dev||{}})
    }catch(x){setSt('idle');fail(x.message)}
  }
  async function verify(ch){
    setErr('')
    try{
      const d=await api('/auth/verify',{method:'POST',body:{email:f.email,channel:ch,code:codes[ch].trim()}})
      const nok={...ok,[ch]:true};setOk(nok);toast(ch==='email'?'Email verified':'Phone verified')
      if(d.done){if(ch==='email'&&ver.phoneMasked&&!nok.phone&&!ver.required.includes('phone'))setPend(d);else finish(d)}
    }catch(x){fail(x.message)}
  }
  async function resend(ch){try{const r=await api('/auth/resend',{method:'POST',body:{email:f.email,channel:ch}});setVer(v=>({...v,dev:{...v.dev,[ch]:r.dev}}));setCool(30);toast('A new code was sent')}catch(x){fail(x.message)}}
  const otpBox=(ch,label)=><div className="space-y-2" key={ch}>
    <div className="flex justify-between text-sm"><b>{label}</b>{ok[ch]?<span className="text-emerald-300 flex items-center gap-1"><Check size={14}/>Verified</span>:<span className="text-white/50">{ch==='email'?ver.masked:ver.phoneMasked}</span>}</div>
    {!ok[ch]&&<><input className="inp tracking-[.4em] text-center text-lg" inputMode="numeric" maxLength={6} placeholder="000000" value={codes[ch]} onChange={e=>setCodes({...codes,[ch]:e.target.value.replace(/\D/g,'')})}/>
      {ver.dev&&ver.dev[ch]&&<p className="text-xs text-amber-300">Demo mode: your code is <b>{ver.dev[ch]}</b></p>}
      <div className="flex gap-2"><button type="button" className="btn flex-1" disabled={codes[ch].length<4} onClick={()=>verify(ch)}>VERIFY</button><button type="button" className="btn2" disabled={cool>0} onClick={()=>resend(ch)}>{cool>0?`RESEND IN ${cool}s`:'RESEND'}</button></div></>}</div>
  return <div className="min-h-screen grid lg:grid-cols-2">
    <div className="fixed top-3 right-3 z-20"><Prefs compact/></div>
    <div className="hidden lg:grid place-items-center relative overflow-hidden">
      {[...Array(18)].map((_,i)=><motion.i key={i} className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300" style={{left:`${(i*37)%100}%`,top:`${(i*53)%100}%`}} animate={{y:[0,-40,0],opacity:[.2,1,.2]}} transition={{repeat:Infinity,duration:3+i%4,delay:i*.2}}/>)}
      <motion.div animate={{y:[0,-12,0]}} transition={{repeat:Infinity,duration:4}}><Truck size={110} className="text-cyan-300 drop-shadow-[0_0_30px_#22d3ee]"/></motion.div>
    </div>
    <div className="grid place-items-center p-5"><motion.form noValidate onSubmit={ver?(e=>e.preventDefault()):submit} initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} className="glass p-7 w-full max-w-md">
      {ver?<>
        <div className="text-2xl font-black gt inline-block">VERIFY YOUR ACCOUNT</div><p className="text-white/60 text-sm mb-4">Enter the codes we sent. They expire in 10 minutes.</p>
        <div className="space-y-5">{ver.need.includes('email')&&otpBox('email','Email code')}{ver.need.includes('phone')&&otpBox('phone',ver.required.includes('phone')?'Phone code (required)':'Phone code (optional)')}</div>
        {pend&&<div className="mt-4 text-sm"><p className="text-emerald-300 mb-2">Email verified. Verify your phone too, or skip it for now.</p><button type="button" className="btn2 w-full" onClick={()=>finish(pend)}>SKIP AND CONTINUE</button></div>}
        {err&&<p className="text-red-400 text-sm mt-3">{err}</p>}
        <button type="button" className="text-sm text-cyan-300 mt-4" onClick={()=>{setVer(null);setPend(null)}}>← Back</button></>
      :<>
        <div className="text-2xl font-black gt inline-block">{titles[mode][0]}</div><p className="text-white/60 text-sm mb-5">{titles[mode][1]}</p>
        <motion.div animate={shake} className="space-y-3">
          {courier&&step===1?<><p className="text-sm text-white/60">Step 2 of 2 · Vehicle and ID details</p><KycFields f={f} setF={setF} setErr={setErr}/></>:<>
            {mode==='register'&&<input className="inp" placeholder="Full Name" autoComplete="name" value={f.name} onChange={set('name')}/>}
            <input className="inp" placeholder="Email Address" autoComplete="email" value={f.email} onChange={set('email')}/>
            {mode==='register'&&<input className="inp" inputMode="tel" placeholder={courier?'Mobile number (10 digits, required)':'Mobile number (optional)'} value={f.phone} onChange={set('phone')}/>}
            {mode!=='forgot'&&<div className="relative"><input className="inp pr-11" type={show?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} placeholder="Password" value={f.pw} onChange={set('pw')}/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-3.5 text-white/50" aria-label="Show password">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>}
            {mode==='register'&&<><div className="grid grid-cols-2 gap-x-3 text-xs">{rules.map(([l,t])=><span key={l} className={t(f.pw)?'text-emerald-300':'text-white/40'}>{t(f.pw)?'✓':'○'} {l}</span>)}</div>
              <input className="inp" type="password" autoComplete="new-password" placeholder="Confirm Password" value={f.pw2} onChange={set('pw2')}/>
              <div className="grid grid-cols-2 gap-2 pt-1">{roles.map(([k,l,d,I])=><motion.button type="button" key={k} onClick={()=>{setRole(k);setStep(0)}} whileHover={{y:-2}} className={`glass p-2 text-center text-xs ${role===k?'!border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,.4)]':''}`}><I className="mx-auto mb-1 text-cyan-300" size={20}/><b>{l}</b><span className="block text-white/50 text-[10px] leading-tight">{d}</span></motion.button>)}</div></>}
          </>}
        </motion.div>
        {mode==='login'&&<div className="flex justify-between text-sm mt-3 text-white/60"><label><input type="checkbox" className="mr-2"/>Remember me</label><Link to="/forgot-password" className="text-cyan-300">Forgot Password?</Link></div>}
        {err&&<p className="text-red-400 text-sm mt-3">{err}</p>}
        {mode==='forgot'&&st==='done'&&<div className="text-sm mt-3 space-y-1"><p className="text-emerald-300">If an account exists for that email, we sent a reset link. Check your inbox and spam folder.</p>{link&&<p className="text-amber-300 text-xs">Demo mode: <a className="underline" href={link}>open the reset link</a></p>}</div>}
        <button className="btn w-full mt-5" disabled={st==='load'}>{st==='load'?<Loader2 className="animate-spin" size={18}/>:st==='done'&&mode!=='forgot'?<Check size={18}/>:mode==='login'?'LOGIN TO SYSTEM':mode==='register'?(courier&&step===0?'NEXT: VEHICLE AND ID':'CREATE ACCOUNT'):'SEND RESET LINK'}</button>
        {courier&&step===1&&<button type="button" className="btn2 w-full mt-2" onClick={()=>setStep(0)}>BACK</button>}
        <p className="text-sm text-center mt-4 text-white/60">{mode==='login'?<>Don’t have an account? <Link className="text-cyan-300" to="/register">CREATE ACCOUNT</Link></>:<>Already have an account? <Link className="text-cyan-300" to="/login">Login</Link></>}</p></>}
    </motion.form></div>
  </div>
}

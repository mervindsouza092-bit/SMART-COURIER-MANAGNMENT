import {useState} from 'react'
import {motion,useAnimation} from 'framer-motion'
import {Link,useNavigate} from 'react-router-dom'
import {Loader2,Check,User,ShieldCheck,Truck,Eye,EyeOff} from 'lucide-react'
import {useApp} from '../ui'
import {api,setToken} from '../api'
const roles=[['user','USER','Book and track deliveries.',User],['admin','ADMIN','Manage the complete system.',ShieldCheck],['courier','COURIER','Manage assigned deliveries.',Truck]]
const titles={login:['WELCOME BACK','Access your smart delivery network.'],register:['CREATE YOUR SMART COURIER ACCOUNT','Join the intelligent delivery network.'],forgot:['RESET ACCESS','Enter your email address.']}
export default function Auth({mode}){
  const {setUser,toast}=useApp(),nav=useNavigate(),shake=useAnimation()
  const [f,setF]=useState({name:'',email:'',pw:'',pw2:''}),[role,setRole]=useState('user'),[err,setErr]=useState(''),[st,setSt]=useState('idle'),[show,setShow]=useState(false)
  const strength=[/.{8,}/,/[A-Z]/,/\d/,/[^\w]/].filter(r=>r.test(f.pw)).length
  const set=k=>e=>setF({...f,[k]:e.target.value})
  const fail=m=>{setErr(m);shake.start({x:[0,-10,10,-10,10,0],transition:{duration:.4}})}
  async function submit(e){
    e.preventDefault();setErr('')
    if(!/\S+@\S+\.\S+/.test(f.email))return fail('Enter a valid email address.')
    if(mode==='forgot'){setSt('load');try{await api('/auth/forgot',{method:'POST',body:{email:f.email}});setSt('done')}catch(x){setSt('idle');fail(x.message)}return}
    if(f.pw.length<6)return fail('Password must be at least 6 characters.')
    if(mode==='register'&&!f.name)return fail('Full name is required.')
    if(mode==='register'&&f.pw!==f.pw2)return fail('Passwords do not match.')
    setSt('load')
    try{
      const d=await api(mode==='register'?'/auth/register':'/auth/login',{method:'POST',body:mode==='register'?{name:f.name,email:f.email,phone:'',password:f.pw,role}:{email:f.email,password:f.pw}})
      setToken(d.token);setSt('done')
      setTimeout(()=>{setUser(d.user);toast(`Welcome, ${d.user.name}`);nav(d.user.role==='admin'?'/admin/dashboard':d.user.role==='courier'?'/courier':'/dashboard')},700)
    }catch(x){setSt('idle');fail(x.message)}
  }
  return <div className="min-h-screen grid lg:grid-cols-2">
    <div className="hidden lg:grid place-items-center relative overflow-hidden">
      {[...Array(14)].map((_,i)=><motion.i key={i} className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300" style={{left:`${(i*37)%100}%`,top:`${(i*53)%100}%`}} animate={{y:[0,-40,0],opacity:[.2,1,.2]}} transition={{repeat:Infinity,duration:3+i%4,delay:i*.2}}/>)}
      <Truck size={110} className="text-cyan-300 drop-shadow-[0_0_30px_#22d3ee]"/>
    </div>
    <div className="grid place-items-center p-5"><motion.form onSubmit={submit} initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} className="glass p-7 w-full max-w-md">
      <div className="text-2xl font-black gt">{titles[mode][0]}</div><p className="text-white/60 text-sm mb-5">{titles[mode][1]}</p>
      <motion.div animate={shake} className="space-y-3">
        {mode==='register'&&<input className="inp" placeholder="Full Name" value={f.name} onChange={set('name')}/>}
        <input className="inp" placeholder="Email Address" value={f.email} onChange={set('email')}/>
        {mode!=='forgot'&&<div className="relative"><input className="inp pr-11" type={show?'text':'password'} placeholder="Password" value={f.pw} onChange={set('pw')}/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-3.5 text-white/50" aria-label="Show password">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>}
        {mode==='register'&&<>
          <div className="flex gap-1">{[1,2,3,4].map(i=><motion.i key={i} className={`h-1 flex-1 rounded ${i<=strength?'bg-cyan-400':'bg-white/10'}`} layout/>)}</div>
          <input className="inp" type="password" placeholder="Confirm Password" value={f.pw2} onChange={set('pw2')}/></>}
      </motion.div>
      {mode!=='forgot'&&<div className="grid grid-cols-3 gap-2 mt-4">{roles.filter(r=>mode==='login'||r[0]!=='admin').map(([k,l,d,I])=><motion.button type="button" key={k} onClick={()=>setRole(k)} whileHover={{rotateX:8,scale:1.04}} style={{perspective:500}} className={`glass p-2 text-center text-xs ${role===k?'!border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,.4)]':''}`}><I className="mx-auto mb-1 text-cyan-300" size={20}/><b>{l}</b><span className="block text-white/50 text-[10px] leading-tight">{d}</span></motion.button>)}</div>}
      {mode==='login'&&<div className="flex justify-between text-sm mt-3 text-white/60"><label><input type="checkbox" className="mr-2"/>Remember me</label><Link to="/forgot-password" className="text-cyan-300">Forgot Password?</Link></div>}
      {err&&<p className="text-red-400 text-sm mt-3">{err}</p>}
      {mode==='forgot'&&st==='done'&&<motion.p initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="text-emerald-300 text-sm mt-3">Reset instructions have been sent.</motion.p>}
      <button className="btn w-full mt-5">{st==='load'?<Loader2 className="animate-spin" size={18}/>:st==='done'&&mode!=='forgot'?<Check size={18}/>:mode==='login'?'LOGIN TO SYSTEM':mode==='register'?'CREATE ACCOUNT':'SEND RESET LINK'}</button>
      <p className="text-sm text-center mt-4 text-white/60">{mode==='login'?<>Don’t have an account? <Link className="text-cyan-300" to="/register">CREATE ACCOUNT</Link></>:<>Already have an account? <Link className="text-cyan-300" to="/login">Login</Link></>}</p>
    </motion.form></div>
  </div>
}

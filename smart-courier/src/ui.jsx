import {createContext,useContext,useEffect,useState} from 'react'
import {AnimatePresence,motion} from 'framer-motion'
import {CheckCircle2,Sparkles,X,Send} from 'lucide-react'
import {api,setToken,hasToken} from './api'
export const Ctx=createContext()
export const useApp=()=>useContext(Ctx)
const tone={'In Transit':'cyan','Out for Delivery':'violet','Picked Up':'blue','Delivered':'green',Pending:'amber',Cancelled:'red',Online:'cyan',Available:'green','On Delivery':'violet',Offline:'gray',Paid:'green',Unpaid:'amber',COD:'blue',Highest:'red',High:'amber',Normal:'blue',Low:'gray',Lowest:'gray',Open:'amber',Answered:'green',Closed:'gray',Failed:'red',Approved:'green',Rejected:'red'}
const tc={cyan:'bg-cyan-400/15 text-cyan-300',violet:'bg-violet-400/15 text-violet-300',blue:'bg-blue-400/15 text-blue-300',green:'bg-emerald-400/15 text-emerald-300',amber:'bg-amber-400/15 text-amber-300',red:'bg-red-400/15 text-red-300',gray:'bg-white/10 text-white/50'}
export const Badge=({s})=><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tc[tone[s]]}`}><motion.i className="w-1.5 h-1.5 rounded-full bg-current" animate={{opacity:[1,.3,1]}} transition={{repeat:Infinity,duration:1.5}}/>{s}</span>
export function Counter({to,prefix=''}){
  const [n,setN]=useState(0)
  useEffect(()=>{let v=0;const id=setInterval(()=>{v+=to/40;if(v>=to){v=to;clearInterval(id)}setN(Math.round(v))},25);return()=>clearInterval(id)},[to])
  return <>{prefix}{n.toLocaleString('en-IN')}</>
}
export const Stat=({label,to,prefix,i=0})=><motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*.08}} whileHover={{rotateX:6,rotateY:-6,scale:1.03}} style={{perspective:600}} className="glass stat p-4"><div className="text-xs tracking-widest text-white/50">{label}</div><div className="text-2xl font-black gt mt-1"><Counter to={to} prefix={prefix}/></div></motion.div>
function Orb(){
  const {user}=useApp(),[o,setO]=useState(false),[q,setQ]=useState(''),[m,setM]=useState([{b:1,t:'Hi, I’m Smart Assist. Pick an option or type a tracking ID.'}])
  const ask=async t=>{
    const hist=m.slice(1).map(x=>({role:x.b?'assistant':'user',content:x.t}))
    setM(v=>[...v,{t}]);setQ('')
    if(!user){setM(v=>[...v,{b:1,t:'Please log in so I can look up your parcels.'}]);return}
    try{const r=await api('/chat',{method:'POST',body:{message:t,history:hist}});setM(v=>[...v,{b:1,t:r.reply}])}
    catch(x){setM(v=>[...v,{b:1,t:x.message}])}
  }
  return <>
    <AnimatePresence>{o&&<motion.div initial={{opacity:0,y:20,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:20}} className="glass fixed bottom-24 right-4 w-[calc(100vw-2rem)] max-w-sm z-50 p-4 bg-[#0a0f1f]/90">
      <div className="flex justify-between font-bold gt mb-2">SMART ASSIST<button onClick={()=>setO(false)}><X size={16}/></button></div>
      <div className="h-56 overflow-y-auto space-y-2 text-sm">{m.map((x,i)=><div key={i} className={`px-3 py-2 rounded-xl w-fit max-w-[85%] ${x.b?'bg-white/10':'bg-cyan-500 text-black ml-auto'}`}>{x.t}</div>)}</div>
      <div className="flex flex-wrap gap-1 my-2">{['Track Package','Book Courier','Find Courier','Contact Support'].map(x=><button key={x} onClick={()=>ask(x)} className="text-xs px-2 py-1 rounded-full border border-cyan-400/30 hover:bg-cyan-400/10">{x}</button>)}</div>
      <div className="flex gap-2"><input className="inp !py-2" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&q&&ask(q)} placeholder="Type here…"/><button className="btn !px-3" onClick={()=>q&&ask(q)}><Send size={16}/></button></div>
    </motion.div>}</AnimatePresence>
    <motion.button onClick={()=>setO(!o)} aria-label="Smart Assist" animate={{scale:[1,1.1,1],boxShadow:['0 0 15px #22d3ee','0 0 40px #8b5cf6','0 0 15px #22d3ee']}} transition={{repeat:Infinity,duration:3}} className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[radial-gradient(circle_at_30%_30%,#a5f3fc,#3b82f6_55%,#7c3aed)] grid place-items-center"><Sparkles className="text-white"/></motion.button>
  </>
}
export function Provider({children}){
  const [user,setUser]=useState(null),[ts,setT]=useState([]),[ready,setReady]=useState(!hasToken())
  useEffect(()=>{if(hasToken())api('/auth/me').then(setUser).catch(()=>setToken(null)).finally(()=>setReady(true))},[])
  useEffect(()=>{const f=()=>setUser(null);addEventListener('sc-logout',f);return()=>removeEventListener('sc-logout',f)},[])  // expired or revoked session: back to the login page
  const toast=m=>{const id=Math.random();setT(t=>[...t,{id,m}]);setTimeout(()=>setT(t=>t.filter(x=>x.id!==id)),3500)}
  return <Ctx.Provider value={{user,setUser,toast}}>{ready?children:null}
    <div className="fixed top-4 right-4 z-[60] space-y-2"><AnimatePresence>{ts.map(t=><motion.div key={t.id} layout initial={{x:80,opacity:0}} animate={{x:0,opacity:1}} exit={{x:80,opacity:0}} className="glass px-4 py-3 flex gap-2 items-center bg-[#0a0f1f]/90 shadow-[0_0_20px_rgba(34,211,238,.3)]"><CheckCircle2 size={16} className="text-cyan-300"/>{t.m}</motion.div>)}</AnimatePresence></div>
    <Orb/></Ctx.Provider>
}

export const Modal=({children,onClose})=><motion.div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm grid place-items-center p-4" initial={{opacity:0}} animate={{opacity:1}} onClick={onClose}><motion.div initial={{scale:.9,y:20}} animate={{scale:1,y:0}} className="glass bg-[#0a0f1f] p-5 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>{children}</motion.div></motion.div>
const ART={box:'M4 8l8-4 8 4v8l-8 4-8-4z M4 8l8 4 8-4 M12 12v8',bell:'M6 16v-5a6 6 0 0112 0v5l2 2H4z M10 20a2 2 0 004 0',users:'M9 11a3 3 0 100-6 3 3 0 000 6z M3 20a6 6 0 0112 0 M16 11a3 3 0 100-6 M21 20a6 6 0 00-5-6',search:'M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-5-5',wifi:'M2 9a15 15 0 0120 0 M5 13a10 10 0 0114 0 M8.5 16.5a5 5 0 017 0 M12 20h.01',card:'M3 6h18v12H3z M3 10h18'}
export const Empty=({kind='box',title,text})=><motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="glass p-10 text-center"><div className="relative w-20 h-20 mx-auto mb-3 grid place-items-center"><motion.span className="absolute inset-0 rounded-full border border-cyan-400/40" animate={{scale:[1,1.4],opacity:[.6,0]}} transition={{repeat:Infinity,duration:2}}/><motion.svg viewBox="0 0 24 24" className="w-12 h-12 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" animate={{y:[0,-5,0]}} transition={{repeat:Infinity,duration:3}}><motion.path d={ART[kind]} initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:1.2}}/></motion.svg></div><div className="font-bold">{title}</div><p className="text-white/60 text-sm mt-1">{text}</p></motion.div>

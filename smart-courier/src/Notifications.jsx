import {useEffect,useState} from 'react'
import {Bell} from 'lucide-react'
import {AnimatePresence,motion} from 'framer-motion'
import {api} from './api'
import {useApp} from './ui'
let last={u:null,id:null}
export default function NotifBell(){
  const {user,toast}=useApp(),[list,setList]=useState([]),[open,setOpen]=useState(false)
  const load=()=>api('/notifications').then(l=>{
    if(last.u!==user.id)last={u:user.id,id:null}
    if(last.id!==null)l.filter(n=>n.id>last.id&&!n.read).forEach(n=>toast(`${n.title}: ${n.message}`))
    last.id=l[0]?l[0].id:0;setList(l)
  }).catch(()=>{})
  useEffect(()=>{load();const t=setInterval(load,8000);return()=>clearInterval(t)},[])
  const unread=list.filter(n=>!n.read).length
  const toggle=()=>{setOpen(!open);if(!open&&unread)api('/notifications/read-all',{method:'POST'}).then(()=>setTimeout(load,1500)).catch(()=>{})}
  return <div className="relative"><button aria-label="Notifications" onClick={toggle} className="glass p-2 relative"><Bell size={18}/>{unread>0&&<span className="absolute -top-1 -right-1 bg-cyan-400 text-black text-[10px] font-bold rounded-full w-4 h-4 grid place-items-center">{unread}</span>}</button>
    <AnimatePresence>{open&&<motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="glass bg-[#0a0f1f]/95 absolute right-0 mt-2 w-80 max-w-[85vw] max-h-96 overflow-y-auto z-40 p-2">
      {list.length?list.map(n=><div key={n.id} className={`p-2 border-b border-white/10 text-sm ${n.read?'text-white/60':''}`}><b>{n.title}</b><div className="text-xs">{n.message}</div><div className="text-[10px] text-white/40">{new Date(n.created_at).toLocaleString()}</div></div>):<div className="p-6 text-center text-white/50 text-sm">No notifications yet.</div>}
    </motion.div>}</AnimatePresence></div>
}

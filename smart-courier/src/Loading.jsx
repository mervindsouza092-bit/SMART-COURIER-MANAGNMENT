import {useEffect,useState} from 'react'
import {motion} from 'framer-motion'
import {PackageCheck} from 'lucide-react'
export default function Loading({onDone}){
  const [p,setP]=useState(0)
  useEffect(()=>{const t=setInterval(()=>setP(v=>Math.min(100,v+4)),60);return()=>clearInterval(t)},[])
  useEffect(()=>{if(p>=100){const t=setTimeout(onDone,300);return()=>clearTimeout(t)}},[p])
  const C=2*Math.PI*54
  return <div className="fixed inset-0 z-[100] bg-[#05070f] grid place-items-center overflow-hidden">
    {[...Array(18)].map((_,i)=><motion.i key={i} className="absolute w-1 h-1 rounded-full bg-cyan-300" style={{left:`${(i*43)%100}%`,top:`${(i*29)%100}%`}} animate={{y:[0,-30,0],opacity:[.1,.9,.1]}} transition={{repeat:Infinity,duration:2+i%3,delay:i*.1}}/>)}
    <motion.div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" animate={{top:['0%','100%']}} transition={{repeat:Infinity,duration:2.5,ease:'linear'}}/>
    <div className="text-center relative">
      <div className="relative w-36 h-36 mx-auto mb-6 grid place-items-center">
        <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90"><circle cx="60" cy="60" r="54" fill="none" stroke="#ffffff14" strokeWidth="4"/><circle cx="60" cy="60" r="54" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-p/100)} style={{transition:'stroke-dashoffset .1s linear'}}/></svg>
        <motion.div animate={{y:[0,-6,0],rotate:[0,4,-4,0]}} transition={{repeat:Infinity,duration:2}}><PackageCheck size={44} className="text-cyan-300 drop-shadow-[0_0_14px_#22d3ee]"/></motion.div>
      </div>
      <div className="text-2xl font-black tracking-[.3em] gt">SMART COURIER</div>
      <div className="text-xs tracking-widest text-white/60 mt-2">INITIALIZING DELIVERY NETWORK...</div>
      <div className="text-cyan-300 font-bold mt-3">{p}%</div>
    </div></div>
}

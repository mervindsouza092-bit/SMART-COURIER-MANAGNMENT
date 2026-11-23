import {useEffect,useState} from 'react'
import {motion} from 'framer-motion'
import {Link} from 'react-router-dom'
import {PackageCheck,Radar,Brain,Zap,ArrowRight,Truck} from 'lucide-react'
const feats=[[Radar,'Real-time tracking','Follow every parcel live on the map.'],[Brain,'AI routing','Routes and ETAs optimized automatically.'],[Zap,'Smart allocation','The best courier is assigned instantly.'],[PackageCheck,'Proof of delivery','OTP and photo confirmation.']]
export default function Landing(){
  const [sc,setSc]=useState(false)
  useEffect(()=>{const f=()=>setSc(scrollY>30);addEventListener('scroll',f);return()=>removeEventListener('scroll',f)},[])
  return <div className="relative overflow-hidden">
    <nav className={`fixed top-0 inset-x-0 z-40 flex items-center justify-between px-5 py-4 transition ${sc?'bg-black/70 backdrop-blur-xl':'bg-transparent'}`}>
      <div className="flex items-center gap-2 font-black tracking-widest"><PackageCheck className="text-cyan-300"/>SMART COURIER</div>
      <div className="hidden lg:flex gap-6 text-sm text-white/70">{[['Home','#top'],['Features','#features'],['Services','#services'],['How It Works','#how'],['About','#about']].map(([n,h])=><a key={n} href={h} className="hover:text-cyan-300">{n}</a>)}<Link to="/tracking" className="hover:text-cyan-300">Tracking</Link></div>
      <div className="flex gap-4 items-center"><Link to="/login" className="text-sm hover:text-cyan-300">LOGIN</Link><Link to="/register" className="btn !py-2 text-sm">GET STARTED</Link></div>
    </nav>
    <section id="top" className="min-h-screen grid lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto px-5 pt-24">
      <div>
        <h1 className="text-4xl sm:text-6xl font-black leading-tight">{'THE FUTURE OF COURIER MANAGEMENT.'.split(' ').map((w,i)=><motion.span key={i} className={`inline-block mr-3 ${i>2?'gt':''}`} initial={{opacity:0,y:30,scale:.9}} animate={{opacity:1,y:0,scale:1}} transition={{delay:i*.12}}>{w}</motion.span>)}</h1>
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.9}} className="text-white/60 mt-5 text-lg">Intelligent logistics. Real-time tracking. Seamless deliveries.</motion.p>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:1.1}} className="flex flex-wrap gap-3 mt-8">
          <Link to="/register" className="btn group">START SHIPPING <ArrowRight size={16} className="transition group-hover:translate-x-1"/></Link>
          <Link to="/tracking" className="btn2">TRACK PACKAGE</Link>
        </motion.div>
      </div>
      <div className="glass relative h-80 lg:h-[420px]">
        <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full">
          <motion.path d="M30 250 C100 60 200 280 370 50" fill="none" stroke="#22d3ee" strokeWidth="3" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:2.5}}/>
          {[[30,250],[370,50]].map(([x,y],i)=><motion.circle key={i} cx={x} cy={y} r="8" fill="#22d3ee" animate={{r:[8,14,8],opacity:[1,.4,1]}} transition={{repeat:Infinity,duration:2}}/>)}
        </svg>
        <motion.div className="absolute left-1/3 top-1/3" animate={{y:[0,-14,0],x:[0,12,0]}} transition={{repeat:Infinity,duration:4}}><Truck size={60} className="text-cyan-300 drop-shadow-[0_0_20px_#22d3ee]"/></motion.div>
        <motion.div className="absolute right-4 bottom-4 glass p-3 text-xs tracking-widest bg-black/50" animate={{y:[0,-8,0]}} transition={{repeat:Infinity,duration:3}}>PACKAGE<b className="block text-base text-cyan-300">SC-20491</b>STATUS · IN TRANSIT<br/>ETA · 24 MIN</motion.div>
      </div>
    </section>
    <section id="features" className="max-w-6xl mx-auto px-5 py-24">
      <motion.h2 initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-3xl font-black gt mb-10">BUILT FOR 2035</motion.h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{feats.map(([I,t,d],i)=><motion.div key={t} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}} whileHover={{rotateX:8,rotateY:-8,scale:1.04}} style={{perspective:600}} className="glass p-5"><I className="text-cyan-300 mb-3"/><b>{t}</b><p className="text-sm text-white/60 mt-1">{d}</p></motion.div>)}</div>
    </section>
    <section id="services" className="max-w-6xl mx-auto px-5 py-16">
      <motion.h2 initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-3xl font-black gt mb-8">SERVICES</motion.h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[['Express city delivery','Fast door-to-door delivery with a live ETA.'],['Documents and parcels','Safe handling for everything from papers to packages.'],['Fragile and electronics','Photo proof at pickup and delivery.'],['Flexible payments','Pay online with UPI or card, or cash on delivery.']].map(([t,d],i)=><motion.div key={t} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}} className="glass p-5"><b>{t}</b><p className="text-sm text-white/60 mt-1">{d}</p></motion.div>)}</div>
    </section>
    <section id="how" className="max-w-6xl mx-auto px-5 py-16">
      <motion.h2 initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-3xl font-black gt mb-8">HOW IT WORKS</motion.h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[['01','Book','Enter pickup and delivery addresses and choose a courier.'],['02','Assign','The nearest available courier is assigned automatically.'],['03','Track','Follow the courier live on the map with a smart ETA.'],['04','Deliver','Confirm with a one-time code and photo proof.']].map(([n,t,d],i)=><motion.div key={n} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.12}} className="glass p-5"><div className="text-3xl font-black gt">{n}</div><b>{t}</b><p className="text-sm text-white/60 mt-1">{d}</p></motion.div>)}</div>
    </section>
    <section id="about" className="max-w-3xl mx-auto px-5 py-16 text-center">
      <motion.h2 initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-3xl font-black gt mb-4">ABOUT</motion.h2>
      <p className="text-white/60">SMART COURIER is an AI-assisted courier management system built as a final-year project. It combines real-time tracking, route optimization, ETA prediction and demand forecasting in one platform for customers, couriers and administrators.</p>
    </section>
    <footer className="text-center text-xs text-white/40 py-8 border-t border-white/10">© SMART COURIER · Intelligent Courier Management System</footer>
  </div>
}

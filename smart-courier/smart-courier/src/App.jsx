import {useState} from 'react'
import {Routes,Route,Navigate,Outlet,NavLink,useLocation,useNavigate} from 'react-router-dom'
import {AnimatePresence,motion} from 'framer-motion'
import {LayoutDashboard,MapPin,Users,LogOut,Menu,Plus,UserCog,Boxes,Brain,Package,UserCircle,Cog,CreditCard,BarChart3,History,Bell,PackageCheck,Trophy,Sparkles,IndianRupee,LifeBuoy,Tag,Home,FlaskConical,ShieldAlert,RotateCcw,Gauge,ScrollText,Wallet} from 'lucide-react'
import {Provider,useApp} from './ui'
import {setToken} from './api'
import NotifBell from './Notifications'
import {Prefs,OfflineBanner} from './Prefs'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import {UserDash,AdminDash,Couriers} from './pages/Dash'
import {UsersPage,Shipments,AiInsights,LiveOps} from './pages/Admin'
import CourierDash from './pages/CourierDash'
import {Profile,Settings} from './pages/Account'
import {MyShipments,NotificationsPage} from './pages/Lists'
import {PaymentsAdmin,AnalyticsAdmin} from './pages/AdminMore'
import {AskData,Leaderboard} from './pages/Insights'
import Pricing from './pages/Pricing'
import {Support,Addresses} from './pages/Customer'
import {Promos} from './pages/AdminTools'
import {WhatIf,Fraud,Reattempts,Safety,AuditLog} from './pages/SmartTools'
import CourierEarnings from './pages/CourierEarnings'
import Reset from './pages/Reset'
import Loading from './Loading'
import Tracking from './pages/Tracking'
import Book from './pages/Book'
const Fade=({children})=><motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.22}}>{children}</motion.div>
function Shell(){
  const {user,setUser,toast}=useApp(),nav=useNavigate(),[open,setOpen]=useState(false)
  if(!user)return <Navigate to="/login"/>
  const admin=user.role==='admin'
  const items=user.role==='courier'?[['/courier','My Deliveries',Package],['/courier/earnings','Earnings',Wallet],['/tracking','Track Package',MapPin]]:admin?[['/admin/dashboard','Command Center',LayoutDashboard],['/admin/users','Users',UserCog],['/admin/couriers','Couriers',Users],['/admin/shipments','Shipments',Boxes],['/admin/pricing','Pricing',IndianRupee],['/admin/promos','Promo Codes',Tag],['/admin/support','Support Tickets',LifeBuoy],['/admin/payments','Payments',CreditCard],['/admin/analytics','Analytics',BarChart3],['/admin/ai-insights','AI Insights',Brain],['/admin/ask','Ask Your Data',Sparkles],['/admin/leaderboard','Leaderboard',Trophy],['/admin/whatif','What-if Simulation',FlaskConical],['/admin/fraud','Fraud Alerts',ShieldAlert],['/admin/reattempts','Reattempt Planner',RotateCcw],['/admin/safety','Shift and Safety',Gauge],['/admin/audit','Activity Log',ScrollText],['/admin/live','Live Ops Map',MapPin],['/tracking','Track Package',MapPin]]:[['/dashboard','Dashboard',LayoutDashboard],['/book-courier','Book Courier',Plus],['/shipments','My Shipments',Boxes],['/tracking','Track Package',MapPin],['/history','Delivery History',History],['/payments','Payments',CreditCard],['/support','Support',LifeBuoy],['/addresses','Saved Addresses',Home]]
  const all=[...items,['/notifications','Notifications',Bell],['/profile','Profile',UserCircle],['/settings','Settings',Cog]]
  return <div className="min-h-screen md:flex">
    <button className="md:hidden fixed top-3 left-3 z-40 glass p-2" onClick={()=>setOpen(!open)} aria-label="Menu"><Menu/></button>
    {open&&<div className="md:hidden fixed inset-0 bg-black/60 z-20" onClick={()=>setOpen(false)}/>}
    <aside className={`glass !rounded-none fixed md:sticky top-0 h-screen w-60 shrink-0 p-4 z-30 overflow-y-auto flex flex-col bg-[#070b17] transition-transform ${open?'':'-translate-x-full'} md:translate-x-0`}>
      <div className="gt font-black text-xl mb-8 mt-12 md:mt-0">SMART COURIER</div>
      {all.map(([to,l,I],i)=><NavLink key={to} to={to} style={{animationDelay:`${i*55}ms`}} onClick={()=>setOpen(false)} className={({isActive})=>`navin flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition ${isActive?'bg-cyan-400/15 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.25)]':'text-white/60 hover:text-white hover:translate-x-1'}`}><I size={18}/>{l}</NavLink>)}
      <Prefs className="mt-auto pt-4 pb-2"/><button onClick={()=>{setToken(null);setUser(null);toast('Logged out');nav('/')}} className="flex gap-3 px-3 py-2.5 text-white/60 hover:text-white"><LogOut size={18}/>Logout</button>
    </aside>
    <main className="flex-1 p-5 pt-16 md:pt-6 min-w-0"><OfflineBanner/><div className="flex justify-end mb-3"><NotifBell/></div><Outlet/></main>
  </div>
}
export default function App(){
  const l=useLocation(),[boot,setBoot]=useState(true)
  if(boot)return <Loading onDone={()=>setBoot(false)}/>
  return <Provider><AnimatePresence mode="wait"><Routes location={l} key={l.pathname}>
    <Route path="/" element={<Fade><Landing/></Fade>}/>
    <Route path="/login" element={<Fade><Auth mode="login"/></Fade>}/>
    <Route path="/register" element={<Fade><Auth mode="register"/></Fade>}/>
    <Route path="/reset-password" element={<Fade><Reset/></Fade>}/>
    <Route path="/forgot-password" element={<Fade><Auth mode="forgot"/></Fade>}/>
    <Route element={<Shell/>}>
      <Route path="/dashboard" element={<Fade><UserDash/></Fade>}/>
      <Route path="/book-courier" element={<Fade><Book/></Fade>}/>
      <Route path="/tracking" element={<Fade><Tracking/></Fade>}/>
      <Route path="/admin/dashboard" element={<Fade><AdminDash/></Fade>}/>
      <Route path="/profile" element={<Fade><Profile/></Fade>}/>
      <Route path="/settings" element={<Fade><Settings/></Fade>}/>
      <Route path="/shipments" element={<Fade><MyShipments mode="all"/></Fade>}/>
      <Route path="/history" element={<Fade><MyShipments mode="history"/></Fade>}/>
      <Route path="/payments" element={<Fade><MyShipments mode="payments"/></Fade>}/>
      <Route path="/notifications" element={<Fade><NotificationsPage/></Fade>}/>
      <Route path="/support" element={<Fade><Support/></Fade>}/>
      <Route path="/addresses" element={<Fade><Addresses/></Fade>}/>
      <Route path="/admin/support" element={<Fade><Support/></Fade>}/>
      <Route path="/admin/promos" element={<Fade><Promos/></Fade>}/>
      <Route path="/admin/pricing" element={<Fade><Pricing/></Fade>}/>
      <Route path="/courier/earnings" element={<Fade><CourierEarnings/></Fade>}/>
      <Route path="/admin/whatif" element={<Fade><WhatIf/></Fade>}/>
      <Route path="/admin/fraud" element={<Fade><Fraud/></Fade>}/>
      <Route path="/admin/reattempts" element={<Fade><Reattempts/></Fade>}/>
      <Route path="/admin/safety" element={<Fade><Safety/></Fade>}/>
      <Route path="/admin/audit" element={<Fade><AuditLog/></Fade>}/>
      <Route path="/admin/ask" element={<Fade><AskData/></Fade>}/>
      <Route path="/admin/leaderboard" element={<Fade><Leaderboard/></Fade>}/>
      <Route path="/admin/payments" element={<Fade><PaymentsAdmin/></Fade>}/>
      <Route path="/admin/analytics" element={<Fade><AnalyticsAdmin/></Fade>}/>
      <Route path="/courier" element={<Fade><CourierDash/></Fade>}/>
      <Route path="/admin/live" element={<Fade><LiveOps/></Fade>}/>
      <Route path="/admin/users" element={<Fade><UsersPage/></Fade>}/>
      <Route path="/admin/shipments" element={<Fade><Shipments/></Fade>}/>
      <Route path="/admin/ai-insights" element={<Fade><AiInsights/></Fade>}/>
      <Route path="/admin/couriers" element={<Fade><Couriers/></Fade>}/>
    </Route>
    <Route path="*" element={<Navigate to="/"/>}/>
  </Routes></AnimatePresence></Provider>
}

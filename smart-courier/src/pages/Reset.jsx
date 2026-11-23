import {useState} from 'react'
import {Link,useNavigate} from 'react-router-dom'
import {motion} from 'framer-motion'
import {api} from '../api'
export default function Reset(){
  const token=new URLSearchParams(location.search).get('token')||'',nav=useNavigate()
  const [pw,setPw]=useState(''),[pw2,setPw2]=useState(''),[err,setErr]=useState(''),[done,setDone]=useState(false)
  const go=async e=>{e.preventDefault();setErr('')
    if(!token)return setErr('This link is missing its reset code. Request a new one.')
    if(pw.length<6)return setErr('Password must be at least 6 characters.')
    if(pw!==pw2)return setErr('Passwords do not match.')
    try{await api('/auth/reset',{method:'POST',body:{token,password:pw}});setDone(true);setTimeout(()=>nav('/login'),1800)}catch(x){setErr(x.message)}}
  return <div className="min-h-screen grid place-items-center p-5"><motion.form onSubmit={go} initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} className="glass p-7 w-full max-w-md space-y-3">
    <div className="text-2xl font-black gt">CHOOSE A NEW PASSWORD</div>
    <input className="inp" type="password" placeholder="New password" value={pw} onChange={e=>setPw(e.target.value)}/>
    <input className="inp" type="password" placeholder="Confirm new password" value={pw2} onChange={e=>setPw2(e.target.value)}/>
    {err&&<p className="text-red-400 text-sm">{err}</p>}{done&&<p className="text-emerald-300 text-sm">Password updated. Taking you to login…</p>}
    <button className="btn w-full">UPDATE PASSWORD</button><Link to="/login" className="block text-center text-sm text-cyan-300">Back to login</Link></motion.form></div>
}

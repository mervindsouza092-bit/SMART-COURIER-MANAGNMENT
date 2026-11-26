import {useEffect,useState} from 'react'
import {Sun,Moon,Download,WifiOff} from 'lucide-react'
import {getLang,setLang,LANGS} from './i18n'
import {getTheme,setTheme} from './theme'
let deferred=null
if(typeof window!=='undefined')addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;dispatchEvent(new Event('sc-install'))})
export function Prefs({compact=false,className=''}){
  const [lang,setL]=useState(getLang()),[theme,setT]=useState(getTheme()),[can,setCan]=useState(!!deferred)
  useEffect(()=>{const f=()=>setCan(!!deferred);addEventListener('sc-install',f);return()=>removeEventListener('sc-install',f)},[])
  const install=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;setCan(false)}
  const pill=on=>`px-2 py-1 rounded-lg text-xs font-bold transition ${on?'bg-cyan-400/20 text-cyan-300':'text-white/60 hover:text-white'}`
  return <div className={`flex flex-wrap items-center gap-2 ${className}`}>
    <button aria-label={theme==='dark'?'Light mode':'Dark mode'} title={theme==='dark'?'Light mode':'Dark mode'} onClick={()=>{const n=theme==='dark'?'light':'dark';setTheme(n);setT(n)}} className="glass !rounded-lg p-1.5">{theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}</button>
    <div className="glass !rounded-lg p-0.5 flex">{LANGS.map(([k,l])=><button key={k} aria-label={'Language '+l} onClick={()=>{setLang(k);setL(k)}} className={pill(lang===k)}>{l}</button>)}</div>
    {can&&<button onClick={install} className="btn2 !py-1 !px-2 text-xs"><Download size={13}/>{compact?'':'Install app'}</button>}
  </div>
}
export function OfflineBanner(){
  const [on,setOn]=useState(typeof navigator==='undefined'?true:navigator.onLine)
  useEffect(()=>{const a=()=>setOn(true),b=()=>setOn(false);addEventListener('online',a);addEventListener('offline',b);return()=>{removeEventListener('online',a);removeEventListener('offline',b)}},[])
  return on?null:<div className="glass !rounded-xl p-2 mb-3 text-sm text-amber-300 flex items-center gap-2"><WifiOff size={16}/>You are offline. Showing the last saved data. Changes need a connection.</div>
}

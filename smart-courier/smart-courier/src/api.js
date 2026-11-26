import {useEffect,useState} from 'react'
const BASE=import.meta.env.VITE_API||'http://localhost:8000/api'
let token=null
try{token=localStorage.getItem('sc_token')}catch{}
export const setToken=t=>{token=t;try{t?localStorage.setItem('sc_token',t):localStorage.removeItem('sc_token')}catch{};if(!t)navigator.serviceWorker?.controller?.postMessage('clear')}
export const hasToken=()=>!!token
export function useDebounced(v,ms=300){const [d,setD]=useState(v);useEffect(()=>{const t=setTimeout(()=>setD(v),ms);return()=>clearTimeout(t)},[v,ms]);return d}
export const getToken=()=>token
export const wsUrl=p=>BASE.replace(/^http/,'ws').replace(/\/api$/,'')+p
export async function api(path,opt={}){
  let r
  try{r=await fetch(BASE+path,{method:opt.method||'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:opt.body?JSON.stringify(opt.body):undefined})}
  catch{throw new Error('Cannot reach the server. Is the backend running on port 8000?')}
  if(r.status===204)return null
  const d=await r.json().catch(()=>({}))
  if(!r.ok)throw new Error(typeof d.detail==='string'?d.detail:'Request failed. Please check your input.')
  return d
}
export function useApi(path){
  const [data,setD]=useState(null),[err,setE]=useState(''),[n,setN]=useState(0)
  useEffect(()=>{let live=true;api(path).then(d=>{if(live){setD(d);setE('')}}).catch(x=>live&&setE(x.message));return()=>{live=false}},[path,n])
  return {data,err,reload:()=>setN(v=>v+1)}
}
export async function download(path,name){
  const r=await fetch(BASE+path,{headers:token?{Authorization:'Bearer '+token}:{}})
  if(!r.ok)throw new Error('Could not download the file')
  const a=document.createElement('a');a.href=URL.createObjectURL(await r.blob());a.download=name;a.click()
}

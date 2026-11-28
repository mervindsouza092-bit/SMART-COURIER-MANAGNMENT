import {useState,useEffect} from 'react'
import {Loader2} from 'lucide-react'
import {Modal} from './ui'
import {useApi} from './api'
export const BANKS=[['State Bank of India','SBIN'],['HDFC Bank','HDFC'],['ICICI Bank','ICIC'],['Axis Bank','UTIB'],['Kotak Mahindra','KKBK'],['Yes Bank','YESB'],['IDFC First Bank','IDFB'],['Union Bank','UBIN'],['Bank of Baroda','BARB_R'],['Punjab National Bank','PUNB_R']]
export const APPS=['Google Pay','PhonePe','Paytm','BHIM','Amazon Pay']
export const WALLETS=[['Paytm Wallet','paytm'],['PhonePe Wallet','phonepe'],['Amazon Pay','amazonpay'],['Mobikwik','mobikwik'],['Freecharge','freecharge']]
export const newChoice=()=>({method:'UPI',how:'app',vpa:'',app:'Google Pay',bank:'SBIN',wallet:'paytm'})
export const validChoice=c=>c.method==='UPI'&&c.how==='id'&&!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(c.vpa.trim())?'Enter a valid UPI ID, for example name@okhdfcbank':''
const tile=on=>`glass !rounded-xl p-3 text-left text-sm transition ${on?'!border-cyan-300 shadow-[0_0_16px_rgba(34,211,238,.3)]':''}`
export function PayPicker({value:v,onChange,allowCod=true}){
  const {data:cfg}=useApi('/pay/config'),demo=!cfg||cfg.demo,set=p=>onChange({...v,...p})
  useEffect(()=>{if(cfg&&!cfg.demo&&v.how==='id')onChange({...v,how:'app'})},[cfg])
  const methods=['UPI','Net Banking','Wallet',...(allowCod?['Cash on Delivery']:[])]
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2">{methods.map(m=><button type="button" key={m} onClick={()=>set({method:m})} className={v.method===m?'btn !py-1.5 text-xs':'btn2 !py-1.5 text-xs'}>{m}</button>)}</div>
    {v.method==='UPI'&&<div className="space-y-2">
      <div className="grid sm:grid-cols-2 gap-2">
        <button type="button" className={tile(v.how==='app')} onClick={()=>set({how:'app'})}><b>Pay with a UPI app</b><span className="block text-xs text-white/50">Opens Google Pay, PhonePe, Paytm and more</span></button>
        {demo&&<button type="button" className={tile(v.how==='id')} onClick={()=>set({how:'id'})}><b>Enter your UPI ID</b><span className="block text-xs text-white/50">We send a request to your UPI app</span></button>}
      </div>
      {v.how==='app'&&<div className="flex flex-wrap gap-2">{APPS.map(a=><button type="button" key={a} className={v.app===a?'btn !py-1 !px-3 text-xs':'btn2 !py-1 !px-3 text-xs'} onClick={()=>set({app:a})}>{a}</button>)}</div>}
      {v.how==='id'&&<input className="inp" placeholder="yourname@bank" value={v.vpa} onChange={e=>set({vpa:e.target.value})}/>}
      {!demo&&<p className="text-xs text-white/40">Banks no longer accept manually typed UPI IDs, so you pay by choosing your UPI app or scanning a QR code on the next screen.</p>}
    </div>}
    {v.method==='Net Banking'&&<div className="grid grid-cols-2 gap-2">{BANKS.map(([n,c])=><button type="button" key={c} className={tile(v.bank===c)} onClick={()=>set({bank:c})}>{n}</button>)}</div>}
    {v.method==='Wallet'&&<div className="grid grid-cols-2 gap-2">{WALLETS.map(([n,c])=><button type="button" key={c} className={tile(v.wallet===c)} onClick={()=>set({wallet:c})}>{n}</button>)}</div>}
    {v.method==='Cash on Delivery'&&<p className="text-sm text-white/60">Pay the courier in cash when the parcel arrives. Keep the exact amount ready.</p>}
    {cfg&&cfg.demo&&v.method!=='Cash on Delivery'&&<p className="text-xs text-amber-300">Demo mode: no real money is charged.</p>}
  </div>
}
// Mounted once in the app. Shows the method chooser and the demo gateway when pay.js asks for them.
export function PayDialogs(){
  const [ch,setCh]=useState(null),[dg,setDg]=useState(null),[err,setErr]=useState('')
  useEffect(()=>{
    const a=e=>{setErr('');setCh({...e.detail,choice:newChoice()})},b=e=>setDg({...e.detail,busy:false})
    addEventListener('sc-choose-pay',a);addEventListener('sc-demo-pay',b)
    return()=>{removeEventListener('sc-choose-pay',a);removeEventListener('sc-demo-pay',b)}
  },[])
  const cancelCh=()=>{ch&&ch.rej(new Error('Payment cancelled'));setCh(null)}
  const go=()=>{const e=validChoice(ch.choice);if(e)return setErr(e);ch.res(ch.choice);setCh(null)}
  const cancelDg=()=>{dg&&dg.rej(new Error('Payment cancelled'));setDg(null)}
  const confirmDg=()=>{const d=dg;setDg({...d,busy:true});setTimeout(()=>{d.res();setDg(null)},1300)}
  const c=dg?.choice
  const lines=!c?[]:c.method==='UPI'?(c.how==='id'?[`A payment request for ₹${dg.amount} was sent to ${c.vpa}.`,'Open your UPI app and approve it.']:[`Opening ${c.app}…`,`Confirm the payment of ₹${dg.amount} in the app.`])
    :c.method==='Net Banking'?[`Redirecting to ${(BANKS.find(b=>b[1]===c.bank)||[])[0]} net banking…`,'Log in and approve the payment.']:[`Pay ₹${dg.amount} with ${(WALLETS.find(w=>w[1]===c.wallet)||[])[0]}.`]
  return <>
    {ch&&<Modal onClose={cancelCh}><div className="font-bold gt mb-3 inline-block">CHOOSE HOW TO PAY · ₹{ch.amount}</div><PayPicker value={ch.choice} onChange={v=>setCh({...ch,choice:v})} allowCod={false}/>
      {err&&<p className="text-red-400 text-sm mt-2">{err}</p>}<div className="flex justify-end gap-2 mt-4"><button className="btn2" onClick={cancelCh}>CANCEL</button><button className="btn" onClick={go}>PAY ₹{ch.amount}</button></div></Modal>}
    {dg&&<Modal onClose={cancelDg}><div className="font-bold gt mb-1 inline-block">DEMO PAYMENT GATEWAY</div><p className="text-xs text-amber-300 mb-3">Demo mode: no real money is charged.</p>{lines.map(l=><p key={l} className="text-sm text-white/80">{l}</p>)}
      <div className="flex justify-end gap-2 mt-4"><button className="btn2" onClick={cancelDg} disabled={dg.busy}>CANCEL</button><button className="btn" onClick={confirmDg} disabled={dg.busy}>{dg.busy?<Loader2 className="animate-spin" size={16}/>:`CONFIRM ₹${dg.amount}`}</button></div></Modal>}
  </>
}

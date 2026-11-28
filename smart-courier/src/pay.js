import {api} from './api'
const loadRzp=()=>new Promise((res,rej)=>{if(window.Razorpay)return res();const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=res;s.onerror=()=>rej(new Error('Could not load the payment window. Check your internet connection.'));document.body.appendChild(s)})
export const choosePayment=amount=>new Promise((res,rej)=>dispatchEvent(new CustomEvent('sc-choose-pay',{detail:{amount,res,rej}})))
export const demoGateway=(choice,amount)=>new Promise((res,rej)=>dispatchEvent(new CustomEvent('sc-demo-pay',{detail:{choice,amount,res,rej}})))
// Pays for a shipment. Without Razorpay keys on the server this runs the demo gateway; with keys it opens Razorpay with the chosen method pre-selected and cards hidden.
export async function payNow(sid,user,choice){
  const o=await api('/payments/order',{method:'POST',body:{shipment_id:sid}})
  const amount=Math.round((o.amount||0))/100
  const c=choice&&choice.method!=='Cash on Delivery'?choice:await choosePayment(amount)
  if(o.mode==='demo'){await demoGateway(c,amount);await api('/payments/demo-pay',{method:'POST',body:{shipment_id:sid,method:c.method}});return}
  await loadRzp()
  return new Promise((res,rej)=>{
    const prefill={name:user.name,email:user.email,contact:user.phone}
    if(c.method==='UPI'){prefill.method='upi';if(c.how==='id')prefill.vpa=c.vpa.trim()}
    if(c.method==='Net Banking'){prefill.method='netbanking';prefill.bank=c.bank}
    if(c.method==='Wallet'){prefill.method='wallet';prefill.wallet=c.wallet}
    const r=new window.Razorpay({key:o.key_id,amount:o.amount,currency:'INR',name:'SMART COURIER',description:'Shipment '+o.tracking_id,order_id:o.order_id,prefill,
      config:{display:{hide:[{method:'card'},{method:'emi'},{method:'paylater'}]}},theme:{color:'#22d3ee'},
      handler:async resp=>{try{await api('/payments/verify',{method:'POST',body:{shipment_id:sid,...resp}});res()}catch(e){rej(e)}},
      modal:{ondismiss:()=>rej(new Error('Payment cancelled'))}})
    r.on('payment.failed',e=>rej(new Error(e.error?.description||'Payment failed')))
    r.open()
  })
}

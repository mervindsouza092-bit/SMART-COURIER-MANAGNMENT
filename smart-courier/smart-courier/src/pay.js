import {api} from './api'
const loadRzp=()=>new Promise((res,rej)=>{if(window.Razorpay)return res();const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=res;s.onerror=()=>rej(new Error('Could not load the payment window. Check your internet connection.'));document.body.appendChild(s)})
// Pays for a shipment. Uses the Razorpay window when the server has keys, otherwise demo mode.
export async function payNow(sid,user){
  const o=await api('/payments/order',{method:'POST',body:{shipment_id:sid}})
  if(o.mode==='demo'){await api('/payments/demo-pay',{method:'POST',body:{shipment_id:sid}});return}
  await loadRzp()
  return new Promise((res,rej)=>{
    const r=new window.Razorpay({key:o.key_id,amount:o.amount,currency:'INR',name:'SMART COURIER',description:'Shipment '+o.tracking_id,order_id:o.order_id,prefill:{name:user.name,email:user.email,contact:user.phone},theme:{color:'#22d3ee'},
      handler:async resp=>{try{await api('/payments/verify',{method:'POST',body:{shipment_id:sid,...resp}});res()}catch(e){rej(e)}},
      modal:{ondismiss:()=>rej(new Error('Payment cancelled'))}})
    r.on('payment.failed',e=>rej(new Error(e.error?.description||'Payment failed')))
    r.open()
  })
}

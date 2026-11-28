import {api} from './api'
import {shrink} from './img'
import {parseLabel} from './labelParse'
export {parseLabel}
// Reads a parcel label photo: Claude vision on the server when available, otherwise Tesseract OCR inside the browser.
export async function readLabel(file){
  const image=await shrink(file,1280,.8)
  try{const r=await api('/ocr/label',{method:'POST',body:{image}});if(r.engine==='claude')return r}catch(x){if(/limit|Too many/i.test(x.message))throw x}
  const {createWorker}=await import('tesseract.js')
  const w=await createWorker('eng')
  try{const {data}=await w.recognize(image);return{engine:'browser',...parseLabel(data.text||'')}}finally{await w.terminate()}
}

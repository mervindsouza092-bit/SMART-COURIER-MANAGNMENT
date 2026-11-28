// Best-effort parser for text read from a parcel label (used when Claude vision is not available)
const MARK=/^(to|ship to|deliver to|deliver|consignee|receiver)\b\s*[:\-]?\s*/i
export function parseLabel(text){
  const lines=(text||'').split(/\r?\n/).map(s=>s.replace(/\s+/g,' ').trim()).filter(l=>l.length>1)
  const joined=lines.join('\n')
  const ph=joined.match(/(?:\+?91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})\b/),phone=ph?ph[1].replace(/\D/g,''):null
  const pin=(joined.match(/\b[1-9]\d{2}\s?\d{3}\b/g)||[]).pop()||null
  const mk=lines.findIndex(l=>MARK.test(l)),from=lines.findIndex(l=>/^(from|sender|ship from)\b\s*[:\-]?/i.test(l))
  let block=[]
  if(mk>=0){for(let i=mk;i<lines.length&&block.length<6;i++){if(i>mk&&i===from)break;block.push(lines[i].replace(MARK,''))}}
  else if(pin){const pi=lines.findIndex(l=>l.replace(/\s/g,'').includes(pin.replace(/\s/g,'')));if(pi>=0)block=lines.slice(Math.max(0,pi-3),pi+1)}
  block=block.filter(Boolean)
  const name=block.length>1&&!/\d/.test(block[0])?block[0]:null
  const addr=(name?block.slice(1):block).filter(l=>!(phone&&l.replace(/\D/g,'').endsWith(phone))).join(', ')
  return{to_name:name,to_phone:phone,to_address:addr||null}
}

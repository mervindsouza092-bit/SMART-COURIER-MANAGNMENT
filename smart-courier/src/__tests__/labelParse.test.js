import {describe,it,expect} from 'vitest'
import {parseLabel} from '../labelParse'
const SAMPLE='From: Raj Stores\nVirar West 401303\nTO:\nAarav Patil\nFlat 4, Sai Residency\nAndheri East, Mumbai 400069\nPh: 98765 43210'
describe('parseLabel',()=>{
  it('finds the receiver name, phone and address after the TO marker',()=>{
    const r=parseLabel(SAMPLE)
    expect(r.to_name).toBe('Aarav Patil');expect(r.to_phone).toBe('9876543210')
    expect(r.to_address).toBe('Flat 4, Sai Residency, Andheri East, Mumbai 400069')
  })
  it('does not mix in the sender address',()=>expect(parseLabel(SAMPLE).to_address).not.toContain('Virar'))
  it('copes with a label without a TO marker by using the PIN code line',()=>{
    const r=parseLabel('Order 55\nRohan Mehta\nShop 2, Station Road\nThane 400601')
    expect(r.to_address).toContain('Thane 400601')
  })
  it('returns empty fields for unreadable text',()=>expect(parseLabel('???')).toEqual({to_name:null,to_phone:null,to_address:null}))
})

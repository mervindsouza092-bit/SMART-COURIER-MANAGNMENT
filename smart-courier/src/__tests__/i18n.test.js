import {describe,it,expect} from 'vitest'
import {translate} from '../i18n'
describe('translate',()=>{
  it('keeps English unchanged',()=>expect(translate('Settings','en')).toBe('Settings'))
  it('translates a whole string to Hindi',()=>expect(translate('Settings','hi')).toBe('सेटिंग्स'))
  it('translates to Marathi and keeps surrounding spaces',()=>expect(translate(' Logout ','mr')).toBe(' लॉग आउट '))
  it('leaves unknown text such as tracking IDs alone',()=>expect(translate('SC-2026-94821','hi')).toBe('SC-2026-94821'))
  it('does not translate a word inside a longer word',()=>expect(translate('Highest','hi')).toBe('सर्वोच्च'))
  it('translates known words inside longer text',()=>expect(translate('USE MY CURRENT LOCATION now','hi')).toContain('मेरा वर्तमान स्थान'))
})

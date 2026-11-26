export const getTheme=()=>{try{return localStorage.getItem('sc_theme')||'dark'}catch{return'dark'}}
export function setTheme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('sc_theme',t)}catch{}}

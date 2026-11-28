import {Component} from 'react'
export default class ErrorBoundary extends Component{
  state={err:null}
  static getDerivedStateFromError(err){return{err}}
  componentDidCatch(e,i){console.error('UI error',e,i)}
  render(){
    if(!this.state.err)return this.props.children
    return <div className="min-h-screen grid place-items-center p-6 text-center"><div className="glass p-8 max-w-md"><h1 className="text-xl font-black gt inline-block mb-2">Something went wrong</h1><p className="text-white/60 text-sm mb-4">The page hit an unexpected problem. Reloading usually fixes it.</p><button className="btn" onClick={()=>{try{localStorage.removeItem('sc_token')}catch{};location.href='/'}}>RELOAD</button></div></div>
  }
}

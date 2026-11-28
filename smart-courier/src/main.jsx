import React from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import {initI18n} from './i18n'
import './index.css'
createRoot(document.getElementById('root')).render(<ErrorBoundary><BrowserRouter><App/></BrowserRouter></ErrorBoundary>)
initI18n()
if('serviceWorker' in navigator&&import.meta.env.PROD)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))

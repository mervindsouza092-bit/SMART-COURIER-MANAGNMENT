import {useEffect} from 'react'
import {MapContainer,TileLayer,LayersControl,Marker,Polyline,Popup,useMap} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
const pin=(c,e)=>L.divIcon({className:'',html:`<div style="font-size:24px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))">${e}</div>`,iconSize:[28,28],iconAnchor:[14,14]})
export const icons={pickup:pin('#8b5cf6','📍'),dest:pin('#34d399','🏁'),courier:pin('#22d3ee','🚚')}
// Real road route from OSRM (free public demo server). a, b = [lat,lng]
export async function route(a,b){
  try{const r=await fetch(`https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`);const x=(await r.json()).routes[0];return{pts:x.geometry.coordinates.map(([lng,lat])=>[lat,lng]),km:x.distance/1000,min:x.duration/60}}catch{return null}
}
// Address -> coordinates via OpenStreetMap Nominatim
export async function geocode(q){
  try{const d=await(await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`)).json();return d[0]?{lat:+d[0].lat,lng:+d[0].lon,name:d[0].display_name}:null}catch{return null}
}
function Fit({pts}){const m=useMap();useEffect(()=>{if(pts.length>1)m.fitBounds(pts,{padding:[40,40]});else if(pts.length)m.setView(pts[0],14)},[pts.length]);return null}
export default function LiveMap({markers=[],line=[],h=380}){
  const pts=markers.map(m=>m.pos)
  return <div className="glass p-1 overflow-hidden" style={{height:h}}><MapContainer center={pts[0]||[19.2,72.85]} zoom={11} style={{height:'100%',width:'100%'}} scrollWheelZoom>
    <LayersControl position="topright">
      <LayersControl.BaseLayer checked name="Street map"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19}/></LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="Satellite"><TileLayer attribution="Tiles &copy; Esri" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={19}/></LayersControl.BaseLayer>
    </LayersControl>
    {line.length>1&&<Polyline positions={line} pathOptions={{color:'#2563eb',weight:5,opacity:.9}}/>}
    {markers.map((m,i)=><Marker key={i} position={m.pos} icon={m.icon}><Popup>{m.label}</Popup></Marker>)}
    <Fit pts={pts}/></MapContainer></div>
}

"use client";
const nodes=[{id:"a",x:40,y:40,label:"SRC"},{id:"b",x:190,y:30,label:"SW-01"},{id:"c",x:320,y:90,label:"RTR"},{id:"d",x:190,y:150,label:"SW-02"},{id:"e",x:40,y:170,label:"HOST"},{id:"f",x:320,y:200,label:"DST"}];
const edges:[[string,string],[string,string],[string,string],[string,string],[string,string],[string,string]]=[["a","b"],["b","c"],["b","d"],["d","e"],["c","f"],["d","c"]];
function pos(id:string){return nodes.find(n=>n.id===id)!}
export function NetworkDiagram(){return <svg viewBox="0 0 360 240" className="h-full w-full" role="img" aria-label="Abstract network topology diagram">
{edges.map(([from,to],i)=>{const a=pos(from),b=pos(to);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} pathLength="1" stroke="var(--border-strong)" strokeWidth="1" strokeOpacity=".5" className="network-edge" style={{animationDelay:`${.15*i}s`}}/>})}
<circle r="2.6" cx="40" cy="40" fill="var(--vermilion)" className="packet-a"/><circle r="2.6" cx="190" cy="30" fill="var(--vermilion)" className="packet-b"/>
{nodes.map((n,i)=><g key={n.id} className="network-node" style={{animationDelay:`${.9+i*.08}s`,animationFillMode:"both"}}><circle cx={n.x} cy={n.y} r={n.id==="c"||n.id==="b"?7:5} fill="var(--surface)" stroke="var(--cobalt)" strokeWidth="1.5"/><text x={n.x} y={n.y+20} textAnchor="middle" fontFamily="var(--font-ibm-plex-mono), monospace" fontSize="8" fill="var(--muted)">{n.label}</text></g>)}
</svg>}

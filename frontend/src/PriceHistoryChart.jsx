import { useMemo, useState } from "react";
const money=(amount)=>"$"+Number(amount).toLocaleString("es-CL");
const formatDate=(date,locale)=>new Date(date).toLocaleDateString(locale==="en"?"en-US":"es-CL");
const COLORS=["#337ac2","#d1664e","#2e9970","#9a70ca","#db9e2d","#3d99b8","#d2548c"];
export function inDateRange(point,from,to) {
  const date=new Date(point.checkedAt).getTime();
  const start=from?Date.parse(from+"T00:00:00"): -Infinity;
  const end=to?Date.parse(to+"T23:59:59"):Infinity;
  return Number.isFinite(date)&&date>=start&&date<=end;
}
export default function PriceHistoryChart({history,t,locale}) {
  const [days,setDays]=useState("all");
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const [hidden,setHidden]=useState([]);
  const cutoff=days==="all"?-Infinity:Date.now()-Number(days)*86400000;
  const sources=useMemo(()=>(history.sources||[]).map((source)=>({
    ...source,
    visible:source.points.filter((point)=>Date.parse(point.checkedAt)>=cutoff&&inDateRange(point,from,to))
  })),[history,cutoff,from,to]);
  const all=sources.filter(s=>!hidden.includes(s.sourceId)).flatMap(s=>s.visible);
  const minTime=all.length?Math.min(...all.map(p=>Date.parse(p.checkedAt))):0;
  const maxTime=all.length?Math.max(...all.map(p=>Date.parse(p.checkedAt))):0;
  const minPrice=all.length?Math.min(...all.map(p=>p.priceClp)):0;
  const maxPrice=all.length?Math.max(...all.map(p=>p.priceClp)):0;
  const width=800,height=250,padX=72,padY=35;
  const pointCoords=(point)=>{
    const spanTime=Math.max(1,maxTime-minTime);
    const spanPrice=Math.max(1,maxPrice-minPrice);
    const x=padX+(Date.parse(point.checkedAt)-minTime)*(width-2*padX)/spanTime;
    const y=height-padY-(point.priceClp-minPrice)*(height-2*padY)/spanPrice;
    return {x,y};
  };
  return <div className="history-explorer">
    <div className="history-options">
      <div className="history-presets" role="group" aria-label={t("Período")}>
        {[["7","7d"],["30","30d"],["90","90d"],["365","1a"],["all",t("Todo")]].map(([value,label])=>
          <button type="button" className={days===value?"active":""} key={value} onClick={()=>setDays(value)}>
            {label}
          </button>)}
      </div>
      <div className="history-date-inputs">
        <label>{t("Desde")} <input type="date" value={from} onChange={(e)=>{setFrom(e.target.value);setDays("all");}}/></label>
        <label>{t("Hasta")} <input type="date" value={to} onChange={(e)=>{setTo(e.target.value);setDays("all");}}/></label>
      </div>
    </div>
    {sources.length===0 || all.length===0
      ? <p className="feature-note">{t("No hay observaciones reales para este período.")}</p>
      : <svg className="full-history-chart" viewBox="0 0 800 250" role="img" aria-label={t("Evolución de precios por tienda")}>
          {[0,.25,.5,.75,1].map((fraction)=>{
            const y=height-padY-fraction*(height-2*padY);
            const price=minPrice+fraction*(maxPrice-minPrice);
            return <g key={fraction}>
              <line x1={padX} x2={width-padX} y1={y} y2={y} className="history-grid-line"/>
              <text x={padX-8} y={y+4} textAnchor="end" className="history-axis-text">{Math.round(price/1000)}k</text>
            </g>;
          })}
          {sources.filter(s=>!hidden.includes(s.sourceId)).map((source)=>{
            const color=COLORS[sources.findIndex(s=>s.sourceId===source.sourceId)%COLORS.length];
            const coords=source.visible.map(pointCoords);
            return <g key={source.sourceId}>
              {coords.length>1 && <polyline points={coords.map(p=>p.x+","+p.y).join(" ")}
                fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round"/>}
              {source.visible.map((point,i)=><circle key={i} cx={coords[i].x} cy={coords[i].y}
                r="5" fill={color} stroke="var(--chart-bg,#fff)" strokeWidth="2">
                  <title>{(source.sourceName||source.sourceId)+" · "+money(point.priceClp)+" · "+formatDate(point.checkedAt,locale)}</title>
                </circle>)}
            </g>;
          })}
          <text x={padX} y={height-6} className="history-axis-text">{formatDate(new Date(minTime).toISOString(),locale)}</text>
          <text x={width-padX} y={height-6} textAnchor="end" className="history-axis-text">{formatDate(new Date(maxTime).toISOString(),locale)}</text>
        </svg>}
    {sources.length>0 && <div className="history-legend">
      {sources.map((source,i)=><label key={source.sourceId}>
        <input type="checkbox" checked={!hidden.includes(source.sourceId)}
          onChange={(e)=>setHidden((current)=>e.target.checked?current.filter(x=>x!==source.sourceId):[...current,source.sourceId])}/>
        <span className="history-dot" style={{background:COLORS[i%COLORS.length]}}/>
        {source.sourceName||source.sourceId}
      </label>)}
    </div>}
    {sources.length>0 && <div className="history-summary">
      {sources.map((source)=><article className="trend-card" key={source.sourceId}>
        <h3>{source.sourceName||source.sourceId}</h3>
        {source.visible.length ? <>
          <p>{t("Último precio observado")}: <strong>{money(source.visible.at(-1).priceClp)}</strong></p>
          <p>{t("Mínimo registrado")}: {money(Math.min(...source.visible.map(p=>p.priceClp)))}</p>
          <p>{t("Variación observada")}: {source.visible.length>1
            ? money(source.visible.at(-1).priceClp-source.visible[0].priceClp)
            : t("Se necesitan dos observaciones")}</p>
          <table className="trend-table"><thead><tr><th>{t("Fecha")}</th><th>{t("Precio CLP")}</th></tr></thead>
            <tbody>{source.visible.slice(-8).map((point,i)=><tr key={i}>
              <td>{formatDate(point.checkedAt,locale)}</td><td>{money(point.priceClp)}</td>
            </tr>)}</tbody>
          </table></> : <p>{t("Sin datos en este período.")}</p>}
      </article>)}
    </div>}

  </div>;
}

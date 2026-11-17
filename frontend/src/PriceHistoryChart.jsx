import { formatMoney, formatNumber } from "./i18n.js";
import {useMemo,useState} from "react";

const COLORS=["#337ac2","#d1664e","#2e9970","#9a70ca","#db9e2d","#3d99b8","#d2548c"];
const WIDTH=800,HEIGHT=250,PAD_X=74,PAD_Y=35;
const dateText=(value,locale)=>new Date(value).toLocaleDateString(locale==="en"?"en-US":"es-CL");
export function formatPriceAxis(price, locale = "en") {
  if(price>=1000000) return formatNumber(price/1000000,locale,{maximumFractionDigits:3})+"M";
  if(price>=1000) return Math.round(price/1000)+"k";
  return String(Math.round(price));
}
export function collapseUnchangedPrices(points) {
  const ordered=[...(points||[])].filter(p=>Number.isFinite(p.priceClp)&&Number.isFinite(Date.parse(p.checkedAt)))
    .sort((a,b)=>Date.parse(a.checkedAt)-Date.parse(b.checkedAt));
  return ordered.filter((point,index)=>index===0||point.priceClp!==ordered[index-1].priceClp);
}
export function priceAtTime(points,timestamp) {
  const ordered=collapseUnchangedPrices(points);
  if(!ordered.length)return null;
  let candidate=ordered[0];
  for(const point of ordered) {
    if(Date.parse(point.checkedAt)>timestamp) break;
    candidate=point;
  }
  return candidate;
}
export function inDateRange(point,from,to) {
  const value=Date.parse(point.checkedAt);
  const start=from?Date.parse(from+"T00:00:00"):-Infinity;
  const end=to?Date.parse(to+"T23:59:59"):Infinity;
  return Number.isFinite(value)&&value>=start&&value<=end;
}
export default function PriceHistoryChart({history,t,locale}) {
  const money = value => formatMoney(value,locale);
  const [days,setDays]=useState("all");
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const [hidden,setHidden]=useState([]);
  const [hover,setHover]=useState(null);
  const cutoff=days==="all"?-Infinity:Date.now()-Number(days)*86400000;
  const sources=useMemo(()=>(history.sources||[]).map(source=>({
    ...source,
    raw:source.points.filter(point=>
      Date.parse(point.checkedAt)>=cutoff&&inDateRange(point,from,to)),
    visible:collapseUnchangedPrices(source.points.filter(point=>
      Date.parse(point.checkedAt)>=cutoff&&inDateRange(point,from,to))),
  })),[history,cutoff,from,to]);
  // Hide retailers without observations in the selected date range, including
  // their legend checkboxes and summary cards. Do not mutate the source data.
  const storesWithData=sources.filter(source=>source.raw.length>0);
  const drawn=storesWithData.filter(source=>!hidden.includes(source.sourceId));
  const all=drawn.flatMap(s=>s.raw);
  const times=all.map(p=>Date.parse(p.checkedAt));
  const minTime=all.length?Math.min(...times):0;
  const maxTime=all.length?Math.max(...times):0;
  const minPrice=all.length?Math.min(...all.map(p=>p.priceClp)):0;
  const maxPrice=all.length?Math.max(...all.map(p=>p.priceClp)):0;
  const xAt=(time)=>PAD_X+(time-minTime)*(WIDTH-PAD_X*2)/Math.max(1,maxTime-minTime);
  const yAt=(price)=>HEIGHT-PAD_Y-(price-minPrice)*(HEIGHT-PAD_Y*2)/Math.max(1,maxPrice-minPrice);
  const makePath=(points,lastTime)=>{
    if(!points.length)return "";
    const first=points[0],startX=xAt(Date.parse(first.checkedAt)),startY=yAt(first.priceClp);
    let path="M "+startX+" "+startY;
    for(let i=1;i<points.length;i++){
      const point=points[i],x=xAt(Date.parse(point.checkedAt)),y=yAt(point.priceClp);
      path+=" H "+x+" V "+y;
    }
    path+=" H "+xAt(lastTime);
    return path;
  };
  const setTooltip=(event,source)=>{
    const svg=event.currentTarget.ownerSVGElement;
    if(!svg)return;
    const bounds=svg.getBoundingClientRect();
    const localX=(event.clientX-bounds.left)*WIDTH/Math.max(1,bounds.width);
    const x=Math.max(PAD_X,Math.min(WIDTH-PAD_X,localX));
    const time=minTime+(x-PAD_X)/(WIDTH-2*PAD_X)*(maxTime-minTime);
    const point=priceAtTime(source.visible,time);
    if(point)setHover({sourceId:source.sourceId,source:source.sourceName||source.sourceId,
      x,y:yAt(point.priceClp),price:point.priceClp,date:point.checkedAt});
  };
  return <div className="history-explorer">
    <div className="history-options">
      <div className="history-presets" role="group" aria-label={t("labels.period")}>
        {[["7",t("history.periodWeek")],["30",t("history.periodMonth")],["90",t("history.periodQuarter")],["365",t("history.periodYear")],["all",t("labels.all")]].map(([value,label])=>
          <button type="button" key={value} className={days===value?"active":""}
            onClick={()=>{setDays(value);setHover(null);}}>{label}</button>)}
      </div>
      <div className="history-date-inputs">
        <label>{t("labels.from")} <input type="date" value={from} onChange={e=>{setFrom(e.target.value);setDays("all");setHover(null);}}/></label>
        <label>{t("labels.to")} <input type="date" value={to} onChange={e=>{setTo(e.target.value);setDays("all");setHover(null);}}/></label>
      </div>
    </div>
    {!all.length?<p className="feature-note">{t("labels.noRealObservationsInThisPeriod")}</p>:
      <div className="history-chart-frame">
        <svg className="full-history-chart" viewBox={"0 0 "+WIDTH+" "+HEIGHT} role="img"
          aria-label={t("labels.priceChangesByRetailer")} onMouseLeave={()=>setHover(null)}>
          {[0,.25,.5,.75,1].map(fraction=>{
            const y=HEIGHT-PAD_Y-fraction*(HEIGHT-PAD_Y*2);
            const value=minPrice+fraction*(maxPrice-minPrice);
            return <g key={fraction}>
              <line x1={PAD_X} x2={WIDTH-PAD_X} y1={y} y2={y} className="history-grid-line"/>
              <text x={PAD_X-9} y={y+4} textAnchor="end" className="history-axis-text">{formatPriceAxis(value,locale)}</text>
            </g>;
          })}
          {drawn.map(source=>{
            const color=COLORS[storesWithData.findIndex(s=>s.sourceId===source.sourceId)%COLORS.length];
            const path=makePath(source.visible,Date.parse(source.raw.at(-1)?.checkedAt||source.visible.at(-1)?.checkedAt));
            return <g key={source.sourceId}>
              <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>
              <path d={path} fill="none" stroke="transparent" strokeWidth="16"
                pointerEvents="stroke" onMouseMove={e=>setTooltip(e,source)} onMouseLeave={()=>setHover(null)}
                tabIndex={0} aria-label={(source.sourceName||source.sourceId)+" - "+t("labels.priceChangesByRetailer")}
                onFocus={()=>{const point=source.visible.at(-1);if(point)setHover({
                  sourceId:source.sourceId,source:source.sourceName||source.sourceId,x:xAt(Date.parse(point.checkedAt)),
                  y:yAt(point.priceClp),price:point.priceClp,date:point.checkedAt});}}
                onBlur={()=>setHover(null)}/>
              {source.visible.map((point,i)=><circle key={i} cx={xAt(Date.parse(point.checkedAt))} cy={yAt(point.priceClp)}
                r="2.6" fill={color} pointerEvents="none"/>)}
            </g>;
          })}
          {hover && <g className="history-tooltip-marker" pointerEvents="none">
            <line x1={hover.x} x2={hover.x} y1={PAD_Y} y2={HEIGHT-PAD_Y} stroke="#a9bfd8" strokeDasharray="4 4"/>
            <circle cx={hover.x} cy={hover.y} r="5" fill="#fff" stroke="#497bad" strokeWidth="2"/>
          </g>}
          <text x={PAD_X} y={HEIGHT-6} className="history-axis-text">{dateText(minTime,locale)}</text>
          <text x={WIDTH-PAD_X} y={HEIGHT-6} textAnchor="end" className="history-axis-text">{dateText(maxTime,locale)}</text>
        </svg>
        {hover&&<div className="history-hover-details" role="status">
          <strong>{hover.source}</strong><span>{money(hover.price)}</span>
          <small>{dateText(hover.date,locale)}</small>
        </div>}
      </div>}
    {storesWithData.length>0&&<div className="history-legend">
      {storesWithData.map((source,i)=><label key={source.sourceId}>
        <input type="checkbox" checked={!hidden.includes(source.sourceId)}
          onChange={e=>{setHover(null);setHidden(current=>e.target.checked?current.filter(x=>x!==source.sourceId):[...current,source.sourceId]);}}/>
        <span className="history-dot" style={{background:COLORS[i%COLORS.length]}}/>
        {source.sourceName||source.sourceId}
      </label>)}
    </div>}
    {storesWithData.length>0&&<div className="history-summary">
      {storesWithData.map(source=><article className="trend-card" key={source.sourceId}>
        <h3>{source.sourceName||source.sourceId}</h3>
        {source.visible.length?<>
          <p>{t("labels.latestObservedPrice")}: <strong>{money(source.visible.at(-1).priceClp)}</strong></p>
          <p>{t("labels.lowestRecordedPrice")}: {money(Math.min(...source.visible.map(p=>p.priceClp)))}</p>
          <p>{t("labels.recordedPriceChange")}: {source.visible.length>1?
            money(source.visible.at(-1).priceClp-source.visible[0].priceClp):t("labels.twoObservationsRequired")}</p>
          <table className="trend-table"><thead><tr><th>{t("labels.date")}</th><th>{t("labels.priceClp")}</th></tr></thead>
            <tbody>{source.visible.slice(-8).map((point,i)=><tr key={i}>
              <td>{dateText(point.checkedAt,locale)}</td><td>{money(point.priceClp)}</td>
            </tr>)}</tbody>
          </table>
        </>:<p>{t("labels.noDataInThisPeriod")}</p>}
      </article>)}
    </div>}
  </div>;
}

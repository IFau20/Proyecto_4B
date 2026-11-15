import {PC_FACTORY_BRANCH_IDS} from "./pcFactory.ts";
const clean=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export function parseWeeklyHours(html:string):Record<number,string[]>{
 const weekly:Record<number,string[]>={};
 const names=["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
 const lines=html.replace(/<!--[\s\S]*?-->/g,"").replace(/<br\b[^>]*>|<\/p>|<\/div>/gi,"\n")
  .replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/g," ").split("\n");
 for(const raw of lines){
  const line=clean(raw);
  // A dated exception is not a recurring weekly schedule.
  if(/\b\d{1,2}\s+de\s+|\b\d{1,2}[/-]\d{1,2}|\bferiado|\bespecial/.test(line))continue;
  const times=line.match(/\b(?:[01]\d|2[0-3]):[0-5]\d\b/g)||[];
  if(![2,4].includes(times.length))continue;
  const prefix=line.slice(0,line.indexOf(times[0]!));
  const days=[...prefix.matchAll(/domingo|lunes|martes|miercoles|jueves|viernes|sabado/g)].map(m=>names.indexOf(m[0]));
  if(!days.length)continue;
  const range=days.length===2&&/^(?:\s|a|al|-)+$/.test(prefix.replace(/domingo|lunes|martes|miercoles|jueves|viernes|sabado/g,""));
  if(range){let d=days[0];for(let i=0;i<7;i++,d=(d+1)%7){weekly[d]=times;if(d===days[1])break;}}
  else for(const d of days)weekly[d]=times;
 }
 return weekly;
}
export function parsePcFactoryStores(script:string){
 const array=(name:string):any[]=>{
  const match=new RegExp("\\$"+name+"\\s*=\\s*(\\[[\\s\\S]*?\\]);").exec(script);
  try{const value=JSON.parse(match?.[1]||"null");return Array.isArray(value)?value:[];}catch{return [];}
 };
 const schedules=array("schedules");
 return array("stores").flatMap(store=>{
  const sourceId=PC_FACTORY_BRANCH_IDS[String(store?.fields?.id)];if(!sourceId)return [];
  const ownSchedule=String(store.fields.Horario||"");
  const ownText=ownSchedule.replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim();
  const closedUntilNotice=/cerrad[oa]\s+hasta\s+nuevo\s+aviso/i.test(clean(ownText));
  const scheduleNotice=/cerrad|especial|\b\d{1,2}\s+de\s+/i.test(clean(ownText))?ownText:null;
  let schedule=ownSchedule;
  if(store.fields["Horario General"]?.includes("Si")){
   const general=schedules.find(s=>store.meta?.tags?.includes(s.meta?.slug));
   if(general)schedule=String(general.fields?.Horario||"");
  }
  const location=store.fields.Direccion?.[0];
  const lat=Number(location?.location?.lat),lon=Number(location?.location?.lon);
  return [{sourceId,weekly:parseWeeklyHours(schedule),closedUntilNotice,scheduleNotice,
   scheduleText:schedule.replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim(),
   lat:Number.isFinite(lat)&&lat<=-17&&lat>=-56?lat:null,
   lon:Number.isFinite(lon)&&lon<=-66&&lon>=-76?lon:null}];
 });
}
export async function fetchPcFactoryStores(fetcher:typeof fetch=fetch){
 try{
  const response=await fetcher("https://www.pcfactory.cl/tiendas",{signal:AbortSignal.timeout(7000),redirect:"error"});
  if(!response.ok)return [];
  const page=await response.text();
  const widget=/data-widget-name="Tiendas lista-mapa"[\s\S]{0,1200}?var css_url\s*=\s*"([^"]+)\.css"/.exec(page);
  if(!widget)return [];
  const url=new URL(widget[1]+".js");
  if(url.protocol!=="https:"||url.hostname!=="www.pcfactory.cl"||!url.pathname.startsWith("/widget_manager/"))return [];
  const script=await fetcher(url.href,{signal:AbortSignal.timeout(7000),redirect:"error"});
  return script.ok?parsePcFactoryStores(await script.text()):[];
 }catch{return [];}
}

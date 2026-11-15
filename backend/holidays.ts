// Holiday calendar is published by feriados.devschile.cl. A holiday never
// guarantees a store is closed, nor that a normal schedule applies.
export type Holiday={date:string;name:string;irrenunciable:boolean;source:"feriados.devschile.cl"};
type HolidayApi={feriados?:Record<string,Array<{mes:number;dia:number;descripcion:string;irrenunciable:boolean}>>};
const yearly=new Map<number,{at:number,days:Map<string,Holiday>}>();
const inflight=new Map<number,Promise<Map<string,Holiday>>>();
export function validChileanDate(date:string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
  const parsed=new Date(date+"T12:00:00Z");
  return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date &&
    Number(date.slice(0,4))>=2025&&Number(date.slice(0,4))<=2030;
}
export function parseChileanHolidays(data:HolidayApi,year:number) {
  const result=new Map<string,Holiday>();
  for(const list of Object.values(data?.feriados||{})) {
    if(!Array.isArray(list))continue;
    for(const item of list){
      if(!Number.isInteger(item.mes)||!Number.isInteger(item.dia))continue;
      const date=year+"-"+String(item.mes).padStart(2,"0")+"-"+String(item.dia).padStart(2,"0");
      if(!validChileanDate(date)||typeof item.descripcion!=="string")continue;
      result.set(date,{date,name:item.descripcion,irrenunciable:item.irrenunciable===true,
        source:"feriados.devschile.cl"});
    }
  }
  return result;
}
export async function holidayOn(date:string,fetcher:typeof fetch=fetch):Promise<Holiday|null> {
  if(!validChileanDate(date))throw new RangeError("Invalid Chilean calendar date");
  const year=Number(date.slice(0,4));
  let entry=yearly.get(year);
  if(!entry||Date.now()-entry.at>=24*60*60*1000){
    let pending=inflight.get(year);
    if(!pending){
      pending=(async()=>{
        const response=await fetcher("https://feriados.devschile.cl/api/holidays/"+year,{
          signal:AbortSignal.timeout(10000),headers:{Accept:"application/json"}});
        if(!response.ok)throw Error("Holiday source unavailable");
        const data=await response.json();
        if(!data?.feriados || typeof data.feriados!=="object" || Array.isArray(data.feriados))
          throw Error("Invalid holiday calendar response");
        const days=parseChileanHolidays(data,year);
        if(!days.size)throw Error("Empty holiday calendar response");
        return days;
      })().finally(()=>{inflight.delete(year);});
      inflight.set(year,pending);
    }
    try{
      const days=await pending;
      entry={days,at:Date.now()};yearly.set(year,entry);
    }catch{
      // If the official calendar mirror cannot be read, holiday is unknown,
      // not 'not a holiday' and not an assertion that the branch will open.
      throw Error("Holiday calendar unavailable");
    }
  }
  return entry?.days.get(date)||null;
}

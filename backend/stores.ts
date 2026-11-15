// Publicly listed locations and hours. Physical inventory is never inferred from the address.
export const STORES = [
  {
    sourceId: "centrale", name: "Centrale", kind: "office",
    address: "Av. Los Leones 1707, piso 11, Providencia, Santiago, Chile",
    lat: -33.4349, lon: -70.6017,
    contactUrl: "https://centrale.cl/contacto/",
    weekly: {1:["09:00","17:45"],2:["09:00","17:45"],3:["09:00","17:45"],4:["09:00","17:45"],5:["09:00","17:45"]},
    addressPhrase: "los leones 1707", hourPhrases:["09:00","17:45"],
  },
  {
    sourceId: "spdigital", name: "SP Digital", kind: "pickup",
    address: "Padre Mariano 356, Providencia, Santiago, Chile",
    lat: -33.42419, lon: -70.61829,
    contactUrl: "https://www.spdigital.cl/myaccount/directions/",
    weekly: {1:["09:00","18:30"],2:["09:00","18:30"],3:["09:00","18:30"],4:["09:00","18:30"],5:["09:00","18:00"]},
    addressPhrase: "padre mariano", hourPhrases:["09:00","18:30","18:00"],
  },
  {
    sourceId: "pcexpress", name: "PC Express", kind: "pickup",
    address: "Almirante Zegers 784, Providencia, Santiago, Chile",
    // Coordinates confirmed with public geocoding on 2026-11-15.
    lat: -33.4342406, lon: -70.6235302,
    contactUrl: "https://tienda.pc-express.cl/sucursales-y-horarios",
    weekly: {
      1:["09:30","14:00","15:00","18:30"],2:["09:30","14:00","15:00","18:30"],
      3:["09:30","14:00","15:00","18:30"],4:["09:30","14:00","15:00","18:30"],
      5:["09:30","14:00","15:00","18:30"]
    },
    addressPhrase: "almirante zegers 784", hourPhrases:["09:30","14:00","15:00","18:30"],
  },
  {
    sourceId: "winpy", name: "Winpy", kind: "pickup",
    address: "Av. Antonio Varas 2223, Ñuñoa, Santiago, Chile",
    lat: -33.4478, lon: -70.611,
    contactUrl: "https://www.winpy.cl/retiros-y-despachos",
    weekly: {1:["09:00","19:00"],2:["09:00","19:00"],3:["09:00","19:00"],4:["09:00","19:00"],5:["09:00","18:00"]},
    addressPhrase: "antonio varas 2223", hourPhrases:["09:00","19:00","18:00"],
  },
  {sourceId:"pcfactory-montt",name:"PC Factory — Manuel Montt",kind:"store",
    address:"Avenida Manuel Montt 170, Providencia, Santiago, Chile",lat:-33.4301869,lon:-70.6191484,
    contactUrl:"https://www.pcfactory.cl/tiendas",
    weekly:{},addressPhrase:"",hourPhrases:[]},
  {sourceId:"pcfactory-costanera",name:"PC Factory — Costanera",kind:"store",
    address:"Avenida Andrés Bello 2447, local 196, Providencia, Santiago, Chile",lat:null,lon:null,
    contactUrl:"https://www.pcfactory.cl/tiendas",
    weekly:{},addressPhrase:"",hourPhrases:[]},
  {sourceId:"pcfactory-huerfanos",name:"PC Factory — Huérfanos",kind:"store",
    address:"Huérfanos 1081, Santiago, Chile",lat:-33.4396409,lon:-70.6519297,
    contactUrl:"https://www.pcfactory.cl/tiendas",
    weekly:{},addressPhrase:"",hourPhrases:[]},
  {sourceId:"pcfactory-lascondes",name:"PC Factory — Las Condes",kind:"store",
    address:"Avenida Las Condes 8199, Las Condes, Santiago, Chile",lat:-33.3986031,lon:-70.551345,
    contactUrl:"https://www.pcfactory.cl/tiendas",
    weekly:{},addressPhrase:"",hourPhrases:[]},
  {sourceId:"pcfactory-egana",name:"PC Factory — Plaza Egaña",kind:"store",
    address:"Av. Larraín 5862, La Reina, Santiago, Chile",lat:-33.4519071,lon:-70.56871,
    contactUrl:"https://www.pcfactory.cl/tiendas",
    weekly:{},addressPhrase:"",hourPhrases:[]},
  {sourceId:"pcfactory-kennedy",name:"PC Factory — Open Kennedy",kind:"store",
    address:"Avenida Presidente Kennedy 5601, Las Condes, Santiago, Chile",lat:-33.4011993,lon:-70.5753756,
    contactUrl:"https://www.pcfactory.cl/tiendas",
    weekly:{},addressPhrase:"",hourPhrases:[]},
  {sourceId:"pcfactory-norte",name:"PC Factory — Plaza Norte",kind:"store",
    address:"Avenida Américo Vespucio 1737, Huechuraba, Santiago, Chile",lat:-33.3658064,lon:-70.6784518,
    contactUrl:"https://www.pcfactory.cl/tiendas",
    weekly:{},addressPhrase:"",hourPhrases:[]},
  {sourceId:"pcfactory-florida",name:"PC Factory — Florida",kind:"store",
    address:"Avenida Vicuña Mackenna Oriente 6100, La Florida, Santiago, Chile",lat:-33.5104156,lon:-70.6065722,
    contactUrl:"https://www.pcfactory.cl/tiendas",
    weekly:{},addressPhrase:"",hourPhrases:[]},
  {sourceId:"pcfactory-vina",name:"PC Factory — Viña del Mar",kind:"store",
    address:"Avenida Valparaíso 459, Viña del Mar, Chile",lat:-33.0243192,lon:-71.5562327,
    contactUrl:"https://www.pcfactory.cl/tiendas",
    weekly:{},addressPhrase:"",hourPhrases:[]},
  {sourceId:"pcfactory-maipu",name:"PC Factory — Maipú",kind:"store",
    address:"Avenida Américo Vespucio 399, Maipú, Santiago, Chile",lat:-33.4827018,lon:-70.7505165,
    contactUrl:"https://www.pcfactory.cl/tiendas",
    weekly:{},addressPhrase:"",hourPhrases:[]},
];
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export function verifyHours(html: string, store: (typeof STORES)[number]) {
  const content=normalize(html.replace(/<[^>]*>/g," ").replace(/\s+/g," "));
  return store.hourPhrases.length>0 && content.includes(store.addressPhrase) &&
    store.hourPhrases.every((time)=>content.includes(time)) &&
    /lunes|martes|miercoles|jueves|viernes/.test(content);
}
export function distanceKm(lat1:number,lon1:number,lat2:number,lon2:number) {
  const r=Math.PI/180;
  const x=Math.sin((lat2-lat1)*r/2)**2+Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin((lon2-lon1)*r/2)**2;
  return 12742*Math.asin(Math.min(1,Math.sqrt(x)));
}
let cached: Awaited<ReturnType<typeof checkStores>> | null=null;
let cachedAt=0;
export async function checkStores(fetcher:typeof fetch=fetch,now=Date.now()) {
  return await Promise.all(STORES.map(async (store)=>{
    let scheduleVerified=false;
    try {
      if (store.hourPhrases.length===0) throw Error("Opening hours not provided by source");
      const response=await fetcher(store.contactUrl,{signal:AbortSignal.timeout(6000),headers:{Accept:"text/html"}});
      if(response.ok) scheduleVerified=verifyHours(await response.text(),store);
    } catch { /* unverified, not an assertion of current opening */ }
    const {addressPhrase:_a,hourPhrases:_h,...publicInfo}=store;
    return {...publicInfo,scheduleVerified,checkedAt:new Date(now).toISOString()};
  }));
}
export async function getStores() {
  const now=Date.now();
  if(cached && now-cachedAt<30*60*1000) return cached;
  const result=await checkStores();
  cached=result;cachedAt=now;
  return result;
}

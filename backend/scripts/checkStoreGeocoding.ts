import {STORES,distanceKm} from "../stores.ts";
import {geocodeStoreLocations} from "../storeGeocoding.ts";
const all=await geocodeStoreLocations(STORES);
const known=all.filter(s=>Number.isFinite(s.lat)&&Number.isFinite(s.lon));
const userExample={lat:-33.432,lon:-70.614}; // Diagnostic sample only, never actual user location.
const nearest=known.map(s=>({...s,km:distanceKm(userExample.lat,userExample.lon,s.lat!,s.lon!)}))
  .sort((a,b)=>a.km-b.km).slice(0,6);
console.log(JSON.stringify({
  totalStores:all.length,geocodedStores:known.length,
  coordinates:known.map(s=>({sourceId:s.sourceId,lat:s.lat,lon:s.lon})),nearestSample:nearest.map(s=>({
    name:s.name,address:s.address,km:s.km.toFixed(1)
  }))
},null,2));
// No exception: public geocoding services can limit or block automated requests.

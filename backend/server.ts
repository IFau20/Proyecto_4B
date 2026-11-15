import {handleRequest} from "./handler.ts";
import {collectNotebookHistory} from "./notebooks.ts";

const port=Number(Deno.env.get("PORT")??8000);
const SIX_HOURS_MS=6*60*60*1000;
let collecting=false;
async function collectVerifiedPrices(){
  if(collecting)return;
  collecting=true;
  try {await collectNotebookHistory();}
  catch(error){console.error("Scheduled price collection failed",error);}
  finally{collecting=false;}
}
// One collector covers the whole notebook catalog, including Lenovo and HP.
// Requests never overlap, and history is committed in one atomic batch.
void collectVerifiedPrices();
setInterval(()=>{void collectVerifiedPrices();},SIX_HOURS_MS);
console.log("PC Tracker API running at http://localhost:"+port);
Deno.serve({port},handleRequest);

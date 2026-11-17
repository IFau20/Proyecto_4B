import { handleRequest } from "./handler.ts";
import { collectNotebookHistory } from "./notebooks.ts";
import { readEnv } from "./runtime.ts";

export function createHostedHandler({requestHandler=handleRequest,collect=collectNotebookHistory,setting=readEnv}:{
  requestHandler?:(request:Request)=>Promise<Response>;
  collect?:()=>Promise<void>;
  setting?:(name:string)=>string;
}={}){
  return async(request:Request):Promise<Response>=>{
    try{
      if(new URL(request.url).pathname==="/api/collect-history"){
        const secret=setting("CRON_SECRET");
        if(!secret)return Response.json({error:"Scheduled collection is not configured"},{status:503});
        if(request.headers.get("Authorization")!=="Bearer "+secret)
          return Response.json({error:"Unauthorized"},{status:401});
        if(request.method!=="GET")return new Response(null,{status:405,headers:{Allow:"GET"}});
        await collect();
        return Response.json({ok:true,collectedAt:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}});
      }
      return await requestHandler(request);
    }catch(error){
      console.error("PC Tracker API request failed",error);
      return Response.json({error:"Service temporarily unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
    }
  };
}

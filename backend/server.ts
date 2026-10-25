import { handleRequest } from "./handler.ts";

const port = Number(Deno.env.get("PORT") ?? 8000);

console.log(`Computer API available at http://localhost:${port}/api/computers`);
Deno.serve({ port }, handleRequest);

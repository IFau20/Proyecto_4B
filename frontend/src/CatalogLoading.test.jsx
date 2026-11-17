import {beforeEach,it,expect,vi} from "vitest";
import {render,screen,act} from "@testing-library/react";
import App from "./App.jsx";
beforeEach(()=>{localStorage.clear();localStorage.setItem("pc-tracker-locale","es");sessionStorage.clear();});
const response=data=>({ok:true,json:async()=>data});
it("renders a valid empty catalog without reporting a connection failure",async()=>{
 vi.stubGlobal("fetch",vi.fn(async url=>response(String(url).startsWith("/api/notebooks")?[]:{enabled:false,user:null})));
 render(<App/>);
 expect(await screen.findByText("No hay notebooks verificados disponibles.")).toBeInTheDocument();
 expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("rejects malformed catalog responses instead of treating them as empty",async()=>{
 vi.stubGlobal("fetch",vi.fn(async url=>response(String(url).startsWith("/api/notebooks")?{items:[]}:{enabled:false,user:null})));
 render(<App/>);
 expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo conectar con el catálogo de notebooks.");
});
it("an empty late preview cannot erase a complete catalog response",async()=>{
 let finishPreview;
 const item={sku:"TEST-SKU",id:"test",isLive:true,name:"Test notebook",ramGb:16,gpu:"GPU",processor:"CPU",offers:[]};
 vi.stubGlobal("fetch",vi.fn(async url=>url==="/api/notebooks?preview=1"?new Promise(resolve=>{finishPreview=resolve;}):response(url==="/api/notebooks"?[item]:{enabled:false,user:null})));
 render(<App/>);
 await screen.findByRole("heading",{name:"Test notebook"});
 await act(async()=>finishPreview(response([])));
 expect(screen.getByRole("heading",{name:"Test notebook"})).toBeInTheDocument();
});
it("a late populated preview cannot replace a definitive empty full catalog",async()=>{
 let finishPreview;
 const item={sku:"TEST-SKU",id:"test",isLive:true,name:"Test notebook",ramGb:16,gpu:"GPU",processor:"CPU",offers:[]};
 vi.stubGlobal("fetch",vi.fn(async url=>url==="/api/notebooks?preview=1"?new Promise(resolve=>{finishPreview=resolve;}):response(url==="/api/notebooks"?[]:{enabled:false,user:null})));
 render(<App/>);
 await screen.findByText("No hay notebooks verificados disponibles.");
 await act(async()=>finishPreview(response([item])));
 expect(screen.queryByRole("heading",{name:"Test notebook"})).not.toBeInTheDocument();
 expect(screen.getByText("No hay notebooks verificados disponibles.")).toBeInTheDocument();
});

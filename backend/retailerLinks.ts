// Exact product links located by manufacturer-code searches on 2026-11-15.
// Links are discovery evidence, never evidence of a current price or inventory.
export type RetailerLink={sourceId:string;sourceName:string;url:string};
const link=(sourceId:string,sourceName:string,url:string):RetailerLink=>({sourceId,sourceName,url});
const tecnomas=(slug:string)=>link("tecnomas","Tecnomas","https://www.tecnomas.cl/producto/"+slug);
export const ADDITIONAL_RETAILER_LINKS:Record<string,RetailerLink[]>={
 "83LY003NCL":[
  link("pcfactory","PC Factory","https://www.pcfactory.cl/producto/54229-lenovo-notebook-gamer-legion-5-"),
  link("bip","BIP","https://bip.cl/notebook-legion-5-gen-10-core-i9-14900hx-32gb-1tb-rtx-5070-8gb-151-win11h-pn-83ly003ncl_40276"),
  link("centrale","Centrale","https://centrale.cl/producto/notebook-lenovo-legion-5-15-1-gen10-i9-14900hx-rtx-5070-32gb-ram-1tb-w11h/")],
 "NH.DADAL.002.1":[link("ripley","Ripley","https://simple.ripley.cl/notebook-acer-nitro-lite-nl16-71g-56q8-1-intel-core-i5-16gb-ram-512gb-ssd-nvidia-rtx-3050-16-2000408652090p")],
 "90NR0MZ6-M001N0":[tecnomas("asus-tuf-f16-fx607vj-rl028w-90nr0mz6-m001n0")],
 "83DV016GCL":[
  link("spdigital","SP Digital","https://www.spdigital.cl/lenovo-loq-gen-9-83dv016gcl-i713650hx-24gb-ram-512gb-ssd-nvidia-rtx3050-6gb-156-144hz-w11/"),
  link("winpy","Winpy","https://www.winpy.cl/venta/notebook-gamer-lenovo-loq-de-15-6-i7-13650hx-rtx-3050-24gb-ram-512gb-ssd-win11/"),
  tecnomas("lv-loq-gen-9-core-i7-13650hx-24gb-512gb-156-fhd-144hz-rtx3050-6gb-luna-grey")],
 "83DV009MUS":[tecnomas("lenovo-loq-15irx9-83dv009mus"),link("gamingx","GamingX","https://gamingx.cl/productos/lenovo-loq-15irx9-15-6-144hz-i5-13450hx-16gb-512g-rtx-4060/")],
 "12VE-066US":[tecnomas("msi-gf63-thin-12ve-12ve-066us"),link("ultrapc","UltraPC","https://www.ultrapc.cl/tienda/2503x351408685-notebook-notebook-msi-12ve-066us-15-6-144-hz-i7-12650h-16gb-512gb-ssd-nvidia-geforce-rtx4050/")],
 "C2DA0LA":[
  link("spdigital","SP Digital","https://www.spdigital.cl/omen-16-wuxga-nt-r9-8940hx-24gb-1tb-rtx5070-08gb-win-black/"),
  tecnomas("hp-omen-16-ap0007la-c2da0la"),
  link("rumbochile","RumboChile","https://rumbochile.cl/notebook-gamer-hp-16-ap0007la-amd-r9-8940hx-ram-24gb-ssd-1tb-tc2da0la")],
 "NKWWG":[tecnomas("dell-inspiron-16-5640-nkwwg")],
 "B6ML4LA":[tecnomas("hp-victus-15-fb3004la-b6ml4la"),link("ripley","Ripley","https://simple.ripley.cl/notebook-gamer-victus-hp-15-fb3004la-amd-ryzen-9-16gb-ram-1tb-ssd-rtx-4060-8gb-156-fhd-w11h-mpm10003011099")],
 "CYBORG15AIA1VE":[
  link("spdigital","SP Digital","https://www.spdigital.cl/cyborg-15-ai-a1ve-rtx-4050-gddr6-6gb/"),
  link("winpy","Winpy","https://www.winpy.cl/venta/notebook-msi-cyborg-15-ai-a1vek-de-15-6-ultra-7-155h-rtx-4050-16gb-ram-512gb-ssd-win11/"),
  tecnomas("cyborg-15-ai-a1ve-rtx-4050-gddr6-6gb"),
  link("ctman","CTMAN","https://www.ctman.cl/products/msi-cyborg15aia1ve")],
 "CYBORG1513218":[tecnomas("msi-cyborg-15-a13ve-218us-cyborg1513218"),link("smartdeal","SmartDeal","https://www.smartdeal.cl/producto/notebook-msi-cyborg-15-a13ve-218-gaming-intel-core-i7-512gb-ssd-16gb-ram-nvidia-rtx-4050-15-fhd/")],
 "THIN15131451":[tecnomas("msi-thin-15-b13ve-1451us-thin15131451")]
};

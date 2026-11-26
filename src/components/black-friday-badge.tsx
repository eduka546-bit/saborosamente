import { useBlackFridayActive, blackFridayPrice } from "@/lib/black-friday";
export function BlackFridayBadge({tipo,weight}:{tipo:string;weight?:string}) {
 const active=useBlackFridayActive();
 if(!active || !(tipo==="combo" || blackFridayPrice(tipo,tipo==="sopa"?"400g":weight || "200g")!==null)) return null;
 return <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#f5d94a] px-1.5 py-0.5 align-middle text-[8px] font-extrabold leading-none tracking-tight text-black sm:text-[9px]" style={{backgroundColor:"#f5d94a",color:"#111111"}}>Black Friday</span>;
}

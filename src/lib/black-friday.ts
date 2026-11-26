import { useEffect, useState } from "react";
export const BF_START = Date.parse("2026-11-26T03:00:00Z");
export const BF_END = Date.parse("2026-11-29T03:00:00Z");
export function isBlackFridayActive(now = Date.now()) { return now >= BF_START && now < BF_END; }
export function useBlackFridayActive() {
 const [active,setActive] = useState(false);
 useEffect(() => { const update=()=>setActive(isBlackFridayActive()); update(); const timer=window.setInterval(update,1000); return ()=>window.clearInterval(timer); },[]);
 return active;
}
export function blackFridayPrice(tipo: string, weight?: string): number | null {
 if(tipo==="sopa" && weight==="400g") return 16;
 if(tipo!=="marmita") return null;
 return weight==="200g"?14:weight==="300g"?17:weight==="400g"?20:null;
}

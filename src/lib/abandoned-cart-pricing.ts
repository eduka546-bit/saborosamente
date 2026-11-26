import { blackFridayPrice } from "@/lib/black-friday";
import { precoCheioMarmita, precoMarmitaPorFaixa, unidadesDoItem, type TabelaPrecosMarmita } from "@/lib/combo-rules";

const money=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
const qty=(i:any)=>Math.max(1,Number(i.quantity??i.quantidade??1)||1);
const weight=(i:any)=>String(i.weight??i.tamanho??i.gramatura??i.peso??"").trim();
const original=(i:any)=>Number(i.subtotal??i.total??((i.preco??i.preco_unitario??0)*qty(i)))||0;

export function repriceOpenCart(cart:any,catalog:any[],table:TabelaPrecosMarmita,active:boolean,extras?:any){
 if(!["em_andamento","abandonado","recuperado"].includes(cart.status)||!Array.isArray(cart.itens))return cart;
 if(!active && !cart.itens.some((i:any)=>i.blackFridaySnapshot))return cart;
 const lookup=new Map(catalog.map(p=>[String(p.id),p]));
 const rows=cart.itens.map((i:any)=>{
   const id=String(i.productId??i.produto_id??"");
   const p=lookup.get(String(i.comboPronto?.comboId??(id.startsWith("combo:")?id.split(":")[1]:id)));
   const custom=Boolean(i.custom)||id.startsWith("custom:");
   const name=String(p?.nome??i.nome??"");
   const tipo=custom?"custom":String(p?.tipo_produto??i.tipo_produto??(id.startsWith("combo:")||/^combo /i.test(name)?"combo":/^TD\d+/i.test(name)?"marmita":""));
   const w=tipo==="sopa"?"400g":weight(i)||"200g";
   const units=tipo==="combo"?Number(i.comboPronto?.totalUnits??unidadesDoItem(name,"combo")):1;
   const promo=tipo==="combo"&&units>=5?(blackFridayPrice("marmita",w)??0)*units:blackFridayPrice(tipo,w);
   return {i,p,tipo,w,units,promo,q:qty(i)};
 });
 const eligible=rows.reduce((sum:number,r:any)=>sum+(r.promo!==null&&r.promo>0?r.q*r.units:0),0);
 const totalUnits=rows.reduce((sum:number,r:any)=>sum+r.q*r.units,0);
 const unlocked=active&&eligible>=5;
 const itens=rows.map(({i,p,tipo,w,promo,q}:any)=>{
   let unit:number|null=null;
   if(unlocked&&promo!==null&&promo>0)unit=promo;
   else if(tipo==="marmita")unit=active?precoCheioMarmita(w,table):precoMarmitaPorFaixa(w,totalUnits,precoCheioMarmita(w,table),table);
   else if(tipo==="sopa")unit=18;
   else if(tipo==="combo"&&p)unit=Number((w==="300g"?p.preco_300g:w==="400g"?p.preco_400g:p.preco)??p.preco);
   if(unit===null||!Number.isFinite(unit)||unit<=0)return i;
   if(tipo==="marmita"&&i.opcoes?.consumo==="pronta")unit+=Number(extras?.pronta??0)+(i.opcoes?.garfoEFaca?Number(extras?.garfoEFaca??0):0);
   return {...i,preco:money(unit),subtotal:money(unit*q)};
 });
 return {...cart,itens,valor_total:money(itens.reduce((sum:number,i:any)=>sum+original(i),0))};
}

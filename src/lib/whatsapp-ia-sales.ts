import { normalizarPrecosMarmita, precoMarmitaPorFaixa, type TamanhoMarmita } from "./combo-rules.ts";
import { validarSugestaoPedido, type SugestaoPedido } from "./whatsapp-ia-order.ts";

export type CanalRecebimento = "entrega" | "retirada" | null;
export type DadosRecebimento = { metodo: CanalRecebimento; cidade: string; bairro: string; horario: string };
export type EstadoVenda = {
  itens: Array<{productId:string;weight:"200g"|"300g"|"400g";quantity:number}>;
  recebimento: DadosRecebimento;
};
export type ResumoVenda = {
  pedido: SugestaoPedido;
  itensTotal: number;
  resumo: string;
  pendencias: string[];
  proximaFaixa: { faltam: number; alvo: number; descricao: string } | null;
  perguntaSeguinte: string;
  aplicavelNoFormulario: boolean;
};
export const ESTADO_VENDA_VAZIO: EstadoVenda = {
  itens:[], recebimento:{metodo:null,cidade:"",bairro:"",horario:""},
};
const moeda=(n:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
const normal=(s:string)=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const pesoValido=(s:string):s is TamanhoMarmita => ["200g","300g","400g"].includes(s);
const textLimit=(v:unknown,n=100)=>typeof v==="string"?v.trim().slice(0,n):"";

/** Recusa instruções de preço, IDs não públicos, quantidades impossíveis e dados pessoais no estado do navegador. */
export function normalizarEstadoVenda(raw:unknown):EstadoVenda {
  const o=raw && typeof raw==="object"?raw as Record<string,any>:{};
  const itens=Array.isArray(o.itens)?o.itens.slice(0,50).flatMap((x:any)=>{
    const quantity=x?.quantity;
    if(typeof x?.productId!=="string" || x.productId.length>90 || !pesoValido(x.weight) ||
       !Number.isInteger(quantity) || quantity<1 || quantity>100)return [];
    return [{productId:x.productId,weight:x.weight as TamanhoMarmita,quantity}];
  }):[];
  const receb=o.recebimento&&typeof o.recebimento==="object"?o.recebimento:{};
  return {itens,recebimento:{
    metodo:receb.metodo==="entrega"||receb.metodo==="retirada"?receb.metodo:null,
    cidade:textLimit(receb.cidade,90),bairro:textLimit(receb.bairro,90),horario:textLimit(receb.horario,80),
  }};
}

/** Impede que o modelo remova itens antigos sem pedido explícito ou retire unidades além do solicitado. */
export function validarTransicaoVenda(
  anterior:EstadoVenda, proximo:EstadoVenda, mensagem:string,
):string[] {
  const antes=normalizarEstadoVenda(anterior),depois=normalizarEstadoVenda(proximo);
  const texto=normal(mensagem);
  const autorizaRetirada=/(troca|troque|trocar|tira|tire|tirar|retira|retire|retirar|remove|remova|remover|substitu|no lugar|sem |diminu|reduz|menos |zerar|esvaziar|limpar|cancelar|muda|mude|altera|passa|uma das|duas das)/.test(texto);
  const pendencias:string[]=[];
  const qtd=new Map<string,number>();
  const anteriorQtd=new Map<string,number>();
  for(const i of depois.itens){
    const k=i.productId+":"+i.weight;
    qtd.set(k,(qtd.get(k)??0)+i.quantity);
  }
  for(const i of antes.itens){
    const k=i.productId+":"+i.weight;
    anteriorQtd.set(k,(anteriorQtd.get(k)??0)+i.quantity);
  }
  const removidas=[...anteriorQtd.entries()].reduce(
    (n,[k,v])=>n+Math.max(0,v-(qtd.get(k)??0)),0);
  const adicionadas=[...qtd.entries()].reduce(
    (n,[k,v])=>n+Math.max(0,v-(anteriorQtd.get(k)??0)),0);
  if(removidas && !autorizaRetirada)
    pendencias.push("A IA retirou "+removidas+" unidade(s) do carrinho sem pedido explícito. Carrinho anterior preservado.");
  const trechoQuantidade=texto.match(
    /\b(?:troca|troque|trocar|tira|tire|tirar|retira|retire|retirar|remove|remova|remover|substitu\w*|muda|mude|altera|passa)\b.{0,45}?\b(1|2|3|uma|um|duas|dois|tres)\b/
  )||texto.match(/\b(uma|duas|dois|tres) das?\b/);
  const numero:Record<string,number>={um:1,uma:1,duas:2,dois:2,tres:3};
  const qtdPediu=trechoQuantidade?numero[trechoQuantidade[1]]??Number(trechoQuantidade[1]):null;
  if(removidas && qtdPediu && removidas!==qtdPediu)
    pendencias.push("O cliente solicitou alterar "+qtdPediu+" unidade(s), mas a IA retirou "+removidas+". Revise a troca.");
  const adicao=texto.match(
    /\b(?:acrescente|acrescenta|acrescentar|adiciona|adicione|adicionar|inclua|inclui|incluir|coloque|coloca|somar|soma|mais)\b.{0,35}?\b(1|2|3|4|5|uma|um|duas|dois|tres)\b/
  );
  const unidadesAdicao=adicao?numero[adicao[1]]??Number(adicao[1]):null;
  if(unidadesAdicao && !autorizaRetirada && adicionadas!==unidadesAdicao)
    pendencias.push("O cliente solicitou adicionar "+unidadesAdicao+" unidade(s), mas a IA acrescentou "+adicionadas+". Revise as quantidades.");
  const pedeSubstituicao=/(troca|troque|trocar|substitu|no lugar)/.test(texto) ||
    /(uma das|duas das|muda|mude|altera|passa).{0,70}\b(200|300|400)\s*g\b/.test(texto);
  if(pedeSubstituicao && qtdPediu && removidas===qtdPediu && adicionadas!==qtdPediu)
    pendencias.push("A substituição pediu "+qtdPediu+" unidade(s), mas adicionou "+adicionadas+". Confirme tamanhos e sabores.");
  if(depois.itens.reduce((n,i)=>n+i.quantity,0)>200)
    pendencias.push("Carrinho acima de 200 unidades. Monte o pedido manualmente.");
  if(antes.recebimento.metodo && depois.recebimento.metodo &&
     antes.recebimento.metodo!==depois.recebimento.metodo &&
     !/(entrega|entregar|retirada|retirar|buscar|receber)/.test(texto))
    pendencias.push("A IA alterou entrega/retirada sem solicitação. Confira o recebimento.");
  return pendencias;
}

/** Nunca retira a pendência de um modelo nem confirma entrega quando falta bairro/data. */
export function resumirVenda(
  estadoBruto:unknown, rawPedido:unknown, produtos:any[], precos:unknown,
  cidadesPermitidas:string[]=[],
):ResumoVenda {
  const estado=normalizarEstadoVenda(estadoBruto);
  const pedido=validarSugestaoPedido(rawPedido,produtos,precos);
  const pendencias=[...pedido.pendencias];
  for(const i of pedido.itens) {
    if(i.estoque===null) pendencias.push(i.nome+" ("+i.weight+"): disponibilidade não confirmada; equipe precisa verificar antes de confirmar.");
  }
  const itensTotal=pedido.itens.reduce((n,it)=>n+it.quantity,0);
  if (!pedido.itens.length) pendencias.push("Informe sabores, tamanhos e quantidades disponíveis.");
  if (estado.recebimento.metodo===null) pendencias.push("Confirme se prefere entrega ou retirada na loja.");
  if (estado.recebimento.metodo==="entrega") {
    if (!estado.recebimento.cidade) pendencias.push("Informe a cidade da entrega.");
    else if (cidadesPermitidas.length && !cidadesPermitidas.some(c=>normal(c)===normal(estado.recebimento.cidade)))
      pendencias.push("Cidade não encontrada nas rotas cadastradas; a equipe precisa confirmar atendimento.");
    if (!estado.recebimento.bairro) pendencias.push("Informe o bairro para consultar frete.");
    if (!estado.recebimento.horario) pendencias.push("Confirme dia e intervalo de entrega disponíveis no checkout.");
  }
  const proximo=[5,10,20].find(t=>itensTotal>0 && itensTotal<t)??null;
  const proximaFaixa=proximo?{
    faltam:proximo-itensTotal, alvo:proximo,
    descricao:"Faltam "+(proximo-itensTotal)+" unidade(s) para a faixa de "+proximo+" itens; confira os novos valores antes de adicionar.",
  }:null;
  const linhas=pedido.itens.map(i=>
    "• "+i.quantity+"× "+i.nome+" ("+i.weight+") — "+moeda(i.unitPrice*i.quantity));
  const receb=estado.recebimento;
  const modo=receb.metodo==="retirada"?"Retirada na loja":
    receb.metodo==="entrega"?"Entrega em "+(receb.cidade||"cidade a confirmar")+(receb.bairro?" / "+receb.bairro:"")+
      (receb.horario?" · preferência: "+receb.horario:""):
    "Entrega ou retirada: a confirmar";
  const unico=[...new Set(pendencias)].slice(0,25);
  const resumo="*Prévia do pedido SaborosaMente*\n"+
    (linhas.length?linhas.join("\n"):"• Sabores e quantidades pendentes")+
    "\n\n*Subtotal das refeições:* "+moeda(pedido.subtotal)+
    "\n*Recebimento:* "+modo+
    "\n*Frete:* a confirmar no checkout"+
    "\n*Total final:* a confirmar após endereço, descontos/cupom, cashback e adicionais"+
    (unico.length?"\n\n*Para conferir:*\n"+unico.map(x=>"• "+x).join("\n"):"")+
    "\n\nEsta é uma prévia para revisão da equipe, não é um pedido confirmado. Valores e estoque podem mudar.";
  const perguntaSeguinte=unico[0]||"Os itens estão corretos? Podemos conferir entrega/retirada e pagamento antes de finalizar.";
  return {pedido,itensTotal,resumo,pendencias:unico,proximaFaixa,perguntaSeguinte,
    aplicavelNoFormulario:pedido.itens.length>0 && pendencias.length===0};
}
export function sugestoesDeVenda(
  pedido:SugestaoPedido, produtos:any[], precos:unknown, preferidos:string[]=[],
):Array<{productId:string;nome:string;weight:TamanhoMarmita;motivo:string}> {
  const existentes=new Set(pedido.itens.map(i=>i.productId));
  const peso=(pedido.itens[0]?.weight||"300g") as TamanhoMarmita;
  const tabela=normalizarPrecosMarmita(precos);
  return produtos.filter(p=>p.ativo===true&&p.visivel_online===true&&!existentes.has(p.id)&&
      String(p.tipo_produto||"").toLowerCase()==="marmita")
    .map(p=>{
      const stock=p["estoque_"+peso];
      const valor=Number(p["tabela_nutricional_"+peso]?.kcal);
      const ok=p.controle_estoque===true&&Number.isFinite(Number(stock))&&Number(stock)>0;
      return {p,ok,calorias:Number.isFinite(valor)&&valor>0?valor:null,
        favorito:preferidos.includes(p.id)};
    })
    .filter(x=>x.ok)
    .sort((a,b)=>Number(b.favorito)-Number(a.favorito)||
      (a.calorias??Infinity)-(b.calorias??Infinity)||String(a.p.nome).localeCompare(String(b.p.nome),"pt-BR"))
    .slice(0,3)
    .map(x=>({productId:x.p.id,nome:String(x.p.nome),weight:peso,
      motivo:x.favorito?"Já foi comprado anteriormente":"Disponível na gramatura solicitada"}));
}
/** O valor futuro é informado apenas como unitário verificável, sem prometer economia no total. */
export function textoProximaFaixa(resumo:ResumoVenda,precos:unknown):string|null {
  if(!resumo.proximaFaixa)return null;
  const tabela=normalizarPrecosMarmita(precos);
  const primeiro=resumo.pedido.itens.find(i=>["200g","300g","400g"].includes(i.weight));
  if(!primeiro)return resumo.proximaFaixa.descricao;
  const antes=precoMarmitaPorFaixa(primeiro.weight,resumo.itensTotal,primeiro.unitPrice,tabela);
  const depois=precoMarmitaPorFaixa(primeiro.weight,resumo.proximaFaixa.alvo,primeiro.unitPrice,tabela);
  return resumo.proximaFaixa.descricao+
    " Exemplo: marmita de "+primeiro.weight+" passaria de "+moeda(antes)+
    " para "+moeda(depois)+" por unidade. O subtotal aumentará com os itens adicionais.";
}

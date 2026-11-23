import { validarSugestaoPedido, type SugestaoPedido } from "./whatsapp-ia-order.ts";
import { catalogVariants, type CatalogOrderItem } from "./whatsapp-catalog.ts";
import { faixaPorQuantidade, isMarmita, normalizarPrecosMarmita } from "./combo-rules.ts";
import type { montarFatosIA } from "./whatsapp-ia-facts.ts";

export type ModalidadeVenda = "entrega" | "retirada" | null;
export type EntregaVenda = {
  modalidade: ModalidadeVenda;
  cidade: string;
  bairro: string;
  preferencia: string;
};
export type EstadoVenda = {
  itens: Array<Pick<CatalogOrderItem, "productId" | "quantity" | "weight">>;
  entrega: EntregaVenda;
};
export type OportunidadeVenda = {
  faltam: number;
  proximaFaixa: number;
  mensagem: string;
  opcoes: Array<{ productId: string; nome: string; weight: "200g" | "300g" | "400g" }>;
};
export type ResultadoVenda = {
  estado: EstadoVenda;
  pedido: SugestaoPedido;
  pendencias: string[];
  resumo: string;
  proximaPergunta: string;
  oportunidade: OportunidadeVenda | null;
  podeAbrirRascunho: boolean;
};
export type FatosVenda = ReturnType<typeof montarFatosIA>;
const vazio = (): EntregaVenda => ({ modalidade: null, cidade: "", bairro: "", preferencia: "" });
const texto = (v: unknown, max = 100) => typeof v === "string" ? v.trim().slice(0, max) : "";
const normal = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();
const money = (v: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
const key = (v: Pick<CatalogOrderItem,"productId"|"weight">) => v.productId+":"+v.weight;
const totalUnidades = (itens: Array<{quantity:number}>) => itens.reduce((n,i)=>n+i.quantity,0);

/** O navegador e a OpenAI não são fonte confiável de preços, estoque ou produtos. */
export function normalizarEstadoVenda(raw: unknown): EstadoVenda {
  const v = raw && typeof raw === "object" ? raw as Record<string, any> : {};
  const itens = Array.isArray(v.itens) && v.itens.length <= 50
    ? v.itens.filter((i:any)=>i && typeof i.productId==="string" &&
      i.productId.length<=80 && ["200g","300g","400g"].includes(i.weight) &&
      Number.isInteger(i.quantity) && i.quantity>0 && i.quantity<=100).map((i:any)=>({
        productId:i.productId,weight:i.weight as CatalogOrderItem["weight"],quantity:i.quantity,
      })) : [];
  const rawEntrega = v.entrega && typeof v.entrega==="object" ? v.entrega : {};
  return {
    itens,
    entrega:{
      modalidade:rawEntrega.modalidade==="entrega"||rawEntrega.modalidade==="retirada" ? rawEntrega.modalidade : null,
      cidade:texto(rawEntrega.cidade,80),
      bairro:texto(rawEntrega.bairro,80),
      preferencia:texto(rawEntrega.preferencia,120),
    },
  };
}

/** Descarta cidade e bairro não reconhecidos — nunca inventar prazo, taxa ou atendimento. */
export function validarEntregaVenda(raw: unknown, anterior: EntregaVenda, fatos: FatosVenda): {
  entrega: EntregaVenda; pendencias: string[];
} {
  const r = raw && typeof raw==="object" ? raw as Record<string, unknown> : {};
  const pendencias:string[]=[];
  const modalidade = r.modalidade==="entrega"||r.modalidade==="retirada"
    ? r.modalidade : r.modalidade===null ? null : anterior.modalidade;
  if (modalidade==="retirada") return {entrega:{...vazio(),modalidade:"retirada"},pendencias};
  const cidadeDesejada = texto(r.cidade !== undefined ? r.cidade : anterior.cidade,80);
  const cidade = cidadeDesejada
    ? fatos.cidades.find(c=>normal(c.cidade)===normal(cidadeDesejada))
    : undefined;
  if(cidadeDesejada && !cidade)pendencias.push("Cidade não encontrada nas rotas cadastradas. Confirme a área atendida com a equipe.");
  const cidadeAnterior = normal(anterior.cidade);
  const mudouCidade = cidade && normal(cidade.cidade)!==cidadeAnterior;
  const bairroDesejado = texto(r.bairro!==undefined ? r.bairro : mudouCidade ? "" : anterior.bairro,80);
  const bairro = cidade?.bairros.find(b=>normal(b.bairro)===normal(bairroDesejado));
  if(bairroDesejado && !bairro) pendencias.push("Bairro não encontrado para esta cidade. Confira a taxa e o endereço no checkout.");
  const preferencia = texto(r.preferencia!==undefined ? r.preferencia : anterior.preferencia,120);
  return {
    entrega:{
      modalidade,
      cidade:cidade?.cidade ?? "",
      bairro:bairro?.bairro ?? "",
      preferencia,
    }, pendencias,
  };
}
function validarCarrinho(itens: EstadoVenda["itens"],produtos:any[],precos:unknown) {
  const resultado=validarSugestaoPedido({itens,pendencias:[]},produtos,precos);
  const canCount=resultado.itens.reduce((n,i)=>n+i.quantity,0);
  const origCount=totalUnidades(itens);
  // Uma linha inválida ou estoque insuficiente não pode sumir silenciosamente.
  if(canCount!==origCount || resultado.itens.length!==new Set(itens.map(key)).size)
    resultado.pendencias.push("O carrinho contém item inválido, indisponível ou com estoque insuficiente. Corrija antes de continuar.");
  return resultado;
}
export function oportunidadeVenda(pedido:SugestaoPedido,produtos:any[],precos:unknown):OportunidadeVenda|null {
  if(pedido.pendencias.length || !pedido.itens.length)return null;
  const total=totalUnidades(pedido.itens);
  const proximaFaixa=[5,10,20].find(q=>q>total);
  if(!proximaFaixa || proximaFaixa-total>2)return null;
  const faltam=proximaFaixa-total;
  const tamanho=pedido.itens.find(i=>/^(200|300|400)g$/.test(i.tamanho))?.weight ?? "300g";
  const tabela=normalizarPrecosMarmita(precos);
  const existentes=new Set(pedido.itens.map(i=>i.productId));
  const opcoes=produtos.filter(p=>p.ativo===true && p.visivel_online===true &&
    p.tipo_produto!=="combo" && p.tipo_produto!=="sopa" && p.tipo_produto!=="complemento" &&
    isMarmita(p.nome,p.categorias?.nome??p.categoria)).flatMap(p=>{
      const variante=catalogVariants(p,tabela).find(v=>v.weight===tamanho && v.orderable &&
        (v.stock!==null && v.stock>=faltam));
      return variante ? [{productId:String(p.id),nome:String(p.nome),
        weight:variante.weight,jaNoCarrinho:existentes.has(p.id)}] : [];
    }).sort((a,b)=>Number(a.jaNoCarrinho)-Number(b.jaNoCarrinho))
    .slice(0,2).map(({productId,nome,weight})=>({productId,nome,weight}));
  return {
    faltam,proximaFaixa,opcoes,
    mensagem:"Faltam "+faltam+" unidade(s) para a faixa de "+proximaFaixa+
      "+ itens. Ao escolher mais sabores, os preços das marmitas avulsas são recalculados pela tabela atual.",
  };
}
export function resumoVendaWhatsApp(pedido:SugestaoPedido,entrega:EntregaVenda,pendencias:string[],oportunidade:OportunidadeVenda|null):{
  resumo:string;proximaPergunta:string;
} {
  const count=totalUnidades(pedido.itens);
  const linhas=[
    "🍽️ *Prévia do pedido SaborosaMente*",
    ...pedido.itens.map(i=>"• "+i.quantity+"× "+i.nome+" — "+i.tamanho+" · "+money(i.unitPrice*i.quantity)),
    "*"+count+" unidade(s)* · Subtotal: *"+money(pedido.subtotal)+"*",
  ];
  if(entrega.modalidade==="retirada")linhas.push("📍 Retirada na loja — horário a confirmar.");
  else if(entrega.modalidade==="entrega") {
    linhas.push("🚚 Entrega"+(entrega.cidade?" em "+entrega.cidade:"")+
      (entrega.bairro?" / "+entrega.bairro:"")+".");
    if(entrega.preferencia)linhas.push("Preferência informada: "+entrega.preferencia+" (sujeita à agenda).");
  } else linhas.push("Entrega ou retirada: a escolher.");
  linhas.push("Frete, descontos adicionais, cupons e valor final: confirmar no checkout.");
  if(pendencias.length)linhas.push("⚠️ *Antes de confirmar:* "+pendencias.slice(0,4).join(" | "));
  if(oportunidade)linhas.push("💚 "+oportunidade.mensagem);
  linhas.push("Esta é uma *simulação* para conferência da equipe, não é um pedido confirmado, pago nem reservado.");
  const proximaPergunta=pendencias[0] || (!count
    ? "Quais sabores, tamanhos e quantidades você gostaria?"
    : !entrega.modalidade ? "Você prefere entrega ou retirada na loja?"
    : entrega.modalidade==="entrega" && !entrega.cidade ? "Em qual cidade você quer receber?"
    : entrega.modalidade==="entrega" && !entrega.bairro ? "Qual é seu bairro para conferirmos o frete?"
    : !entrega.preferencia ? "Qual dia e horário de preferência? Vamos confirmar a agenda."
    : "Posso deixar esta prévia para a equipe revisar e confirmar os dados?");
  return {resumo:linhas.join("\n"),proximaPergunta};
}
function textoExpressaLimpar(pergunta:string) {
  const p=normal(pergunta);
  return /(?:zerar|limpar|esvaziar)\s+(?:o\s+)?(?:carrinho|rascunho)|(?:cancelar|apagar)\s+(?:o\s+)?(?:carrinho|rascunho)/.test(p);
}
function textoExpressaRemover(pergunta:string) {
  return /\b(tirar|retirar|remover|excluir|apagar|troca|trocar|substituir|alterar|mudar|corrigir|reduzir|diminuir|em vez de|somente|s[oó]|sem)\b/i.test(pergunta);
}

/** Uma resposta JSON da IA é apenas proposta. Operações e cálculos são validados de novo no servidor. */
export function prepararVendaIA(args:{
  raw:unknown;anterior:unknown;pergunta:string;produtos:any[];precos:unknown;fatos:FatosVenda;
}):ResultadoVenda {
  const anterior=normalizarEstadoVenda(args.anterior);
  const raw=args.raw && typeof args.raw==="object" ? args.raw as Record<string,unknown> : {};
  const pendencias:string[] = Array.isArray(raw.pendencias)
    ? raw.pendencias.filter((p):p is string=>typeof p==="string").slice(0,8).map(p=>p.slice(0,180)) : [];
  let itens=anterior.itens;
  const acao=raw.acao;
  if (acao==="limpar") {
    if(textoExpressaLimpar(args.pergunta))itens=[];
    else pendencias.push("O pedido de limpeza do carrinho não foi explícito. Mantive os itens anteriores.");
  } else if (acao==="atualizar") {
    if(!Array.isArray(raw.itens) || raw.itens.length>50)pendencias.push("Itens sugeridos inválidos. Mantive o carrinho anterior.");
    else {
      const candidato=normalizarEstadoVenda({itens:raw.itens}).itens;
      const sugerido=validarCarrinho(candidato,args.produtos,args.precos);
      const anteriorValidado=validarCarrinho(anterior.itens,args.produtos,args.precos);
      if(candidato.length!==raw.itens.length || sugerido.pendencias.length){
        pendencias.push(...sugerido.pendencias,"Não apliquei alterações incompletas ao carrinho.");
      } else {
        const antes=new Map(anterior.itens.map(i=>[key(i),i.quantity]));
        const depois=new Map(candidato.map(i=>[key(i),i.quantity]));
        const diminuiu=[...antes].some(([k,q])=>(depois.get(k)??0)<q);
        if(diminuiu && !textoExpressaRemover(args.pergunta) && anteriorValidado.itens.length){
          pendencias.push("A IA tentou retirar itens sem solicitação explícita. Mantive o carrinho anterior.");
        } else itens=candidato;
      }
    }
  } else if(acao!=="manter")pendencias.push("Não entendi a alteração solicitada. Mantive o carrinho anterior.");

  const pedido=validarCarrinho(itens,args.produtos,args.precos);
  pendencias.push(...pedido.pendencias);
  const validacaoEntrega=validarEntregaVenda(raw.entrega,anterior.entrega,args.fatos);
  pendencias.push(...validacaoEntrega.pendencias);
  if (pedido.itens.some(i=>i.estoque===null))
    pendencias.push("Há estoque não controlado. Confirme a disponibilidade com a equipe antes de salvar o pedido.");
  const oportunidade=pendencias.length?null:oportunidadeVenda(pedido,args.produtos,args.precos);
  const unicas=[...new Set(pendencias)].slice(0,12);
  const resumo=resumoVendaWhatsApp(pedido,validacaoEntrega.entrega,unicas,oportunidade);
  return {
    estado:{itens,entrega:validacaoEntrega.entrega},
    pedido,pendencias:unicas,resumo:resumo.resumo,proximaPergunta:resumo.proximaPergunta,
    oportunidade,podeAbrirRascunho:pedido.itens.length>0 && !unicas.length,
  };
}
/** Revalidação sem modelo para restaurar rascunhos, nunca usa preços persistidos no navegador. */
export function conferirVenda(args:{
  anterior:unknown;produtos:any[];precos:unknown;fatos:FatosVenda;
}):ResultadoVenda {
  return prepararVendaIA({...args,pergunta:"Conferir valores atuais sem alterações",
    raw:{acao:"manter",entrega:normalizarEstadoVenda(args.anterior).entrega}});
}

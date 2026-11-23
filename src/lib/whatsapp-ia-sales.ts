import { validarSugestaoPedido, type SugestaoPedido } from "./whatsapp-ia-order.ts";
import { catalogVariants, type CatalogOrderItem } from "./whatsapp-catalog.ts";
import { calcularFrete, isMarmita, normalizarPrecosMarmita, precoCheioMarmita } from "./combo-rules.ts";
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
  economiaFaixa: number;
  fretePrevisto: number | null;
  totalPrevisto: number | null;
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
export function resumoVendaWhatsApp(pedido:SugestaoPedido,entrega:EntregaVenda,pendencias:string[],oportunidade:OportunidadeVenda|null,cotacao?:{frete:number|null;total:number|null;economia:number}):{
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
  if(cotacao?.economia && cotacao.economia>0)
    linhas.push("Economia pela faixa de quantidade: "+money(cotacao.economia)+" (já incluída no subtotal).");
  if(cotacao?.frete!==null && cotacao?.frete!==undefined)
    linhas.push("Frete estimado por bairro: "+money(cotacao.frete)+".");
  else linhas.push("Frete: a confirmar conforme bairro e rota.");
  if(cotacao?.total!==null && cotacao?.total!==undefined)
    linhas.push("*Total estimado sem adicionais: "+money(cotacao.total)+"*.");
  linhas.push("Cupons, cashback, adicionais e total final devem ser conferidos no checkout.");
  if(pendencias.length)linhas.push("⚠️ *Antes de confirmar:* "+pendencias.slice(0,4).join(" | "));
  if(oportunidade)linhas.push("💚 "+oportunidade.mensagem);
  linhas.push("Esta é uma *simulação* para conferência da equipe, não é um pedido confirmado, pago nem reservado.");
  const duvidaEstoque=pendencias.some(p=>/estoque|esgotado|indisponível/i.test(p));
  const duvidaSabores=pendencias.some(p=>/sabor|quantidade faltante|unidades.*proposta|proposta.*unidades/i.test(p));
  const proximaPergunta=duvidaEstoque ? "Algum sabor está indisponível. Você prefere escolher outra opção disponível?"
    : duvidaSabores ? "Pode confirmar os sabores e quantidades que faltam no carrinho?"
    : !count ? "Quais sabores, tamanhos e quantidades você gostaria?"
    : !entrega.modalidade ? "Você prefere entrega ou retirada na loja?"
    : entrega.modalidade==="entrega" && !entrega.cidade ? "Em qual cidade você quer receber?"
    : entrega.modalidade==="entrega" && !entrega.bairro ? "Qual é seu bairro para conferirmos o frete?"
    : !entrega.preferencia ? "Qual dia e horário de preferência? Vamos confirmar a agenda."
    : pendencias.length ? "Nossa equipe precisa conferir algumas informações antes de confirmar. Pode esclarecer os pontos destacados?"
    : "Posso deixar esta prévia para a equipe revisar e confirmar os dados?";
  return {resumo:linhas.join("\n"),proximaPergunta};
}
function quantidadeTotalPedida(pergunta:string):number|null {
  const p=normal(pergunta);
  const m=p.match(/(?:quero|preciso(?: de)?|monta(?:r)?|comprar|separa(?:r)?|pedido de)\s+(?:um total de\s+)?(\d{1,3})\s*(?:marmitas?|refeicoes?|unidades?|pratos?)\b/);
  if(!m)return null;
  const n=Number(m[1]);
  return n>=1 && n<=200 ? n : null;
}

const palavrasNumeros:Record<string,number>={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,vinte:20};
function quantidadeTexto(valor:string):number|null {
  const n=Number(valor);
  return Number.isInteger(n) && n>0 && n<=200 ? n : palavrasNumeros[valor]??null;
}
function quantidadeDeAcrescimo(pergunta:string):number|null {
  const p=normal(pergunta);
  const m=p.match(/\b(?:adiciona(?:r)?|adicione|acrescenta(?:r)?|acrescente|coloca(?:r)?|inclua|inclui(?:r)?|soma(?:r)?|mais)\s+(?:mais\s+)?(\d{1,3}|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|vinte)\b/);
  return m ? quantidadeTexto(m[1]) : null;
}
function quantidadeDeRemocao(pergunta:string):number|null {
  const p=normal(pergunta);
  const m=p.match(/\b(?:retire|retira(?:r)?|tire|tira(?:r)?|remova|remover|exclua|excluir|reduza|reduzir|diminua|diminuir)\s+(?:(?:as|os|uma|um)\s+)?(\d{1,3}|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\b/);
  return m ? quantidadeTexto(m[1]) : null;
}
function quantidadeDeTroca(pergunta:string):number|null {
  const p=normal(pergunta);
  const m=p.match(/\b(?:troca(?:r)?|troque|substitui(?:r)?|substitua)\s+(?:(?:as|os)\s+)?(\d{1,3}|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\b/);
  return m ? quantidadeTexto(m[1]) : null;
}
function diferencasDeItens(antes:EstadoVenda["itens"],depois:EstadoVenda["itens"]) {
  const contar=(a:EstadoVenda["itens"])=>{
    const x=new Map<string,number>();
    for(const i of a)x.set(key(i),(x.get(key(i))??0)+i.quantity);
    return x;
  };
  const a=contar(antes),b=contar(depois),chaves=new Set([...a.keys(),...b.keys()]);
  return { adicionadas:[...chaves].reduce((n,k)=>n+Math.max(0,(b.get(k)??0)-(a.get(k)??0)),0),
    removidas:[...chaves].reduce((n,k)=>n+Math.max(0,(a.get(k)??0)-(b.get(k)??0)),0) };
}
/** Não atribuir automaticamente um prato específico quando a categoria possui várias receitas. */
function ambiguidadesDeSabores(pergunta:string,produtos:any[]):string[] {
  const p=normal(pergunta);
  if(/\b(sugira|sugerir|sortidas|sortidos|variadas|variados|voce escolhe|surpreenda)\b/.test(p))
    return [];
  const principais=["frango","carne","lasanha","escondidinho","estrogonofe","tilapia"];
  const genericas=principais.filter(termo=>new RegExp("\\b"+termo+"\\b").test(p));
  const pendencias:string[]=[];
  for(const termo of genericas){
    const matches=produtos.filter(p=>p.ativo===true&&p.visivel_online===true&&
      normal(String(p.nome)).includes(termo));
    if(matches.length<=1)continue;
    // O cliente pode escrever só o nome resumido do prato; um segundo descritor
    // reconhecido deve distinguir a receita sem exigir descrição integral.
    const descritores=new Set(matches.flatMap(x=>normal(String(x.nome))
      .split(/\s+/).filter(w=>w.length>=5&&![
        "frango","carne","lasanha","escondidinho","estrogonofe","tilapia",
        "molho","arroz","batata","pratos","pesto","feito","molhos","branco",
      ].includes(w))));
    const detalhou=[...descritores].some(w=>new RegExp("\\b"+w+"\\b").test(p));
    if(!detalhou)pendencias.push("Há várias opções de "+termo+" no cardápio. Confirme o sabor exato antes de aplicar a sugestão.");
  }
  return pendencias;
}

function textoExpressaLimpar(pergunta:string) {
  const p=normal(pergunta);
  return /(?:zerar|zere|limpar|limpe|esvaziar|esvazie)\s+(?:(?:o|a)\s+)?(?:carrinho|simulacao|rascunho)|(?:cancelar|apagar|apague)\s+(?:o\s+)?(?:carrinho|rascunho)/.test(p);
}
function textoExpressaRemover(pergunta:string) {
  return /\b(tirar|tire|tira|retirar|retire|retira|remover|remova|excluir|exclua|apagar|apague|troca|trocar|troque|substituir|substitua|alterar|altere|mudar|mude|corrigir|corrija|reduzir|reduza|diminuir|diminua|em vez de|somente|apenas|s[oó]|sem)\b/i.test(pergunta);
}

/** Uma resposta JSON da IA é apenas proposta. Operações e cálculos são validados de novo no servidor. */
export function prepararVendaIA(args:{
  raw:unknown;anterior:unknown;pergunta:string;produtos:any[];precos:unknown;fatos:FatosVenda;
}):ResultadoVenda {
  const anterior=normalizarEstadoVenda(args.anterior);
  const raw=args.raw && typeof args.raw==="object" ? args.raw as Record<string,unknown> : {};
  const pendencias:string[] = Array.isArray(raw.pendencias)
    ? raw.pendencias.filter((p):p is string=>typeof p==="string").slice(0,8)
      .map(p=>p.slice(0,180))
      .filter(p=>!/^\s*(?:perguntas? (?:nao|não) respondidas|informa[cç][oõ]es? pendentes|confirmar dados|aguardando resposta)\s*\.?$/i.test(p))
    : [];
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
        const diferencas=diferencasDeItens(anterior.itens,candidato);
        const adicionar=quantidadeDeAcrescimo(args.pergunta);
        const retirar=quantidadeDeRemocao(args.pergunta);
        const trocar=quantidadeDeTroca(args.pergunta);
        const mensagem=normal(args.pergunta);
        const somenteLogistica=/\b(entrega|entregar|retirada|retirar|bairro|frete|endereco|horario|agendar)\b/.test(mensagem) &&
          !/\b(marmita|refeicao|unidade|item|produto|sabor|prato)\b/.test(mensagem);
        if(diminuiu && somenteLogistica) {
          pendencias.push("Alteração de entrega ou retirada não autoriza remover produtos. Mantive os itens.");
        } else if(diminuiu && !textoExpressaRemover(args.pergunta) && anteriorValidado.itens.length){
          pendencias.push("A IA tentou retirar itens sem solicitação explícita. Mantive o carrinho anterior.");
        } else if(adicionar!==null && diferencas.adicionadas!==adicionar) {
          pendencias.push("O cliente pediu acrescentar "+adicionar+" unidade(s), mas a proposta acrescentou "+diferencas.adicionadas+". Mantive o carrinho anterior.");
        } else if(retirar!==null && (diferencas.removidas!==retirar || diferencas.adicionadas>0)){
          pendencias.push("A remoção solicitada foi de "+retirar+" unidade(s), mas a IA propôs outra alteração. Mantive o carrinho anterior.");
        } else if(trocar!==null && (diferencas.removidas!==trocar || diferencas.adicionadas!==trocar)){
          pendencias.push("A troca solicitada foi de "+trocar+" unidade(s), mas a IA alterou outras quantidades. Mantive o carrinho anterior.");
        } else itens=candidato;
      }
    }
  } else if(acao!=="manter")pendencias.push("Não entendi a alteração solicitada. Mantive o carrinho anterior.");

  const pedido=validarCarrinho(itens,args.produtos,args.precos);
  pendencias.push(...pedido.pendencias);
  if(acao==="atualizar")pendencias.push(...ambiguidadesDeSabores(args.pergunta,args.produtos));
  if (!anterior.itens.length && acao==="atualizar") {
    const solicitadas=quantidadeTotalPedida(args.pergunta);
    const sugeridas=totalUnidades(itens);
    if(solicitadas!==null && solicitadas!==sugeridas)
      pendencias.push("O cliente pediu "+solicitadas+" unidades, mas a proposta tem "+
        sugeridas+". Confirme os sabores e a quantidade faltante.");
  }
  const textoLogistica=normal(args.pergunta);
  const autorizaMudarEntrega=/\b(entrega|entregar|retirada|retirar|buscar|receber|bairro|cidade|frete|endereco|horario|agendar|agendado)\b/.test(textoLogistica) ||
    args.fatos.cidades.some(c=>textoLogistica.includes(normal(c.cidade)));
  const validacaoEntrega=validarEntregaVenda(autorizaMudarEntrega?raw.entrega:{},anterior.entrega,args.fatos);
  pendencias.push(...validacaoEntrega.pendencias);
  if (pedido.itens.some(i=>i.estoque===null))
    pendencias.push("Há estoque não controlado. Confirme a disponibilidade com a equipe antes de salvar o pedido.");
  const q=totalUnidades(pedido.itens);
  const tabela=normalizarPrecosMarmita(args.precos);
  const porId=new Map(args.produtos.map(p=>[p.id,p]));
  const elegiveis=pedido.itens.reduce((n,i)=>{
    const p=porId.get(i.productId);
    return n+(p && String(p.tipo_produto).toLowerCase()!=="combo" &&
      !["sopa","complemento","bebida"].includes(String(p.tipo_produto).toLowerCase()) &&
      isMarmita(p.nome,p.categorias?.nome??p.categoria)?i.quantity:0);
  },0);
  const cheio=pedido.itens.reduce((n,i)=>{
    const p=porId.get(i.productId);
    const ehMarmita=p && !["sopa","complemento","bebida","combo"].includes(String(p.tipo_produto).toLowerCase())
      && isMarmita(p.nome,p.categorias?.nome??p.categoria);
    return n+(ehMarmita?precoCheioMarmita(i.weight,tabela):i.unitPrice)*i.quantity;
  },0);
  const economiaFaixa=Math.round(Math.max(0,cheio-pedido.subtotal)*100)/100;
  let fretePrevisto:number|null=null;
  if(validacaoEntrega.entrega.modalidade==="retirada")fretePrevisto=0;
  if(validacaoEntrega.entrega.modalidade==="entrega") {
    const cidade=args.fatos.cidades.find(c=>normal(c.cidade)===normal(validacaoEntrega.entrega.cidade));
    const bairro=cidade?.bairros.find(b=>normal(b.bairro)===normal(validacaoEntrega.entrega.bairro));
    if(cidade?.minimoUnidades && q<cidade.minimoUnidades)
      pendencias.push("Pedido mínimo nesta cidade: "+cidade.minimoUnidades+" unidades. O carrinho tem "+q+".");
    if(bairro && pedido.itens.length && !pedido.pendencias.length)
      fretePrevisto=calcularFrete({subtotal:pedido.subtotal,
        totalUnidades:elegiveis,taxaBase:Number(bairro.taxa),
        cidade:cidade!.cidade,freteGratisAPartirDe:999999,minQuantidadeSBS:5,fretePromoSBS:5});
  }
  const totalPrevisto=fretePrevisto===null?null:Math.round((pedido.subtotal+fretePrevisto)*100)/100;
  const oportunidade=pendencias.length?null:oportunidadeVenda(pedido,args.produtos,args.precos);
  const unicas=[...new Set(pendencias)].slice(0,12);
  const resumo=resumoVendaWhatsApp(pedido,validacaoEntrega.entrega,unicas,oportunidade,{
    frete:fretePrevisto,total:totalPrevisto,economia:economiaFaixa,
  });
  return {
    estado:{itens,entrega:validacaoEntrega.entrega},
    pedido,pendencias:unicas,resumo:resumo.resumo,proximaPergunta:resumo.proximaPergunta,
    oportunidade,podeAbrirRascunho:pedido.itens.length>0 && !unicas.length,
    economiaFaixa,fretePrevisto,totalPrevisto,
  };
}
/** Revalidação sem modelo para restaurar rascunhos, nunca usa preços persistidos no navegador. */
export function conferirVenda(args:{
  anterior:unknown;produtos:any[];precos:unknown;fatos:FatosVenda;
}):ResultadoVenda {
  return prepararVendaIA({...args,pergunta:"Conferir valores atuais sem alterações",
    raw:{acao:"manter",entrega:normalizarEstadoVenda(args.anterior).entrega}});
}

/** Mesmas instruções usadas no painel e na bateria de QA. Somente dados comerciais. */
export function montarPromptVenda(
  estadoAnterior: EstadoVenda,catalogoSeguro:unknown[],fatos:FatosVenda,contexto:string,
):string {
  return [
        "Você é um interpretador de pedidos da SaborosaMente PARA A EQUIPE, não um caixa automático.",
        "Leia a mensagem e o ESTADO ATUAL do carrinho. Devolva somente um objeto JSON:",
        '{"acao":"manter|atualizar|limpar","itens":[{"productId":"id","weight":"300g","quantity":2}],"entrega":{"modalidade":"entrega|retirada|null","cidade":"...","bairro":"...","preferencia":"..."},"pendencias":["perguntas não respondidas"]}.',
        "Quando atualizar, itens deve conter o carrinho COMPLETO resultante, não somente o produto alterado.",
        "Acao manter = não mudar itens. Nunca limpar a não ser que o cliente peça explicitamente zerar o carrinho.",
        "Para acrescentar itens, preserve os existentes. Para trocar/retirar, mude somente o que o cliente pediu.",
        "Sem sabor, tamanho ou quantidade definidos, nunca invente. Inclua a parte inequívoca e registre pendências.",
        "Nunca aceitar ID fora do catálogo ou gramatura inexistente. Não incluir combos prontos ou personalizadas como marmitas avulsas.",
        "Se o cliente pedir opções mais leves, comparar somente calorias cadastradas na gramatura informada; sem dado, perguntar.",
        "Não solicitar nome, telefone, endereço completo, CPF, cartão ou dados privados.",
        "Não calcular valores, descontos ou frete: o servidor fará isso. Não afirmar que enviou mensagens, criou pedidos ou reservou estoque.",
        "Cidade e bairro somente se constarem nas rotas. Preferência de data/horário é apenas pedido do cliente, jamais confirmação de agenda.",
        "ENTREGA: mantenha campos anteriores se não forem alterados explicitamente.",
        "O cliente pode pedir várias trocas na mesma mensagem. Nunca transformar pedido pago/cancelamento de compra em comando para limpar carrinho.",
        "Histórico anterior só quando explicitamente solicitado, nunca inventar últimos pedidos.",
        "ESTADO ATUAL JSON:",JSON.stringify(estadoAnterior),
        "HISTÓRICO PERMITIDO:",contexto,
        "CIDADES E BAIRROS:",JSON.stringify(fatos.cidades.map(c=>({
          cidade:c.cidade,bairros:c.bairros.map(b=>b.bairro),
        }))),
        "CATÁLOGO ATUAL JSON:",JSON.stringify(catalogoSeguro),
      ].join("\n");
}

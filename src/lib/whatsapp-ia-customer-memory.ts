import { telefonesDoMesmoContato } from "./whatsapp-ia-privacy.ts";
import { catalogVariants } from "./whatsapp-catalog.ts";
import { normalizarPrecosMarmita } from "./combo-rules.ts";

export type PedidoHistorico = {
  id: string;
  created_at?: string | null;
  status?: string | null;
  telefone_cliente?: string | null;
  cliente_telefone?: string | null;
  endereco_cidade?: string | null;
};
export type ItemHistorico = {
  pedido_id: string; produto_id?: string | null;
  quantidade?: number | null; observacao?: string | null;
};
export type MemoriaItem = {
  productId: string;
  nome: string;
  weight: "200g" | "300g" | "400g";
  quantity: number;
};
export type MemoriaCliente = {
  pedidosAnalisados: number;
  pedidosEntregues: number;
  ultimoPedido: { data: string; cidade: string | null; itens: MemoriaItem[]; naoReconhecidos: number } | null;
  favoritos: Array<{ productId: string; nome: string; weight: MemoriaItem["weight"]; unidades: number; pedidos: number }>;
  intervaloMedioDias: number | null;
  aviso: string;
};

export function pedidosRelacionadosAoTelefone(pedidos: PedidoHistorico[], telefoneConversa: string): PedidoHistorico[] {
  return pedidos.filter(p => telefonesDoMesmoContato(p.telefone_cliente, telefoneConversa) ||
    telefonesDoMesmoContato(p.cliente_telefone, telefoneConversa));
}
export function pesoDoItemHistorico(observacao: unknown): MemoriaItem["weight"] | null {
  const texto = String(observacao ?? "");
  const m = texto.match(/(?:peso|tamanho|gramatura)\s*[:=-]?\s*(200|300|400)\s*g\b/i) ||
    texto.match(/\b(200|300|400)\s*g\b/i);
  return m ? (m[1] + "g") as MemoriaItem["weight"] : null;
}
const entregue = (s: unknown) => String(s ?? "").toLocaleLowerCase("pt-BR").trim() === "entregue";
const cancelado = (s: unknown) => /cancelad|estornad|reembolsad/i.test(String(s ?? ""));
const dataEmMs = (p: PedidoHistorico) => {
  const t = Date.parse(String(p.created_at ?? ""));
  return Number.isFinite(t) ? t : 0;
};

export function criarMemoriaCliente(
  telefoneConversa: string, pedidos: PedidoHistorico[], linhas: ItemHistorico[], produtos: any[], precos: unknown,
): MemoriaCliente {
  const vazia: MemoriaCliente = {
    pedidosAnalisados: 0, pedidosEntregues: 0, ultimoPedido: null, favoritos: [],
    intervaloMedioDias: null,
    aviso: "Histórico consultado somente para a equipe. Confirme os sabores e tamanhos com o cliente; não implica reserva de estoque.",
  };
  const vinculados = pedidosRelacionadosAoTelefone(pedidos, telefoneConversa)
    .filter(p => !cancelado(p.status)).sort((a,b) => dataEmMs(b)-dataEmMs(a)).slice(0,30);
  if (!vinculados.length) return vazia;
  const finalizados = vinculados.filter(p => entregue(p.status));
  const catalogo = new Map(produtos.filter(p => p?.ativo === true && p?.visivel_online === true).map(p => [p.id,p]));
  const tabela = normalizarPrecosMarmita(precos);
  const porPedido = new Map<string, MemoriaItem[]>();
  const quantidadeNaoMapeada = new Map<string,number>();
  const pedidosComProduto = new Map<string,Set<string>>();
  const ranking = new Map<string,{productId:string;nome:string;weight:MemoriaItem["weight"];unidades:number;pedidos:number}>();

  for (const pedido of vinculados) {
    const lista = linhas.filter(l => l.pedido_id === pedido.id).slice(0,100);
    const itens: MemoriaItem[] = [];
    let desconhecidos = 0;
    for (const linha of lista) {
      const p = catalogo.get(linha.produto_id ?? "");
      const weight = pesoDoItemHistorico(linha.observacao);
      const qty = Number(linha.quantidade);
      const variant = p && weight && catalogVariants(p, tabela).find(v => v.weight === weight && v.orderable);
      if (!p || !variant || !Number.isInteger(qty) || qty < 1 || qty > 100) {
        desconhecidos++;
        continue;
      }
      const item = {productId:p.id,nome:String(p.nome),weight:weight!,quantity:qty};
      itens.push(item);
      if (entregue(pedido.status)) {
        const key = item.productId + ":" + item.weight;
        const atual = ranking.get(key);
        const vistos = pedidosComProduto.get(pedido.id) ?? new Set<string>();
        const jaContado = vistos.has(key);
        vistos.add(key);
        pedidosComProduto.set(pedido.id,vistos);
        ranking.set(key,{
          productId:item.productId,nome:item.nome,weight:item.weight,
          unidades:(atual?.unidades ?? 0)+qty,
          pedidos:(atual?.pedidos ?? 0)+(jaContado?0:1),
        });
      }
    }
    porPedido.set(pedido.id,itens);
    quantidadeNaoMapeada.set(pedido.id,desconhecidos);
  }
  const datas = finalizados.map(dataEmMs).filter(t=>t>0).sort((a,b)=>a-b);
  const diffs = datas.slice(1).map((t,i)=>t-datas[i]).filter(n=>n>0);
  const intervaloMedioDias = diffs.length ? Math.round(diffs.reduce((n,v)=>n+v,0)/diffs.length/86_400_000) : null;
  const ultimo = finalizados[0] ?? null;
  return {
    ...vazia, pedidosAnalisados:vinculados.length,pedidosEntregues:finalizados.length,
    ultimoPedido:ultimo?{
      data:ultimo.created_at ?? "",cidade:ultimo.endereco_cidade ?? null,
      itens:porPedido.get(ultimo.id) ?? [],naoReconhecidos:quantidadeNaoMapeada.get(ultimo.id) ?? 0,
    }:null,
    favoritos:[...ranking.values()].sort((a,b)=>b.pedidos-a.pedidos||b.unidades-a.unidades).slice(0,5),
    intervaloMedioDias,
  };
}
export function querRepetirUltimoPedido(pergunta:string):boolean {
  const texto=pergunta.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  return /(repetir|repete|mesmo pedido|pedido anterior|ultimo pedido|da ultima vez|de sempre|pedido igual)/.test(texto);
}
export function repeticaoSemAlteracoes(pergunta:string):boolean {
  const texto=pergunta.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  return querRepetirUltimoPedido(texto) &&
    !/(troca|trocar|tirar|retira|adicion|inclu|sem |menos |mais |substitu|alter|muda|mas |exceto|outro|diferent|metade)/.test(texto);
}
/** Dados de compra, não perfil clínico nem informações de endereço/telefone. */
export function contextoDePreferenciasParaIA(memoria: MemoriaCliente): string {
  return JSON.stringify({
    quantidadePedidosFinalizados:memoria.pedidosEntregues,
    favoritos:memoria.favoritos.map(f=>({productId:f.productId,nome:f.nome,tamanho:f.weight,frequenciaEmPedidos:f.pedidos})),
    ultimoPedido:memoria.ultimoPedido?.itens.map(i=>({productId:i.productId,nome:i.nome,weight:i.weight,quantity:i.quantity})) ?? [],
    ultimoPedidoItensNaoMapeados:memoria.ultimoPedido?.naoReconhecidos ?? 0,
    aviso:"Dados de compras anteriores consultados apenas pela equipe; não revelá-los automaticamente ao cliente. Não inferir doenças, alergias ou dieta. Não repetir item oculto/esgotado. Conferir estoque e preços atuais.",
  });
}

/** Uma troca substitui itens, mas não cria ou apaga unidades sem confirmação.
 * Funciona também quando a IA propõe apenas parte dos sabores.
 */
export function verificarTrocasDaRecompra(
  texto: string, anteriores: MemoriaItem[], propostos: Array<{productId:string;weight:string;quantity:number}>,
): string[] {
  const normalizado=texto.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  if(!/(troca|trocar|substitu|no lugar de)/.test(normalizado))return [];
  const totalAnterior=anteriores.reduce((n,i)=>n+i.quantity,0);
  const totalNovo=propostos.reduce((n,i)=>n+i.quantity,0);
  const pendencias:string[]=[];
  if(!totalAnterior)return ["Não há último pedido entregue para conferir a troca."];
  if(totalNovo!==totalAnterior)pendencias.push(
    "A troca alterou o total de "+totalAnterior+" para "+totalNovo+" unidades. Confira quantidades antes de aplicar.",
  );
  const contar=(items:Array<{productId:string;weight:string;quantity:number}>)=>{
    const m=new Map<string,number>();
    for(const i of items){const k=i.productId+":"+i.weight;m.set(k,(m.get(k)??0)+i.quantity);}
    return m;
  };
  const antes=contar(anteriores),depois=contar(propostos);
  const chaves=new Set([...antes.keys(),...depois.keys()]);
  const removidas=[...chaves].reduce((n,k)=>n+Math.max(0,(antes.get(k)??0)-(depois.get(k)??0)),0);
  const adicionadas=[...chaves].reduce((n,k)=>n+Math.max(0,(depois.get(k)??0)-(antes.get(k)??0)),0);
  if(!removidas && !adicionadas)pendencias.push("Nenhuma troca foi identificada. Confirme quais sabores devem mudar.");
  if(/\b(2|duas|dois)\b.{0,50}(?:marmitas?|unidades?|por algo|por outra)/.test(normalizado) ||
     /(?:troca|trocar|substitu).{0,14}\b(2|duas|dois)\b/.test(normalizado)) {
    if(removidas!==2 || adicionadas!==2) pendencias.push(
      "O cliente solicitou trocar 2 unidades, mas a sugestão alterou "+removidas+" retirada(s) e "+adicionadas+" adicionada(s). Revise antes de aplicar.",
    );
  }
  return pendencias;
}

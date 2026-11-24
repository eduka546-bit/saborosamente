/** Regras de interface para a troca de sabor; o banco revalida tudo com locks. */
export type ProdutoTroca = {
  id: string;
  tipo_produto?: string | null;
  estoque_200g?: number | null;
  estoque_300g?: number | null;
  estoque_400g?: number | null;
  controle_estoque?: boolean | null;
};

export function tamanhoDeEstoqueTroca(tipo: string | null | undefined, tamanho: string): "200g" | "300g" | "400g" | null {
  if (tipo === "sopa") return "400g";
  if (tipo === "complemento") return "200g";
  if (tipo !== "marmita") return null;
  const match = String(tamanho).match(/\b(200|300|400)\s*g\b/i);
  return match ? (match[1] + "g") as "200g" | "300g" | "400g" : null;
}

export function saldoParaTroca(produto: ProdutoTroca, tamanho: string): number | null {
  const coluna = tamanhoDeEstoqueTroca(produto.tipo_produto, tamanho);
  if (!coluna) return null;
  return Number(produto["estoque_" + coluna] ?? 0);
}

export function permiteTrocarSaborPedido(pedido: {status?: string | null; estoque_baixado?: boolean | null}, item: {
  id?: string | null;
  produto_id?: string | null;
  quantidade?: number | null;
  produtos?: {tipo_produto?: string | null} | null;
}, tamanho: string): boolean {
  return Boolean(
    item.id && item.produto_id &&
    (Number(item.quantidade) || 0) > 0 &&
    pedido.estoque_baixado &&
    !["cancelado", "entregue", "rascunho"].includes(String(pedido.status || "").toLowerCase()) &&
    tamanhoDeEstoqueTroca(item.produtos?.tipo_produto, tamanho),
  );
}

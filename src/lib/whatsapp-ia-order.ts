import { catalogVariants, type CatalogOrderItem } from "./whatsapp-catalog.ts";
import { isMarmita, normalizarPrecosMarmita, precoMarmitaPorFaixa } from "./combo-rules.ts";

export type SugestaoItem = CatalogOrderItem & { nome: string; tamanho: string; estoque: number | null };
export type SugestaoPedido = { itens: SugestaoItem[]; pendencias: string[]; subtotal: number };

// Toda validação e precificação é feita com o catálogo, nunca com valores da IA.
export function validarSugestaoPedido(raw: any, produtos: any[], precos: unknown): SugestaoPedido {
  const tabela = normalizarPrecosMarmita(precos);
  const pendencias: string[] = Array.isArray(raw?.pendencias) ? raw.pendencias.filter((p: unknown) => typeof p === "string").slice(0, 20).map((p: string) => p.slice(0, 200)) : [];
  if (!Array.isArray(raw?.itens) || raw.itens.length > 50) return { itens: [], pendencias: ["Pedido não reconhecido. Confira os sabores e quantidades."], subtotal: 0 };
  const grupos = new Map<string, { produto: any; variante: ReturnType<typeof catalogVariants>[number]; quantity: number }>();
  for (const item of raw.itens) {
    const p = produtos.find(p => p.id === item?.productId && p.ativo === true && p.visivel_online === true);
    const q = item?.quantity;
    const variant = p && catalogVariants(p, tabela).find(v => v.weight === item?.weight && v.orderable);
    if (!p || !variant || !Number.isInteger(q) || q < 1 || q > 100) {
      pendencias.push("Há um item sem produto, tamanho ou quantidade válida. Confira a solicitação.");
      continue;
    }
    const key = p.id + ":" + variant.weight;
    const old = grupos.get(key);
    grupos.set(key, { produto: p, variante: variant, quantity: (old?.quantity ?? 0) + q });
  }
  const total = [...grupos.values()].reduce((n, r) => n + r.quantity, 0);
  if (total > 200) return { itens: [], pendencias: ["Quantidade acima do limite do simulador. Monte o pedido manualmente."], subtotal: 0 };
  const itens: SugestaoItem[] = [];
  for (const { produto: p, variante: v, quantity } of grupos.values()) {
    if (v.stock !== null && (!Number.isFinite(v.stock) || v.stock < quantity)) {
      pendencias.push(p.nome + " (" + v.label + "): estoque insuficiente para " + quantity + " unidades.");
      continue;
    }
    const tipo = String(p.tipo_produto ?? "").toLowerCase();
    const marmita = !["sopa","complemento","bebida","combo"].includes(tipo) && isMarmita(p.nome, p.categorias?.nome ?? p.categoria);
    itens.push({ productId: p.id, nome: p.nome, tamanho: v.label, weight: v.weight, quantity,
      unitPrice: marmita ? precoMarmitaPorFaixa(v.weight, total, v.price, tabela) : v.price, estoque: v.stock });
  }
  if (!itens.length && !pendencias.length) pendencias.push("Nenhum produto identificado. Informe sabores, tamanhos e quantidades.");
  return { itens, pendencias, subtotal: Math.round(itens.reduce((n, i) => n + i.quantity*i.unitPrice, 0)*100)/100 };
}

/**
 * Montagem das marmitas personalizadas como o cliente enviou no checkout.
 * Usa o registro do pedido (snapshot) e não a configuração atual do cardápio:
 * alterações posteriores de ingredientes ou gramaturas não mudam a comanda.
 */
export type IngredientePersonalizadoPedido = {
  nome: string;
  gramatura: number | null;
  modoPreparo: string | null;
};

export type MontagemPersonalizadaPedido = {
  tamanho: string;
  pesoTotal: number;
  previsao: string | null;
  ingredientes: IngredientePersonalizadoPedido[];
};

/** Mesmo formato de observação utilizado pelo checkout, preservado no pedido. */
export function formatarMontagemPersonalizadaPedido(custom: {
  tamanhoSigla: string;
  pesoTotal: number;
  itens: { nome: string; gramatura: number; modoPreparo?: string }[];
}): string {
  return [
    `PERSONALIZADA ${custom.tamanhoSigla} (${custom.pesoTotal}g)`,
    custom.itens.map(i => `${i.gramatura > 0 ? `${i.gramatura}g ` : ""}${i.nome}${i.modoPreparo ? ` (${i.modoPreparo})` : ""}`).join(" + "),
  ].join(" | ");
}

export function extrairMontagemPersonalizadaPedido(item: {
  nome_item?: string | null;
  observacao?: string | null;
  produtos?: { nome?: string | null } | null;
}): MontagemPersonalizadaPedido | null {
  const partes = String(item.observacao ?? "")
    .split("|")
    .map((parte) => parte.trim())
    .filter(Boolean);

  const indice = partes.findIndex((parte) =>
    /^PERSONALIZADA\s+[^()|]+?\s*\(\s*\d+\s*g\s*\)/i.test(parte),
  );
  if (indice < 0) return null;

  const cabecalho = partes[indice].match(
    /^PERSONALIZADA\s+([^()|]+?)\s*\(\s*(\d+)\s*g\s*\)/i,
  );
  if (!cabecalho) return null;

  const previsao = partes
    .find((parte) => /^Personalizada prevista para\s*:/i.test(parte))
    ?.replace(/^Personalizada prevista para\s*:\s*/i, "") || null;

  // O checkout grava os ingredientes depois do cabeçalho e da previsão,
  // separados por " + ". Só interpreta essa parte, não as demais observações.
  const composicao = partes.slice(indice + 1).find((parte) =>
    !/^Personalizada prevista para\s*:/i.test(parte) &&
    /(?:^|\s)\d+(?:[.,]\d+)?\s*g\s+\S/i.test(parte),
  );
  if (!composicao) return null;

  const ingredientes = composicao
    .split(/\s+\+\s+/)
    .map((texto): IngredientePersonalizadoPedido | null => {
      const parte = texto.trim();
      if (!parte) return null;
      const comGramas = parte.match(/^(\d+(?:[.,]\d+)?)\s*g\s+(.+)$/i);
      const gramatura = comGramas ? Number(comGramas[1].replace(",", ".")) : null;
      const nomeComPreparo = (comGramas ? comGramas[2] : parte).trim();
      const modo = nomeComPreparo.match(/^(.*?)\s+\(([^()]+)\)$/);
      const nome = (modo ? modo[1] : nomeComPreparo).trim();
      if (!nome) return null;
      return {
        nome,
        gramatura: gramatura !== null && Number.isFinite(gramatura) ? gramatura : null,
        modoPreparo: modo?.[2].trim() || null,
      };
    })
    .filter((ing): ing is IngredientePersonalizadoPedido => ing !== null);

  if (!ingredientes.length) return null;
  return {
    tamanho: cabecalho[1].trim().toUpperCase(),
    pesoTotal: Number(cabecalho[2]),
    previsao,
    ingredientes,
  };
}

type ItemCozinha = Parameters<typeof extrairMontagemPersonalizadaPedido>[0] & {
  quantidade?: number | null;
};

export function ehPersonalizadaPedido(item: ItemCozinha): boolean {
  return /personalizad/i.test(item.nome_item ?? item.produtos?.nome ?? "") ||
    /(?:^|\|)\s*PERSONALIZADA\s+[^()|]+?\s*\(\s*\d+\s*g\s*\)/i.test(item.observacao ?? "");
}

/** Comanda por combinação (gramas por unidade), sem preços nem produtos comuns. */
export function mensagemPersonalizadasCozinha(order: {
  id?: string;
  nome_cliente?: string | null;
  itens?: ItemCozinha[] | null;
}): string {
  const personalizadas = (order.itens ?? []).filter(ehPersonalizadaPedido);
  if (!personalizadas.length) return "";
  const total = personalizadas.reduce((sum, i) => sum + (Number(i.quantidade) || 0), 0);
  const cabecalho = [
    "*PERSONALIZADAS — COZINHA*",
    order.id ? `Pedido #${order.id.slice(0, 8).toUpperCase()}` : "",
    order.nome_cliente ? `Cliente: ${order.nome_cliente}` : "",
    `Total: ${total} un.`,
  ].filter(Boolean).join("\n");
  const linhas = personalizadas.map((item, index) => {
    const montagem = extrairMontagemPersonalizadaPedido(item);
    const qtd = Number(item.quantidade) || 0;
    if (!montagem) return `*${index + 1}. ${qtd}x ${item.nome_item || item.produtos?.nome || "Personalizada"}*\n⚠️ Montagem não registrada — conferir antes de preparar.`;
    return [
      `*${index + 1}. ${qtd}x Personalizada ${montagem.tamanho} (${montagem.pesoTotal}g por un.)*`,
      montagem.previsao ? `Previsão: ${montagem.previsao}` : "",
      "Ingredientes por unidade:",
      ...montagem.ingredientes.filter(i => !/^Excedente proteína \d+g/i.test(i.nome)).map(i =>
        `• ${i.gramatura === null ? "" : `${i.gramatura.toLocaleString("pt-BR")}g de `}${i.nome}${i.modoPreparo ? ` (${i.modoPreparo})` : ""}${i.gramatura === null ? " — sem gramatura" : ""}`),
    ].filter(Boolean).join("\n");
  });
  return [cabecalho, ...linhas].join("\n\n");
}

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
    /^PERSONALIZADA\s+(GG|P|M|G)\s*\(\s*\d+\s*g\s*\)/i.test(parte),
  );
  if (indice < 0) return null;

  const cabecalho = partes[indice].match(
    /^PERSONALIZADA\s+(GG|P|M|G)\s*\(\s*(\d+)\s*g\s*\)/i,
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
    tamanho: cabecalho[1].toUpperCase(),
    pesoTotal: Number(cabecalho[2]),
    previsao,
    ingredientes,
  };
}

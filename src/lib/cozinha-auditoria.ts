/** Confere exclusivamente preparações de rendimento TEÓRICO totalmente mensuráveis em gramas.
 * Preparações de rendimento REAL (pesagem), com líquidos, ovos, QB ou componentes
 * são intencionalmente excluídas: não inventar perdas de evaporação/absorção.
 * Entradas de preparação são matérias-primas CRUAS: aplica a perda ao rendimento
 * teórico final, mas não ao peso de compra de um insumo já cru.
 */
export type AlertaRendimentoCozinha = {
  preparacaoId: string;
  preparacao: string;
  cadastrado: number;
  teorico: number;
  diferenca: number;
  tipo: "inconsistencia_teorica" | "rendimento_a_conferir";
};

type IngredienteRendimento = {
  id: string;
  unidade_medida?: string | null;
  nome?: string | null;
  tipo_rendimento?: string | null;
  quebra_percentual?: number | null;
  fator_rendimento?: number | null;
};
type ItemPreparacao = {
  ingrediente_id?: string | null;
  preparacao_componente_id?: string | null;
  quantidade?: number | null;
};
type PreparacaoRendimento = {
  id: string;
  nome: string;
  observacao?: string | null;
  rendimento_final_g?: number | null;
};

export function auditarRendimentosTeoricos(
  preparacoes: PreparacaoRendimento[],
  itens: ItemPreparacao[],
  ingredientes: IngredienteRendimento[],
): AlertaRendimentoCozinha[] {
  const porId = new Map(ingredientes.map((i) => [i.id, i]));
  const porPreparacao = new Map<string, ItemPreparacao[]>();
  // O cadastro do item só precisa destes campos; o agrupamento é realizado
  // pelo vínculo original preparacao_id sem renomear os cadastros.
  for (const item of itens as Array<ItemPreparacao & { preparacao_id?: string }>) {
    if (!item.preparacao_id) continue;
    const anteriores = porPreparacao.get(item.preparacao_id) || [];
    anteriores.push(item);
    porPreparacao.set(item.preparacao_id, anteriores);
  }
  const alertas: AlertaRendimentoCozinha[] = [];
  for (const prep of preparacoes) {
    const nota = String(prep.observacao || "");
    const teoricoDeclarado = /rendimento\s+te[oó]ric/i.test(nota);
    const medido = /rendimento\s+operacional|rendimento\s+real\s+(?:medid[oa]|pesad[oa]|confirmad[oa])|\b(?:medid[oa]|pesad[oa]|confirmad[oa]|observad[oa]|lote\s+real)\b/i.test(nota);
    if (!teoricoDeclarado && medido) continue;
    const linhas = porPreparacao.get(prep.id) || [];
    const cadastrado = Number(prep.rendimento_final_g);
    if (!(cadastrado > 0) || !linhas.length) continue;
    let total = 0;
    let valido = true;
    // Só somar água em litros quando a ficha assumir explicitamente incorporação integral.
    const aguaIntegral = /AUDITORIA_AGUA_INTEGRAL/.test(String(prep.observacao || ""));
    for (const linha of linhas) {
      const ingrediente = porId.get(linha.ingrediente_id || "");
      const bruto = Number(linha.quantidade);
      if (!ingrediente || linha.preparacao_componente_id || !(bruto > 0)) {
        valido = false;
        break;
      }
      if (ingrediente.unidade_medida === "L" &&
          aguaIntegral && /^agua$/i.test(String(ingrediente.nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) {
        total += bruto * 1000;
        continue;
      }
      if (ingrediente.unidade_medida !== "g") {
        // Água descartada, ovos e unidades exigem regra/medição explícita.
        valido = false;
        break;
      }
      if (ingrediente.tipo_rendimento === "perda") {
        const perda = Number(ingrediente.quebra_percentual);
        if (!Number.isFinite(perda) || perda < 0 || perda >= 100) { valido = false; break; }
        total += bruto * (1 - perda / 100);
      } else if (ingrediente.tipo_rendimento === "ganho") {
        const fator = Number(ingrediente.fator_rendimento);
        if (!(fator > 0)) { valido = false; break; }
        total += bruto * fator;
      } else total += bruto;
    }
    if (!valido) continue;
    const diferenca = cadastrado - total;
    // Preparações sem teoria declarada podem evaporar durante o preparo:
    // destacar somente desvios grandes (>15%) para conferir, nunca recalcular automaticamente.
    const tolerancia = teoricoDeclarado ? Math.max(1, total * 0.005) : Math.max(10, total * 0.15);
    if (Math.abs(diferenca) > tolerancia) {
      alertas.push({
        preparacaoId: prep.id, preparacao: prep.nome, cadastrado,
        teorico: total, diferenca,
        tipo: teoricoDeclarado ? "inconsistencia_teorica" : "rendimento_a_conferir",
      });
    }
  }
  return alertas.sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca));
}

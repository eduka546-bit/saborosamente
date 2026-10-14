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
};

type IngredienteRendimento = {
  id: string;
  unidade_medida?: string | null;
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
    if (!/rendimento\s+te[oó]ric/i.test(String(prep.observacao || ""))) continue;
    const linhas = porPreparacao.get(prep.id) || [];
    const cadastrado = Number(prep.rendimento_final_g);
    if (!(cadastrado > 0) || !linhas.length) continue;
    let total = 0;
    let valido = true;
    for (const linha of linhas) {
      const ingrediente = porId.get(linha.ingrediente_id || "");
      const bruto = Number(linha.quantidade);
      if (!ingrediente || ingrediente.unidade_medida !== "g" ||
          linha.preparacao_componente_id || !(bruto > 0)) {
        // Não deduzir perda/ganho de preparos com água, ovo, QB ou subpreparações.
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
    if (Math.abs(diferenca) > Math.max(1, total * 0.005)) {
      alertas.push({
        preparacaoId: prep.id, preparacao: prep.nome, cadastrado,
        teorico: total, diferenca,
      });
    }
  }
  return alertas.sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca));
}

export const MARGEM_SEGURANCA_RECEITA = 10;

export function custoUnitarioIngrediente(ingrediente: any): number {
  if (!ingrediente) return 0;
  return ingrediente.unidade_medida === "un" || ingrediente.unidade_medida === "L"
    ? Number(ingrediente.custo_por_unidade || 0)
    : Number(ingrediente.custo_por_kg || 0) / 1000;
}

export function custoComMargemReceita(custoBase: number) {
  const base = Math.max(0, Number(custoBase || 0));
  const margem = base * MARGEM_SEGURANCA_RECEITA / 100;
  return { base, margem, total: base + margem };
}

export function calcularCustoPreparacao(
  id: string,
  preparacoes: Map<string, any>,
  itens: Map<string, any[]>,
  ingredientes: Map<string, any>,
  visitados = new Set<string>(),
): { custoLote: number; porGrama: number; pendencias: string[] } {
  const prep = preparacoes.get(id);
  const pendencias: string[] = [];
  if (!prep || visitados.has(id)) return { custoLote: 0, porGrama: 0, pendencias: [prep ? `${prep.nome}: vínculo circular` : "Preparação ausente"] };
  const proximos = new Set(visitados).add(id);
  const linhas = itens.get(id) || [];
  if (!linhas.length) pendencias.push(`${prep.nome}: ingredientes não cadastrados`);
  if (!(Number(prep.rendimento_final_g) > 0)) pendencias.push(`${prep.nome}: rendimento pronto não cadastrado`);
  let custoLote = 0;
  for (const linha of linhas) {
    const quantidade = Number(linha.quantidade || 0);
    if (!(quantidade > 0)) continue;
    if (linha.preparacao_componente_id) {
      const filho = calcularCustoPreparacao(linha.preparacao_componente_id, preparacoes, itens, ingredientes, proximos);
      custoLote += quantidade * filho.porGrama;
      pendencias.push(...filho.pendencias);
      continue;
    }
    const ingrediente = ingredientes.get(linha.ingrediente_id);
    if (!ingrediente) {
      pendencias.push(`${prep.nome}: ingrediente ausente`);
      continue;
    }
    const unitario = custoUnitarioIngrediente(ingrediente);
    if (!(unitario > 0) && !/^água$/i.test(String(ingrediente.nome).trim())) pendencias.push(`${ingrediente.nome}: preço não cadastrado`);
    // Quantidade da base = insumo de entrada. Perda/ganho já está no
    // rendimento pronto; não converter novamente nem aplicar margem aqui.
    custoLote += quantidade * unitario;
  }
  return { custoLote, porGrama: Number(prep.rendimento_final_g) > 0 ? custoLote / Number(prep.rendimento_final_g) : 0, pendencias: [...new Set(pendencias)] };
}

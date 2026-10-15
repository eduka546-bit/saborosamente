export type UnidadeIngrediente = "g" | "L" | "un";
export type MarcacaoIngrediente = {
  data_producao: string;
  ingrediente_id: string;
  unidade: UnidadeIngrediente;
  quantidade_referencia: number | string;
};

/** Uma marcação refere-se apenas ao ingrediente de uma DATA da produção. */
export function chaveChecklistIngrediente(
  data: string,
  ingredienteId: string,
  unidade: UnidadeIngrediente,
): string {
  return `${data}:${ingredienteId}:${unidade}`;
}

/** Se a necessidade calculada mudou, o ingrediente deve ser conferido e marcado novamente.
 * Não tratamos a marcação como baixa de estoque.
 */
export function ingredienteEstaSeparado(
  marcacao: Pick<MarcacaoIngrediente, "quantidade_referencia"> | undefined,
  quantidadeCalculada: number,
): boolean {
  if (!marcacao) return false;
  const registrado = Number(marcacao.quantidade_referencia);
  const atual = Number(quantidadeCalculada);
  return Number.isFinite(registrado) && Number.isFinite(atual)
    && Math.abs(registrado - atual) <= 0.005;
}

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

/** Assinatura estável da quantidade/montagem relevante para uma etapa.
 * Se o planejamento mudar, uma marcação antiga deixa de parecer concluída.
 */
export function assinaturaChecklist(partes: readonly (string | number)[]): string {
  const texto = partes.map((v) => String(v)).join("|");
  let a = 2166136261;
  let b = 5381;
  for (let i = 0; i < texto.length; i++) {
    const codigo = texto.charCodeAt(i);
    a = Math.imul(a ^ codigo, 16777619);
    b = Math.imul(b, 33) ^ codigo;
  }
  return `${(a >>> 0).toString(16).padStart(8, "0")}${(b >>> 0).toString(16).padStart(8, "0")}`;
}

export function etapaEstaMarcada(
  valorSalvo: { assinatura_referencia: string } | undefined,
  assinaturaAtual: string,
): boolean {
  return Boolean(valorSalvo && valorSalvo.assinatura_referencia === assinaturaAtual);
}

export function quantidadeRestante(necessaria: number, disponivelPronto: number) {
  return Math.max(0, Number(necessaria || 0) - Number(disponivelPronto || 0));
}

export function fatorCapacidade(ajustes: Array<{ disponivel: number; necessario: number }>) {
  const validos = ajustes.filter((x) => Number(x.necessario) > 0);
  if (!validos.length) return 1;
  return Math.max(0, Math.min(...validos.map((x) => Number(x.disponivel || 0) / Number(x.necessario))));
}

export function sugerirMarmitas(planejadas: number, fator: number) {
  return Math.max(0, Math.floor(Number(planejadas || 0) * Math.max(0, Number(fator || 0))));
}

export function quantidadeBrutaPorRendimento(pronta: number, ingrediente: { tipo_rendimento?: string | null; quebra_percentual?: number | null; fator_rendimento?: number | null }) {
  const quantidade = Math.max(0, Number(pronta || 0));
  if (ingrediente?.tipo_rendimento === "perda") {
    const perda = Math.min(99.999, Math.max(0, Number(ingrediente.quebra_percentual || 0))) / 100;
    return quantidade / (1 - perda);
  }
  if (ingrediente?.tipo_rendimento === "ganho") {
    return quantidade / Math.max(0.000001, Number(ingrediente.fator_rendimento || 1));
  }
  return quantidade;
}

export function quantidadeNoLote(quantidadeBase: number, preparoNecessario: number, rendimentoBase: number) {
  if (!(Number(rendimentoBase) > 0)) return 0;
  return Math.max(0, Number(quantidadeBase || 0) * Number(preparoNecessario || 0) / Number(rendimentoBase));
}

/** Planejamento por período: datas ISO locais, aritmética UTC ao meio-dia
 * para evitar deslocamentos por fuso/horário de verão no calendário.
 */
export const MAX_DIAS_PLANEJAMENTO = 90;
export type PeriodoProducao = { inicio: string; fim: string };

export function dataISOValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T12:00:00Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

export function somarDiasPeriodo(iso: string, dias: number): string {
  if (!dataISOValida(iso)) return iso;
  const data = new Date(`${iso}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

export function quantidadeDiasPeriodo(inicio: string, fim: string): number {
  if (!dataISOValida(inicio) || !dataISOValida(fim)) return 0;
  const comeco = new Date(`${inicio}T12:00:00Z`).getTime();
  const termino = new Date(`${fim}T12:00:00Z`).getTime();
  const dias = Math.round((termino - comeco) / 86400000) + 1;
  return dias >= 1 && dias <= MAX_DIAS_PLANEJAMENTO ? dias : 0;
}

export function listarDatasPeriodo(inicio: string, fim: string): string[] {
  const total = quantidadeDiasPeriodo(inicio, fim);
  return Array.from({ length: total }, (_, i) => somarDiasPeriodo(inicio, i));
}

/** Ajusta um limite de data sem criar intervalo invertido ou maior que 90 dias. */
export function alterarLimitePeriodo(
  anterior: PeriodoProducao,
  limite: "inicio" | "fim",
  valor: string,
): PeriodoProducao {
  if (!dataISOValida(valor)) return anterior;
  if (limite === "inicio") {
    const fim = anterior.fim < valor
      ? valor
      : anterior.fim > somarDiasPeriodo(valor, MAX_DIAS_PLANEJAMENTO - 1)
        ? somarDiasPeriodo(valor, MAX_DIAS_PLANEJAMENTO - 1)
        : anterior.fim;
    return { inicio: valor, fim };
  }
  const inicio = anterior.inicio > valor
    ? valor
    : anterior.inicio < somarDiasPeriodo(valor, -(MAX_DIAS_PLANEJAMENTO - 1))
      ? somarDiasPeriodo(valor, -(MAX_DIAS_PLANEJAMENTO - 1))
      : anterior.inicio;
  return { inicio, fim: valor };
}

export function periodoComDuracao(inicio: string, dias: number): PeriodoProducao {
  const quantidade = Math.min(MAX_DIAS_PLANEJAMENTO, Math.max(1, Math.trunc(dias) || 1));
  return { inicio, fim: somarDiasPeriodo(inicio, quantidade - 1) };
}

export function deslocarPeriodo(periodo: PeriodoProducao, direcao: -1 | 1): PeriodoProducao {
  const dias = quantidadeDiasPeriodo(periodo.inicio, periodo.fim);
  if (!dias) return periodo;
  return {
    inicio: somarDiasPeriodo(periodo.inicio, dias * direcao),
    fim: somarDiasPeriodo(periodo.fim, dias * direcao),
  };
}

export function selecionarDiasPeriodo(
  datas: string[],
  excluidas: ReadonlySet<string>,
): string[] {
  return datas.filter((dia) => !excluidas.has(dia));
}

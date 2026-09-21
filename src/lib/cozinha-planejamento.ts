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

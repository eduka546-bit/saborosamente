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

const termosGenericos = new Set(["molho","branco","preto","arroz","feijao","carne","frango","pronto","cozido","cozida","grelhado","grelhada"]);
const normalizarNome = (valor: unknown) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function nomesCozinhaCorrespondem(a: unknown, b: unknown) {
  const x=normalizarNome(a), y=normalizarNome(b);
  return !!x&&!!y&&(x.includes(y)||y.includes(x)||x.split(" ").some((termo)=>termo.length>=4&&!termosGenericos.has(termo)&&y.split(" ").includes(termo)));
}

export function ingredientesCozinhaCorrespondem(a: unknown, b: unknown) {
  const x=normalizarNome(a), y=normalizarNome(b);
  if (!x || !y) return false;
  const classesExclusivas=["molho","extrato","pure","farinha","queijo"];
  if (classesExclusivas.some((termo)=>(x.split(" ").includes(termo))!==(y.split(" ").includes(termo)))) return false;
  return x.includes(y)||y.includes(x);
}

export function alocarQuantidadePorPesos<T extends { peso: number }>(total: number, destinos: T[]) {
  const quantidade=Math.max(0,Number(total||0));
  const validos=destinos.filter((destino)=>Number(destino.peso)>0);
  const somaPesos=validos.reduce((s,destino)=>s+Number(destino.peso),0);
  if (!(somaPesos>0)) return [] as Array<T & { quantidade: number }>;
  return validos.map((destino)=>({...destino,quantidade:quantidade*Number(destino.peso)/somaPesos}));
}

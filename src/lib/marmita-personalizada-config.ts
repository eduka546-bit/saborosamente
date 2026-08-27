// Configuração da Marmita Personalizada.
// - Grupos/ingredientes/modos vêm das tabelas marmita_grupos / marmita_ingredientes.
// - Tamanhos (faixas de peso), preços e regras ficam em
//   site_settings.parametros_loja.marmita_personalizada (editável no admin),
//   com fallback nos defaults abaixo (que espelham o material enviado).

export interface MarmitaIngrediente {
  id: string;
  grupo_id: string;
  nome: string;
  modos_preparo: string[];
  observacao?: string | null;
  ordem: number;
  ativo: boolean;
}

export interface MarmitaGrupo {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  ingredientes: MarmitaIngrediente[];
}

// Uma faixa de tamanho: até `pesoMax` gramas custa `preco`.
export interface MarmitaTamanho {
  sigla: string; // "P" | "M" | "G" | "GG" (livre)
  label: string; // ex.: "Até 250g"
  pesoMin: number; // g (inclusive)
  pesoMax: number; // g (inclusive)
  preco: number;
}

export interface MarmitaPersonalizadaConfig {
  ativo: boolean;
  titulo: string;
  descricao: string;
  minUnidades: number; // mínimo por combinação
  pesoMaximo: number; // g
  avisoPrazo: string; // texto do aviso de entrega
  tamanhos: MarmitaTamanho[];
  // Proteína pode ocupar no máximo X% do teto do tamanho (ex.: 60).
  percentualMaxProteina: number;
  // Adicional por grama de proteína que exceder o limite (ex.: 0.07).
  adicionalProteinaPorGrama: number;
}

export const DEFAULT_MARMITA_CONFIG: MarmitaPersonalizadaConfig = {
  ativo: true,
  titulo: "Monte sua Marmita Personalizada",
  descricao: "Escolha os ingredientes, o modo de preparo e a gramatura da sua marmita.",
  minUnidades: 3,
  pesoMaximo: 600,
  avisoPrazo:
    "As marmitas personalizadas precisam de 1 semana de preparo. Você escolhe a data normalmente, mas esses itens serão entregues na semana seguinte.",
  tamanhos: [
    { sigla: "P", label: "Até 250g", pesoMin: 0, pesoMax: 250, preco: 18.9 },
    { sigla: "M", label: "250 a 350g", pesoMin: 251, pesoMax: 350, preco: 22.9 },
    { sigla: "G", label: "350 a 450g", pesoMin: 351, pesoMax: 450, preco: 26.9 },
    { sigla: "GG", label: "450 a 600g", pesoMin: 451, pesoMax: 600, preco: 29.9 },
  ],
  percentualMaxProteina: 60,
  adicionalProteinaPorGrama: 0.07,
};

// Normaliza a config vinda do banco caindo nos defaults por campo faltante.
export function normalizarMarmitaConfig(raw: any): MarmitaPersonalizadaConfig {
  const cfg = raw ?? {};
  const d = DEFAULT_MARMITA_CONFIG;

  const tamanhos: MarmitaTamanho[] =
    Array.isArray(cfg.tamanhos) && cfg.tamanhos.length > 0
      ? cfg.tamanhos
          .map((t: any) => ({
            sigla: String(t?.sigla ?? "").trim() || "?",
            label: String(t?.label ?? "").trim(),
            pesoMin: Number.isFinite(Number(t?.pesoMin)) ? Number(t.pesoMin) : 0,
            pesoMax: Number.isFinite(Number(t?.pesoMax)) ? Number(t.pesoMax) : 0,
            preco: Number.isFinite(Number(t?.preco)) ? Number(t.preco) : 0,
          }))
          .filter((t: MarmitaTamanho) => t.pesoMax > 0 && t.preco > 0)
          .sort((a: MarmitaTamanho, b: MarmitaTamanho) => a.pesoMax - b.pesoMax)
      : d.tamanhos;

  const num = (v: any, fb: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fb;
  };

  // Percentual (aceita 0 explícito → desliga a regra; usa default só se ausente/ inválido)
  const pctRaw = Number(cfg.percentualMaxProteina);
  const percentualMaxProteina =
    Number.isFinite(pctRaw) && pctRaw >= 0 && pctRaw <= 100
      ? pctRaw
      : d.percentualMaxProteina;
  const addRaw = Number(cfg.adicionalProteinaPorGrama);
  const adicionalProteinaPorGrama =
    Number.isFinite(addRaw) && addRaw >= 0 ? addRaw : d.adicionalProteinaPorGrama;

  return {
    ativo: cfg.ativo !== undefined ? Boolean(cfg.ativo) : d.ativo,
    titulo: String(cfg.titulo ?? "").trim() || d.titulo,
    descricao: String(cfg.descricao ?? "").trim() || d.descricao,
    minUnidades: Math.max(1, Math.floor(num(cfg.minUnidades, d.minUnidades))),
    pesoMaximo: num(cfg.pesoMaximo, d.pesoMaximo),
    avisoPrazo: String(cfg.avisoPrazo ?? "").trim() || d.avisoPrazo,
    tamanhos,
    percentualMaxProteina,
    adicionalProteinaPorGrama,
  };
}

// Limite de proteína (g) para um tamanho: percentualMaxProteina% do teto (pesoMax).
export function limiteProteina(
  tamanho: MarmitaTamanho,
  cfg: MarmitaPersonalizadaConfig,
): number {
  return Math.round((tamanho.pesoMax * cfg.percentualMaxProteina) / 100);
}

// Retorna o tamanho correspondente a um peso total (g), ou null se acima do máximo.
export function tamanhoPorPeso(
  peso: number,
  cfg: MarmitaPersonalizadaConfig,
): MarmitaTamanho | null {
  if (peso <= 0) return null;
  // Ordena por pesoMax e pega a primeira faixa que comporta o peso.
  const ordenados = [...cfg.tamanhos].sort((a, b) => a.pesoMax - b.pesoMax);
  for (const t of ordenados) {
    if (peso <= t.pesoMax) return t;
  }
  return null; // acima do maior tamanho
}

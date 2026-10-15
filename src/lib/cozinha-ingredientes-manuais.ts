export type UnidadeInsumo = "g" | "un" | "L";
export type IngredienteManual = {
  id: string;
  data_producao: string;
  tipo: "ajuste" | "adicional";
  ingrediente_id: string | null;
  nome: string;
  unidade: UnidadeInsumo;
  quantidade: number;
  referencia_original: number | null;
  marcado_em: string | null;
};
export type NecessidadeCozinha = {
  id: string;
  quantidade: number;
  unidade: UnidadeInsumo;
  item: { nome: string; [key: string]: any };
  pratos: string[];
  qb: boolean;
  manual?: boolean;
  manualId?: string;
  ajusteId?: string;
  adicional?: boolean;
  revisaoNecessaria?: boolean;
  quantidadeReceita?: number;
  manualMarcado?: boolean;
};
export const nomeNormalizado = (nome: string): string =>
  String(nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().toLowerCase().replace(/\s+/g, " ");

export function aplicarIngredientesManuais(
  calculados: NecessidadeCozinha[],
  manuais: IngredienteManual[],
  catalogo: { id: string; nome: string; [key: string]: any }[] = [],
): NecessidadeCozinha[] {
  const catalogoId = new Map(catalogo.map((i) => [i.id, i]));
  const linhas = new Map<string, NecessidadeCozinha>();
  for (const item of calculados) {
    linhas.set(`${item.id}:${item.unidade}`, { ...item, pratos: [...item.pratos] });
  }
  // Quantidade ajustada substitui a calculada, sem alterar a ficha técnica.
  for (const ajuste of manuais.filter((m) => m.tipo === "ajuste")) {
    const key = `${ajuste.ingrediente_id}:${ajuste.unidade}`;
    const original = linhas.get(key);
    if (!original) continue;
    const quantidadeReceita = Number(original.quantidade);
    linhas.set(key, {
      ...original,
      quantidade: Number(ajuste.quantidade),
      qb: false,
      manual: true,
      ajusteId: ajuste.id,
      quantidadeReceita,
      revisaoNecessaria: ajuste.referencia_original === null ||
        Math.abs(Number(ajuste.referencia_original) - quantidadeReceita) > 0.005,
    });
  }
  // Adições podem ser ingredientes do catálogo (descontar estoque normalmente)
  // ou itens avulsos sem cadastro (não assumir saldo nem custo).
  // Chave estável por nome e unidade para consolidar avulsos de vários dias.
  for (const extra of manuais.filter((m) => m.tipo === "adicional")) {
    const produto = extra.ingrediente_id ? catalogoId.get(extra.ingrediente_id) : undefined;
    const id = produto?.id || `avulso:${nomeNormalizado(extra.nome)}`;
    const key = `${id}:${extra.unidade}`;
    const existente = linhas.get(key);
    const acrescimo = Number(extra.quantidade);
    if (existente) {
      linhas.set(key, {
        ...existente,
        quantidade: existente.quantidade + acrescimo,
        qb: false,
        manual: true,
        manualId: extra.id,
        adicional: true,
        pratos: Array.from(new Set([...existente.pratos, "Adicional manual"])),
      });
    } else {
      linhas.set(key, {
        id,
        quantidade: acrescimo,
        unidade: extra.unidade,
        item: produto || { nome: extra.nome },
        pratos: ["Adicional manual"],
        qb: false,
        manual: true,
        manualId: extra.id,
        adicional: true,
        manualMarcado: Boolean(extra.marcado_em),
      });
    }
  }
  return [...linhas.values()].sort((a,b) => a.item.nome.localeCompare(b.item.nome, "pt-BR"));
}

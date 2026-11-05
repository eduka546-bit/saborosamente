/**
 * Regras de estoque dos combos prontos.
 * O estoque que ja esta no carrinho local tambem e reservado para impedir
 * que a mesma unidade seja adicionada duas vezes ao montar um novo combo.
 */
export type SaborComboEstoque = {
  id: string;
  nome?: string;
  controle_estoque?: boolean;
  estoque_200g?: number | null;
  estoque_300g?: number | null;
  estoque_400g?: number | null;
};

export type LinhaCarrinhoEstoque = {
  productId: string;
  weight?: string;
  quantity: number;
  custom?: unknown;
  comboPronto?: {
    sabores: Array<{ productId: string; quantity: number }>;
  };
};

export function estoqueLivreCombo(
  produto: SaborComboEstoque,
  peso: string,
  linhas: LinhaCarrinhoEstoque[] = [],
): number {
  if (!produto.controle_estoque) return Number.POSITIVE_INFINITY;
  const campo = peso === "400g" ? "estoque_400g" : peso === "300g" ? "estoque_300g" : "estoque_200g";
  const estoque = Math.max(0, Number(produto[campo] ?? 0));
  const reservado = linhas.reduce((total, linha) => {
    if (linha.weight !== peso || linha.custom) return total;
    if (linha.comboPronto) {
      const dentro = linha.comboPronto.sabores
        .filter((sabor) => sabor.productId === produto.id)
        .reduce((valor, sabor) => valor + Number(sabor.quantity || 0), 0);
      return total + dentro * Number(linha.quantity || 0);
    }
    return total + (linha.productId === produto.id ? Number(linha.quantity || 0) : 0);
  }, 0);
  return Math.max(0, estoque - reservado);
}

/** Preserva a composicao original ate o limite disponivel de cada sabor. */
export function composicaoBaseMaisLeves(
  produtos: SaborComboEstoque[],
  totalUnidades: number,
  peso: string,
  linhas: LinhaCarrinhoEstoque[] = [],
): Record<string, number> {
  const desejadoPorSabor = totalUnidades === 20 ? 2 : 1;
  return Object.fromEntries(produtos.map((produto) => [
    produto.id,
    Math.min(desejadoPorSabor, estoqueLivreCombo(produto, peso, linhas)),
  ]));
}

export function somarComposicao(composicao: Record<string, number>): number {
  return Object.values(composicao).reduce((total, qtd) => total + qtd, 0);
}

export function combinarTrocasMaisLeves(
  produtos: SaborComboEstoque[],
  base: Record<string, number>,
  extras: Record<string, number>,
  peso: string,
  linhas: LinhaCarrinhoEstoque[] = [],
): Record<string, number> {
  return Object.fromEntries(
    produtos.map((produto) => [
      produto.id,
      Math.max(
        0,
        Math.min(
          (base[produto.id] ?? 0) + Math.max(0, extras[produto.id] ?? 0),
          estoqueLivreCombo(produto, peso, linhas),
        ),
      ),
    ]),
  );
}

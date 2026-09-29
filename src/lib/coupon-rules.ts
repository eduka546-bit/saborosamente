export interface CouponCalculationInput {
  tipo?: string | null;
  valor?: number | null;
  subtotalCheio: number;
  subtotalEfetivo: number;
  subtotalComboPronto?: number;
  taxaEntrega?: number;
  substituiDescontoProgressivo?: boolean;
  excluirComboPronto?: boolean;
}

const roundMoney = (value: number) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function calcularRegraCupom(input: CouponCalculationInput) {
  const subtotalCheio = Math.max(0, Number(input.subtotalCheio || 0));
  const subtotalEfetivo = Math.max(0, Number(input.subtotalEfetivo || 0));
  const subtotalComboPronto = Math.max(0, Number(input.subtotalComboPronto || 0));
  const taxaEntrega = Math.max(0, Number(input.taxaEntrega || 0));
  const substitui = Boolean(input.substituiDescontoProgressivo);
  const excluirCombo = Boolean(input.excluirComboPronto);

  const descontoProgressivoOriginal = roundMoney(
    Math.max(0, subtotalCheio - subtotalEfetivo),
  );
  const descontoProgressivoAplicado = substitui ? 0 : descontoProgressivoOriginal;
  const subtotalBaseProdutos = roundMoney(substitui ? subtotalCheio : subtotalEfetivo);
  const subtotalElegivelCupom = roundMoney(
    excluirCombo
      ? Math.max(0, subtotalBaseProdutos - subtotalComboPronto)
      : subtotalBaseProdutos,
  );

  const tipo = String(input.tipo || "");
  const valor = Math.max(0, Number(input.valor || 0));

  let descontoCupom = 0;
  if (tipo === "Percentual") {
    descontoCupom = subtotalElegivelCupom * (valor / 100);
  } else if (tipo === "Entrega Grátis") {
    descontoCupom = taxaEntrega;
  } else if (tipo) {
    descontoCupom = Math.min(valor, subtotalElegivelCupom);
  }

  descontoCupom = roundMoney(
    Math.min(
      Math.max(0, descontoCupom),
      tipo === "Entrega Grátis" ? taxaEntrega : subtotalElegivelCupom,
    ),
  );

  return {
    descontoProgressivoOriginal,
    descontoProgressivoAplicado,
    subtotalBaseProdutos,
    subtotalElegivelCupom,
    descontoCupom,
    descontoCupomProdutos: tipo === "Entrega Grátis" ? 0 : descontoCupom,
  };
}

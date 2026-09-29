import { describe, expect, it } from "vitest";
import { calcularRegraCupom } from "./coupon-rules";

describe("regras de cupons", () => {
  it("NOVOSITE substitui o desconto progressivo por 20% sobre o valor cheio elegível", () => {
    const result = calcularRegraCupom({
      tipo: "Percentual",
      valor: 20,
      subtotalCheio: 418,
      subtotalEfetivo: 378,
      subtotalComboPronto: 0,
      taxaEntrega: 5,
      substituiDescontoProgressivo: true,
      excluirComboPronto: true,
    });

    expect(result.descontoProgressivoOriginal).toBe(40);
    expect(result.descontoProgressivoAplicado).toBe(0);
    expect(result.subtotalBaseProdutos).toBe(418);
    expect(result.descontoCupom).toBe(83.6);
  });

  it("NOVOSITE não aplica desconto em Combo Pronto", () => {
    const result = calcularRegraCupom({
      tipo: "Percentual",
      valor: 20,
      subtotalCheio: 499,
      subtotalEfetivo: 489,
      subtotalComboPronto: 290,
      substituiDescontoProgressivo: true,
      excluirComboPronto: true,
    });

    expect(result.subtotalBaseProdutos).toBe(499);
    expect(result.subtotalElegivelCupom).toBe(209);
    expect(result.descontoCupom).toBe(41.8);
  });

  it("cupom comum continua usando o subtotal já com a faixa progressiva", () => {
    const result = calcularRegraCupom({
      tipo: "Percentual",
      valor: 5,
      subtotalCheio: 418,
      subtotalEfetivo: 378,
      substituiDescontoProgressivo: false,
      excluirComboPronto: false,
    });

    expect(result.descontoProgressivoAplicado).toBe(40);
    expect(result.subtotalBaseProdutos).toBe(378);
    expect(result.descontoCupom).toBe(18.9);
  });
});

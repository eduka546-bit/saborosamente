import { describe, it, expect } from "vitest";
import {
  isNoDiscount,
  getComboDiscount,
  tierDescontoProgressivo,
  calcularDescontoProgressivo,
  calcularFrete,
  calcularTotaisCombo,
  type CartItemForCalc,
} from "./combo-rules";

// ─────────────────────────────────────────────────────────────────────────────
// isNoDiscount — sopas e complementos não recebem desconto
// ─────────────────────────────────────────────────────────────────────────────
describe("isNoDiscount", () => {
  it("marca sopas como sem desconto", () => {
    expect(isNoDiscount("Sopa")).toBe(true);
    expect(isNoDiscount("sopas")).toBe(true);
    expect(isNoDiscount("Sopa de legumes")).toBe(true);
  });

  it("marca complementos como sem desconto", () => {
    expect(isNoDiscount("Complemento")).toBe(true);
    expect(isNoDiscount("complementos")).toBe(true);
  });

  it("marca combos prontos como sem desconto (já têm desconto no preço)", () => {
    expect(isNoDiscount("Combo Pronto")).toBe(true);
    expect(isNoDiscount("Combos Prontos")).toBe(true);
  });

  it("não marca marmitas como sem desconto", () => {
    expect(isNoDiscount("Fitness")).toBe(false);
    expect(isNoDiscount("Tradicional")).toBe(false);
    expect(isNoDiscount("Marmita")).toBe(false);
  });

  it("é case-insensitive", () => {
    expect(isNoDiscount("SOPA")).toBe(true);
    expect(isNoDiscount("CoMpLeMeNtO")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getComboDiscount / tierDescontoProgressivo — faixas 5/10/20
// ─────────────────────────────────────────────────────────────────────────────
describe("faixas de desconto progressivo", () => {
  it("sem desconto abaixo de 5 unidades", () => {
    expect(tierDescontoProgressivo(0)).toBe(0);
    expect(tierDescontoProgressivo(4)).toBe(0);
    expect(getComboDiscount(4)).toBeNull();
  });

  it("3% a partir de 5 unidades", () => {
    expect(tierDescontoProgressivo(5)).toBe(0.03);
    expect(tierDescontoProgressivo(9)).toBe(0.03);
    expect(getComboDiscount(5)?.discount).toBe(0.03);
  });

  it("5% a partir de 10 unidades", () => {
    expect(tierDescontoProgressivo(10)).toBe(0.05);
    expect(tierDescontoProgressivo(19)).toBe(0.05);
    expect(getComboDiscount(10)?.discount).toBe(0.05);
  });

  it("7% a partir de 20 unidades", () => {
    expect(tierDescontoProgressivo(20)).toBe(0.07);
    expect(tierDescontoProgressivo(100)).toBe(0.07);
    expect(getComboDiscount(50)?.discount).toBe(0.07);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcularDescontoProgressivo — desconto só sobre marmitas
// ─────────────────────────────────────────────────────────────────────────────
describe("calcularDescontoProgressivo", () => {
  it("não aplica desconto abaixo de 5 unidades", () => {
    const itens: CartItemForCalc[] = [{ categoria: "Fitness", subtotal: 100, quantidade: 4 }];
    expect(calcularDescontoProgressivo(itens)).toBe(0);
  });

  it("aplica 3% sobre o subtotal das marmitas com 5 unidades", () => {
    const itens: CartItemForCalc[] = [{ categoria: "Fitness", subtotal: 100, quantidade: 5 }];
    expect(calcularDescontoProgressivo(itens)).toBeCloseTo(3, 5);
  });

  it("sopas contam na quantidade (destravam a faixa) mas NÃO recebem desconto", () => {
    // 3 marmitas (R$90) + 2 sopas (R$36) = 5 unidades → faixa 3%
    // desconto só sobre as marmitas: 90 * 0.03 = 2.70
    const itens: CartItemForCalc[] = [
      { categoria: "Tradicional", subtotal: 90, quantidade: 3 },
      { categoria: "Sopa", subtotal: 36, quantidade: 2 },
    ];
    expect(calcularDescontoProgressivo(itens)).toBeCloseTo(2.7, 5);
  });

  it("aplica 7% quando chega a 20 unidades", () => {
    const itens: CartItemForCalc[] = [{ categoria: "Fitness", subtotal: 400, quantidade: 20 }];
    expect(calcularDescontoProgressivo(itens)).toBeCloseTo(28, 5);
  });

  it("pedido só de sopas não recebe desconto mesmo com 10+ unidades", () => {
    const itens: CartItemForCalc[] = [{ categoria: "Sopa", subtotal: 180, quantidade: 10 }];
    expect(calcularDescontoProgressivo(itens)).toBe(0);
  });

  it("combo pronto conta na faixa mas não recebe desconto; só marmitas avulsas recebem", () => {
    // combo pronto (5un, R$200, já com desconto) + 2 marmitas avulsas (R$60)
    // total 7un → faixa 3%; desconto só sobre as marmitas: 60 * 0.03 = 1.80
    const itens: CartItemForCalc[] = [
      { categoria: "Combo Pronto", subtotal: 200, quantidade: 5 },
      { categoria: "Fitness", subtotal: 60, quantidade: 2 },
    ];
    expect(calcularDescontoProgressivo(itens)).toBeCloseTo(1.8, 5);
  });

  it("pedido só de combo pronto não recebe desconto progressivo adicional", () => {
    const itens: CartItemForCalc[] = [
      { categoria: "Combo Pronto", subtotal: 400, quantidade: 20 },
    ];
    expect(calcularDescontoProgressivo(itens)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcularFrete — frete grátis, promo São Bento, taxa base
// ─────────────────────────────────────────────────────────────────────────────
describe("calcularFrete", () => {
  it("frete zero quando subtotal é zero", () => {
    expect(calcularFrete({ subtotal: 0, totalUnidades: 0, taxaBase: 14.9 })).toBe(0);
  });

  it("usa a taxa base fora de São Bento do Sul", () => {
    expect(
      calcularFrete({
        subtotal: 100,
        totalUnidades: 3,
        taxaBase: 10,
        cidade: "Rio Negrinho",
      }),
    ).toBe(10);
  });

  it("frete promocional de R$ 5,00 em São Bento do Sul com 5+ unidades", () => {
    expect(
      calcularFrete({
        subtotal: 150,
        totalUnidades: 5,
        taxaBase: 14.9,
        cidade: "São Bento do Sul",
      }),
    ).toBe(5.0);
  });

  it("São Bento do Sul com menos de 5 unidades paga taxa base", () => {
    expect(
      calcularFrete({
        subtotal: 60,
        totalUnidades: 3,
        taxaBase: 12,
        cidade: "São Bento do Sul",
      }),
    ).toBe(12);
  });

  it("frete grátis quando subtotal atinge o limite configurado", () => {
    expect(
      calcularFrete({
        subtotal: 200,
        totalUnidades: 4,
        taxaBase: 14.9,
        cidade: "Rio Negrinho",
        freteGratisAPartirDe: 150,
      }),
    ).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcularTotaisCombo — total do "Monte Você Mesmo"
// ─────────────────────────────────────────────────────────────────────────────
describe("calcularTotaisCombo", () => {
  it("sem desconto abaixo de 5 marmitas", () => {
    const r = calcularTotaisCombo([{ categoria: "Fitness", subtotal: 80, quantidade: 4 }]);
    expect(r.discountPct).toBe(0);
    expect(r.discount).toBe(0);
    expect(r.total).toBeCloseTo(80, 5);
  });

  it("aplica 3% com 5 marmitas", () => {
    const r = calcularTotaisCombo([{ categoria: "Fitness", subtotal: 100, quantidade: 5 }]);
    expect(r.discountPct).toBe(0.03);
    expect(r.total).toBeCloseTo(97, 5);
  });

  it("usa a MAIOR faixa: 20 marmitas dão 7% (não 3%)", () => {
    // Regressão: a versão antiga com COMBO_RULES.find() retornava 3% para 20 itens.
    const r = calcularTotaisCombo([{ categoria: "Fitness", subtotal: 400, quantidade: 20 }]);
    expect(r.discountPct).toBe(0.07);
    expect(r.discount).toBeCloseTo(28, 5);
    expect(r.total).toBeCloseTo(372, 5);
  });

  it("sopas contam na quantidade mas não recebem desconto", () => {
    const r = calcularTotaisCombo([
      { categoria: "Tradicional", subtotal: 90, quantidade: 3 },
      { categoria: "Sopa", subtotal: 36, quantidade: 2 },
    ]);
    expect(r.totalQty).toBe(5);
    expect(r.discountPct).toBe(0.03);
    expect(r.discount).toBeCloseTo(2.7, 5); // 3% só sobre as marmitas (90)
    expect(r.total).toBeCloseTo(123.3, 5); // 126 - 2.70
  });
});

import { describe, it, expect } from "vitest";
import { calcularCashbackCreditado, calcularCashbackUtilizavel } from "./cashback";

describe("calcularCashbackCreditado", () => {
  it("credita o percentual configurado sobre o valor do pedido", () => {
    expect(calcularCashbackCreditado(100, { ativo: true, percentual: 0.01 })).toBeCloseTo(1, 5);
    expect(calcularCashbackCreditado(250, { ativo: true, percentual: 0.05 })).toBeCloseTo(12.5, 5);
  });

  it("não credita nada se o programa estiver inativo", () => {
    expect(calcularCashbackCreditado(100, { ativo: false, percentual: 0.01 })).toBe(0);
  });

  it("não credita nada para pedido de valor zero", () => {
    expect(calcularCashbackCreditado(0, { ativo: true, percentual: 0.01 })).toBe(0);
  });
});

describe("calcularCashbackUtilizavel", () => {
  const config = { ativo: true, minimo_uso: 5, limite_desconto_pct: 0.1 };

  it("limita ao teto percentual do pedido quando o saldo é maior", () => {
    // teto = 100 * 10% = 10; saldo 50 → usa 10
    expect(calcularCashbackUtilizavel(50, 100, config)).toBeCloseTo(10, 5);
  });

  it("limita ao saldo quando ele é menor que o teto percentual", () => {
    // teto = 100 * 10% = 10; saldo 6 → usa 6
    expect(calcularCashbackUtilizavel(6, 100, config)).toBeCloseTo(6, 5);
  });

  it("não usa nada se o saldo estiver abaixo do mínimo de uso", () => {
    expect(calcularCashbackUtilizavel(4, 100, config)).toBe(0);
  });

  it("não usa nada com saldo zero", () => {
    expect(calcularCashbackUtilizavel(0, 100, config)).toBe(0);
  });

  it("não usa nada se o programa estiver inativo", () => {
    expect(calcularCashbackUtilizavel(50, 100, { ...config, ativo: false })).toBe(0);
  });

  it("não usa nada quando o total do pedido é zero", () => {
    expect(calcularCashbackUtilizavel(50, 0, config)).toBe(0);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configEntregaParaCidade,
  gerarDatasEntrega,
  horariosDisponiveisParaData,
  regraEntregaCidade,
  validarEntregaProgramada,
} from "./entrega-config";

const regionaisSexta = ["Mafra", "Rio Negro", "Rio Negrinho", "Campo Alegre", "Piên"];

beforeEach(() => {
  vi.useFakeTimers();
  // Quinta, 15/10/2026 às 10h59 de Brasília: testar previsões futuras.
  vi.setSystemTime(new Date("2026-10-15T13:59:00.000Z"));
});
afterEach(() => vi.useRealTimers());

describe("agenda e elegibilidade de cada cidade em três passadas", () => {
  for (const [cidade, data, faixa] of [
    ["Corupá", "20/10/2026", "13:30h ~ 14:30h"],
    ...regionaisSexta.map((cidade) => [cidade, "16/10/2026", "13:30h ~ 14:30h"]),
  ]) {
    describe(cidade, () => {
      it("1ª passada: cidade, dia e janela de entrega corretos", () => {
        const cfg = configEntregaParaCidade(null, cidade);
        expect(cfg.minUnidades).toBe(5);
        expect(gerarDatasEntrega(cfg).some((d) => d.valor === data)).toBe(true);
        expect(validarEntregaProgramada({ cidade, data, horario: faixa, totalUnidades: 5 }).ok).toBe(true);
        if (cidade !== "Corupá") expect(cfg.horarios.every((h) => h.startsWith("1"))).toBe(true);
      });
      it("2ª passada: bloqueio de pedido com quatro unidades", () => {
        const resp = validarEntregaProgramada({ cidade, data, horario: faixa, totalUnidades: 4 });
        expect(resp.ok).toBe(false);
        if (!resp.ok) expect(resp.erro).toMatch(/5 unidades/i);
      });
      it("3ª passada: rejeita dia errado ou horário fora da rota", () => {
        const diaErrado = cidade === "Corupá" ? "16/10/2026" : "20/10/2026";
        expect(validarEntregaProgramada({ cidade, data: diaErrado, horario: faixa, totalUnidades: 5 }).ok).toBe(false);
        if (cidade !== "Corupá") {
          expect(validarEntregaProgramada({ cidade, data, horario: "09:30h ~ 10:30h", totalUnidades: 5 }).ok).toBe(false);
        }
      });
    });
  }

  describe("São Bento do Sul", () => {
    it("1ª passada: entrega diária disponível e sem mínimo regional", () => {
      const cfg = configEntregaParaCidade(null, "São Bento do Sul");
      expect(cfg.diasPermitidos).toEqual([1, 2, 3, 4, 5, 6]);
      expect(cfg.minUnidades).toBeUndefined();
      expect(validarEntregaProgramada({ cidade: "São Bento do Sul", data: "15/10/2026", horario: "13:30h ~ 14:30h", totalUnidades: 1 }).ok).toBe(true);
    });
    it("2ª passada: retirada usa a agenda local", () => {
      expect(validarEntregaProgramada({ cidade: "São Bento do Sul", data: "16/10/2026", horario: "09:30h ~ 10:30h", totalUnidades: 1 }).ok).toBe(true);
    });
    it("3ª passada: horários passados não são exibidos", () => {
      const cfg = configEntregaParaCidade(null, "São Bento do Sul");
      expect(horariosDisponiveisParaData(cfg, "15/10/2026")).not.toContain("09:30h ~ 10:30h");
    });
  });

  it("bloqueia a rota regional após 11h de sexta", () => {
    vi.setSystemTime(new Date("2026-10-16T14:00:00.000Z"));
    const cfg = configEntregaParaCidade(null, "Mafra");
    expect(gerarDatasEntrega(cfg).some((d) => d.valor === "16/10/2026")).toBe(false);
    expect(validarEntregaProgramada({ cidade: "Mafra", data: "16/10/2026", horario: "13:30h ~ 14:30h", totalUnidades: 5 }).ok).toBe(false);
  });

  it("bloqueia horário de entrega passado hoje", () => {
    vi.setSystemTime(new Date("2026-10-15T15:00:00.000Z"));
    expect(validarEntregaProgramada({ cidade: "São Bento do Sul", data: "15/10/2026", horario: "09:30h ~ 10:30h", totalUnidades: 1 }).ok).toBe(false);
  });

  it("normaliza nomes de bairros/cidades acentuadas", () => {
    expect(regraEntregaCidade("Corupá").diasPermitidos).toEqual([2]);
    expect(regraEntregaCidade("Pien").diasPermitidos).toEqual([5]);
  });
});

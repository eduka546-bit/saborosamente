import { describe, expect, it } from "vitest";
import {
  configEntregaParaCidade,
  regraEntregaCidade,
} from "./entrega-config";

describe("regras regionais de entrega", () => {
  it("Mafra e Rio Negro exigem 5 unidades e entregam na sexta à tarde", () => {
    for (const cidade of ["Mafra", "Rio Negro"]) {
      const regra = regraEntregaCidade(cidade);
      expect(regra.minUnidades).toBe(5);
      expect(regra.diasPermitidos).toEqual([5]);
      expect(regra.cutoffMesmoDia).toEqual({ hora: 11, minuto: 0 });
      expect(regra.horarios?.every((h) => h.startsWith("1"))).toBe(true);
    }
  });

  it("Corupá, Rio Negrinho, Campo Alegre e Piên exigem mínimo de 5", () => {
    for (const cidade of ["Corupá", "Rio Negrinho", "Campo Alegre", "Piên"]) {
      const regra = regraEntregaCidade(cidade);
      expect(regra.minUnidades).toBe(5);
      expect(regra.cutoffMesmoDia).toEqual({ hora: 11, minuto: 0 });
    }
  });

  it("São Bento do Sul mantém a agenda padrão sem mínimo regional", () => {
    const regra = regraEntregaCidade("São Bento do Sul");
    expect(regra.minUnidades).toBeUndefined();
    expect(regra.diasPermitidos).toBeUndefined();

    const cfg = configEntregaParaCidade(null, "São Bento do Sul");
    expect(cfg.diasPermitidos).toEqual([1, 2, 3, 4, 5, 6]);
    expect(cfg.horarios.length).toBeGreaterThan(0);
  });
});

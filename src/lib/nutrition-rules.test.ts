import { describe, expect, it } from "vitest";
import { isHighProteinFlavor, maxProteinForFlavor } from "./nutrition-rules";

describe("classificação de alta proteína por sabor", () => {
  it("classifica o sabor inteiro quando qualquer tamanho tem 30g+ de proteína", () => {
    const product = {
      tabela_nutricional_200g: { prot: 19 },
      tabela_nutricional_300g: { prot: 28 },
      tabela_nutricional_400g: { prot: 37 },
    };

    expect(isHighProteinFlavor(product)).toBe(true);
    expect(maxProteinForFlavor(product)).toBe(37);
  });

  it("não classifica quando nenhum tamanho atinge o corte", () => {
    const product = {
      tabela_nutricional_200g: { prot: 14 },
      tabela_nutricional_300g: { prot: 21 },
      tabela_nutricional_400g: { prot: 29 },
    };

    expect(isHighProteinFlavor(product)).toBe(false);
  });

  it("aceita valores nutricionais salvos como texto", () => {
    const product = {
      tabela_nutricional_300g: { prot: "30,0 g" },
    };

    expect(isHighProteinFlavor(product)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { auditarRendimentosTeoricos } from "./cozinha-auditoria";
import { quantidadeBrutaPorRendimento } from "./cozinha-planejamento";

const ingredientes = [
  { id: "tilapia", unidade_medida: "g", tipo_rendimento: "perda", quebra_percentual: 40 },
  { id: "tomate", unidade_medida: "g", tipo_rendimento: "perda", quebra_percentual: 24 },
];
const itens = [
  { preparacao_id: "tilapia-assada", ingrediente_id: "tilapia", quantidade: 1000 },
  { preparacao_id: "tilapia-assada", ingrediente_id: "tomate", quantidade: 300 },
];
const preparacao = {
  id: "tilapia-assada", nome: "Tilápia assada",
  observacao: "Rendimento TEÓRICO: tilápia crua com perda de 40% e tomate cru com perda de 24%.",
};
describe("conferência tripla do rendimento da tilápia", () => {
  it("detecta a preparação antiga com 30% apesar de o ingrediente usar 40%", () => {
    const alertas = auditarRendimentosTeoricos([{ ...preparacao, rendimento_final_g: 928 }], itens, ingredientes);
    expect(alertas).toHaveLength(1);
    expect(alertas[0].teorico).toBeCloseTo(828, 3);
    expect(alertas[0].diferenca).toBeCloseTo(100, 3);
  });
  it("aceita a preparação corrigida e mantém tomate contado uma vez", () => {
    expect(auditarRendimentosTeoricos([{ ...preparacao, rendimento_final_g: 828 }], itens, ingredientes)).toHaveLength(0);
    expect(1000 * 0.60 + 300 * 0.76).toBeCloseTo(828, 6);
  });
  it("escala insumos CRUS pela preparação e não reaplica a perda", () => {
    const pronto130 = 130;
    const peixeCru = pronto130 * 1000 / 828;
    expect(peixeCru).toBeCloseTo(157.00483, 3);
    expect(peixeCru * .6 + (pronto130 * 300 / 828) * .76).toBeCloseTo(pronto130, 4);
    // Perda direta (sem preparação) usa pronta/(1-perda).
    expect(quantidadeBrutaPorRendimento(100, ingredientes[0])).toBeCloseTo(166.666667, 4);
  });
  it("não finge exatidão em preparos com água, ovos ou receita-base pesada", () => {
    const outras = [
      { id: "molho", nome: "Molho com água", observacao: "Rendimento TEÓRICO", rendimento_final_g: 700 },
      { id: "observado", nome: "Purê observado", observacao: "Rendimento operacional medido", rendimento_final_g: 700 },
    ];
    const preparos = [
      { preparacao_id: "molho", ingrediente_id: "tilapia", quantidade: 1000 },
      { preparacao_id: "molho", ingrediente_id: "agua", quantidade: 1 },
      { preparacao_id: "observado", ingrediente_id: "tilapia", quantidade: 1000 },
    ];
    expect(auditarRendimentosTeoricos(outras, preparos, [...ingredientes, { id:"agua", unidade_medida:"L" }])).toHaveLength(0);
  });
});

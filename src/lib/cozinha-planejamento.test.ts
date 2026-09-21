import { describe, expect, it } from "vitest";
import { fatorCapacidade, quantidadeBrutaPorRendimento, quantidadeNoLote, quantidadeRestante, sugerirMarmitas } from "./cozinha-planejamento";

describe("planejamento interligado da cozinha", () => {
  it("zera a necessidade quando o preparo pronto cobre o total", () => {
    expect(quantidadeRestante(5667, 5667)).toBe(0);
  });

  it("desconta parcialmente o que já está pronto", () => {
    expect(quantidadeRestante(5667, 2000)).toBe(3667);
  });

  it("usa o ingrediente limitante para calcular a capacidade", () => {
    expect(fatorCapacidade([{ disponivel: 5000, necessario: 10000 }, { disponivel: 9000, necessario: 10000 }])).toBe(0.5);
  });

  it("sugere somente marmitas inteiras em cada tamanho", () => {
    expect(sugerirMarmitas(10, 0.55)).toBe(5);
  });

  it("permite sugerir produção adicional quando há ingrediente a mais", () => {
    expect(sugerirMarmitas(10, 1.4)).toBe(14);
  });

  it("converte o peso pronto para o mesmo peso cru usado na lista de ingredientes", () => {
    expect(quantidadeBrutaPorRendimento(3553, { tipo_rendimento:"perda", quebra_percentual:30 })).toBeCloseTo(5075.714, 3);
  });

  it("faz o abatimento integral usando a mesma conversão de perda", () => {
    const bruto=quantidadeBrutaPorRendimento(3553, { tipo_rendimento:"perda", quebra_percentual:30 });
    expect(quantidadeRestante(bruto,bruto)).toBe(0);
  });

  it("usa a mesma proporção do lote ao calcular e ao retirar uma preparação sem rendimento cadastrado", () => {
    const costelaDoLote=quantidadeNoLote(2000,12182.4,4800);
    expect(costelaDoLote).toBeCloseTo(5076,3);
    expect(quantidadeRestante(costelaDoLote,costelaDoLote)).toBe(0);
  });
});

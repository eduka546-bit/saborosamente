import { describe, expect, it } from "vitest";
import { alocarQuantidadePorPesos, fatorCapacidade, ingredientesCozinhaCorrespondem, nomesCozinhaCorrespondem, quantidadeBrutaPorRendimento, quantidadeNoLote, quantidadeRestante, sugerirMarmitas } from "./cozinha-planejamento";

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

  it("não confunde Arroz Branco com Molho Branco", () => {
    expect(nomesCozinhaCorrespondem("Arroz branco","Molho branco")).toBe(false);
  });

  it("não confunde Feijão Preto com Feijão Carioca", () => {
    expect(nomesCozinhaCorrespondem("Feijão Preto","Feijão Carioca")).toBe(false);
  });

  it("mantém correspondências específicas válidas", () => {
    expect(nomesCozinhaCorrespondem("Arroz Branco Parboilizado","arroz branco")).toBe(true);
    expect(nomesCozinhaCorrespondem("Molho madeira","alcatra molho madeira")).toBe(true);
  });

  it("reconhece o mesmo ingrediente com descrição de corte ou marca", () => {
    expect(ingredientesCozinhaCorrespondem("Patinho", "Patinho em tiras")).toBe(true);
    expect(ingredientesCozinhaCorrespondem("Molho madeira", "Molho madeira industrializado marca Elegê")).toBe(true);
  });

  it("não mistura tomate com molho ou batatas de tipos diferentes", () => {
    expect(ingredientesCozinhaCorrespondem("Tomate", "Molho de tomate industrializado")).toBe(false);
    expect(ingredientesCozinhaCorrespondem("Batata doce", "Batata inglesa")).toBe(false);
  });

  it("distribui um ingrediente compartilhado sem aumentar o total", () => {
    const partes=alocarQuantidadePorPesos(12000,[{id:"a",peso:2},{id:"b",peso:1}]);
    expect(partes.find((x)=>x.id==="a")?.quantidade).toBe(8000);
    expect(partes.find((x)=>x.id==="b")?.quantidade).toBe(4000);
    expect(partes.reduce((s,x)=>s+x.quantidade,0)).toBe(12000);
  });

  it("abate proporcionalmente somente a parte pronta de cada preparo", () => {
    const partes=alocarQuantidadePorPesos(12000,[{id:"madeira",peso:1},{id:"estrogonofe",peso:1}]);
    const desconto=partes.find((x)=>x.id==="estrogonofe")!.quantidade*0.5;
    expect(quantidadeRestante(12000,desconto)).toBe(9000);
  });
});

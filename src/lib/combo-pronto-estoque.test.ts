import { describe, expect, it } from "vitest";
import {
  combinarTrocasMaisLeves,
  composicaoBaseMaisLeves,
  estoqueLivreCombo,
  somarComposicao,
} from "./combo-pronto-estoque";

const sabores = Array.from({ length: 10 }, (_, i) => ({
  id: `TD${i + 1}`,
  controle_estoque: true,
  estoque_200g: 5,
  estoque_300g: 5,
  estoque_400g: 5,
}));

describe("estoque dos combos prontos", () => {
  it("mantem 2 unidades de cada sabor quando o combo de 20 esta completo", () => {
    const base = composicaoBaseMaisLeves(sabores, 20, "200g");
    expect(somarComposicao(base)).toBe(20);
    expect(Object.values(base).every((q) => q === 2)).toBe(true);
  });

  it("pede troca das duas unidades quando um sabor esta zerado", () => {
    const produtos = sabores.map((p, i) => i === 0 ? { ...p, estoque_200g: 0 } : p);
    const base = composicaoBaseMaisLeves(produtos, 20, "200g");
    expect(somarComposicao(base)).toBe(18);
    const completa = combinarTrocasMaisLeves(produtos, base, { TD2: 2 }, "200g");
    expect(somarComposicao(completa)).toBe(20);
    expect(completa.TD1).toBe(0);
    expect(completa.TD2).toBe(4);
  });

  it("preserva uma unidade restante e substitui so a outra", () => {
    const produtos = sabores.map((p, i) => i === 0 ? { ...p, estoque_200g: 1 } : p);
    const base = composicaoBaseMaisLeves(produtos, 20, "200g");
    const completa = combinarTrocasMaisLeves(produtos, base, { TD2: 1 }, "200g");
    expect(base.TD1).toBe(1);
    expect(somarComposicao(completa)).toBe(20);
  });

  it("considera o estoque reservado por avulsos e combos existentes no carrinho", () => {
    const carrinho = [
      { productId: "TD1", quantity: 2, weight: "200g" },
      { productId: "combo:abc", quantity: 1, weight: "200g", comboPronto: {
        sabores: [{ productId: "TD1", quantity: 2 }],
      } },
    ];
    expect(estoqueLivreCombo(sabores[0], "200g", carrinho)).toBe(1);
    expect(estoqueLivreCombo(sabores[0], "300g", carrinho)).toBe(5);
  });

  it("nao deixa acrescentar substituicoes acima do estoque do proprio combo", () => {
    const produtos = sabores.map((p, i) => i === 0 ? { ...p, estoque_200g: 0 } : i === 1 ? { ...p, estoque_200g: 3 } : p);
    const base = composicaoBaseMaisLeves(produtos, 20, "200g");
    const tentativa = combinarTrocasMaisLeves(produtos, base, { TD2: 4 }, "200g");
    expect(tentativa.TD2).toBe(3);
    expect(somarComposicao(tentativa)).toBe(19);
  });

  it("tambem permite recuperar um sabor ausente da lista se ha estoque nos demais", () => {
    const nove = sabores.slice(0, 9);
    const base = composicaoBaseMaisLeves(nove, 10, "200g");
    const completa = combinarTrocasMaisLeves(nove, base, { TD1: 1 }, "200g");
    expect(somarComposicao(base)).toBe(9);
    expect(somarComposicao(completa)).toBe(10);
  });
});

import { describe, expect, it } from "vitest";
import { sortOrderItems } from "./order-item-order";

describe("ordenação de itens em checkout e impressão", () => {
  it("ordena TD01, TD04, TD09 sem alterar valores ou original", () => {
    const items = [
      { product: { nome: "TD09 - Panqueca" }, quantity: 2, subtotal: 42 },
      { product: { nome: "TD01 - Frango" }, quantity: 1, subtotal: 19 },
      { product: { nome: "TD04 - Estrogonofe" }, quantity: 3, subtotal: 63 },
    ];
    const sorted = sortOrderItems(items);
    expect(sorted.map(i => i.product.nome.slice(0, 4))).toEqual(["TD01", "TD04", "TD09"]);
    expect(sorted.reduce((s, i) => s + i.subtotal, 0)).toBe(124);
    expect(items[0].product.nome.slice(0, 4)).toBe("TD09");
  });
  it("ordena numericamente TD2 antes de TD10 e mesmo sabor por gramatura", () => {
    const items = [
      { nome: "TD10 - Exemplo", peso: "300g" },
      { nome: "TD02 - Exemplo", peso: "400g" },
      { nome: "TD02 - Exemplo", peso: "200g" },
      { nome: "TD02 - Exemplo", peso: "300g" },
    ];
    expect(sortOrderItems(items).map(i => i.nome.slice(0,4) + " " + i.peso))
      .toEqual(["TD02 200g", "TD02 300g", "TD02 400g", "TD10 300g"]);
  });
  it("reconhece códigos nos itens antigos, inclusive na observação", () => {
    const items = [
      { nome: "Marmita", observacao: "Peso: 300g | TD09 - Panqueca" },
      { produtos: { nome: "TD04 - Estrogonofe" }, observacao: "Peso: 200g" },
      { nome_item: "TD01 - Frango", observacao: "Peso: 400g" },
    ];
    expect(sortOrderItems(items).map(i => i.observacao))
      .toEqual(["Peso: 400g", "Peso: 200g", "Peso: 300g | TD09 - Panqueca"]);
  });
  it("mantém combos e sopas sem código, sem afetar a quantidade", () => {
    const items = [
      { nome: "Sopa de legumes", quantidade: 2 },
      { nome: "TD04 - Estrogonofe", quantidade: 1 },
      { nome: "Combo 10 marmitas", quantidade: 1 },
    ];
    const sorted = sortOrderItems(items);
    expect(sorted.map(i => i.nome)).toEqual(["TD04 - Estrogonofe", "Combo 10 marmitas", "Sopa de legumes"]);
    expect(sorted.reduce((s,i) => s+i.quantidade,0)).toBe(4);
  });
});

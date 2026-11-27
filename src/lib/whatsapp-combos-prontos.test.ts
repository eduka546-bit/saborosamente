import { describe, expect, it } from "vitest";
import { codigoComboPronto } from "./combo-pronto-codigo";
import { interpretarResumoWhatsapp } from "./whatsapp-order-parser";

describe("Combos Prontos em pedidos manuais de WhatsApp", () => {
  it("reconhece 1 Combo Mais Vendidos 10un (P) a preço Black, sem inventar sabores", () => {
    const pedido = interpretarResumoWhatsapp([
      "Pedido Cliente Teste (Responsável Teste)",
      "Telefone: (49) 9 9805-0232",
      "Endereço: Rua Heinz Weber, 370 - Cruzeiro - São Bento do Sul",
      "",
      "1 - Combo Mais Vendidos 10un (P) - 140,00",
      "Valor Black - 10 x 14,00",
      "",
      "Entrega: 5,00",
      "Forma de Pagamento: Link",
      "Total: 140 + 5 = R$ 145,00",
    ].join("\n"));
    expect(pedido.nome).toBe("Cliente Teste (Responsável Teste)");
    expect(pedido.telefone).toBe("(49) 9 9805-0232");
    expect(pedido.endereco).toEqual({
      rua: "Rua Heinz Weber", numero: "370", bairro: "Cruzeiro", cidade: "São Bento do Sul",
    });
    expect(pedido.pagamento).toBe("link");
    expect(pedido.metodoEntrega).toBe("entrega");
    expect(pedido.taxaEntrega).toBe(5);
    expect(pedido.totalPedido).toBe(145);
    expect(pedido.blocos).toHaveLength(1);
    expect(pedido.blocos[0]).toEqual(expect.objectContaining({
      descricao: "Combo Mais Vendidos 10un (P)",
      tipo: "combo",
      quantidadeDeclarada: 1,
      unidadesEsperadas: 10,
      peso: "200g",
      subtotalDeclarado: 140,
    }));
    expect(pedido.itens).toEqual([{codigo:"__COMBO_MAIS_VENDIDOS_10",quantidade:1}]);
    expect(pedido.itensDetalhados).toEqual([
      {codigo:"__COMBO_MAIS_VENDIDOS_10",quantidade:1,peso:"200g",pesoExibicao:"200g",precoUnitario:140},
    ]);
    expect(pedido.avisos).toEqual([]);
  });

  it("faz vínculo exato com nome de combo ativo do catálogo, evitando baixar TD indevidamente", () => {
    expect(codigoComboPronto("Combo Pratos Mais Vendidos - 10un")).toBe("__COMBO_MAIS_VENDIDOS_10");
    expect(codigoComboPronto("Combo Mais Vendidos 10un (P)")).toBe("__COMBO_MAIS_VENDIDOS_10");
    expect(codigoComboPronto("Combo Pratos Mais Leves - 5un")).toBe("__COMBO_MAIS_LEVES_5");
    expect(codigoComboPronto("Combo Pratos Mais Vendidos - 20un")).toBe("__COMBO_MAIS_VENDIDOS_20");
    expect(codigoComboPronto("Combo A Escolha - 10 A 19 Marmitas")).toBeNull();
    expect(codigoComboPronto("Combo Mais Pedidas 300g (M)")).toBeNull();
    expect(codigoComboPronto("Combo Mais Vendidos 10un")).toBe("__COMBO_MAIS_VENDIDOS_10");
  });

  it("interpreta combo pronto G e múltiplos combos M sem tratar as unidades como itens soltos", () => {
    const g = interpretarResumoWhatsapp([
      "Pedido Cliente Teste",
      "1 - Combo Pratos Mais Leves 20un (G) - 400,00",
      "Valor Black - 20 x 20,00",
      "Retirada na Loja",
      "Total: R$ 400,00",
    ].join("\n"));
    expect(g.itensDetalhados).toEqual([
      {codigo:"__COMBO_MAIS_LEVES_20",quantidade:1,peso:"400g",pesoExibicao:"400g",precoUnitario:400},
    ]);
    expect(g.blocos[0].unidadesEsperadas).toBe(20);
    expect(g.avisos).toEqual([]);
    const m = interpretarResumoWhatsapp([
      "Pedido Cliente Teste",
      "2 - Combo Mais Vendidos 5un (M) - 170,00",
      "Valor Black - 10 x 17,00",
      "Retirada na Loja",
      "Total: R$ 170,00",
    ].join("\n"));
    expect(m.itensDetalhados).toEqual([
      {codigo:"__COMBO_MAIS_VENDIDOS_5",quantidade:2,peso:"300g",pesoExibicao:"300g",precoUnitario:85},
    ]);
    expect(m.blocos[0].unidadesEsperadas).toBe(10);
    expect(m.avisos).toEqual([]);
  });

  it("mantém o fluxo dos combos com sabores TD explicitados", () => {
    const comSabores = interpretarResumoWhatsapp([
      "Pedido Cliente Teste",
      "1 - Combo Mais Vendidos 5un (P) - 70,00",
      "5 x 14,00",
      "1xTD(1-2-3-4-5)",
      "Retirada na Loja",
      "Total: R$ 70,00",
    ].join("\n"));
    expect(comSabores.itens).toEqual(
      ["TD01","TD02","TD03","TD04","TD05"].map(codigo=>({codigo,quantidade:1})),
    );
    expect(comSabores.itensDetalhados.every(i=>i.peso==="200g" && i.precoUnitario===14)).toBe(true);
    expect(comSabores.avisos).toEqual([]);
  });
});

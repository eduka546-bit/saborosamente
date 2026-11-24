import { describe, expect, it } from "vitest";
import { interpretarResumoWhatsapp } from "./whatsapp-order-parser";

describe("resumo WhatsApp com marmitas e complementos agrupados", () => {
  it("reconhece 15 marmitas 200g e 5 complementos 150g sem confundir a faixa Combo 20un", () => {
    const texto = [
      "Pedido Cliente de Teste",
      "Telefone: (47) 90000-0000",
      "Endereço: R. Exemplo, 244 - Centro - São Bento do Sul - Ótica Exemplo",
      "",
      "15 - Refeições 200g (P) - 223,50",
      "_Combo 20un - 15 x 14,90un_",
      "1xTD(7-19-20-23-24-26-28) + 2xTD(8-9-10-11)",
      "",
      "5 - Complemento 150g - 44,50",
      "_5 x 8,90un_",
      "1xCO(3)",
      "2xCO(6)",
      "2xCO(1)",
      "",
      "Entrega: 5,00",
      "Forma de Pagamento: Transferência Pix",
      "Total: 223,50 + 44,50 + 5 = R$ 273,00",
    ].join("\n");
    const p = interpretarResumoWhatsapp(texto);

    expect(p.nome).toBe("Cliente de Teste");
    expect(p.telefone).toBe("(47) 90000-0000");
    expect(p.endereco).toEqual({
      rua: "R. Exemplo", numero: "244", bairro: "Centro", cidade: "São Bento do Sul",
    });
    expect(p.referencia).toBe("Ótica Exemplo");
    expect(p.metodoEntrega).toBe("entrega");
    expect(p.pagamento).toBe("pix");
    expect(p.blocos).toHaveLength(2);
    expect(p.blocos.map(b => [b.tipo, b.quantidadeDeclarada, b.unidadesEsperadas, b.subtotalDeclarado])).toEqual([
      ["refeicoes", 15, 15, 223.5],
      ["complemento", 5, 5, 44.5],
    ]);
    expect(p.itens).toEqual([
      ...["TD07", "TD19", "TD20", "TD23", "TD24", "TD26", "TD28"].map(codigo => ({ codigo, quantidade: 1 })),
      ...["TD08", "TD09", "TD10", "TD11"].map(codigo => ({ codigo, quantidade: 2 })),
      { codigo: "CO03", quantidade: 1 },
      { codigo: "CO06", quantidade: 2 },
      { codigo: "CO01", quantidade: 2 },
    ]);
    const refeicoes = p.itensDetalhados.filter(i => i.codigo.startsWith("TD"));
    const complementos = p.itensDetalhados.filter(i => i.codigo.startsWith("CO"));
    expect(refeicoes.reduce((n, i) => n + i.quantidade, 0)).toBe(15);
    expect(refeicoes.every(i => i.peso === "200g" && i.pesoExibicao === "200g" && i.precoUnitario === 14.9)).toBe(true);
    expect(complementos.reduce((n, i) => n + i.quantidade, 0)).toBe(5);
    expect(complementos.every(i => i.peso === "200g" && i.pesoExibicao === "150g" && i.precoUnitario === 8.9)).toBe(true);
    expect(p.taxaEntrega).toBe(5);
    expect(p.totalPedido).toBe(273);
    expect(Math.round((p.itensDetalhados.reduce((n, i) => n + i.quantidade * (i.precoUnitario ?? 0), 0) + p.taxaEntrega!) * 100)).toBe(27300);
    expect(p.avisos).toEqual([]);
  });
});

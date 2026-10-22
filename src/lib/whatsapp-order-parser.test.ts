import { describe, expect, it } from "vitest";
import { interpretarResumoWhatsapp } from "./whatsapp-order-parser";

describe("interpretação dos pedidos recebidos no WhatsApp", () => {
  it("lê o pedido da Marcela com 5 sabores diferentes, combo, frete e saldo anterior", () => {
    const pedido = interpretarResumoWhatsapp(`Pedido Marcela Feliski - MF:

5 - Refeições 400g (G) - 117,50
_Combo 5un - 5 x 23,50un_
1xTD(1-9-11-16-28)

Entrega: 10,00

Local de Entrega: Rua Ermelino Becker, 53 - Centro - Rio Negro

Forma de Pagamento: Cartão

Total: 117,50 + 10 = R$ 127,50 (+ 127,50 anterior) = R$ 255,00`);
    expect(pedido.nome).toBe("Marcela Feliski");
    expect(pedido.cidadeSigla).toBe("MF");
    expect(pedido.peso).toBe("400g");
    expect(pedido.quantidadeDeclarada).toBe(5);
    expect(pedido.precoUnitario).toBe(23.5);
    expect(pedido.itens).toEqual(["TD01", "TD09", "TD11", "TD16", "TD28"].map(codigo => ({ codigo, quantidade: 1 })));
    expect(pedido.subtotalDeclarado).toBe(117.5);
    expect(pedido.taxaEntrega).toBe(10);
    expect(pedido.endereco).toEqual({ rua: "Rua Ermelino Becker", numero: "53", bairro: "Centro", cidade: "Rio Negro" });
    expect(pedido.pagamento).toBe("cartao");
    expect(pedido.totalPedido).toBe(127.5);
    expect(pedido.saldoAnterior).toBe(127.5);
    expect(pedido.totalAcumulado).toBe(255);
    expect(pedido.itens.reduce((sum, item) => sum + item.quantidade * (pedido.precoUnitario ?? 0), 0) + (pedido.taxaEntrega ?? 0)).toBe(127.5);
  });

  it("mantém compatibilidade com resumos antigos, cada código em uma linha", () => {
    const pedido = interpretarResumoWhatsapp(`Pedido Fulano - SBS:
12 - Refeições 300g - 240,00
12 x R$ 20,00 /un
5xTD(02)
4xTD26
3xTD(09)
Entrega / Retirada: 10,00
Local de Entrega / Retirada: Rua Teste, 42 - Centro - São Bento do Sul
Total: R$ 250,00`);
    expect(pedido.peso).toBe("300g");
    expect(pedido.precoUnitario).toBe(20);
    expect(pedido.itens).toEqual([
      { codigo: "TD02", quantidade: 5 },
      { codigo: "TD26", quantidade: 4 },
      { codigo: "TD09", quantidade: 3 },
    ]);
    expect(pedido.totalPedido).toBe(250);
    expect(pedido.totalAcumulado).toBeNull();
    expect(pedido.saldoAnterior).toBeNull();
  });

  it("separa códigos de um grupo e lê a quantidade de cada um", () => {
    const pedido = interpretarResumoWhatsapp("3xTD(01-09)\n2xTD28");
    expect(pedido.itens).toEqual([
      { codigo: "TD01", quantidade: 3 },
      { codigo: "TD09", quantidade: 3 },
      { codigo: "TD28", quantidade: 2 },
    ]);
  });

  it("não confunde um total acumulado de dívida com o novo pedido", () => {
    const pedido = interpretarResumoWhatsapp("Total: 117,50 + 10 = R$ 127,50 (+ 127,50 anterior) = R$ 255,00");
    expect(pedido.totalPedido).toBe(127.5);
    expect(pedido.totalAcumulado).not.toBe(pedido.totalPedido);
  });
  it("Maria Eduarda: dois combos de 5, 300g e 400g, retirada e 7% de desconto", () => {
    const pedido = interpretarResumoWhatsapp(`Pedido Maria Eduarda - SBS:

1 - Combo Mais Pedidas 300g (M) - 100,00
__Combo 5un_
1xTD(01-08-14-20-26)

1 - Combo Mais Pedidas 400g (M) - 115,00
__Combo 5un_
1xTD(01-08-14-20-26)

Entrega: Retirada

Forma de Pagamento: ?

Total: 100,00 + 115,00 = 215,00 - 7% = R$ 199,95`);
    expect(pedido.nome).toBe("Maria Eduarda");
    expect(pedido.blocos).toHaveLength(2);
    expect(pedido.itensDetalhados).toHaveLength(10);
    expect(pedido.blocos.map((b) => b.peso)).toEqual(["300g", "400g"]);
    expect(pedido.itensDetalhados.slice(0, 5).every((i) => i.precoUnitario === 20)).toBe(true);
    expect(pedido.itensDetalhados.slice(5).every((i) => i.precoUnitario === 23)).toBe(true);
    expect(pedido.taxaEntrega).toBe(0);
    expect(pedido.metodoEntrega).toBe("retirada");
    expect(pedido.pagamento).toBeNull();
    expect(pedido.descontoPercentual).toBe(7);
    expect(pedido.descontoValor).toBe(15.05);
    expect(pedido.totalPedido).toBe(199.95);
    expect(pedido.avisos).toEqual([]);
  });

  it("Daniela Pfeiffer: interpreta 200g/300g, complementos e aponta diferença de dez centavos", () => {
    const pedido = interpretarResumoWhatsapp(`Pedido Daniela Pfeiffer - SBS:

13 - Refeições 200g (P) - 206,70
_Combo 10un - 13 x 15,90un_
1xTD(1-7-10-11-19-20-28)
2xTD(3-8-9)

2 - Refeições 300g (M) - 39,80
_Combo 10un - 2 x 19,90un_
1xTD(21-22)

4 - Complemento 150g - 33,70
_2 x 7,90un_
_2 x 8,90un_
1xCO(2-3)
2xCO(6)

Entrega: 5,00

Local de Entrega: R. Felipe Schmidt, 244 - Centro - São Bento do Sul - Ótica Rolf

Horário de Entrega:?

Forma de Pagamento: Transferência Pix

Total: 280,20 + 5 = R$ 285,20`);
    expect(pedido.nome).toBe("Daniela Pfeiffer");
    expect(pedido.blocos.map((b) => b.itens.reduce((s, i) => s + i.quantidade, 0))).toEqual([13, 2, 4]);
    expect(pedido.blocos.map((b) => b.peso)).toEqual(["200g", "300g", "200g"]);
    expect(pedido.blocos[0].itens.every((i) => i.precoUnitario === 15.9)).toBe(true);
    expect(pedido.blocos[1].itens.every((i) => i.precoUnitario === 19.9)).toBe(true);
    expect(pedido.blocos[2].itens).toEqual([
      { codigo: "CO02", quantidade: 1, peso: "200g", pesoExibicao: "150g", precoUnitario: 7.9 },
      { codigo: "CO03", quantidade: 1, peso: "200g", pesoExibicao: "150g", precoUnitario: 7.9 },
      { codigo: "CO06", quantidade: 2, peso: "200g", pesoExibicao: "150g", precoUnitario: 8.9 },
    ]);
    expect(pedido.endereco?.cidade).toBe("São Bento do Sul");
    expect(pedido.referencia).toBe("Ótica Rolf");
    expect(pedido.horario).toBeNull();
    expect(pedido.pagamento).toBe("pix");
    expect(pedido.taxaEntrega).toBe(5);
    expect(pedido.totalPedido).toBe(285.2);
    expect(pedido.avisos.some((msg) => msg.includes("33,60") && msg.includes("33,70"))).toBe(true);
    const valorCalculado = pedido.itensDetalhados.reduce(
      (sum, i) => sum + i.quantidade * (i.precoUnitario ?? 0), 0) + (pedido.taxaEntrega ?? 0);
    expect(Math.round(valorCalculado * 100) / 100).toBe(285.1);
  });

  it("interpreta comprovante de 7 sopas, com nomes quebrados, frete e cashback pago", () => {
    const receipt = `1X SO04 - SOPA DE FEIJAO COM
   MACARRAO (MINESTRA)
    1X SO07 - CREME DE ABOBORA
   CABOTIA COM CARNE DESFIADA
    1X SO08 - CREME DE MANDIOQUINHA
   COM FRANGO E BACON
    1X SO09 - CREME DE BATATA
   INGLESA COM CARNE DESFIADA
    1X SO10 - CALDO DE AIPIM COM
   CARNE MOIDA
    2X SO11 - CALDO VERDE PORTUGUES
   DE BATATA COM CALABRESA E COUVE
   MANTEIGA

   ================================

   SUBTOTAL:              R$ 115,00
   TAXA DE ENTREGA:        R$ 10,00
   TOTAL:                 R$ 125,00

   PAGO COM CASHBACK:       R$ 1,71
   TOTAL A SER PAGO:      R$ 123,29`;
    const p = interpretarResumoWhatsapp(receipt);
    expect(p.itens.map(i => [i.codigo, i.quantidade])).toEqual([
      ["SO04", 1], ["SO07", 1], ["SO08", 1],
      ["SO09", 1], ["SO10", 1], ["SO11", 1], ["SO11", 1],
    ]);
    expect(p.itens.reduce((s, i) => s + i.quantidade, 0)).toBe(7);
    expect(p.itensDetalhados.every(i => i.peso === "400g")).toBe(true);
    expect(p.itensDetalhados.reduce((s, i) => s + Math.round(i.quantidade * (i.precoUnitario ?? 0) * 100), 0)).toBe(11500);
    expect(p.taxaEntrega).toBe(10);
    expect(p.metodoEntrega).toBe("entrega");
    expect(p.totalPedido).toBe(123.29);
    expect(p.cashbackUsado).toBe(1.71);
    expect(p.descontoValor).toBe(0);
    expect(p.avisos).toContain("Comprovante sem preços individuais: o subtotal foi dividido entre as unidades. Confira os valores antes de salvar.");
    expect(p.avisos.some(a => a.includes("não corresponde"))).toBe(false);
  });

  it("sem cashback, recibo usa o total bruto informado sem inventar desconto", () => {
    const p = interpretarResumoWhatsapp("1X SO11 - CALDO VERDE\nSUBTOTAL: R$ 18,00\nTAXA DE ENTREGA: R$ 5,00\nTOTAL: R$ 23,00");
    expect(p.itens).toEqual([{ codigo: "SO11", quantidade: 1 }]);
    expect(p.cashbackUsado).toBe(0);
    expect(p.totalPedido).toBe(23);
  });

  it("Augusto Gums: lê refeição no singular, telefone, endereço, link e os dois tamanhos", () => {
    const texto = `Pedido Augusto Gums:
Telefone: 47 9628-6543
Endereço: Rua João Pauli, 200 - Colonial - São Bento do Sul

5 - Refeição 400g (G) - 114,50
_Combo 10un - 5 x 22,90_
1xTD(7-9-22) + 2xTD(14)

5 - Refeição 300g (M) - 99,50
_Combo 10un - 5 x 19,90_
1xTD(3-7-8-9-22)

Entrega: R$ 5,00
Forma de Pagamento: Link
Total: 114,50 + 99,50 + 5,00 = 219,00`;
    const pedido = interpretarResumoWhatsapp(texto);
    expect(pedido.nome).toBe("Augusto Gums");
    expect(pedido.telefone).toBe("47 9628-6543");
    expect(pedido.endereco).toEqual({
      rua: "Rua João Pauli", numero: "200", bairro: "Colonial", cidade: "São Bento do Sul",
    });
    expect(pedido.pagamento).toBe("link");
    expect(pedido.blocos).toHaveLength(2);
    expect(pedido.blocos.map(b => b.peso)).toEqual(["400g", "300g"]);
    expect(pedido.itensDetalhados).toEqual([
      ...["TD07", "TD09", "TD22"].map(codigo => ({ codigo, quantidade: 1, peso: "400g", pesoExibicao: "400g", precoUnitario: 22.9 })),
      { codigo: "TD14", quantidade: 2, peso: "400g", pesoExibicao: "400g", precoUnitario: 22.9 },
      ...["TD03", "TD07", "TD08", "TD09", "TD22"].map(codigo => ({ codigo, quantidade: 1, peso: "300g", pesoExibicao: "300g", precoUnitario: 19.9 })),
    ]);
    expect(pedido.itensDetalhados.reduce((t, item) => t + item.quantidade, 0)).toBe(10);
    expect(pedido.taxaEntrega).toBe(5);
    expect(pedido.totalPedido).toBe(219);
    expect(pedido.avisos).toEqual([]);
  });

  it("lê 24 marmitas 400g com retirada na loja e desconto fixo de R$ 26,28", () => {
    const p = interpretarResumoWhatsapp(`Pedido Cliente Exemplo
Telefone: 47 90000-0000
Endereço: Rua Exemplo, 3620 - Bairro Colonial - São bento do Sul

24 - Refeições 400g (G) - 525,60
_Combo 20un - 24 x 21,90un_
4xTD(16)
2xTD(02-03-05-17-18-24-25-26-27)
1xTD(12-13)

Retirada na Loja

Total: 525,60 - 26,28 = R$ 499,32`);
    expect(p.nome).toBe("Cliente Exemplo");
    expect(p.telefone).toBe("47 90000-0000");
    expect(p.endereco).toEqual({
      rua: "Rua Exemplo", numero: "3620", bairro: "Colonial", cidade: "São Bento do Sul",
    });
    expect(p.metodoEntrega).toBe("retirada");
    expect(p.taxaEntrega).toBe(0);
    expect(p.quantidadeDeclarada).toBe(24);
    expect(p.itens).toEqual([
      { codigo: "TD16", quantidade: 4 },
      ...["TD02","TD03","TD05","TD17","TD18","TD24","TD25","TD26","TD27"]
        .map(codigo => ({ codigo, quantidade: 2 })),
      { codigo: "TD12", quantidade: 1 },
      { codigo: "TD13", quantidade: 1 },
    ]);
    expect(p.itensDetalhados.every(i => i.peso === "400g" && i.precoUnitario === 21.9)).toBe(true);
    expect(p.itens.reduce((s, i) => s + i.quantidade, 0)).toBe(24);
    expect(p.subtotalDeclarado).toBe(525.6);
    expect(p.descontoPercentual).toBeNull();
    expect(p.descontoValor).toBe(26.28);
    expect(p.totalPedido).toBe(499.32);
    expect(p.avisos).toEqual([]);
  });

  it("diferencia desconto absoluto em reais de desconto percentual", () => {
    const base = "1 - Refeição 400g - 100,00\n1xTD16\nEntrega: Retirada\n";
    const real = interpretarResumoWhatsapp(base + "Total: 100,00 - R$ 5,00 = R$ 95,00");
    expect(real.descontoPercentual).toBeNull();
    expect(real.descontoValor).toBe(5);
    const percentual = interpretarResumoWhatsapp(base + "Total: 100,00 - 5% = R$ 95,00");
    expect(percentual.descontoPercentual).toBe(5);
    expect(percentual.descontoValor).toBe(5);
  });

});

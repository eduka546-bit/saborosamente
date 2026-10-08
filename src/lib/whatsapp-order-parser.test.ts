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
});

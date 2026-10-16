import { describe, it, expect } from "vitest";
import { interpretarResumoWhatsapp } from "./whatsapp-order-parser";

const comprovante = [
"Cliente:   Cliente Exemplo",
"Fone:      (47) 99999-1234",
"----------------------------------------",
"F. ENTREGA: ENTREGA AGENDADA0",
"AGENDADO: 16/10 - 15:00 - 18:00",
"----------------------------------------",
"Endereco:  TRAVESSA DAS FLORES",
"Numero:    144",
"Complem.:  SALA 105 - PROMOTORIA - MPSC",
"Bairro:    CENTRO / RIO NEGRINHO",
"Referencia:1º ANDAR",
"----------------------------------------",
"Qtd  Descricao             V.Uni V.Total",
"----------------------------------------",
"1    COMBO 5 A 9 UNIDADES  102,50 102,50",
"     SABOR",
"     * TD02- Almondegas ao Molho Sugo",
"     com Arroz e Batata Rustica 200g",
"     * TD05- Arroz Carreteiro com Carne",
"     de Patinho Desfiada, Bacon e",
"     Calabresa 200g",
"     * TD13 - Escondidinho de Patinho",
"     com Batata Inglesa e Queijo 200g",
"     * TD18-Patinho Moido a Bolonhesa",
"     com Arroz e Feijao 200g",
"     * TD26- Macarrao Talharim com",
"     Carne Moida de Patinho a Bolonhesa",
"     200g",
"     * SO04- Sopa de Feijao com",
"     Macarrao (Minestra) 400g",
"     SERVIR",
"     ++ Consumir depois (congelado)",
"----------------------------------------",
"Total Itens:                      102,50",
"Tx. Entrega:                       10,00",
"TOTAL PEDIDO:                     112,50",
"                            ------------",
"TOTAL PAGO:                         0,00",
"TOTAL A PAGAR:                    112,50",
"TROCO:                              0,00",
"",
"F. PAGAMENTO.: CARTaO DE DeBITO",
"(MAQUININHA) (ELO)",
].join("\n");

describe("Comprovantes P10 colados no WhatsApp", () => {
  it("interpreta cliente, telefone, endereço de Rio Negrinho, horário e cartão débito Elo", () => {
    const p = interpretarResumoWhatsapp(comprovante);
    expect(p.nome).toBe("Cliente Exemplo");
    expect(p.telefone).toBe("(47) 99999-1234");
    expect(p.metodoEntrega).toBe("entrega");
    expect(p.endereco).toEqual({
      rua: "TRAVESSA DAS FLORES", numero: "144",
      bairro: "CENTRO", cidade: "RIO NEGRINHO",
    });
    expect(p.complemento).toBe("SALA 105 - PROMOTORIA - MPSC");
    expect(p.referencia).toBe("1º ANDAR");
    expect(p.horario).toBe("16/10 - 15:00 - 18:00");
    expect(p.pagamento).toBe("cartao");
    expect(p.tipoCartao).toContain("Débito");
    expect(p.tipoCartao).toContain("ELO");
    expect(p.observacoesAdicionais).toBe("Consumir depois (congelado)");
  });
  it("registra exatamente seis sabores, cada um com sua gramatura, sem duplicar combo", () => {
    const p = interpretarResumoWhatsapp(comprovante);
    expect(p.itens).toEqual(["TD02","TD05","TD13","TD18","TD26","SO04"].map(codigo => ({codigo,quantidade:1})));
    expect(p.itensDetalhados.map(i => i.peso)).toEqual(["200g","200g","200g","200g","200g","400g"]);
    expect(p.quantidadeDeclarada).toBe(6);
    expect(p.itensDetalhados.reduce((sum, i) => sum + i.quantidade, 0)).toBe(6);
  });
  it("divide R$ 102,50 apenas entre os sabores sem perder centavos", () => {
    const p = interpretarResumoWhatsapp(comprovante);
    expect(p.subtotalDeclarado).toBe(102.5);
    expect(Math.round(p.itensDetalhados.reduce((s, i) => s + (i.precoUnitario || 0) * i.quantidade, 0) * 100)).toBe(10250);
    expect(p.taxaEntrega).toBe(10);
    expect(p.totalPedido).toBe(112.5);
    expect(p.avisos.some(a => a.includes("Valores por sabor distribuídos"))).toBe(true);
    expect(p.avisos.some(a => a.includes("divergentes"))).toBe(false);
  });
  it("reconhece divergências e não inventa abatimento por pagamento", () => {
    const p = interpretarResumoWhatsapp(comprovante.replace("TOTAL A PAGAR:                    112,50", "TOTAL A PAGAR:                    100,00"));
    expect(p.avisos.some(a => a.includes("TOTAL A PAGAR"))).toBe(true);
    expect(p.totalPedido).toBe(112.5);
    expect(p.cashbackUsado).toBe(0);
  });
  it("não quebra um pedido WhatsApp tradicional", () => {
    const p = interpretarResumoWhatsapp("Pedido João - SBS:\n1xTD02\n1xTD09\nEntrega: 5,00\nTotal: R$ 40,00");
    expect(p.nome).toBe("João");
    expect(p.itens).toEqual([{codigo:"TD02",quantidade:1},{codigo:"TD09",quantidade:1}]);
  });
});

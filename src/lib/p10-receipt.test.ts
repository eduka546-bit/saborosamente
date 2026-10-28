import { describe, expect, it } from "vitest";
import { encontrarProdutoP10, normalizarAgendamentoP10, parseP10Receipt } from "./p10-receipt";
import { dataEntregaProgramada, pedidoDaRota } from "./entregadores-resumo";

const catalogo = [
  "TD01 - Tiras de Alcatra ao Molho Madeira e Arroz com Brócolis",
  "TD02 - Almôndegas ao Molho Sugo com Arroz e Batata Rústica",
  "TD08 - Parmegiana de Frango com Arroz e Batata Rústica",
  "TD11 - Estrogonofe de Carne com Arroz Branco e Legumes",
  "TD14 - Filé de Tilápia Assada com Tomate e Purê de Batata Doce ao Molho Pesto",
  "TD17 - Frango Empanado Americano com Arroz e Feijão",
  "TD19 - Lasanha de Frango",
  "TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa",
  "TD26 - Macarrão Talharim com Carne Moída de Patinho à Bolonhesa",
  "CO01 - Frango Desfiado 150g",
  "CO06 - Carne de Panela 150g",
].map((nome, n) => ({ id: String(n), nome, codigo_integracao: null }));

describe("Leitura dos comprovantes P10", () => {
  it("reconhece um combo de cinco pratos com sabores sem código e tamanho do cabeçalho", () => {
    const cupom = `Cliente: Cliente de Teste
Fone: (00) 00000-0000
F. ENTREGA: ENTREGA EM CASA (50m)(12:27)
Qtd  Descricao             V.Uni V.Total
1    COMBO PRATOS MAIS      80,00  80,00
     VENDIDOS - 5UN
     TAMANHO
     * 5 Refeicoes 200g P
     ESCOLHA
     ++ Alcatra ao Molho Madeira com
     Arroz e Brocolis
     ++ File de Tilapia e Tomate Seco
     com Pure de Batata Doce ao Molho
     Pesto
     ++ Lasanha de Carne
     ++ Macarrao Talharim com Carne
     Moida de Patinho a Bolonhesa
     ++ Parmegiana de Frango com Arroz
     e Batata Rustica
Total Itens: 80,00
Tx. Entrega: 6,00
TOTAL PEDIDO: 86,00
TOTAL PAGO: 86,00
TOTAL A PAGAR: 0,00
F. PAGAMENTO.: PAGAMENTO ONLINE`;
    const result = parseP10Receipt(cupom);
    expect(result.quantidadeEsperada).toBe(5);
    expect(result.itens).toHaveLength(5);
    expect(result.itens.map(item => item.tamanho)).toEqual(Array(5).fill("200g"));
    expect(result.itens.map(i => encontrarProdutoP10(i, catalogo)?.nome.slice(0, 4)))
      .toEqual(["TD01", "TD14", "TD20", "TD26", "TD08"]);
    expect(result.total).toBe(86);
    expect(result.taxa).toBe(6);
    expect(result.dados.totalPago).toBe(86);
  });

  it("reconhece combos por código e complementos 150g sem interpretar SERVIR como produto", () => {
    const cupom = `Cliente: Cliente de Teste
F. ENTREGA: ENTREGA AGENDADA0
AGENDADO: 30/10 - 15:00 - 18:00
Bairro: BELA VISTA / RIO NEGRINHO
Qtd  Descricao             V.Uni V.Total
1 COMBO 5 A 9 UNIDADES 84,50 84,50
SABOR
* TD02- Almondegas ao Molho Sugo
com Arroz e Batata Rustica 200g
* TD08- Parmegiana de Frango com
Arroz e Batata Rustica 200g
* TD11- Estrogonofe de Carne com
Arroz e Brocolis 200g
* TD17- Frango Empanado Americano
com Arroz e Feijao 200g
* TD19- Lasanha de Frango 200g
SERVIR
++ Consumir depois (congelado)
1 CO07- CARNE DE PANELA 9,90 9,90
150G
SERVIR
++ Consumir depois (congelado)
1 CO01- FRANGO DESFIADO 9,90 9,90
150G
SERVIR
++ Consumir depois (congelado)
Total Itens: 104,30
Tx. Entrega: 10,00
TOTAL PEDIDO: 114,30
TOTAL PAGO: 0,00
TOTAL A PAGAR: 114,30
F. PAGAMENTO.: CARTAO DE CREDITO (MAQUININHA)`;
    const result = parseP10Receipt(cupom);
    expect(result.itens).toHaveLength(7);
    expect(result.itens.map(i => i.codigo))
      .toEqual(["TD02", "TD08", "TD11", "TD17", "TD19", "CO07", "CO01"]);
    expect(result.itens.map(i => i.tamanho))
      .toEqual(["200g", "200g", "200g", "200g", "200g", "150g", "150g"]);
    expect(result.itens.slice(0, 5).every(i => !!encontrarProdutoP10(i, catalogo))).toBe(true);
    expect(encontrarProdutoP10(result.itens[5], catalogo)).toBeUndefined();
    expect(encontrarProdutoP10(result.itens[6], catalogo)?.nome).toMatch(/^CO01/);
    expect(result.dados.agendado).toBe("30/10 - 15:00 - 18:00");
    const agendado = normalizarAgendamentoP10(result.dados.agendado, new Date("2026-10-28T16:00:00Z"));
    expect(agendado).toBe("30/10/2026 - 15:00 - 18:00");
    const pedido = {
      id: "p10-exemplo", status: "pendente", metodo_entrega: "entrega",
      endereco_cidade: result.dados.cidade, horario_recebimento: "Agendado: " + agendado,
    };
    expect(dataEntregaProgramada(pedido)).toBe("2026-10-30");
    expect(pedidoDaRota(pedido, "sexta", "2026-10-30")).toBe(true);
    expect(pedidoDaRota(pedido, "sexta", "2026-11-06")).toBe(false);
    expect(normalizarAgendamentoP10("31/12 - 15:00", new Date("2026-12-31T16:00:00Z"))).toBe("31/12/2026 - 15:00");
    expect(normalizarAgendamentoP10("01/01 - 15:00", new Date("2026-12-31T16:00:00Z"))).toBe("01/01/2027 - 15:00");
    expect(result.dados.cidade).toBe("RIO NEGRINHO");
    expect(result.total).toBe(114.3);
    expect(result.taxa).toBe(10);
    expect(result.dados.totalAPagar).toBe(114.3);
  });
});

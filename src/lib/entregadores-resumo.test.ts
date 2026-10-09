import { describe, expect, it } from "vitest";
import {
  cobrancaNoMotorista, dataEntregaProgramada, diaDaSemana,
  enderecoCompleto, pedidoDaRota, proximaDataRota, rotaDaCidade,
  textoResumoEntregador, type PedidoRota,
} from "./entregadores-resumo";

const base: PedidoRota = {
  id: "pedido-a", nome_cliente: "Cliente Exemplo", endereco_cidade: "Rio Negro",
  endereco_rua: "Rua Ermelino Becker", endereco_numero: "53", endereco_bairro: "Centro",
  metodo_entrega: "entrega", status: "preparando", valor_total: 127.5,
  metodo_pagamento: "cartao",
};

describe("resumo de entregas para motoristas", () => {
  it("agendamento: Corupá terça; outras cidades sexta; nunca São Bento do Sul", () => {
    expect(rotaDaCidade("Corupá")).toBe("terca");
    expect(rotaDaCidade(" CORUPA ")).toBe("terca");
    expect(rotaDaCidade("Mafra")).toBe("sexta");
    expect(rotaDaCidade("RIO NEGRO")).toBe("sexta");
    expect(rotaDaCidade("Rio Negrinho")).toBe("sexta");
    expect(rotaDaCidade("Piên")).toBe("sexta");
    expect(rotaDaCidade("São Bento do Sul")).toBeNull();
    expect(rotaDaCidade("SBS")).toBeNull();
    expect(proximaDataRota("terca", "2026-10-09")).toBe("2026-10-13");
    expect(proximaDataRota("sexta", "2026-10-09")).toBe("2026-10-09");
    expect(diaDaSemana("2026-10-13")).toBe(2);
  });

  it("não mistura pedidos programados para outra sexta, cancelados, entregues ou retirada", () => {
    const agendado = { ...base, horario_recebimento: "16/10/2026 • 17:30h ~ 18:30h" };
    expect(dataEntregaProgramada(agendado)).toBe("2026-10-16");
    expect(pedidoDaRota(agendado, "sexta", "2026-10-09")).toBe(false);
    expect(pedidoDaRota(agendado, "sexta", "2026-10-16")).toBe(true);
    expect(pedidoDaRota({ ...base, status: "cancelado" }, "sexta", "2026-10-09")).toBe(false);
    expect(pedidoDaRota({ ...base, status: "entregue" }, "sexta", "2026-10-09")).toBe(false);
    expect(pedidoDaRota({ ...base, metodo_entrega: "retirada" }, "sexta", "2026-10-09")).toBe(false);
    expect(pedidoDaRota({ ...base, endereco_cidade: "São Bento do Sul" }, "sexta", "2026-10-09")).toBe(false);
    expect(pedidoDaRota({ ...base, endereco_cidade: "Corupá" }, "sexta", "2026-10-09")).toBe(false);
  });

  it("exibe valor e forma somente se dinheiro ou cartão de crédito/débito", () => {
    expect(cobrancaNoMotorista({ ...base, metodo_pagamento: "Dinheiro" })).toContain("R$");
    expect(cobrancaNoMotorista({ ...base, metodo_pagamento: "Cartão Crédito" })).toContain("Cartão de crédito");
    expect(cobrancaNoMotorista({ ...base, metodo_pagamento: "Cartão Débito" })).toContain("Cartão de débito");
    expect(cobrancaNoMotorista({ ...base, metodo_pagamento: "cartao", tipo_cartao: "Visa débito" })).toContain("Cartão de débito");
    for (const metodo of ["pix", "PIX", "Link de pagamento", "mercadopago", "P10", "transferência", "alimentacao", "nao_informado", "Cartão Alimentação"]) {
      expect(cobrancaNoMotorista({ ...base, metodo_pagamento: metodo })).toBeNull();
    }
  });

  it("formata endereço completo e complementos", () => {
    const e = enderecoCompleto({
      ...base, endereco_complemento: "Casa 2", endereco_referencia: "Ao lado da farmácia", endereco_cep: "83880-000",
    });
    expect(e).toContain("Rua Ermelino Becker, 53");
    expect(e).toContain("Bairro Centro");
    expect(e).toContain("Compl.: Casa 2");
    expect(e).toContain("Ref.: Ao lado da farmácia");
  });

  it("texto não revela valor, cartão ou PIX quando cliente já pagou, sem omitir nome/endereço", () => {
    const paisagem: PedidoRota[] = [
      { ...base, id: "a", nome_cliente: "Marcela Feliski", metodo_pagamento: "cartao" },
      { ...base, id: "b", nome_cliente: "Maria Eduarda", metodo_pagamento: "pix" },
      { ...base, id: "c", nome_cliente: "Outra Cliente", metodo_pagamento: "Link de pagamento" },
    ];
    const t = textoResumoEntregador(paisagem, "sexta", "2026-10-09");
    expect(t).toContain("Marcela Feliski - Cidade: Rio Negro");
    expect(t).toContain("Rua Ermelino Becker, 53");
    expect(t.match(/Valor e forma de pagamento/g)).toHaveLength(1);
    expect(t).not.toContain("PIX");
    expect(t).not.toContain("Link de pagamento");
    expect(t).toContain("Total de entregas: 3");
  });

  it("listas vazias e endereços ausentes não compartilham clientes indevidamente", () => {
    expect(textoResumoEntregador([ { ...base, endereco_rua: "", endereco: "" } ], "sexta", "2026-10-09")).toContain("Total de entregas: 0");
    expect(textoResumoEntregador([base], "terca", "2026-10-13")).not.toContain("Cliente Exemplo");
  });
});

import { describe, expect, it } from "vitest";
import { normalizarTelefoneBrasileiro, telefonesDoMesmoContato, pedidosVisiveisAoContato } from "./whatsapp-ia-privacy";

describe("segurança da consulta de pedidos pelo WhatsApp", () => {
  it.each([
    ["+55 (47) 99999-9999", "47999999999"],
    ["5547999999999", "47999999999"],
    ["(47) 99999-9999", "+55 47 99999-9999"],
    ["4799999999", "47999999999"],
    ["+55 (47) 9999-9999", "4799999999"],
  ])("aceita o mesmo número em formatos diferentes (%s)", (a,b) => {
    expect(telefonesDoMesmoContato(a,b)).toBe(true);
  });
  it.each([
    ["47999999999", "48999999999"],
    ["5547999999999", "5548999999999"],
    ["47999999999", "47988888888"],
    ["47999999999", ""],
    ["", "47999999999"],
    ["ABC", "XYZ"],
    ["1234", "1234"],
  ])("rejeita números diferentes/inválidos (%s)",(a,b) => {
    expect(telefonesDoMesmoContato(a,b)).toBe(false);
  });
  it("não aceita somente o protocolo de outro cliente como autorização", () => {
    const pedidos = [
      { id:"12345678-dead-4afe-9a12-121212121212",telefone_cliente:"+55 47 99999-9999",status:"entregue" },
      { id:"abcdef12-beef-4afe-9a12-232323232323",telefone_cliente:"+55 48 98888-8888",status:"preparando" },
    ];
    expect(pedidosVisiveisAoContato(pedidos,"5547999999999","abcdef12")).toEqual([]);
    expect(pedidosVisiveisAoContato(pedidos,"5547999999999","12345678")).toEqual([pedidos[0]]);
    expect(pedidosVisiveisAoContato(pedidos,"5547999999999")).toEqual([pedidos[0]]);
  });
  it("falha fechada quando número está ausente ou é inválido", () => {
    expect(normalizarTelefoneBrasileiro("12")).toBeNull();
    expect(pedidosVisiveisAoContato([{id:"12345678",telefone_cliente:null}], "5547999999999")).toEqual([]);
  });
  it("não aceita protocolos curtos demais",() => {
    expect(pedidosVisiveisAoContato([{id:"abcdef12",telefone_cliente:"47999999999"}], "47999999999","a")).toEqual([]);
  });
});

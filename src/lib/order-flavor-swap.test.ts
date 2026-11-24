import { describe, expect, it } from "vitest";
import { permiteTrocarSaborPedido, saldoParaTroca, tamanhoDeEstoqueTroca } from "./order-flavor-swap";

describe("troca operacional de sabores", () => {
  it("usa o tamanho da marmita na mesma coluna de estoque", () => {
    expect(tamanhoDeEstoqueTroca("marmita", "Peso: 200g | Congelada")).toBe("200g");
    expect(tamanhoDeEstoqueTroca("marmita", "Peso: 300g")).toBe("300g");
    expect(tamanhoDeEstoqueTroca("marmita", "400g")).toBe("400g");
    expect(tamanhoDeEstoqueTroca("marmita", "")).toBeNull();
  });
  it("usa estoque de 200g para complemento 150g e de 400g para sopa", () => {
    expect(saldoParaTroca({id:"1",tipo_produto:"complemento",estoque_200g:6},"150g")).toBe(6);
    expect(saldoParaTroca({id:"2",tipo_produto:"sopa",estoque_400g:9},"400g")).toBe(9);
  });
  it("não libera trocas para pedidos sem baixa, entregues ou cancelados", () => {
    const item={id:"a",produto_id:"b",quantidade:3,produtos:{tipo_produto:"marmita"}};
    expect(permiteTrocarSaborPedido({status:"pendente",estoque_baixado:true},item,"300g")).toBe(true);
    expect(permiteTrocarSaborPedido({status:"pendente",estoque_baixado:false},item,"300g")).toBe(false);
    expect(permiteTrocarSaborPedido({status:"entregue",estoque_baixado:true},item,"300g")).toBe(false);
    expect(permiteTrocarSaborPedido({status:"cancelado",estoque_baixado:true},item,"300g")).toBe(false);
    expect(permiteTrocarSaborPedido({status:"rascunho",estoque_baixado:true},item,"300g")).toBe(false);
  });
  it("não confunde personalizadas, combos ou marmitas sem tamanho", () => {
    expect(permiteTrocarSaborPedido({status:"pendente",estoque_baixado:true},{id:"x",produto_id:null,quantidade:1,produtos:{tipo_produto:"marmita"}},"300g")).toBe(false);
    expect(permiteTrocarSaborPedido({status:"pendente",estoque_baixado:true},{id:"x",produto_id:"y",quantidade:1,produtos:{tipo_produto:"combo"}},"300g")).toBe(false);
    expect(permiteTrocarSaborPedido({status:"pendente",estoque_baixado:true},{id:"x",produto_id:"y",quantidade:1,produtos:{tipo_produto:"marmita"}},"")).toBe(false);
  });
});

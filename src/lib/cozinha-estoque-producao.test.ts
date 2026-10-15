import { describe, it, expect } from "vitest";
import { consultarEstoquePronto } from "./cozinha-estoque-producao";

describe("estoque pronto durante cadastro de produção", () => {
  const loja = { estoque_200g: 10, estoque_300g: 0, estoque_400g: 3 };
  const cozinha = { estoque_200g: 4, estoque_300g: 7, estoque_400g: 1 };
  it("soma apenas marmitas prontas por tamanho na loja e cozinha", () => {
    expect(consultarEstoquePronto(loja, cozinha, "200")).toEqual({loja:10,cozinha:4,total:14});
    expect(consultarEstoquePronto(loja, cozinha, "300")).toEqual({loja:0,cozinha:7,total:7});
    expect(consultarEstoquePronto(loja, cozinha, "400")).toEqual({loja:3,cozinha:1,total:4});
  });
  it("registro ausente na cozinha é estoque zero sem somar unidades planejadas", () => {
    expect(consultarEstoquePronto(loja, null, "200")).toEqual({loja:10,cozinha:0,total:10});
  });
  it("não inventa estoque de 150g em coluna inexistente", () => {
    expect(consultarEstoquePronto(loja, cozinha, "150")).toBeNull();
  });
  it("preserva saldos negativos se houver falta registrada", () => {
    expect(consultarEstoquePronto({estoque_200g:-2},{estoque_200g:5},"200")?.total).toBe(3);
  });
});

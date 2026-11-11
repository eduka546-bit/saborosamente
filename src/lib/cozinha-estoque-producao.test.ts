import { describe, it, expect } from "vitest";
import { consultarEstoquePronto, indexarEstoqueMarmitasCozinha } from "./cozinha-estoque-producao";

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

// A tabela cozinha_estoque_marmitas é indexada por produto_id, não por id.
describe("índice de saldo da cozinha após atualizar lista", () => {
  it("recupera corretamente as quantidades de cada produto pelo seu id de catálogo", () => {
    const registros = [
      { produto_id: "td01", estoque_200g: 3, estoque_300g: 0, estoque_400g: 0 },
      { produto_id: "td02", estoque_200g: 2, estoque_300g: 0, estoque_400g: 5 },
      { produto_id: "so06", estoque_200g: 0, estoque_300g: 0, estoque_400g: 12 },
      { produto_id: "co04", estoque_200g: 3, estoque_300g: 0, estoque_400g: 0 },
    ];
    const mapa = indexarEstoqueMarmitasCozinha(registros);
    expect(mapa.size).toBe(4);
    expect(mapa.get("td01")?.estoque_200g).toBe(3);
    expect(mapa.get("td02")?.estoque_400g).toBe(5);
    expect(mapa.get("so06")?.estoque_400g).toBe(12);
    expect(mapa.get("co04")?.estoque_200g).toBe(3);
    expect(mapa.get("produto inexistente")).toBeUndefined();
  });

  it("atualiza os valores indexados ao receber nova lista do servidor", () => {
    const antes = indexarEstoqueMarmitasCozinha([{ produto_id: "td20", estoque_300g: 0 }]);
    const depois = indexarEstoqueMarmitasCozinha([{ produto_id: "td20", estoque_300g: 21 }]);
    expect(antes.get("td20")?.estoque_300g).toBe(0);
    expect(depois.get("td20")?.estoque_300g).toBe(21);
  });
});

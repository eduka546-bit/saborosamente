import { describe, expect, it } from "vitest";
import { extrairMontagemPersonalizadaPedido } from "./marmita-personalizada-pedido";

describe("montagem de marmita personalizada no painel de pedidos", () => {
  it("mostra o tamanho, peso, data, preparo e todas as gramaturas do checkout", () => {
    const montagem = extrairMontagemPersonalizadaPedido({
      nome_item: "Marmita Personalizada (M)",
      observacao: "PERSONALIZADA M (340g) | Personalizada prevista para: 12/11/2026 • Retirada na loja | 100g Bovino (Patinho) (Tiras) + 80g Arroz (Branco) + 80g Feijão (Preto) + 80g Mix de legumes",
    });
    expect(montagem).toEqual({
      tamanho: "M",
      pesoTotal: 340,
      previsao: "12/11/2026 • Retirada na loja",
      ingredientes: [
        { nome: "Bovino (Patinho)", gramatura: 100, modoPreparo: "Tiras" },
        { nome: "Arroz", gramatura: 80, modoPreparo: "Branco" },
        { nome: "Feijão", gramatura: 80, modoPreparo: "Preto" },
        { nome: "Mix de legumes", gramatura: 80, modoPreparo: null },
      ],
    });
  });
  it("mostra molho sem gramatura separadamente dos ingredientes pesados", () => {
    const montagem = extrairMontagemPersonalizadaPedido({
      observacao: "Peso: 400g | PERSONALIZADA GG (520g) | Personalizada prevista para: 29/10/2026 | 220g Frango (Iscas) + 100g Arroz (Branco) + 100g Feijão (Preto) + 50g Brócolis + Sugo",
    });
    expect(montagem?.tamanho).toBe("GG");
    expect(montagem?.ingredientes.at(-1)).toEqual({
      nome: "Sugo", gramatura: null, modoPreparo: null,
    });
  });
  it("não inventa preparo para itens manuais ou produtos normais", () => {
    expect(extrairMontagemPersonalizadaPedido({
      nome_item: "Marmitas personalizadas (300g)",
      observacao: "Item manual sem baixa de estoque",
    })).toBeNull();
    expect(extrairMontagemPersonalizadaPedido({
      nome_item: "Frango com arroz", observacao: "Peso: 300g | Congelada",
    })).toBeNull();
  });
});

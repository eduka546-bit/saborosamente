import { describe, expect, it } from "vitest";
import { extrairMontagemPersonalizadaPedido, formatarMontagemPersonalizadaPedido, mensagemPersonalizadasCozinha } from "./marmita-personalizada-pedido";

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

describe("comanda de personalizadas", () => {
  it("preserva a montagem do modal e agrupa as combinações por quantidade", () => {
    const observacao = formatarMontagemPersonalizadaPedido({
      tamanhoSigla: "M", pesoTotal: 310,
      itens: [
        { nome: "Frango", gramatura: 180, modoPreparo: "Grelhado" },
        { nome: "Arroz", gramatura: 130 },
        { nome: "Sugo", gramatura: 0 },
        { nome: "Excedente proteína 10g (+R$ 0,70)", gramatura: 0 },
      ],
    });
    const mensagem = mensagemPersonalizadasCozinha({
      id: "12345678-abcd", nome_cliente: "Cliente",
      itens: [
        { nome_item: "Marmita Personalizada (M)", quantidade: 3, observacao: "Item manual sem baixa de estoque | " + observacao },
        { nome_item: "Marmita Personalizada (P)", quantidade: 4, observacao: "PERSONALIZADA P (200g) | 100g Frango + 100g Arroz" },
        { nome_item: "Marmita normal", quantidade: 2, observacao: "Peso: 300g" },
        { nome_item: "Marmitas personalizadas (300g)", quantidade: 1 },
      ],
    });
    expect(mensagem).toContain("Total: 8 un.");
    expect(mensagem).toContain("3x Personalizada M (310g por un.)");
    expect(mensagem).toContain("180g de Frango (Grelhado)");
    expect(mensagem).toContain("Sugo — sem gramatura");
    expect(mensagem).toContain("4x Personalizada P (200g por un.)");
    expect(mensagem).toContain("Montagem não registrada");
    expect(mensagem).not.toContain("Excedente");
    expect(mensagem).not.toContain("Marmita normal");
    expect(mensagemPersonalizadasCozinha({ itens: [{ nome_item: "Sopa", quantidade: 2 }] })).toBe("");
  });
});

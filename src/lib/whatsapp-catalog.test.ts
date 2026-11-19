import { describe, expect, it } from "vitest";
import { MARMITA_PRICE_TABLE } from "./combo-rules";
import { catalogMessage, catalogSearch, catalogVariants, type CatalogProduct } from "./whatsapp-catalog";

const marmita: CatalogProduct = { id: "teste", nome: "TD12 - Frango Grelhado", tipo_produto: "marmita", preco: 16.9, preco_300g: 20.9, preco_400g: 23.9, estoque_200g: 0, estoque_300g: 4, estoque_400g: 7, imagem_url: "https://example.com/default.png", imagem_300g: "https://example.com/300.png" };
describe("catálogo da central de WhatsApp", () => {
  it("usa a tabela de preços do site, a imagem e estoque específicos de cada tamanho", () => {
    const tabela = { ...MARMITA_PRICE_TABLE, "300g": { ...MARMITA_PRICE_TABLE["300g"], unit: 24.9 } };
    const variants = catalogVariants(marmita, tabela);
    expect(variants.map(v => v.label)).toEqual(["200g", "300g", "400g"]);
    expect(variants[1]).toMatchObject({ price: 24.9, stock: 4, image: "https://example.com/300.png", orderable: true });
    expect(variants[2].image).toBe(marmita.imagem_url);
  });
  it("não oferece gramaturas indisponíveis e respeita sopas e complementos", () => {
    expect(catalogVariants({ ...marmita, preco_300g: null, preco_400g: null }, MARMITA_PRICE_TABLE)).toHaveLength(1);
    expect(catalogVariants({ id: "sopa", nome: "Canja", tipo_produto: "sopa", preco: 18, estoque_400g: 2 }, MARMITA_PRICE_TABLE)).toMatchObject([{ label: "400g", weight: "400g", price: 18, stock: 2 }]);
    expect(catalogVariants({ id: "comp", nome: "Complemento", tipo_produto: "complemento", preco: 8.9, estoque_200g: 3 }, MARMITA_PRICE_TABLE)).toMatchObject([{ label: "150g", weight: "200g", price: 8.9, stock: 3 }]);
  });
  it("não lança combos como produtos avulsos", () => {
    const [variant] = catalogVariants({ id: "combo", nome: "Combo 5 unidades", tipo_produto: "combo", preco: 80, peso: "5 unidades" }, MARMITA_PRICE_TABLE);
    expect(variant).toMatchObject({ orderable: false, label: "5 unidades", price: 80, stock: null });
  });
  it("mensagem com negrito, quebras, preço e link, sem prometer estoque zerado", () => {
    const [variant] = catalogVariants(marmita, MARMITA_PRICE_TABLE);
    const text = catalogMessage(marmita, variant);
    expect(text).toContain("*TD12 - Frango Grelhado*\n📦 200g\n💰");
    expect(text).toContain("Consulte disponibilidade");
    expect(text).toContain("https://saborosamente.com/produto/teste");
    expect(catalogSearch("ALMÔNDEGAS")).toBe("almondegas");
  });
});

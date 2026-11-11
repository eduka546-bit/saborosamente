import { describe, expect, it } from "vitest";
import { interpretarMensagemEstoqueCozinha } from "./cozinha-estoque-importacao";

const codigos = ["TD01","TD10","TD22","TD17","TD12","TD19","CO04","TD11","TD20","TD04","TD24","TD08","TD02","TD21","TD03","TD16","TD28","SO07","SO08","SO06"];
const produtos = codigos.map((codigo) => ({
  id: codigo,
  nome: codigo + " - Produto cadastrado",
  tipo_produto: codigo.startsWith("SO") ? "sopa" : codigo.startsWith("CO") ? "complemento" : "marmita",
}));

const mensagem = [
  "*Estoque Cozinha:*",
  "",
  "Panqueca de Carne 200g - 6",
  "Frango Americano 200g - 4",
  "Esc. Frango 200g - 7",
  "Lasanha Frango 200g - 4",
  "Tiras de Bife 150g - 10",
  "Est. Carne 300g - 11",
  "Est. Carne 200g - 6",
  "Las. Carne 200g - 13",
  "Vaca Atolada 300g - 3",
  "Vaca Atolada 400g - 8",
  "Est. Carne 400g - 24",
  "Carbonara 300g - 7",
  "Esc. Frango 300g - 7",
  "Parm. Frango 300g - 15",
  "Alm. Sugo 200g - 4",
  "Vaca Atolada 200g - 4",
  "Panqueca Frango 200g - 9",
  "Nhoque 400g - 5",
  "Esc. Frango 400g - 2",
  "Lasanha Frango 400g - 2",
  "Lasanha Frango 300g - 6",
  "Panqueca Carne 300g - 3",
  "Nhoque 300g - 9",
  "Tiras de Bife 200g - 5",
  "Tiras Bife 300g - 10",
  "Tiras Bife 400g - 4",
  "Penne Alla Creme 200g - 8",
  "Penne Alla Creme 300g - 9",
  "Penne Alla Creme 400g - 8",
  "Creme Abóbora - 10",
  "Creme Mandioquinha - 17",
  "Canja Galinha - 18",
].join("\n");

describe("interpretação do estoque de marmitas da cozinha", () => {
  it("interpreta os 32 lançamentos e os 258 itens da mensagem original", () => {
    const resultado = interpretarMensagemEstoqueCozinha(mensagem, produtos);
    expect(resultado.erros).toEqual([]);
    expect(resultado.itens).toHaveLength(32);
    expect(resultado.total).toBe(258);
    expect(resultado.itens.find((item) => item.tamanho === "150")).toEqual({
      produto_id: "CO04", nome: "CO04 - Produto cadastrado", tamanho: "150", quantidade: 10,
    });
    expect(resultado.itens.find((item) => item.produto_id === "SO06")).toMatchObject({
      tamanho: "400", quantidade: 18,
    });
  });

  it("bloqueia a atualização quando houver nomes desconhecidos e linhas inválidas", () => {
    const resultado = interpretarMensagemEstoqueCozinha("Produto desconhecido 200g - 4\nPanqueca Carne 200g - x", produtos);
    expect(resultado.erros).toHaveLength(2);
  });

  it("aceita quantidade antes do produto e abreviações de produção", () => {
    const resultado = interpretarMensagemEstoqueCozinha([
      "10 Penne alla creme - 300g",
      "11 Penne alla creme - 200g",
      "9 tiras de alcatra - 400g",
      "8 tiras de alcatra - 300g",
      "4 tiras de alcatra - 200g",
      "8 Estr. Frango - 400",
      "10 Estr. Frango - 300",
      "4 tiras de carne - 150g",
    ].join("\n"), produtos);
    expect(resultado.erros).toEqual([]);
    expect(resultado.total).toBe(64);
    expect(resultado.itens).toEqual(expect.arrayContaining([
      expect.objectContaining({ produto_id: "TD28", tamanho: "300", quantidade: 10 }),
      expect.objectContaining({ produto_id: "TD01", tamanho: "400", quantidade: 9 }),
      expect.objectContaining({ produto_id: "TD10", tamanho: "400", quantidade: 8 }),
      expect.objectContaining({ produto_id: "CO04", tamanho: "150", quantidade: 4 }),
    ]));
  });

  it("aceita lista compacta como no admin e linhas individuais para sopas e complementos", () => {
    const resultado = interpretarMensagemEstoqueCozinha(
      "*Estoque Cozinha:*\nTD02 - 4/2/6\nSO06 - 9\nCO04 - 7",
      produtos,
    );
    expect(resultado.erros).toEqual([]);
    expect(resultado.itens).toHaveLength(5);
    expect(resultado.total).toBe(28);
    expect(resultado.itens).toEqual(expect.arrayContaining([
      expect.objectContaining({ produto_id: "TD02", tamanho: "200", quantidade: 4 }),
      expect.objectContaining({ produto_id: "TD02", tamanho: "300", quantidade: 2 }),
      expect.objectContaining({ produto_id: "TD02", tamanho: "400", quantidade: 6 }),
      expect.objectContaining({ produto_id: "SO06", tamanho: "400", quantidade: 9 }),
      expect.objectContaining({ produto_id: "CO04", tamanho: "150", quantidade: 7 }),
    ]));
  });


  it("aceita integralmente o relatório enviado: nomes completos, títulos, zeros e todas as gramaturas", () => {
    const catalogoCompleto = [
      ...Array.from({ length: 28 }, (_, i) => String(i + 1).padStart(2, "0")).map((n) => ({
        id: "TD" + n, nome: "TD" + n + " - Produto cadastrado", tipo_produto: "marmita",
      })),
      ...Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((n) => ({
        id: "SO" + n, nome: "SO" + n + " - Produto cadastrado", tipo_produto: "sopa",
      })),
      ...Array.from({ length: 6 }, (_, i) => String(i + 1).padStart(2, "0")).map((n) => ({
        id: "CO" + n, nome: "CO" + n + " - Produto cadastrado", tipo_produto: "complemento",
      })),
    ];
    const texto = "*MARMITAS* _(200g / 300g / 400g)_\n• TD01 - Tiras de Alcatra ao Molho Madeira e Arroz com Brócolis - 3 / 0 / 0\n• TD02 - Almôndegas ao Molho Sugo com Arroz e Batata Rústica - 2 / 0 / 5\n• TD03 - Nhoque de Batata ao Molho Bolonhesa com Carne Moída de Patinho - 5 / 0 / 0\n• TD04 - Vaca Atolada (Carne de Panela com Aipim) - 0 / 0 / 0\n• TD05 - Arroz Carreteiro com Carne de Patinho Desfiada, Bacon e Calabresa - 0 / 0 / 0\n• TD06 - Frango Grelhado ao Molho Sugo com Arroz e Brócolis - 0 / 0 / 0\n• TD07 - Sobrecoxa Ensopada com Purê de Aipim - 0 / 0 / 0\n• TD08 - Parmegiana de Frango com Arroz e Batata Rústica - 0 / 0 / 0\n• TD09 - Parmegiana de Carne com Arroz e Batata Rústica - 2 / 0 / 0\n• TD10 - Estrogonofe de Frango com Arroz Branco e Legumes - 3 / 0 / 0\n• TD11 - Estrogonofe de Carne com Arroz Branco e Legumes - 0 / 0 / 3\n• TD12 - Escondidinho de Frango com Batata Inglesa e Queijo - 0 / 0 / 0\n• TD13 - Escondidinho de Patinho com Batata Inglesa e Queijo - 0 / 0 / 0\n• TD14 - Filé de Tilápia Assada com Tomate e Purê de Batata Doce ao Molho Pesto - 5 / 10 / 12\n• TD15 - Feijoada com Arroz e Couve Mineira - 0 / 0 / 0\n• TD16 - Tiras de Bife ao Molho com Arroz Branco e Feijão Preto - 0 / 0 / 0\n• TD17 - Frango Empanado Americano com Arroz e Feijão - 4 / 7 / 0\n• TD18 - Patinho Moído à Bolonhesa com Arroz e Feijão Preto - 0 / 0 / 0\n• TD19 - Lasanha de Frango - 7 / 0 / 0\n• TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa - 4 / 21 / 19\n• TD21 - Panqueca de Frango com Queijo - 17 / 0 / 0\n• TD22 - Panqueca de Carne com Queijo a Bolonhesa - 3 / 0 / 0\n• TD23 - Macarrão Penne na Manteiga com Frango Grelhado ao Creme - 0 / 0 / 0\n• TD24 - Espaguete à Carbonara com Ovos Mexidos e Bacon - 0 / 0 / 0\n• TD25 - Espaguete com Almôndegas com Queijo à Bolonhesa - 2 / 10 / 3\n• TD26 - Macarrão Talharim com Carne Moída de Patinho à Bolonhesa - 9 / 11 / 13\n• TD27 - Macarrão Penne ao Molho 4 Queijos com Bacon e Calabresa - 0 / 0 / 0\n• TD28 - Macarrão Penne alla Creme com Tiras de Alcatra - 6 / 0 / 9\n\n*SOPAS*\n• SO01 - Sopa de Frango com Legumes - 0\n• SO02 - Sopa de Carne com Legumes - 0\n• SO03 - Sopa de Legumes - 0\n• SO04 - Sopa de Feijão com Macarrão (Minestra) - 0\n• SO05 - Sopa de Bucho - 0\n• SO06 - Canja de Galinha com Arroz - 12\n• SO07 - Creme de Abóbora Cabotia com Carne Desfiada - 9\n• SO08 - Creme de Mandioquinha  com Frango e Bacon - 8\n• SO09 - Creme de Batata Inglesa com Carne Desfiada - 0\n• SO10 - Caldo de Aipim com Carne Moída - 0\n• SO11 - Caldo Verde Português - 0\n• SO12 - Caldo de Peixe (Tilápia) - 0\n\n*COMPLEMENTOS*\n• CO01 - Frango Desfiado 150g - 0\n• CO02 - Frango Americano 150g - 0\n• CO03 - Frango Ensopado 150g - 0\n• CO04 - Tiras de Carne de Patinho 150g - 3\n• CO05 - Carne Moída de Patinho à Bolonhesa 150g - 0\n• CO06 - Carne de Panela 150g - 0";
    const resultado = interpretarMensagemEstoqueCozinha(texto, catalogoCompleto);
    expect(resultado.erros).toEqual([]);
    expect(resultado.itens).toHaveLength(102); // 28 marmitas x 3 + 12 sopas + 6 complementos
    expect(resultado.total).toBe(227);
    expect(resultado.itens.filter((item) => item.quantidade === 0).length).toBeGreaterThan(50);
    expect(resultado.itens.filter((item) => item.produto_id === "TD14").map((item) => item.quantidade)).toEqual([5, 10, 12]);
    expect(resultado.itens.filter((item) => item.produto_id === "TD20").map((item) => item.quantidade)).toEqual([4, 21, 19]);
    expect(resultado.itens.find((item) => item.produto_id === "SO06")).toMatchObject({ tamanho: "400", quantidade: 12 });
    expect(resultado.itens.find((item) => item.produto_id === "CO04")).toMatchObject({ tamanho: "150", quantidade: 3 });
    expect(resultado.itens.filter((item) => item.produto_id === "TD04").map((item) => item.quantidade)).toEqual([0, 0, 0]);
  });

  it("não permite repetir um tamanho já citado na lista compacta", () => {
    const resultado = interpretarMensagemEstoqueCozinha("TD02 - 1/2/3\nTD02 300g - 4", produtos);
    expect(resultado.erros).toHaveLength(1);
    expect(resultado.erros[0]).toContain("repetido");
  });

  it("não aceita duplicação, gramatura ausente de marmita ou troca de tamanho de sopa", () => {
    expect(interpretrar("Nhoque 300g - 3\nNhoque 300g - 5")).toHaveLength(1);
    expect(interpretrar("Nhoque - 3")).toHaveLength(1);
    expect(interpretrar("Creme Abóbora 200g - 3")).toHaveLength(1);
  });
});

function interpretrar(texto: string) {
  return interpretarMensagemEstoqueCozinha(texto, produtos).erros;
}

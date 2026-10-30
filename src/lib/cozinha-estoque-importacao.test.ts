import { describe, expect, it } from "vitest";
import { interpretarMensagemEstoqueCozinha } from "./cozinha-estoque-importacao";

const codigos = ["TD22","TD17","TD12","TD19","CO04","TD11","TD20","TD04","TD24","TD08","TD02","TD21","TD03","TD16","TD28","SO07","SO08","SO06"];
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

  it("não aceita duplicação, gramatura ausente de marmita ou troca de tamanho de sopa", () => {
    expect(interpretrar("Nhoque 300g - 3\nNhoque 300g - 5")).toHaveLength(1);
    expect(interpretrar("Nhoque - 3")).toHaveLength(1);
    expect(interpretrar("Creme Abóbora 200g - 3")).toHaveLength(1);
  });
});

function interpretrar(texto: string) {
  return interpretarMensagemEstoqueCozinha(texto, produtos).erros;
}

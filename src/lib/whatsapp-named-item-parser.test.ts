import { describe, expect, it } from "vitest";
import { interpretarListaSaboresPorNome, type ProdutoPorNome } from "./whatsapp-named-item-parser";

const produtos: ProdutoPorNome[] = [
  {id:"s06",nome:"SO06 - Canja de Galinha com Arroz",tipo_produto:"sopa",preco:18},
  {id:"s12",nome:"SO12 - Caldo de Peixe (Tilápia)",tipo_produto:"sopa",preco:18},
  {id:"s09",nome:"SO09 - Creme de Batata Inglesa com Carne Desfiada",tipo_produto:"sopa",preco:18},
  {id:"t28",nome:"TD28 - Macarrão Penne alla Creme com Tiras de Alcatra",tipo_produto:"marmita",preco:16.9,preco_300g:20.9,preco_400g:23.9},
  {id:"t16",nome:"TD16 - Tiras de Bife ao Molho com Arroz Branco e Feijão Preto",tipo_produto:"marmita",preco:16.9,preco_300g:20.9,preco_400g:23.9},
  {id:"t11",nome:"TD11 - Estrogonofe de Carne com Arroz Branco e Legumes",tipo_produto:"marmita",preco:16.9,preco_300g:20.9,preco_400g:23.9},
  {id:"t10",nome:"TD10 - Estrogonofe de Frango com Arroz Branco e Legumes",tipo_produto:"marmita",preco:16.9,preco_300g:20.9,preco_400g:23.9},
  {id:"t01",nome:"TD01 - Tiras de Alcatra ao Molho Madeira e Arroz com Brócolis",tipo_produto:"marmita",preco:16.9,preco_300g:20.9,preco_400g:23.9},
  {id:"t09",nome:"TD09 - Parmegiana de Carne com Arroz e Batata Rústica",tipo_produto:"marmita",preco:16.9,preco_300g:20.9,preco_400g:23.9},
  {id:"t08",nome:"TD08 - Parmegiana de Frango com Arroz e Batata Rústica",tipo_produto:"marmita",preco:16.9,preco_300g:20.9,preco_400g:23.9},
];
const texto = [
  "2x Sopa de canja",
  "Sopa de tilapia",
  "2x Creme de batata inglesa com carne desfiada",
  "Todas de 400g:",
  "Macarrao penne com tiras de alcatra",
  "Bife ao molho com arroz e feijao",
  "Estrognofe de carne",
  "Estrognofe de frango",
  "Tiras de alcatra ao molho madeira com arroz e brocolis",
  "Parmegiana de carne",
].join("\n");

describe("interpretação de lista de sabores por nome no WhatsApp", () => {
  it("reconhece todos os 11 produtos do exemplo, 5 sopas e 6 refeições G", () => {
    const p = interpretarListaSaboresPorNome(texto,produtos);
    expect(p.naoIdentificados).toEqual([]);
    expect(p.avisos).toEqual([]);
    expect(p.itens.map(i=>[i.productId,i.quantidade,i.peso])).toEqual([
      ["s06",2,"400g"],
      ["s12",1,"400g"],
      ["s09",2,"400g"],
      ["t28",1,"400g"],
      ["t16",1,"400g"],
      ["t11",1,"400g"],
      ["t10",1,"400g"],
      ["t01",1,"400g"],
      ["t09",1,"400g"],
    ]);
    expect(p.itens.reduce((sum,item)=>sum+item.quantidade,0)).toBe(11);
    expect(p.itens.slice(0,3).every(it=>it.precoUnitario===18)).toBe(true);
    expect(p.itens.slice(3).every(it=>it.precoUnitario===23.9)).toBe(true);
  });

  it("reconhece preço Black para sopas e marmitas 400g com >=5 itens", () => {
    const p = interpretarListaSaboresPorNome(texto,produtos,{blackFridayAtiva:true});
    expect(p.naoIdentificados).toEqual([]);
    expect(p.itens.slice(0,3).every(i=>i.precoUnitario===16)).toBe(true);
    expect(p.itens.slice(3).every(i=>i.precoUnitario===20)).toBe(true);
    const soma=p.itens.reduce((sum,it)=>sum+it.quantidade*it.precoUnitario,0);
    expect(soma).toBe(200);
  });

  it("não confunde tilápia com marmita de peixe e carne com frango", () => {
    const p = interpretarListaSaboresPorNome(
      "Sopa de tilapia\nParmegiana de carne\nEstrogonofe de frango\nEstrogonofe de carne",
      produtos,
    );
    expect(p.itens.map(i=>i.productId)).toEqual(["s12","t09","t10","t11"]);
    expect(p.naoIdentificados).toEqual([]);
  });

  it("informa ingredientes desconhecidos sem descartar os outros itens silenciosamente", () => {
    const p = interpretarListaSaboresPorNome(
      texto + "\nHamburguer de salmão",
      produtos,
      {blackFridayAtiva:true},
    );
    expect(p.itens).toHaveLength(9);
    expect(p.naoIdentificados).toEqual(["Hamburguer de salmão"]);
  });

  it("não inventa produto ausente do catálogo, mesmo que esteja no dicionário de apelidos", () => {
    const semSopa = produtos.filter(p=>p.id!=="s12");
    const p = interpretarListaSaboresPorNome("Sopa de tilapia",semSopa);
    expect(p.itens).toEqual([]);
    expect(p.naoIdentificados).toEqual(["Sopa de tilapia"]);
  });

  it("respeita cabeçalhos, quantidade explícita e tamanhos sem alterar sopa 400g", () => {
    const p = interpretarListaSaboresPorNome(
      "Pedido Cliente Exemplo\nTelefone: 47 99999-9999\nSopas:\n2x Sopa de canja\nMarmitas 200g:\n3x Parmegiana de carne",
      produtos,
      {blackFridayAtiva:true},
    );
    expect(p.naoIdentificados).toEqual([]);
    expect(p.itens.map(i=>[i.productId,i.quantidade,i.peso,i.precoUnitario])).toEqual([
      ["s06",2,"400g",16],["t09",3,"200g",14],
    ]);
  });

  it("não supõe 400g se um sabor de marmita vem sem indicação de gramatura", () => {
    const p = interpretarListaSaboresPorNome("Estrognofe de frango",produtos);
    expect(p.itens).toEqual([expect.objectContaining({productId:"t10",peso:"300g"})]);
    expect(p.avisos.some(v=>v.includes("Tamanho não informado"))).toBe(true);
  });
});

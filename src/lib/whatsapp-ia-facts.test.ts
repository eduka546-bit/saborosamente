import { describe, expect, it } from "vitest";
import { montarFatosIA, perguntaSemIdentificadores } from "./whatsapp-ia-facts";
import { precoMarmitaPorFaixa } from "./combo-rules";

const prato = {
  id: "p", nome: "Frango", tipo_produto: "marmita", ativo: true, visivel_online: true,
  preco: 100, preco_300g: 100, preco_400g: 100, controle_estoque: true,
  estoque_200g: 4, estoque_300g: 0, estoque_400g: null,
  ingredientes: "frango, arroz, industrializado", categorias: { nome: "Tradicionais" },
};

describe("fatos apresentados ao assistente de WhatsApp", () => {
  const tamanhos = ["200g", "300g", "400g"] as const;
  const quantidades = [1, 2, 4, 5, 6, 9, 10, 11, 19, 20, 21, 50];
  const cases = tamanhos.flatMap(t => quantidades.map(q => [t, q] as const));
  it.each(cases)("preço real do checkout %s, %i unidades", (peso, qtd) => {
    const { tabelaPrecosMarmitas } = montarFatosIA([prato], [], {});
    const faixa = qtd >= 20 ? "t20" : qtd >= 10 ? "t10" : qtd >= 5 ? "t5" : "unit";
    expect(tabelaPrecosMarmitas[peso][faixa]).toBe(precoMarmitaPorFaixa(peso, qtd, 100));
  });
  it.each(["Mafra", "Rio Negro", "Rio Negrinho", "Campo Alegre", "Piên", "Pien"])("rota semanal %s", cidade => {
    const f = montarFatosIA([], [{cidade, bairro: "Centro", valor: 12}], {});
    expect(f.cidades[0]).toMatchObject({ dias: ["Sexta-feira"], minimoUnidades: 5, limiteMesmoDia: { hora: 11, minuto: 30 } });
    expect(f.cidades[0].bairros).toEqual([{ bairro: "Centro", taxa: 12 }]);
  });
  it("Corupá às terças", () => {
    expect(montarFatosIA([], [{cidade: "Corupá", bairro: "Centro", valor: 10}], {}).cidades[0].dias).toEqual(["Terça-feira"]);
  });
  it("SBS segue agenda configurada", () => {
    const f = montarFatosIA([], [{cidade: "São Bento do Sul", bairro: "Centro", valor: 10}], {parametros_loja:{entrega:{diasPermitidos:[2,4], horarios:["14h"], qtdDatas:1}}});
    expect(f.cidades[0]).toMatchObject({dias:["Terça-feira","Quinta-feira"], horarios:["14h"]});
  });
  it.each([
    [false,true], [true,false], [false,false], [null,true], [true,undefined],
  ])("não divulga produto não público (%s, %s)", (ativo, visivel_online) => {
    expect(montarFatosIA([{...prato, ativo, visivel_online}], [], {}).catalogo).toHaveLength(0);
  });
  it("estoque individual por tamanho", () => {
    expect(montarFatosIA([prato], [], {}).catalogo[0].tamanhos.map(v => v.disponibilidade)).toEqual(["em estoque","esgotado","confirmar"]);
  });
  it("estoque não controlado não promete disponibilidade", () => {
    expect(montarFatosIA([{...prato, controle_estoque:false}], [], {}).catalogo[0].tamanhos.every(v => v.disponibilidade === "confirmar")).toBe(true);
  });
  it("alteração de preço no painel é refletida no contexto", () => {
    const f = montarFatosIA([prato], [], {parametros_loja:{precos_marmita:{"200g":{unit:22,t5:21}}}});
    expect(f.catalogo[0].tamanhos[0].precoUnitario).toBe(22);
    expect(f.tabelaPrecosMarmitas["200g"].t5).toBe(21);
  });
  it("omite meios de pagamento desativados", () => {
    expect(montarFatosIA([],[], {payment_methods:[{label:"Pix"},{label:"Cheque",enabled:false}]}).pagamentos).toEqual(["Pix"]);
  });
  it("não divulga ingredientes privados", () => {
    expect(montarFatosIA([prato],[],{}).catalogo[0].ingredientes).not.toContain("industrializado");
  });
  it("personalizada segue configuração atual e opções ativas", () => {
    const f = montarFatosIA([],[],{parametros_loja:{marmita_personalizada:{ativo:false,minUnidades:8}}},[{id:"1",nome:"Proteína",ativo:true}], [{grupo_id:"1",nome:"Frango",ativo:true},{grupo_id:"1",nome:"Carne",ativo:false}]);
    expect(f.personalizada).toMatchObject({ativo:false,minUnidades:8,ingredientes:[{grupo:"Proteína",opcoes:[{nome:"Frango"}]}]});
  });
  it("não inclui dados pessoais da configuração da loja", () => {
    expect(JSON.stringify(montarFatosIA([],[],{secret:"segredo-privado",config_impressao:{secret:"segredo-privado"}}))).not.toContain("segredo-privado");
  });
  it.each(["123.456.789-00", "12345678900", "(47) 99999-9999", "+55 47 99999-9999", "nome@exemplo.com"])("oculta identificador %s", valor => {
    expect(perguntaSemIdentificadores("Meu dado é " + valor)).not.toContain(valor);
  });
  it("mantém a pergunta comercial", () => {
    expect(perguntaSemIdentificadores("Quanto custam 20 marmitas de 400g?")).toBe("Quanto custam 20 marmitas de 400g?");
  });
});

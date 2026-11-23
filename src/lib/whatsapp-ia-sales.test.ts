import { describe, expect, it } from "vitest";
import { ESTADO_VENDA_VAZIO, normalizarEstadoVenda, validarTransicaoVenda,
  resumirVenda, sugestoesDeVenda, textoProximaFaixa, type EstadoVenda } from "./whatsapp-ia-sales";

const p=(id:string,nome:string,stock=50,extra:Record<string,unknown>={})=>({
  id,nome,tipo_produto:"marmita",ativo:true,visivel_online:true,controle_estoque:true,
  estoque_200g:stock,estoque_300g:stock,estoque_400g:stock,
  preco:16.9,preco_300g:20.9,preco_400g:23.9,
  tabela_nutricional_300g:{kcal:250,prot:30},...extra,
});
const produtos=[
  p("a","Frango Grelhado"),p("b","Tilápia Assada"),p("c","Lasanha de Carne"),
  p("d","Arroz com Brócolis"),p("e","Frango com Legumes",12),
  p("esgotado","Refeição Esgotada",0),
  p("oculto","Item Oculto",100,{visivel_online:false}),
  p("sopa","Sopa de Legumes",50,{tipo_produto:"sopa",preco:12}),
];
const item=(quantity:number,productId="a",weight:"200g"|"300g"|"400g"="300g")=>({productId,weight,quantity});
const estado=(itens:EstadoVenda["itens"],recebimento:EstadoVenda["recebimento"]=ESTADO_VENDA_VAZIO.recebimento):EstadoVenda=>({itens,recebimento});
const resumir=(e:EstadoVenda,pendencias:string[]=[])=>resumirVenda(e,{itens:e.itens,pendencias},produtos,{},["São Bento do Sul","Rio Negrinho","Campo Alegre"]);

describe("bateria de 100 simulações determinísticas de venda (sem disparos e sem OpenAI)",()=>{
  // 10 cenários: preços por quantidade, inclusive nas fronteiras das quatro faixas.
  it.each([1,2,3,4,5,6,9,10,19,20])("preço de %i unidades usa tabela fixa atual",q=>{
    const x=resumir(estado([item(q)]));
    const esperado=q>=20?18.9:q>=10?19.9:q>=5?20.5:20.9;
    expect(x.pedido.itens[0].unitPrice).toBe(esperado);
    expect(x.pedido.subtotal).toBeCloseTo(q*esperado,2);
    expect(x.resumo).toContain("Frete:* a confirmar");
  });
  // 10: IA não pode apagar silenciosamente itens existentes.
  it.each(["mais uma","qual o frete?","sexta-feira","me mostre opções","sou de Campo Alegre",
    "e no cartão?","esquente em 7 min?","quanto ficou?","ok","ótimo"])("preserva itens no diálogo '%s'",texto=>{
    const erros=validarTransicaoVenda(estado([item(3),item(2,"b")]),estado([item(3)]),texto);
    expect(erros.length).toBeGreaterThan(0);
  });
  // 10: retirada explícita, sem interferir com outros itens.
  it.each(["troca","trocar","retirar","remove","tirar","substituir","menos","reduzir","sem arroz","limpar"])("aceita retirada explicitamente pedida: %s",cmd=>{
    const erros=validarTransicaoVenda(estado([item(3),item(2,"b")]),estado([item(3)]),cmd+" uma unidade");
    expect(erros).toEqual([]);
  });
  // 10: estoque zerado ou insuficiente sempre vira pendência.
  it.each([1,2,3,4,5,6,7,8,9,10])("recusa quantidade %i em item esgotado",q=>{
    const x=resumir(estado([item(q,"esgotado")]));
    expect(x.pedido.itens).toEqual([]);
    expect(x.pendencias.some(p=>p.includes("estoque insuficiente"))).toBe(true);
    expect(x.aplicavelNoFormulario).toBe(false);
  });
  // 10: formatos inválidos nunca são registrados na memória do carrinho.
  it.each([0,-1,1.5,null,"2",101,NaN,Infinity,-100,0.5])("descarta quantidade inválida %s",v=>{
    const x=normalizarEstadoVenda({itens:[{productId:"a",weight:"300g",quantity:v}]});
    expect(x.itens).toEqual([]);
  });
  // 10: município e bairro insuficientes não são conclusão do pedido.
  it.each(["Rio Negrinho","Campo Alegre","São Bento do Sul","Mafra","Piên",
    "Corupá","Rio Negro","Curitiba","Joinville","Cidade Inventada"])("entrega em %s exige bairro e data",cidade=>{
    const x=resumir(estado([item(5)],{metodo:"entrega",cidade,bairro:"",horario:""}));
    expect(x.pendencias).toContain("Informe o bairro para consultar frete.");
    expect(x.pendencias.some(p=>p.includes("intervalo"))).toBe(true);
    expect(x.resumo).not.toMatch(/total final:\*\s*R\$/i);
  });
  // 10: ordem de valores no limiar deve motivar sugestão e não desconto fictício.
  it.each([1,2,3,4,6,7,8,9,16,19])("faixa seguinte em %i unidades é transparente",q=>{
    const x=resumir(estado([item(q)]));
    const aviso=textoProximaFaixa(x,{});
    expect(aviso).toContain("subtotal aumentará");
    expect(aviso).toContain("por unidade");
    expect(x.proximaFaixa?.faltam).toBe([5,10,20].find(t=>t>q)!-q);
  });
  // 10: esconder/indisponibilizar produtos dos rankings, sem inventar estoque.
  it.each([1,2,3,4,5,6,7,8,9,10])("rankings não incluem produtos ocultos/esgotados %i",n=>{
    const x=resumir(estado([item(n)]));
    const r=sugestoesDeVenda(x.pedido,produtos,{},["b","oculto","esgotado"]);
    expect(r.some(p=>["oculto","esgotado","a"].includes(p.productId))).toBe(false);
    expect(r[0].productId).toBe("b");
    expect(r.length).toBeLessThanOrEqual(3);
  });
  // 10: revisar o resumo e não criar recibos, reservas, promessas ou cobranças.
  it.each([1,2,3,4,5,6,7,8,9,10])("resumo não confirma operação para %i unidades",q=>{
    const x=resumir(estado([item(q)],{metodo:"retirada",cidade:"",bairro:"",horario:""}));
    expect(x.resumo).toContain("não é um pedido confirmado");
    expect(x.resumo).toContain("Total final:* a confirmar");
    expect(x.resumo).not.toMatch(/pagamento confirmado|estoque reservado|entrega garantida/i);
    expect(x.pendencias).not.toContain("Informe o bairro para consultar frete.");
  });
  // 10: comportamento sob pedidos parciais, impossíveis ou alterações suspeitas.
  it.each([
    {txt:"cliente pediu só sopa",s:[item(2,"sopa")]},
    {txt:"produto inexistente",s:[item(2,"fake")]},
    {txt:"produto oculto",s:[item(2,"oculto")]},
    {txt:"estoque insuficiente",s:[item(25,"e")]},
    {txt:"sem itens",s:[]},
    {txt:"repetição de item",s:[item(2),item(3)]},
    {txt:"duas gramaturas",s:[item(3),item(2,"a","400g")]},
    {txt:"quantidade 200 excede estoque",s:[item(100),item(100,"b")]},
    {txt:"100 itens sem estoque",s:[item(100,"esgotado")]},
    {txt:"somente entrega",s:[]},
  ])("caso %s sinaliza pedido para revisão sem criar pedido",({s})=>{
    const x=resumir(estado(s as EstadoVenda["itens"]));
    expect(x.pendencias.length).toBeGreaterThan(0);
    expect(x.resumo).toContain("prévia para revisão da equipe");
    expect(x.resumo).toContain("Subtotal das refeições");
    expect(x.aplicavelNoFormulario).toBe(x.pedido.itens.length>0&&x.pedido.pendencias.length===0);
  });
});

import { describe, expect, it } from "vitest";
import { montarFatosIA } from "./whatsapp-ia-facts";
import { respostaComercialDeterministica } from "./whatsapp-ia-commercial";

const base = {
  tipo_produto:"marmita",ativo:true,visivel_online:true,controle_estoque:true,
  estoque_200g:10,estoque_300g:10,estoque_400g:10,preco:16.9,preco_300g:20.9,preco_400g:23.9,
};
const dados = montarFatosIA([
  {...base,id:"tilapia",nome:"Filé de Tilápia com Tomate",estoque_300g:13,
    tabela_nutricional_200g:{kcal:150,prot:18},
    tabela_nutricional_300g:{kcal:225,prot:27},
    tabela_nutricional_400g:{kcal:300,prot:36}},
  {...base,id:"frango",nome:"Frango Grelhado com Arroz",estoque_300g:6,
    tabela_nutricional_200g:{kcal:124,prot:19},
    tabela_nutricional_300g:{kcal:186,prot:28},
    tabela_nutricional_400g:{kcal:248,prot:40}},
], [
  {cidade:"Campo Alegre",bairro:"Centro",valor:10},
  {cidade:"São Bento do Sul",bairro:"Centro",valor:9},
], {parametros_loja:{},payment_methods:[{label:"PIX",enabled:true},{label:"Cartão",enabled:true}]});

describe("IA comercial: cálculos verificáveis antes do modelo",()=>{
 const responder=(q:string)=>respostaComercialDeterministica(q,dados) || "";
 it.each([
  ["Quanto custa uma marmita de 200g?","R$ 16,90"],
  ["Qual o valor de 300g se eu levar 5 marmitas?","R$ 20,50"],
  ["Quanto ficam 10 refeições de 400g?","R$ 22,90"],
  ["Se comprar 20 marmitas de 300g, qual o preço de cada?","R$ 18,90"],
 ])("usa preço fixo correto: %s",(q,preco)=>{
  const result=responder(q).replace(/\u00a0/g," ");
  expect(result).toContain(preco.replace(/\u00a0/g," "));
 });
 it("diferencia 1 e 20 unidades",()=>{
  const r=responder("A marmita de 400g custa igual com 1 e 20 unidades?");
  expect(r).toContain("23,90");expect(r).toContain("21,90");
  expect(r).not.toContain("mesmo preço unitário");
 });
 it("não inventa preço da sopa nem gramatura no pedido misto",()=>{
  const r=responder("Se eu colocar 3 sopas e 7 marmitas, qual faixa vale?");
  expect(r).toContain("10 unidades");expect(r).toContain("10 a 19");
  expect(r).toContain("sabores das sopas");expect(r).not.toContain("R$ 18");
 });
 it("não adiciona taxa ao cartão",()=>{
  const r=responder("Vocês cobram acréscimo no débito?");
  expect(r).toContain("Não cobramos acréscimo");
  expect(r).not.toContain("R$ 1");
 });
 it("detecta peixe de 300g com estoque real",()=>{
  const r=responder("Vocês têm opção de peixe de 300g?");
  expect(r).toContain("Filé de Tilápia");expect(r).toContain("estoque cadastrado");
 });
 it("não aplica frete de SBS a Campo Alegre",()=>{
  const r=responder("Tenho interesse na promoção de entrega para Campo Alegre.");
  expect(r).toContain("exclusivo de São Bento do Sul");expect(r).toContain("sexta");
  expect(r).toContain("taxa depende do bairro");
 });
 it("não promete produção personalizada no mesmo dia",()=>{
  const r=responder("Quero 5 personalizadas de 350g para entregar hoje.");
  expect(r).toContain("próxima semana");expect(r).toContain("não consigo confirmar entrega para hoje");
 });
 it("mantém a comparação de marmitas leves baseada em kcal real",()=>{
  const r=responder("Qual marmita tem menos calorias em 200g?");
  expect(r).toContain("Frango Grelhado");expect(r).toContain("124 kcal");
  expect(r).not.toContain("Combo Pratos Mais Leves");
 });
 it("identifica proteína real por gramatura",()=>{
  const r=responder("Pode me indicar um prato com mais proteína de 400g?");
  expect(r).toContain("40 g de proteína");expect(r).toContain("Frango Grelhado");
 });
 it("informa opt-out de marketing acionável",()=>{
  expect(responder("Quero parar de receber publicidade no WhatsApp.")).toContain("PARAR");
 });
 it("pede cidade quando prazo depende da rota",()=>{
  expect(responder("Se eu pedir depois do horário limite, recebo hoje?")).toContain("Qual é a sua cidade");
 });
 it("não fecha pedido e não inventa preço sem informação",()=>{
  const r=responder("Pode garantir o total com frete de um pedido sem eu informar o bairro?");
  expect(r).not.toContain("R$");
 });
});

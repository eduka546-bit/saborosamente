import { describe, expect, it } from "vitest";
import {
  criarMemoriaCliente, pedidosRelacionadosAoTelefone,
  pesoDoItemHistorico, querRepetirUltimoPedido,
  repeticaoSemAlteracoes, contextoDePreferenciasParaIA, verificarTrocasDaRecompra,
} from "./whatsapp-ia-customer-memory";
import { validarSugestaoPedido } from "./whatsapp-ia-order";

const produtos=[
  {id:"p1",nome:"Frango Grelhado",tipo_produto:"marmita",ativo:true,visivel_online:true,
    preco:16.9,preco_300g:20.9,preco_400g:23.9,controle_estoque:true,estoque_200g:20,estoque_300g:10,estoque_400g:20},
  {id:"p2",nome:"Tilápia Assada",tipo_produto:"marmita",ativo:true,visivel_online:true,
    preco:16.9,preco_300g:20.9,preco_400g:23.9,controle_estoque:true,estoque_200g:20,estoque_300g:0,estoque_400g:20},
  {id:"secreto",nome:"Oculto",tipo_produto:"marmita",ativo:true,visivel_online:false,
    preco:2,controle_estoque:true,estoque_200g:100,estoque_300g:100,estoque_400g:100},
];
const pedidos=[
  {id:"n1",created_at:"2026-11-22T14:00:00Z",status:"cancelado",telefone_cliente:"47999999999",endereco_cidade:"SBS"},
  {id:"n2",created_at:"2026-11-20T14:00:00Z",status:"entregue",telefone_cliente:"+55 47 99999-9999",endereco_cidade:"São Bento do Sul"},
  {id:"n3",created_at:"2026-11-10T14:00:00Z",status:"entregue",cliente_telefone:"4799999999"},
  {id:"n4",created_at:"2026-11-21T14:00:00Z",status:"entregue",telefone_cliente:"48999999999",endereco_cidade:"Outra cidade"},
];
const itens=[
  {pedido_id:"n1",produto_id:"p1",quantidade:9,observacao:"Peso: 300g"},
  {pedido_id:"n2",produto_id:"p1",quantidade:5,observacao:"Peso: 300g"},
  {pedido_id:"n2",produto_id:"p2",quantidade:2,observacao:"Peso: 400g"},
  {pedido_id:"n2",produto_id:"secreto",quantidade:1,observacao:"Peso: 400g"},
  {pedido_id:"n3",produto_id:"p1",quantidade:3,observacao:"Peso: 300g"},
  {pedido_id:"n4",produto_id:"p2",quantidade:20,observacao:"Peso: 200g"},
];

describe("memória de compras do WhatsApp",()=>{
  it("confere o telefone completo; sufixo ou protocolo não bastam",()=>{
    expect(pedidosRelacionadosAoTelefone(pedidos,"5547999999999").map(p=>p.id)).toEqual(["n1","n2","n3"]);
    expect(pedidosRelacionadosAoTelefone(pedidos,"5548999999999").map(p=>p.id)).toEqual(["n4"]);
    expect(pedidosRelacionadosAoTelefone(pedidos,"9999")).toEqual([]);
  });
  it.each(["Peso: 200g","Peso 200g","Tamanho: 200g","gramatura-200 g","200g de frango"])("lê gramatura histórica: %s",(s)=>{
    expect(pesoDoItemHistorico(s)).toBe("200g");
  });
  it.each(["Peso desconhecido","5kg",null,""] )("não adivinha gramaturas: %s",s=>{
    expect(pesoDoItemHistorico(s)).toBeNull();
  });
  it("ignora cancelados, terceiros e produtos ocultos; preserva última compra reconhecida",()=>{
    const m=criarMemoriaCliente("5547999999999",pedidos,itens,produtos,{});
    expect(m.pedidosAnalisados).toBe(2);
    expect(m.pedidosEntregues).toBe(2);
    expect(m.ultimoPedido?.data).toBe("2026-11-20T14:00:00Z");
    expect(m.ultimoPedido?.cidade).toBe("São Bento do Sul");
    expect(m.ultimoPedido?.itens.map(i=>i.productId)).toEqual(["p1","p2"]);
    expect(m.ultimoPedido?.naoReconhecidos).toBe(1);
    expect(m.favoritos[0]).toMatchObject({nome:"Frango Grelhado",pedidos:2,unidades:8});
    expect(m.intervaloMedioDias).toBe(10);
  });
  it("não extrai telefone, endereço, CPF nem detalhes médicos do contexto para o modelo",()=>{
    const m=criarMemoriaCliente("5547999999999",pedidos,itens,produtos,{});
    const prompt=contextoDePreferenciasParaIA(m);
    expect(prompt).not.toContain("5547999999999");
    expect(prompt).not.toContain("São Bento do Sul");
    expect(prompt).not.toContain("n2");
    expect(prompt).toContain("Frango Grelhado");
  });
  it("sem histórico confirmado nunca inventa pedidos anteriores",()=>{
    const m=criarMemoriaCliente("5599999999999",pedidos,itens,produtos,{});
    expect(m.ultimoPedido).toBeNull();
    expect(m.favoritos).toEqual([]);
    expect(m.pedidosEntregues).toBe(0);
  });
  it("repetição simples distingue pedidos com troca, substituição ou variação",()=>{
    expect(repeticaoSemAlteracoes("Quero repetir exatamente o último pedido")).toBe(true);
    expect(repeticaoSemAlteracoes("Quero pedir o mesmo pedido da última vez")).toBe(true);
    expect(repeticaoSemAlteracoes("Repete o último, mas troca duas por algo mais leve")).toBe(false);
    expect(repeticaoSemAlteracoes("Quero o mesmo pedido sem arroz")).toBe(false);
    expect(querRepetirUltimoPedido("Repete meu pedido")).toBe(true);
    expect(repeticaoSemAlteracoes("Quero 5 marmitas de 400g")).toBe(false);
  });
  it("impede troca de duas unidades que altere o total ou troque quantidades erradas",()=>{
    const anterior=[{productId:"p1",nome:"Frango Grelhado",weight:"300g" as const,quantity:5},{productId:"p2",nome:"Tilápia Assada",weight:"400g" as const,quantity:5}];
    const correto=[{productId:"p1",weight:"300g",quantity:3},{productId:"p2",weight:"400g",quantity:5},{productId:"p3",weight:"300g",quantity:2}];
    expect(verificarTrocasDaRecompra("Repete o último, mas troca 2 marmitas por algo mais leve",anterior,correto)).toEqual([]);
    const somou=[...correto,{productId:"p3",weight:"300g",quantity:2}];
    expect(verificarTrocasDaRecompra("troca duas marmitas",anterior,somou).some(p=>p.includes("total"))).toBe(true);
    const uma=[{productId:"p1",weight:"300g",quantity:4},{productId:"p2",weight:"400g",quantity:5},{productId:"p3",weight:"300g",quantity:1}];
    expect(verificarTrocasDaRecompra("troca 2 marmitas",anterior,uma).some(p=>p.includes("2 unidades"))).toBe(true);
    expect(verificarTrocasDaRecompra("Quero apenas repetir",anterior,anterior)).toEqual([]);
  });
  it("recalcula preço e recusa estoque esgotado quando repete",()=>{
    const m=criarMemoriaCliente("5547999999999",pedidos,itens,produtos,{});
    const result=validarSugestaoPedido({
      itens:m.ultimoPedido?.itens.map(({productId,quantity,weight})=>({productId,quantity,weight})) ?? [],
      pendencias:[],
    },produtos,{});
    expect(result.itens).toHaveLength(2);
    expect(result.itens.map(x=>x.unitPrice)).toEqual([20.5,23.5]);
    expect(result.subtotal).toBe(5*20.5+2*23.5);
    const out=validarSugestaoPedido({
      itens:[{productId:"p2",weight:"300g",quantity:2}],pendencias:[],
    },produtos,{});
    expect(out.itens).toHaveLength(0);
    expect(out.pendencias.some(p=>p.includes("estoque insuficiente"))).toBe(true);
  });
});

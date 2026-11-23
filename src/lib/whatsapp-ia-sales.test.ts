import { describe, expect, it } from "vitest";
import { CENARIOS_VENDA } from "./whatsapp-ia-sales-scenarios";
import { conferirVenda, normalizarEstadoVenda, oportunidadeVenda,
  prepararVendaIA, resumoVendaWhatsApp, validarEntregaVenda, type EstadoVenda } from "./whatsapp-ia-sales";
import { montarFatosIA } from "./whatsapp-ia-facts";
import { validarSugestaoPedido } from "./whatsapp-ia-order";
import { precoMarmitaPorFaixa, normalizarPrecosMarmita } from "./combo-rules";

const produtos=[
  {id:"p1",nome:"Frango Grelhado com Arroz",tipo_produto:"marmita",categorias:{nome:"Pratos"},
    ativo:true,visivel_online:true,preco:16.9,preco_300g:20.9,preco_400g:23.9,
    controle_estoque:true,estoque_200g:40,estoque_300g:40,estoque_400g:40},
  {id:"p2",nome:"Tilápia com Batata Doce",tipo_produto:"marmita",categorias:{nome:"Pratos"},
    ativo:true,visivel_online:true,preco:16.9,preco_300g:20.9,preco_400g:23.9,
    controle_estoque:true,estoque_200g:12,estoque_300g:6,estoque_400g:12},
  {id:"p3",nome:"Produto oculto",tipo_produto:"marmita",categorias:{nome:"Pratos"},
    ativo:true,visivel_online:false,preco:16.9,preco_300g:20.9,preco_400g:23.9,
    controle_estoque:true,estoque_200g:100,estoque_300g:100,estoque_400g:100},
  {id:"p4",nome:"Canja de Frango",tipo_produto:"sopa",categorias:{nome:"Sopas"},
    ativo:true,visivel_online:true,preco:18,preco_300g:0,preco_400g:18,
    controle_estoque:true,estoque_200g:0,estoque_300g:0,estoque_400g:15},
  {id:"p5",nome:"Sem controle",tipo_produto:"marmita",categorias:{nome:"Pratos"},
    ativo:true,visivel_online:true,preco:16.9,preco_300g:20.9,preco_400g:23.9,
    controle_estoque:false,estoque_200g:null,estoque_300g:null,estoque_400g:null},
];
const fatos=montarFatosIA(produtos,[
  {cidade:"São Bento do Sul",bairro:"Centro",valor:9},
  {cidade:"Rio Negrinho",bairro:"Centro",valor:10},
  {cidade:"Campo Alegre",bairro:"Centro",valor:10},
],{parametros_loja:{},payment_methods:[{enabled:true,label:"Pix"}]});
const compra=(q=5,id="p1",weight="300g")=>({productId:id,weight,quantity:q});
const anterior=(q=5):EstadoVenda=>({itens:[compra(q) as EstadoVenda["itens"][number]],
  entrega:{modalidade:null,cidade:"",bairro:"",preferencia:""}});
const simular=(pergunta:string,acao:string,itens:any[],ant:unknown=anterior(5),entrega:any={})=>
  prepararVendaIA({raw:{acao,itens,entrega,pendencias:[]},anterior:ant,pergunta,
    produtos,precos:{},fatos});
const tabela=normalizarPrecosMarmita({});

describe("auditoria de 100 cenários sintéticos de venda",()=>{
  it("possui cem perguntas diferentes, dez categorias de dez",()=>{
    expect(CENARIOS_VENDA).toHaveLength(100);
    expect(new Set(CENARIOS_VENDA.map(c=>c.pergunta)).size).toBe(100);
    expect(new Set(CENARIOS_VENDA.map(c=>c.categoria)).size).toBe(10);
    for(let i=0;i<10;i++)
      expect(CENARIOS_VENDA.slice(i*10,i*10+10).every(c=>c.categoria===CENARIOS_VENDA[i*10].categoria)).toBe(true);
  });
  it.each(CENARIOS_VENDA)("cenário $id: $categoria — aplica barreiras comerciais e confirmação",c=>{
    const i=(c.id-1)%10;
    if(c.id<=10){
      const qty=i+1;
      const r=simular(c.pergunta,"atualizar",[compra(qty)],{itens:[],entrega:anterior().entrega});
      expect(r.estado.itens).toHaveLength(1);
      expect(r.pedido.itens[0].quantity).toBe(qty);
      expect(r.pedido.subtotal).toBeCloseTo(qty*precoMarmitaPorFaixa("300g",qty,20.9,tabela));
    }else if(c.id<=20){
      // Mensagem ambígua não pode substituir um carrinho por conta própria.
      const r=simular(c.pergunta,"manter",[],anterior(5));
      expect(r.estado.itens[0].quantity).toBe(5);
      expect(r.resumo).toContain("simulação");
    }else if(c.id<=30){
      const qty=i+1;
      const r=simular(c.pergunta,"atualizar",[compra(qty)],{itens:[],entrega:anterior().entrega});
      if(!r.pedido.itens.length){
        expect(r.pendencias.length).toBeGreaterThan(0);
        expect(r.podeAbrirRascunho).toBe(false);
      } else {
        expect(r.pedido.itens[0].unitPrice).toBe(precoMarmitaPorFaixa("300g",qty,20.9,tabela));
        expect(r.pedido.subtotal).toBeCloseTo(qty*r.pedido.itens[0].unitPrice);
      }
    }else if(c.id<=40){
      const p=i%2===0?"p3":"p2";
      const q=i%2===0?1:100;
      const r=simular(c.pergunta,"atualizar",[compra(q,p)],anterior(5));
      expect(r.estado.itens).toEqual(anterior(5).itens);
      expect(r.pendencias.length).toBeGreaterThan(0);
      expect(r.podeAbrirRascunho).toBe(false);
    }else if(c.id<=50){
      const city=i===4?"Cidade Inventada":i%2===0?"São Bento do Sul":"Rio Negrinho";
      const r=simular(c.pergunta,"manter",[],anterior(5),{
        modalidade:"entrega",cidade:city,bairro:"Centro",preferencia:"sexta à tarde",
      });
      expect(r.resumo).toContain("Frete");
      expect(r.resumo).toContain("checkout");
      expect(r.resumo).not.toContain("entrega confirmada");
      if(i===4)expect(r.pendencias.length).toBeGreaterThan(0);
      else if(i===6)expect(r.estado.entrega.cidade).toBe("");
      else expect(r.estado.entrega.cidade).toBe(city);
    }else if(c.id<=60){
      const r=simular(c.pergunta,"manter",[],anterior(5));
      expect(r.estado.itens[0].quantity).toBe(5);
      expect(r.resumo).toContain("não é um pedido confirmado");
    }else if(c.id<=70){
      const r=simular(c.pergunta,"manter",[],anterior(5));
      expect(r.resumo).not.toMatch(/cura diabetes|ausência de alérgenos garantida/i);
      expect(r.pedido.subtotal).toBeGreaterThan(0);
    }else if(c.id<=80){
      const r=simular(c.pergunta,"manter",[],anterior(5));
      expect(r.podeAbrirRascunho).toBe(true);
      expect(r.resumo).toContain("não é um pedido confirmado");
    }else if(c.id<=90){
      const r=simular(c.pergunta,"limpar",[],anterior(5));
      expect(r.estado.itens[0].quantity).toBe(5);
      expect(r.pendencias.some(p=>p.includes("não foi explícito"))).toBe(true);
    }else{
      const qty=[3,4,7,8,9,10,17,18,19,20][i];
      const r=simular(c.pergunta,"atualizar",[compra(qty)],{itens:[],entrega:anterior().entrega});
      const expected=qty>=20?null:qty<=4?5:qty<=9?10:20;
      if(!r.pedido.itens.length){
        expect(r.pendencias.length).toBeGreaterThan(0);
        expect(r.oportunidade).toBeNull();
      }else{
        expect(r.oportunidade?.proximaFaixa??null).toBe(expected&&expected-qty<=2?expected:null);
      }
      expect(r.oportunidade?.mensagem??"").not.toContain("desconto adicional de");
    }
  });
});

describe("fluxo de venda em múltiplas mensagens, sem operações reais",()=>{
  it("mantém os itens quando o cliente apenas pergunta por frete",()=>{
    const inicial=anterior(5);
    const r=simular("Qual é a taxa de entrega?","manter",[],inicial,{modalidade:"entrega",cidade:"Rio Negrinho",bairro:"Centro"});
    expect(r.estado.itens).toEqual(inicial.itens);
    expect(r.estado.entrega.cidade).toBe("Rio Negrinho");
    expect(r.pedido.subtotal).toBe(102.5);
  });
  it("acrescenta o segundo sabor e refaz toda a faixa de preço",()=>{
    const r=simular("Adiciona 5 de tilápia 300g","atualizar",[compra(5),compra(5,"p2")]);
    expect(r.pedido.itens).toHaveLength(2);
    expect(r.pedido.subtotal).toBe(199);
    expect(r.pedido.itens.every(x=>x.unitPrice===19.9)).toBe(true);
  });
  it("não remove produtos existentes em mensagem que só adiciona",()=>{
    const r=simular("Adicione três de tilápia","atualizar",[compra(3,"p2")]);
    expect(r.estado.itens).toEqual(anterior(5).itens);
    expect(r.pendencias.some(p=>p.includes("retirar itens"))).toBe(true);
  });
  it("aceita substituição expressa e não inventa confirmação",()=>{
    const r=simular("Troca duas de frango por tilápia","atualizar",[compra(3),compra(2,"p2")]);
    expect(r.estado.itens).toHaveLength(2);
    expect(r.pedido.subtotal).toBe(102.5);
    expect(r.resumo).toContain("não é um pedido confirmado");
  });
  it("impede item oculto ou acima do estoque, mesmo com preços inventados pelo modelo",()=>{
    const r=simular("Adicione um produto oculto","atualizar",[{...compra(1,"p3"),unitPrice:0.01}]);
    expect(r.estado.itens).toEqual(anterior(5).itens);
    expect(r.pendencias.length).toBeGreaterThan(0);
    const r2=simular("Adicione 100 tilápias","atualizar",[compra(5),{...compra(100,"p2"),unitPrice:0.01}]);
    expect(r2.estado.itens).toEqual(anterior(5).itens);
  });
  it("o preço do modelo é ignorado; valor vem do checkout",()=>{
    const r=simular("Quero seis marmitas","atualizar",[{...compra(6),unitPrice:9999}],{itens:[],entrega:anterior().entrega});
    expect(r.pedido.itens[0].unitPrice).toBe(20.5);
  });
  it("recusa quantidade decimal, negativa, texto e peso não cadastrado",()=>{
    for(const quantidade of [-1,0,1.5,"10"]){
      const r=simular("Quero esse item","atualizar",[{...compra(1),quantity:quantidade}]);
      expect(r.estado.itens).toEqual(anterior(5).itens);
    }
    const tam=simular("Quero 500g","atualizar",[{...compra(1),weight:"500g"}]);
    expect(tam.estado.itens).toEqual(anterior(5).itens);
  });
  it("limpa somente com pedido explícito para zerar o carrinho, não compra já paga",()=>{
    expect(simular("Zerar o carrinho","limpar",[]).estado.itens).toEqual([]);
    expect(simular("Cancelar pedido já pago","limpar",[]).estado.itens).toEqual(anterior(5).itens);
  });
  it("entrega para cidade desconhecida não vira rota confirmada",()=>{
    const r=simular("Entrega em Cidade Inexistente","manter",[],anterior(5),
      {modalidade:"entrega",cidade:"Cidade Inexistente",bairro:"Centro"});
    expect(r.estado.entrega.cidade).toBe("");
    expect(r.pendencias.length).toBeGreaterThan(0);
    expect(r.podeAbrirRascunho).toBe(false);
  });
  it("mudar a cidade limpa o bairro anterior para não misturar endereços",()=>{
    const ant=anterior(5);ant.entrega={modalidade:"entrega",cidade:"São Bento do Sul",bairro:"Centro",preferencia:""};
    const v=validarEntregaVenda({cidade:"Rio Negrinho"},ant.entrega,fatos);
    expect(v.entrega.cidade).toBe("Rio Negrinho");
    expect(v.entrega.bairro).toBe("");
  });
  it("retirada remove endereço de entrega sem guardar dados antigos",()=>{
    const ant=anterior(5);ant.entrega={modalidade:"entrega",cidade:"Rio Negrinho",bairro:"Centro",preferencia:"sexta"};
    const v=validarEntregaVenda({modalidade:"retirada"},ant.entrega,fatos);
    expect(v.entrega).toEqual({modalidade:"retirada",cidade:"",bairro:"",preferencia:""});
  });
  it("não sugere produtos escondidos/esgotados e não inclui item extra sem autorização",()=>{
    const r=simular("Pode sugerir uma unidade a mais?","atualizar",[compra(9)],{itens:[],entrega:anterior().entrega});
    expect(r.oportunidade?.faltam).toBe(1);
    expect(r.estado.itens).toHaveLength(1);
    expect(r.oportunidade?.opcoes.every(x=>x.productId!=="p3")).toBe(true);
  });
  it("revisão restaura estoque e preços sem chamada ao modelo",()=>{
    const r=conferirVenda({anterior:{itens:[{...compra(5),unitPrice:0.01}],entrega:anterior().entrega},
      produtos,precos:{},fatos});
    expect(r.pedido.itens[0].unitPrice).toBe(20.5);
    expect(r.pedido.subtotal).toBe(102.5);
  });
  it("não abre carrinho oficial quando falta conferir estoque",()=>{
    const r=simular("Adicionar prato sem estoque controlado","atualizar",[compra(5,"p5")],
      {itens:[],entrega:anterior().entrega});
    expect(r.pendencias.some(x=>x.includes("estoque não controlado"))).toBe(true);
    expect(r.podeAbrirRascunho).toBe(false);
  });
  it("trunca e normaliza campos não confiáveis do navegador",()=>{
    const r=normalizarEstadoVenda({itens:[{productId:"p1",weight:"300g",quantity:5,unitPrice:0.01}],
      entrega:{modalidade:"entrega",cidade:"A".repeat(200),bairro:"B".repeat(200),preferencia:"C".repeat(300)}});
    expect("unitPrice" in r.itens[0]).toBe(false);
    expect(r.entrega.cidade.length).toBe(80);
    expect(r.entrega.bairro.length).toBe(80);
    expect(r.entrega.preferencia.length).toBe(120);
  });
  it("não permite confirmar pedido de 10 unidades se a IA só identificou cinco",()=>{
    const r=simular("Quero 10 marmitas de 300g, cinco de frango e cinco sortidas",
      "atualizar",[compra(5)],{itens:[],entrega:anterior().entrega});
    expect(r.estado.itens[0].quantity).toBe(5);
    expect(r.pendencias.some(p=>p.includes("cliente pediu 10 unidades"))).toBe(true);
    expect(r.podeAbrirRascunho).toBe(false);
  });
  it("usa a taxa cadastrada do bairro para total estimado, mas não garante entrega",()=>{
    const r=simular("Quero entrega em Rio Negrinho Centro","manter",[],anterior(5),{
      modalidade:"entrega",cidade:"Rio Negrinho",bairro:"Centro",
    });
    expect(r.pedido.subtotal).toBe(102.5);
    expect(r.fretePrevisto).toBe(10);
    expect(r.totalPrevisto).toBe(112.5);
    expect(r.resumo).toContain("Total estimado");
    expect(r.resumo).toContain("checkout");
    expect(r.resumo).not.toContain("entrega confirmada");
  });
  it("frete promocional R$ 5,00 só vale em São Bento do Sul com 5 marmitas elegíveis",()=>{
    const sim=simular("Entrega em São Bento do Sul Centro","manter",[],anterior(5),{
      modalidade:"entrega",cidade:"São Bento do Sul",bairro:"Centro",
    });
    expect(sim.fretePrevisto).toBe(5);
    expect(sim.totalPrevisto).toBe(107.5);
    const abaixo=simular("Entrega em São Bento do Sul Centro","manter",[],anterior(4),{
      modalidade:"entrega",cidade:"São Bento do Sul",bairro:"Centro",
    });
    expect(abaixo.fretePrevisto).toBe(9);
  });
  it("retirada sempre tem frete zero e valor estimado igual ao subtotal",()=>{
    const r=simular("Quero retirada","manter",[],anterior(5),{modalidade:"retirada"});
    expect(r.fretePrevisto).toBe(0);
    expect(r.totalPrevisto).toBe(102.5);
    expect(r.resumo).toContain("Retirada na loja");
  });
  it("não calcula frete sem bairro e não promete total final",()=>{
    const r=simular("Entrega em Rio Negrinho","manter",[],anterior(5),{
      modalidade:"entrega",cidade:"Rio Negrinho",
    });
    expect(r.fretePrevisto).toBeNull();
    expect(r.totalPrevisto).toBeNull();
    expect(r.resumo).toContain("Frete: a confirmar");
  });
  it("economia por faixa já está incluída no subtotal, não aplica desconto duplicado",()=>{
    const r=simular("Quero 10 marmitas de frango de 300g","atualizar",[compra(10)],
      {itens:[],entrega:anterior().entrega});
    expect(r.pedido.subtotal).toBe(199);
    expect(r.economiaFaixa).toBe(10);
    expect(r.resumo).toContain("já incluída no subtotal");
  });
  it("rejeita três lasanhas quando a IA tenta acrescentar seis em um carrinho existente",()=>{
    const r=simular("Acrescente três lasanhas ao que já escolhi","atualizar",
      [compra(5),compra(3,"p2"),compra(3,"p4","400g")]);
    expect(r.estado.itens).toEqual(anterior(5).itens);
    expect(r.pendencias.some(p=>p.includes("acrescentar 3"))).toBe(true);
    expect(r.podeAbrirRascunho).toBe(false);
  });
  it("não aceita retirar três quando a pessoa pediu duas",()=>{
    const r=simular("Retire as duas últimas unidades","atualizar",[compra(2)],anterior(5));
    expect(r.estado.itens).toEqual(anterior(5).itens);
    expect(r.pendencias.some(p=>p.includes("remoção solicitada"))).toBe(true);
  });
  it("interpreta Retire as duas como remoção explícita válida",()=>{
    const r=simular("Retire as duas últimas unidades","atualizar",[compra(3)],anterior(5));
    expect(r.estado.itens[0].quantity).toBe(3);
    expect(r.pendencias).toEqual([]);
  });
  it("reconhece Zere o carrinho sem limpar pedidos pagos",()=>{
    expect(simular("Zere o carrinho de simulação","limpar",[]).estado.itens).toHaveLength(0);
    expect(simular("Quero cancelar pedido pago","limpar",[]).estado.itens).toEqual(anterior(5).itens);
  });
  it("quando existem várias receitas de frango, não aprova sabor genérico",()=>{
    const variados=[...produtos,{...produtos[0],id:"outro-frango",nome:"Parmegiana de Frango"}];
    const r=prepararVendaIA({pergunta:"Quero cinco marmitas de frango de 300g",anterior:{itens:[],entrega:anterior().entrega},
      raw:{acao:"atualizar",itens:[compra(5)],pendencias:[]},
      produtos:variados,precos:{},fatos});
    expect(r.pendencias.some(p=>p.includes("várias opções de frango"))).toBe(true);
    expect(r.podeAbrirRascunho).toBe(false);
  });
  it("elimina alerta vago gerado pela IA e sugere pergunta operacional",()=>{
    const r=simular("Quero cinco de frango de 300g","atualizar",[compra(5)],{
      itens:[],entrega:anterior().entrega,
    });
    expect(r.proximaPergunta).not.toContain("perguntas não respondidas");
    const raw=prepararVendaIA({raw:{acao:"manter",pendencias:["perguntas não respondidas"]},
      anterior:anterior(5),pergunta:"Quanto custa?",produtos,precos:{},fatos});
    expect(raw.pendencias).toEqual([]);
    expect(raw.proximaPergunta).toMatch(/entrega ou retirada/);
  });
  it("a pergunta de próximo passo exige método de entrega quando ausente",()=>{
    const p=validarSugestaoPedido({itens:[compra(5)]},produtos,{});
    const r=resumoVendaWhatsApp(p,{modalidade:null,cidade:"",bairro:"",preferencia:""},[],null);
    expect(r.proximaPergunta).toMatch(/entrega ou retirada/i);
  });
});

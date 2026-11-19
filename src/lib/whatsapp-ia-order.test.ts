import { describe, it, expect } from "vitest";
import { validarSugestaoPedido } from "./whatsapp-ia-order";
import { precoMarmitaPorFaixa, normalizarPrecosMarmita } from "./combo-rules";
import { formatarTreinamentos } from "./whatsapp-ia-training";
import { identificarAcaoMarketing } from "./whatsapp-marketing-replies";

const p = {id:"abc",nome:"Frango grelhado",tipo_produto:"marmita",ativo:true,visivel_online:true,preco:20,preco_300g:22,preco_400g:25,controle_estoque:true,estoque_200g:100,estoque_300g:100,estoque_400g:100};
const item = (quantity=2,weight="300g",productId="abc")=>({productId,quantity,weight,unitPrice:0.01});
describe("montagem de pedidos",()=>{
  it.each([1,4,5,9,10,19,20,50])("usa preço do site para %i unidades, ignora preço do modelo",q=>{
    const r=validarSugestaoPedido({itens:[item(q)],pendencias:[]},[p],{});
    expect(r.itens[0].unitPrice).toBe(precoMarmitaPorFaixa("300g",q,22,normalizarPrecosMarmita({})));
    expect(r.subtotal).toBe(Math.round(r.itens[0].unitPrice*q*100)/100);
  });
  it("agrupa duplicidades por peso",()=>{
    const r=validarSugestaoPedido({itens:[item(2),item(3),item(1,"200g")]},[p],{});
    expect(r.itens.map(x=>x.quantity)).toEqual([5,1]);
  });
  it("não aceita estoque insuficiente mesmo se dividido em linhas",()=>{
    const r=validarSugestaoPedido({itens:[item(3),item(3)]},[{...p,estoque_300g:5}],{});
    expect(r.itens).toHaveLength(0);expect(r.pendencias).toHaveLength(1);
  });
  it.each([0,-1,1.5,101,"2",null])("recusa quantidade inválida %s",q=>{
    expect(validarSugestaoPedido({itens:[{...item(),quantity:q}]},[p],{}).itens).toHaveLength(0);
  });
  it.each(["999g","150g","",null])("recusa peso não cadastrado %s",weight=>{
    expect(validarSugestaoPedido({itens:[{...item(),weight}]},[p],{}).itens).toHaveLength(0);
  });
  it.each([{ativo:false},{visivel_online:false},{tipo_produto:"combo"}])("não inclui produto indisponível ou combo %j",override=>{
    expect(validarSugestaoPedido({itens:[item()]},[{...p,...override}],{}).itens).toHaveLength(0);
  });
  it("não cria item que o catálogo não reconhece",()=>{
    expect(validarSugestaoPedido({itens:[item(1,"300g","inventado")]},[p],{}).itens).toHaveLength(0);
  });
  it("mantém pendências do modelo e não reserva estoque",()=>{
    const r=validarSugestaoPedido({itens:[item()],pendencias:["Confirme a entrega"]},[p],{});
    expect(r.pendencias).toContain("Confirme a entrega");expect(p.estoque_300g).toBe(100);
  });
  it("estoque desconhecido permanece explícito",()=>{
    expect(validarSugestaoPedido({itens:[item()]},[{...p,controle_estoque:false}],{}).itens[0].estoque).toBe(null);
  });
  it("limita pedidos excessivos",()=>{
    expect(validarSugestaoPedido({itens:[item(100),item(100),item(100)]},[p],{}).itens).toHaveLength(0);
  });
});
describe("treinamento e regras de campanha",()=>{
  it("só usa ensinamentos aprovados",()=>{
    const ctx=formatarTreinamentos([{pergunta:"P",resposta:"Certo",status:"aprovado"},{pergunta:"P",resposta:"ERRO",status:"pendente"},{pergunta:"P",resposta:"ANTIGO",status:"arquivado"}]);
    expect(ctx).toContain("Certo");expect(ctx).not.toContain("ERRO");expect(ctx).not.toContain("ANTIGO");
  });
  it("anonimiza identificadores",()=>{
    expect(formatarTreinamentos([{pergunta:"cpf 123.456.789-00",resposta:"nome@exemplo.com",status:"aprovado"}])).not.toMatch(/123\.456|nome@exemplo/);
  });
  it("usa rótulo com regra ativa",()=>{
    expect(identificarAcaoMarketing({button:{text:"Ver promoções"}},[{chave:"ver promocoes",acao:"menu_site",ativo:true}])).toBe("menu_site");
  });
  it("não ativa regra inativa, nem ação não autorizada",()=>{
    expect(identificarAcaoMarketing({button:{text:"Ver promoções"}},[{chave:"ver promocoes",acao:"menu_site",ativo:false}])).toBeNull();
    expect(identificarAcaoMarketing({button:{text:"Ver promoções"}},[{chave:"ver promocoes",acao:"executar_pedido",ativo:true}])).toBeNull();
  });
  it("mantém opt-out prioritário e fallback de cardápio",()=>{
    expect(identificarAcaoMarketing({button:{text:"Parar lembretes"}},[{chave:"parar lembretes",acao:"menu_cardapio",ativo:true}])).toBeNull();
    expect(identificarAcaoMarketing({button:{text:"Solicitar cardápio"}})).toBe("menu_cardapio");
  });
});

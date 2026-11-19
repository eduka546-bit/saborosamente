import { describe, expect, it, vi } from "vitest";
import { executarCardapioEMenu, identificarAcaoMarketing } from "./whatsapp-marketing-replies";

describe("respostas rápidas de campanhas", () => {
  it.each(["Solicitar cardápio", "SOLICITAR CARDAPIO", "Solicitar o cardápio", "🍽️ Ver cardápio",
    "Quero o cardápio", "Receber cardápio", "Enviar cardápio", "Cardápio completo"])("reconhece %s", text => {
    expect(identificarAcaoMarketing({ type: "button", button: { text, payload: "opaque-id" } })).toBe("menu_cardapio");
  });
  it("reconhece ID de botão sem rótulo", () => {
    expect(identificarAcaoMarketing({ button:{ payload:"btn_cardapio" } })).toBe("menu_cardapio");
  });
  it("reconhece CTA interativo", () => {
    expect(identificarAcaoMarketing({interactive:{button_reply:{id:"marketing_01",title:"Solicitar cardápio"}}})).toBe("menu_cardapio");
  });
  it.each(["Não quero cardápio", "Parar lembretes", "Sim", "Não", "Cancelar"])("não dispara no clique %s", text => {
    expect(identificarAcaoMarketing({button:{text}})).toBeNull();
  });
  it("não interpreta texto livre ou lista como clique de campanha", () => {
    expect(identificarAcaoMarketing({text:{body:"Solicitar cardápio"}})).toBeNull();
    expect(identificarAcaoMarketing({interactive:{list_reply:{id:"menu_cardapio",title:"Cardápio"}}})).toBeNull();
  });
  it("não usa ID conflitante quando o cliente recusa", () => {
    expect(identificarAcaoMarketing({button:{text:"Não quero cardápio",payload:"btn_cardapio"}})).toBeNull();
    expect(identificarAcaoMarketing({button:{text:"constructor"}})).toBeNull();
  });
  it.each([["Fazer um pedido","menu_pedido"],["Falar com atendente","menu_atendente"],["Acessar o site","menu_site"]])("reconhece outros CTAs %s", (text, expected) => {
    expect(identificarAcaoMarketing({button:{text}})).toBe(expected);
  });
  it("manda PDF antes do menu, sem link duplicado", async () => {
    const ordem:string[] = [];
    const enviarPdf = vi.fn(async () => { ordem.push("pdf"); return true; });
    const enviarLink = vi.fn(async () => { ordem.push("link"); return true; });
    const enviarMenu = vi.fn(async () => { ordem.push("menu"); return true; });
    expect(await executarCardapioEMenu({enviarPdf,enviarLink,enviarMenu})).toEqual({cardapio:"pdf",menuEnviado:true});
    expect(ordem).toEqual(["pdf","menu"]);
    expect(enviarLink).not.toHaveBeenCalled();
  });
  it("se PDF falhar, envia link antes do menu", async () => {
    const ordem:string[] = [];
    expect(await executarCardapioEMenu({
      enviarPdf:async()=>{ordem.push("pdf");return false;},
      enviarLink:async()=>{ordem.push("link");return true;},
      enviarMenu:async()=>{ordem.push("menu");return true;},
    })).toEqual({cardapio:"link",menuEnviado:true});
    expect(ordem).toEqual(["pdf","link","menu"]);
  });
  it("não manda menu se nem PDF nem link forem aceitos", async () => {
    const enviarMenu = vi.fn(async()=>true);
    expect(await executarCardapioEMenu({enviarPdf:async()=>false,enviarLink:async()=>false,enviarMenu})).toEqual({cardapio:"falha",menuEnviado:false});
    expect(enviarMenu).not.toHaveBeenCalled();
  });
  it("não confirma menu que falhou", async () => {
    expect(await executarCardapioEMenu({enviarPdf:async()=>true,enviarLink:async()=>true,enviarMenu:async()=>false})).toEqual({cardapio:"pdf",menuEnviado:false});
  });
  it("tenta link mesmo quando o PDF lança exceção", async () => {
    expect(await executarCardapioEMenu({enviarPdf:async()=>{throw Error("falha");},enviarLink:async()=>true,enviarMenu:async()=>true})).toEqual({cardapio:"link",menuEnviado:true});
  });
});

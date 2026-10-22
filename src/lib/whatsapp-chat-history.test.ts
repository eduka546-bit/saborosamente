import { describe, expect, it } from "vitest";
import { juntarHistoricoWhatsApp } from "./whatsapp-chat-history";

describe("histórico e eventos reais WhatsApp", () => {
  it("preserva a ordem e não duplica mensagens com o mesmo ID Meta", () => {
    const archive = [{role:"user",content:"Oi",timestamp:"2026-10-20T11:00:00Z",whatsapp_message_id:"wamid.1"}];
    const window = [{role:"user",content:"Oi",timestamp:"2026-10-20T11:00:00Z",whatsapp_message_id:"wamid.1"}];
    expect(juntarHistoricoWhatsApp(archive,window,[])).toHaveLength(1);
  });
  it("recupera histórico anterior à janela curta", () => {
    const a = [{ role:"user", content:"Antiga", timestamp:"2026-10-20T11:00:00Z" }];
    const w = [{ role:"assistant", content:"Atual", timestamp:"2026-10-22T11:00:00Z" }];
    expect(juntarHistoricoWhatsApp(a,w,[]).map(m=>m.content)).toEqual(["Antiga","Atual"]);
  });
  it("exibe clique mesmo quando a automação não salvou a bolha", () => {
    const ev = [{whatsapp_message_id:"wamid.click",tipo:"botao_template",titulo:"Quero receber ofertas",identificador:"ofertas_sim",recebido_em:"2026-10-22T12:00:00Z"}];
    const data=juntarHistoricoWhatsApp([],[],ev);
    expect(data).toHaveLength(1);
    expect(data[0].tipo_interacao).toBe("botao_template");
    expect(data[0].content).toBe("Quero receber ofertas");
  });
  it("identifica o clique na mensagem existente sem renderizar duas bolhas", () => {
    const mensagem={role:"user",content:"Sim",timestamp:"2026-10-22T12:00:00Z",whatsapp_message_id:"wamid.click"};
    const ev=[{whatsapp_message_id:"wamid.click",tipo:"botao",titulo:"Sim",identificador:"yes",recebido_em:"2026-10-22T12:00:00Z"}];
    const resultado=juntarHistoricoWhatsApp([mensagem],[],ev);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].identificador_interacao).toBe("yes");
  });
});

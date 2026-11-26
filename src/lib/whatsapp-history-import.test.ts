import { describe, expect, it } from "vitest";
import { lerExportacaoWhatsApp, prepararMensagensWhatsApp } from "./whatsapp-history-import";

describe("importação de conversa exportada do WhatsApp Business",()=>{
  it("interpreta formato de iPhone e preserva mensagens multilinhas",()=>{
    const txt="[25/11/2026, 09:28:45] Cliente: Bom dia!\n"+
      "Preciso de 10 marmitas\n"+
      "de 300g.\n"+
      "[25/11/2026, 09:29:00] Loja: Claro! Qual cidade?\n";
    const lido=lerExportacaoWhatsApp(txt);
    expect(lido.mensagens).toHaveLength(2);
    expect(lido.participantes).toEqual(["Cliente","Loja"]);
    expect(lido.mensagens[0].texto).toContain("10 marmitas\nde 300g.");
    expect(lido.mensagens[0].timestamp).toBe("2026-11-25T12:28:45.000Z");
    const msgs=prepararMensagensWhatsApp(lido,"Loja");
    expect(msgs.map(m=>m.role)).toEqual(["user","assistant"]);
    expect(msgs[1].manual).toBe(true);
    expect(msgs[0].source).toBe("business_app_export");
  });
  it("interpreta formato Android com ano de dois dígitos",()=>{
    const txt="25/11/26, 09:00 - Loja: Boa tarde!\n"+
      "25/11/26 09:02 - Cliente: Gostaria de 5 refeições.\n";
    const lido=lerExportacaoWhatsApp(txt);
    expect(lido.mensagens).toHaveLength(2);
    expect(lido.mensagens[1].timestamp).toBe("2026-11-25T12:02:00.000Z");
  });
  it("ignora cabeçalhos de sistema e texto sem mensagem",()=>{
    const txt="As mensagens e chamadas são protegidas\n"+
      "[26/11/2026, 08:00:00] Cliente: Oi!\n";
    const p=lerExportacaoWhatsApp(txt);
    expect(p.ignoradas).toBe(1);
    expect(p.mensagens).toHaveLength(1);
  });
  it("não aceita chat de grupo ou seleção de remetente errado",()=>{
    const txt="[25/11/2026, 09:00] A: oi\n"+
      "[25/11/2026, 09:01] B: oi\n"+
      "[25/11/2026, 09:02] C: oi\n";
    const d=lerExportacaoWhatsApp(txt);
    expect(()=>prepararMensagensWhatsApp(d,"B")).toThrow(/grupo/i);
    expect(()=>prepararMensagensWhatsApp(d,"inexistente")).toThrow(/Selecione/i);
  });
  it("não atribui data impossível nem inventa remetentes",()=>{
    const d=lerExportacaoWhatsApp("[31/02/2026, 09:00] Cliente: data impossível\n");
    expect(d.mensagens).toHaveLength(0);
  });
  it("recusa arquivo grande e texto sem remetente identificado",()=>{
    expect(()=>lerExportacaoWhatsApp("x".repeat(21*1024*1024))).toThrow(/grande/);
    expect(lerExportacaoWhatsApp("sem mensagens").mensagens).toEqual([]);
  });
});

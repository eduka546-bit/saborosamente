import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearCampaignDraft, readCampaignDraft, writeCampaignDraft } from "./campaign-draft-storage";

describe("salvamento de rascunho de campanhas", () => {
  const itens = new Map<string, string>();
  const storage = {
    getItem: (key: string) => itens.get(key) ?? null,
    setItem: (key: string, value: string) => { itens.set(key, value); },
    removeItem: (key: string) => { itens.delete(key); },
  };

  beforeEach(() => {
    itens.clear();
    vi.stubGlobal("window", { localStorage: storage });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("restaura texto e destinatários sem registrar ação de envio", () => {
    const draft = { mensagem: "Oferta de sexta", contatos: ["47999999999", "47988888888"], template: "ofertas" };
    expect(writeCampaignDraft("whatsapp", draft)).toBe(true);
    expect(readCampaignDraft("whatsapp", { mensagem: "", contatos: [], template: "" })).toEqual(draft);
    expect(JSON.parse(itens.get("whatsapp")!).value).not.toHaveProperty("enviar");
  });

  it("mantém os rascunhos de WhatsApp e e-mail separados", () => {
    writeCampaignDraft("whatsapp", { mensagem: "Mensagem de WhatsApp" });
    writeCampaignDraft("email", { mensagem: "Mensagem de e-mail" });
    expect(readCampaignDraft("whatsapp", { mensagem: "" }).mensagem).toBe("Mensagem de WhatsApp");
    expect(readCampaignDraft("email", { mensagem: "" }).mensagem).toBe("Mensagem de e-mail");
  });

  it("ignora dados corrompidos ou expirados", () => {
    const fallback = { nome: "" };
    itens.set("wa", "não é JSON");
    expect(readCampaignDraft("wa", fallback)).toEqual(fallback);
    itens.set("wa", JSON.stringify({ version: 1, savedAt: Date.now() - 31 * 24 * 60 * 60 * 1000, value: { nome: "antigo" } }));
    expect(readCampaignDraft("wa", fallback)).toEqual(fallback);
  });

  it("apaga o rascunho depois da conclusão", () => {
    writeCampaignDraft("email", { mensagem: "Bom dia" });
    clearCampaignDraft("email");
    expect(readCampaignDraft("email", { mensagem: "" }).mensagem).toBe("");
  });

  it("não bloqueia a página quando o armazenamento está indisponível", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => { throw new Error("indisponível"); },
        setItem: () => { throw new Error("indisponível"); },
        removeItem: () => { throw new Error("indisponível"); },
      },
    });
    expect(writeCampaignDraft("email", { mensagem: "teste" })).toBe(false);
    expect(readCampaignDraft("email", { mensagem: "" })).toEqual({ mensagem: "" });
    expect(() => clearCampaignDraft("email")).not.toThrow();
  });
});

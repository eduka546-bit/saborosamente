import { describe, it, expect } from "vitest";
import { whatsappDraftKey, lerRascunhoWhatsapp, salvarRascunhoWhatsapp, limparRascunhoWhatsapp, WHATSAPP_DRAFT_TTL_MS } from "./whatsapp-order-draft";

function memoria() {
  const mapa = new Map<string, string>();
  return {
    getItem: (key: string) => mapa.get(key) ?? null,
    setItem: (key: string, value: string) => { mapa.set(key, value); },
    removeItem: (key: string) => { mapa.delete(key); },
  };
}

describe("rascunho do pedido administrativo WhatsApp", () => {
  it("preserva itens editados, endereço, retirada, desconto e texto original ao recarregar", () => {
    const store = memoria();
    const key = whatsappDraftKey();
    const pedido = {
      pasteText: "24 - Refeições 400g",
      nome: "Cliente Teste",
      rua: "Rua Teste", numero: "123",
      metodoEntrega: "retirada",
      items: [{ key: "linha-1", productId: "produto-1", quantity: 24, weight: "400g", unitPrice: 21.9 }],
      descontoAplicado: 26.28,
    };
    expect(salvarRascunhoWhatsapp(store, key, pedido, 1000000)).toBe(true);
    expect(lerRascunhoWhatsapp<typeof pedido>(store, key, 1000001)).toEqual(pedido);
  });

  it("separa rascunhos entre novo pedido e clientes ou históricos distintos", () => {
    expect(whatsappDraftKey()).not.toBe(whatsappDraftKey("cliente-1"));
    expect(whatsappDraftKey("cliente-1")).not.toBe(whatsappDraftKey("cliente-2"));
    expect(whatsappDraftKey("cliente-1")).not.toBe(whatsappDraftKey(undefined, "historico-1"));
  });

  it("expira o rascunho antigo e apaga o registro após salvar", () => {
    const store = memoria();
    const key = whatsappDraftKey();
    salvarRascunhoWhatsapp(store, key, { nome: "Exemplo" }, 1000000);
    expect(lerRascunhoWhatsapp(store, key, 1000000 + WHATSAPP_DRAFT_TTL_MS + 1)).toBeNull();
    salvarRascunhoWhatsapp(store, key, { nome: "Exemplo" }, 1000000);
    limparRascunhoWhatsapp(store, key);
    expect(lerRascunhoWhatsapp(store, key, 1000001)).toBeNull();
  });

  it("não derruba a tela quando o armazenamento está bloqueado ou corrompido", () => {
    const store = memoria();
    const key = whatsappDraftKey();
    store.setItem(key, "{corrompido");
    expect(lerRascunhoWhatsapp(store, key)).toBeNull();
    const indisponivel = {
      getItem: (): string | null => { throw new Error("bloqueado"); },
      setItem: (): void => { throw new Error("bloqueado"); },
      removeItem: (): void => { throw new Error("bloqueado"); },
    };
    expect(lerRascunhoWhatsapp(indisponivel, key)).toBeNull();
    expect(salvarRascunhoWhatsapp(indisponivel, key, {})).toBe(false);
    expect(() => limparRascunhoWhatsapp(indisponivel, key)).not.toThrow();
  });
});

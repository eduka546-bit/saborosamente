import { describe, expect, it } from "vitest";
import { chaveMensagemPainel, mesclarMensagensWhatsApp } from "./whatsapp-chat-history";

describe("histórico do WhatsApp no painel", () => {
  it("preserva mensagens antigas e acrescenta as novas em ordem", () => {
    const arquivadas = [
      { role: "user", content: "Primeira", whatsapp_message_id: "wamid.1" },
      { role: "assistant", content: "Segunda", whatsapp_message_id: "wamid.2" },
    ];
    const janela = [{ role: "user", content: "Terceira", whatsapp_message_id: "wamid.3" }];
    expect(mesclarMensagensWhatsApp(arquivadas, janela).map((m) => m.content))
      .toEqual(["Primeira", "Segunda", "Terceira"]);
  });

  it("atualiza recibos pelo ID Meta sem duplicar mensagens", () => {
    const arquivadas = [{ role: "assistant", content: "Pedido confirmado", whatsapp_message_id: "wamid.1", deliveryStatus: "enviado" }];
    const janela = [{ role: "assistant", content: "Pedido confirmado", whatsapp_message_id: "wamid.1", deliveryStatus: "lido" }];
    const resultado = mesclarMensagensWhatsApp(arquivadas, janela);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].deliveryStatus).toBe("lido");
    expect(arquivadas[0].deliveryStatus).toBe("enviado");
  });

  it("identifica legados pelo conteúdo/horário sem tratar textos em datas diferentes como duplicados", () => {
    const primeira = { role: "user", content: "Oi", timestamp: "2026-10-20T10:00:00Z" };
    const segunda = { role: "user", content: "Oi", timestamp: "2026-10-21T11:00:00Z" };
    expect(chaveMensagemPainel(primeira)).not.toBe(chaveMensagemPainel(segunda));
    expect(mesclarMensagensWhatsApp([primeira], [segunda])).toHaveLength(2);
  });

  it("não altera a lista original ao juntar mensagens", () => {
    const arquivadas = [{ role: "user", content: "Olá", whatsapp_message_id: "wamid.1" }];
    const janela = [{ role: "assistant", content: "Tudo bem?", whatsapp_message_id: "wamid.2" }];
    mesclarMensagensWhatsApp(arquivadas, janela);
    expect(arquivadas).toHaveLength(1);
  });
});

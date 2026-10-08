import { describe, expect, it } from "vitest";
import { novaMensagemRecebida, ultimaMensagemRecebida, type ConversaNotificacao } from "./whatsapp-notification-rules";

const recebida = {
  role: "user",
  content: "Olá, quero uma marmita",
  timestamp: "2026-10-08T19:10:01.000Z",
  whatsapp_message_id: "wamid.inbound-001",
};

const conversaInicial: ConversaNotificacao = {
  id: "conversa-1",
  ultima_msg: recebida.timestamp,
  mensagens: [recebida],
};

describe("notificações do atendimento WhatsApp", () => {
  it("não envia alerta quando o atendente responde ao cliente", () => {
    const antes = ultimaMensagemRecebida(conversaInicial);
    const depois = {
      ...conversaInicial,
      ultima_msg: "2026-10-08T19:10:04.000Z",
      mensagens: [
        recebida,
        { role: "assistant", manual: true, content: "Boa tarde!", timestamp: "2026-10-08T19:10:04.000Z" },
      ],
    };
    expect(ultimaMensagemRecebida(depois)?.key).toBe(antes?.key);
    expect(novaMensagemRecebida(depois)).toBeNull();
  });

  it("não inventa nova mensagem quando só muda ultima_msg", () => {
    const depois = { ...conversaInicial, ultima_msg: "2026-10-08T19:10:07.000Z" };
    expect(ultimaMensagemRecebida(depois)?.key).toBe(ultimaMensagemRecebida(conversaInicial)?.key);
  });

  it("reconhece uma nova mensagem real e mantém uma chave diferente", () => {
    const nova = { role: "user", content: "Pode enviar o cardápio?", timestamp: "2026-10-08T19:10:10.000Z" };
    const proxima = { ...conversaInicial, mensagens: [recebida, nova] };
    expect(novaMensagemRecebida(proxima)?.content).toBe("Pode enviar o cardápio?");
    expect(ultimaMensagemRecebida(proxima)?.key).not.toBe(ultimaMensagemRecebida(conversaInicial)?.key);
  });

  it("notifica resposta por botão, sem confundir com mensagem de saída", () => {
    const clique = { role: "user", content: "Quero pedir", timestamp: "2026-10-08T19:10:10.000Z" };
    expect(novaMensagemRecebida({ id: "botao", mensagens: [clique] })?.content).toBe("Quero pedir");
    expect(novaMensagemRecebida({ id: "campanha", mensagens: [
      { role: "assistant", content: "Oferta de hoje", campaign_id: "campanha-1", timestamp: clique.timestamp },
    ] })).toBeNull();
  });

  it("ignora eco manual, histórico sincronizado e mensagens sem timestamp", () => {
    expect(novaMensagemRecebida({ id: "eco", mensagens: [
      { role: "assistant", manual: true, content: "Enviei isso", timestamp: recebida.timestamp },
    ] })).toBeNull();
    expect(novaMensagemRecebida({ id: "historico", mensagens: [
      { role: "user", source: "business_app_history_inbound", content: "Mensagem antiga", timestamp: recebida.timestamp },
    ] })).toBeNull();
    expect(novaMensagemRecebida({ id: "sem-data", ultima_msg: recebida.timestamp, mensagens: [
      { role: "user", content: "Mensagem antiga" },
    ] })).toBeNull();
  });

  it("não alerta novamente após o mesmo recebimento e o novo envio", () => {
    const antes = ultimaMensagemRecebida(conversaInicial)?.key;
    const conversaAposEnvio = { ...conversaInicial, mensagens: [
      recebida,
      { role: "assistant", content: "Com certeza", timestamp: "2026-10-08T19:11:00.000Z" },
    ] };
    expect(ultimaMensagemRecebida(conversaAposEnvio)?.key).toBe(antes);
    expect(novaMensagemRecebida(conversaAposEnvio)).toBeNull();
  });
});

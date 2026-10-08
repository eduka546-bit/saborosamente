/**
 * Identifica SOMENTE mensagens novas recebidas de clientes.
 * Nunca usa whatsapp_conversas.ultima_msg na identidade da notificação,
 * pois esse campo também muda quando um atendente envia uma resposta.
 */
export type WhatsappMensagem = {
  role?: string;
  direction?: string;
  campaign_id?: string;
  manual?: boolean;
  source?: string;
  content?: string;
  timestamp?: string;
  whatsapp_message_id?: string;
};

export type ConversaNotificacao = {
  id: string;
  nome?: string | null;
  telefone?: string | null;
  ultima_msg?: string | null;
  mensagens?: WhatsappMensagem[] | null;
};

export function ehMensagemRecebida(mensagem?: WhatsappMensagem): boolean {
  return mensagem?.role === "user" &&
    mensagem.direction !== "out" &&
    mensagem.manual !== true &&
    !mensagem.campaign_id &&
    !String(mensagem.source ?? "").includes("history");
}

function identificarMensagem(mensagem: WhatsappMensagem) {
  const timestamp = mensagem.timestamp ?? "";
  if (!timestamp || !Number.isFinite(Date.parse(timestamp))) return null;
  return {
    content: mensagem.content || "Nova mensagem",
    timestamp,
    key: `${mensagem.whatsapp_message_id ?? ""}:${timestamp}:${mensagem.content ?? ""}`,
  };
}

export function ultimaMensagemRecebida(conversa: ConversaNotificacao) {
  const mensagens = conversa.mensagens ?? [];
  for (let i = mensagens.length - 1; i >= 0; i--) {
    if (ehMensagemRecebida(mensagens[i])) {
      return identificarMensagem(mensagens[i]);
    }
  }
  return null;
}

export function novaMensagemRecebida(conversa: ConversaNotificacao) {
  const ultima = conversa.mensagens?.at(-1);
  return ehMensagemRecebida(ultima) && ultima ? identificarMensagem(ultima) : null;
}

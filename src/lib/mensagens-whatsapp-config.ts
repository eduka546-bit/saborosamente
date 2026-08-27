// Templates das mensagens automáticas de WhatsApp por status do pedido.
// Editáveis no admin e salvos em site_settings.parametros_loja.mensagens_whatsapp.
// A edge function whatsapp-notify lê esses textos e substitui os placeholders.
//
// Placeholders disponíveis:
//   {nome}       → primeiro nome do cliente
//   {protocolo}  → protocolo do pedido (8 primeiros caracteres em maiúsculo)
//   {link}       → link de acompanhamento do pedido

export type StatusMensagem =
  | "novo_pedido"
  | "pagamento_confirmado"
  | "preparando"
  | "saiu para entrega"
  | "entregue"
  | "cancelado";

export type MensagensWhatsappConfig = Record<StatusMensagem, string>;

export const STATUS_MENSAGENS: { key: StatusMensagem; label: string }[] = [
  { key: "novo_pedido", label: "Novo pedido recebido" },
  { key: "pagamento_confirmado", label: "Pagamento confirmado" },
  { key: "preparando", label: "Preparando" },
  { key: "saiu para entrega", label: "Saiu para entrega" },
  { key: "entregue", label: "Entregue (pede feedback)" },
  { key: "cancelado", label: "Cancelado" },
];

// Textos padrão — espelham exatamente os que a edge function já usava.
export const DEFAULT_MENSAGENS: MensagensWhatsappConfig = {
  novo_pedido:
    "🍱 Olá, *{nome}*! Recebemos seu pedido *#{protocolo}* com sucesso!\n\nAssim que começarmos a preparar, você recebe uma mensagem aqui 😊\n\nAcompanhe em: {link}",
  pagamento_confirmado:
    "✅ Pagamento confirmado, *{nome}*! Seu pedido *#{protocolo}* foi confirmado.\n\nEstamos preparando com carinho 🍱\n\nAcompanhe: {link}",
  preparando:
    "🔥 *{nome}*, seu pedido *#{protocolo}* está sendo preparado agora com carinho 👨‍🍳\n\nTempo estimado: 30-45 min\n\nAcompanhe: {link}",
  "saiu para entrega":
    "🚚 *{nome}*, seu pedido *#{protocolo}* saiu para entrega agora! 🏃‍♂️\n\nRastreie em tempo real: {link}",
  entregue:
    "🎉 Pedido *#{protocolo}* entregue, *{nome}*!\n\nEsperamos que aprecie bastante 😋\n\nResponda com uma nota de *1 a 5* ⭐ para nos ajudar a melhorar!\n\n_Sua opinião é muito importante para nós_ 🫶🏼",
  cancelado:
    "😔 Oi, *{nome}*. Infelizmente seu pedido *#{protocolo}* foi cancelado.\n\nEntraremos em contato para explicar. Dúvidas? Responda esta mensagem 💬",
};

// Normaliza a config vinda do banco, caindo no default por status faltante/vazio.
export function normalizarMensagens(raw: any): MensagensWhatsappConfig {
  const cfg = raw ?? {};
  const out = {} as MensagensWhatsappConfig;
  (Object.keys(DEFAULT_MENSAGENS) as StatusMensagem[]).forEach((k) => {
    const v = typeof cfg[k] === "string" ? cfg[k].trim() : "";
    out[k] = v || DEFAULT_MENSAGENS[k];
  });
  return out;
}

// Substitui os placeholders no template.
export function renderMensagem(
  template: string,
  vars: { nome: string; protocolo: string; link: string },
): string {
  return template
    .replaceAll("{nome}", vars.nome)
    .replaceAll("{protocolo}", vars.protocolo)
    .replaceAll("{link}", vars.link);
}

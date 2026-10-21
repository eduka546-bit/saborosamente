/**
 * Mescla mensagens da janela curta do agente ao histórico permanente.
 * Mantém a ordem de chegada do histórico e usa a versão mais recente da
 * janela para atualizar recibos de entrega/leitura sem duplicar mensagens.
 */
export function chaveMensagemPainel(msg: any): string {
  if (msg?.whatsapp_message_id) return "meta:" + msg.whatsapp_message_id;
  return JSON.stringify([
    msg?.role ?? "", msg?.content ?? "", msg?.timestamp ?? "",
    msg?.media_path ?? "", msg?.media_url ?? "", msg?.campaign_id ?? "",
  ]);
}

export function mesclarMensagensWhatsApp(arquivadas: any[], janela: any[]): any[] {
  const mensagens = [...arquivadas];
  const indices = new Map(mensagens.map((msg, index) => [chaveMensagemPainel(msg), index]));

  for (const msg of janela) {
    const chave = chaveMensagemPainel(msg);
    const indice = indices.get(chave);
    if (indice === undefined) {
      indices.set(chave, mensagens.length);
      mensagens.push(msg);
    } else {
      mensagens[indice] = msg;
    }
  }
  return mensagens;
}

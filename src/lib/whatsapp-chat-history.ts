/**
 * Mescla mensagens da janela curta do agente ao histórico permanente.
 * Mantém a ordem de chegada do histórico e usa a versão mais recente da
 * janela para atualizar recibos de entrega/leitura sem duplicar mensagens.
 */
export function chaveMensagemPainel(msg: any): string {
  if (msg?.whatsapp_message_id) return "meta:" + msg.whatsapp_message_id;
  // Uma chave curta evita estourar o índice PostgreSQL de favoritos com
  // mensagens de vários milhares de caracteres. Dois hashes de 32 bits
  // independentes produzem 64 bits de identificação para mensagens legadas.
  const valor = JSON.stringify([
    msg?.role ?? "", msg?.content ?? "", msg?.timestamp ?? "",
    msg?.media_path ?? "", msg?.media_url ?? "",
    msg?.media_storage_path ?? "", msg?.campaign_id ?? "",
  ]);
  let a = 0x811c9dc5;
  let b = 0x9747b28c;
  for (let i = 0; i < valor.length; i++) {
    const c = valor.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c, 0x5bd1e995);
  }
  return "legado:" + (a >>> 0).toString(16).padStart(8, "0")
    + (b >>> 0).toString(16).padStart(8, "0");
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

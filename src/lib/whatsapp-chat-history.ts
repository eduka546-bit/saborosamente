/** Histórico do atendimento: deduplicação por ID Meta (ou dados legados).
 *  Em caso de colisão, a janela ativa prevalece, pois contém recibos novos.
 */
export function chaveMensagemWhatsApp(msg: any): string {
  const id = String(msg?.whatsapp_message_id ?? "");
  if (id) return "meta:" + id;
  return JSON.stringify([
    msg?.role ?? "", msg?.content ?? "", msg?.timestamp ?? "",
    msg?.media_path ?? "", msg?.media_url ?? "", msg?.campaign_id ?? "",
    msg?.manual ?? null,
  ]);
}

export type InteracaoWhatsApp = {
  whatsapp_message_id: string;
  tipo: string;
  titulo: string;
  identificador?: string | null;
  mensagem_origem_id?: string | null;
  recebido_em: string;
};

/** Cliques são eventos reais. Exibimos um cartão mesmo quando o menu
 *  encerra o webhook antes de salvar uma mensagem de usuário na janela.
 */
export function juntarHistoricoWhatsApp(
  arquivadas: any[], janela: any[], interacoes: InteracaoWhatsApp[],
): any[] {
  const resultado = [...arquivadas];
  const indice = new Map(resultado.map((msg, i) => [chaveMensagemWhatsApp(msg), i]));

  for (const msg of janela) {
    const chave = chaveMensagemWhatsApp(msg);
    const posicao = indice.get(chave);
    if (posicao === undefined) {
      indice.set(chave, resultado.length);
      resultado.push(msg);
    } else {
      resultado[posicao] = msg;
    }
  }

  for (const evento of interacoes) {
    const chave = "meta:" + evento.whatsapp_message_id;
    const posicao = indice.get(chave);
    const dados = {
      tipo_interacao: evento.tipo,
      titulo_interacao: evento.titulo,
      identificador_interacao: evento.identificador,
      reply_to_message_id: evento.mensagem_origem_id,
    };
    if (posicao !== undefined) {
      resultado[posicao] = { ...resultado[posicao], ...dados };
    } else {
      indice.set(chave, resultado.length);
      resultado.push({
        role: "user", content: evento.titulo, timestamp: evento.recebido_em,
        whatsapp_message_id: evento.whatsapp_message_id, ...dados,
      });
    }
  }
  // Preserva o sequenciamento dos registros antigos sem data.
  if (resultado.every((msg) => msg.timestamp && Number.isFinite(Date.parse(String(msg.timestamp))))) {
    return resultado.map((msg, i) => ({ msg, i }))
      .sort((a, b) => Date.parse(a.msg.timestamp) - Date.parse(b.msg.timestamp) || a.i - b.i)
      .map(({ msg }) => msg);
  }
  return resultado;
}

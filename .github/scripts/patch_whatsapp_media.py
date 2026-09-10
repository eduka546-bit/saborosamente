from pathlib import Path

p = Path('supabase/functions/whatsapp-agent/index.ts')
s = p.read_text(encoding='utf-8')

marker = '''async function transcreverAudio(buffer: ArrayBuffer, mime: string): Promise<string | null> {'''
helper = '''async function salvarMidiaRecebida(
  telefone: string,
  messageId: string | undefined,
  mediaId: string,
  midia: { bytes: Uint8Array; mime: string },
): Promise<{ path: string; mime: string } | null> {
  try {
    const mime = midia.mime || "application/octet-stream";
    const ext = (mime.split('/')[1] || 'bin').split(';')[0].replace(/[^a-zA-Z0-9]/g, '') || 'bin';
    const telefoneLimpo = String(telefone).replace(/\\D/g, '') || 'desconhecido';
    const idArquivo = messageId || mediaId;
    const path = `${telefoneLimpo}/${Date.now()}-${idArquivo}.${ext}`;
    const { error } = await supabase.storage
      .from('whatsapp-midias')
      .upload(path, midia.bytes, { contentType: mime, upsert: false });
    if (error) {
      console.error('Falha ao salvar mídia recebida:', error.message);
      return null;
    }
    return { path, mime };
  } catch (e: any) {
    console.error('salvarMidiaRecebida exception:', e?.message ?? e);
    return null;
  }
}

async function transcreverAudio(buffer: ArrayBuffer, mime: string): Promise<string | null> {'''
if 'async function salvarMidiaRecebida(' not in s:
    if marker not in s:
        raise SystemExit('marker transcreverAudio não encontrado')
    s = s.replace(marker, helper, 1)

old_off = '''      if (!config?.ativo) {
        const conversaPausada = await getOrCreateConversa(telefone, nomeContato);
        if (conversaPausada) {
          await appendMensagem(conversaPausada.id, conversaPausada.mensagens ?? [], {
            role: "user",
            content: texto || menuId || `[${msg.type || "mensagem"} recebido]`,
          });
        }
        return new Response("OK", { status: 200 });
      }'''
new_off = '''      if (!config?.ativo) {
        const conversaPausada = await getOrCreateConversa(telefone, nomeContato);
        if (conversaPausada) {
          let midiaPausada: any = null;
          const mediaIdPausada =
            msg.type === "image" ? msg.image?.id :
            (msg.type === "audio" || msg.type === "voice") ? (msg.audio?.id ?? msg.voice?.id) :
            msg.type === "document" ? msg.document?.id : null;
          if (mediaIdPausada) {
            const baixada = await baixarMidiaWhatsApp(mediaIdPausada);
            if (baixada) midiaPausada = await salvarMidiaRecebida(telefone, msg.id, mediaIdPausada, baixada);
          }
          const conteudoPausado = texto || menuId || `[${msg.type || "mensagem"} recebido]`;
          await appendMensagem(conversaPausada.id, conversaPausada.mensagens ?? [], {
            role: "user",
            content: conteudoPausado,
            ...(midiaPausada ? {
              media_path: midiaPausada.path,
              media_type: msg.type,
              mime_type: midiaPausada.mime,
              whatsapp_media_id: mediaIdPausada,
            } : {}),
          });
        }
        return new Response("OK", { status: 200 });
      }'''
if old_off not in s:
    raise SystemExit('bloco IA off não encontrado')
s = s.replace(old_off, new_off, 1)

old_decl = '''      // ── Mídia recebida do cliente ────────────────────────────────────────'''
new_decl = '''      let mediaAnexo: any = null;

      // ── Mídia recebida do cliente ────────────────────────────────────────'''
if 'let mediaAnexo: any = null;' not in s:
    if old_decl not in s: raise SystemExit('marker mídia não encontrado')
    s = s.replace(old_decl, new_decl, 1)

old_audio = '''          const mediaId = msg.audio?.id ?? msg.voice?.id;
          const midia = mediaId ? await baixarMidiaWhatsApp(mediaId) : null;
          const transcricao = midia ? await transcreverAudio(midia.buffer, midia.mime) : null;'''
new_audio = '''          const mediaId = msg.audio?.id ?? msg.voice?.id;
          const midia = mediaId ? await baixarMidiaWhatsApp(mediaId) : null;
          if (mediaId && midia) mediaAnexo = await salvarMidiaRecebida(telefone, msg.id, mediaId, midia);
          const transcricao = midia ? await transcreverAudio(midia.buffer, midia.mime) : null;'''
if old_audio not in s: raise SystemExit('bloco audio não encontrado')
s = s.replace(old_audio, new_audio, 1)

old_image = '''          const mediaId = msg.image?.id;
          const legendaCliente = msg.image?.caption?.trim();
          const midia = mediaId ? await baixarMidiaWhatsApp(mediaId) : null;
          const descricao = midia ? await analisarImagem(midia.bytes, midia.mime) : null;'''
new_image = '''          const mediaId = msg.image?.id;
          const legendaCliente = msg.image?.caption?.trim();
          const midia = mediaId ? await baixarMidiaWhatsApp(mediaId) : null;
          if (mediaId && midia) mediaAnexo = await salvarMidiaRecebida(telefone, msg.id, mediaId, midia);
          const descricao = midia ? await analisarImagem(midia.bytes, midia.mime) : null;'''
if old_image not in s: raise SystemExit('bloco imagem não encontrado')
s = s.replace(old_image, new_image, 1)

old_append = '''      historico = await appendMensagem(conversa.id, historico, { role: "user", content: texto });'''
new_append = '''      historico = await appendMensagem(conversa.id, historico, {
        role: "user",
        content: texto,
        ...(mediaAnexo ? {
          media_path: mediaAnexo.path,
          media_type: msg.type,
          mime_type: mediaAnexo.mime,
          whatsapp_media_id: msg.type === "image" ? msg.image?.id : (msg.audio?.id ?? msg.voice?.id),
        } : {}),
      });'''
if old_append not in s: raise SystemExit('append principal não encontrado')
s = s.replace(old_append, new_append, 1)

p.write_text(s, encoding='utf-8')
print('whatsapp-agent: patch aplicado')

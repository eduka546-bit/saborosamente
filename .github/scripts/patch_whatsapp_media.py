from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"Trecho não encontrado: {label}")
    return text.replace(old, new, 1)

# ── Backend: persist received media in whatsapp-agent ────────────────────────
p = Path('supabase/functions/whatsapp-agent/index.ts')
s = p.read_text(encoding='utf-8')

if 'async function salvarMidiaRecebida(' not in s:
    marker = 'async function transcreverAudio(buffer: ArrayBuffer, mime: string): Promise<string | null> {'
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
    s = replace_once(s, marker, helper, 'função transcreverAudio')

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
if old_off in s:
    s = replace_once(s, old_off, new_off, 'bloco IA desligada')

if 'let mediaAnexo: any = null;' not in s:
    marker = '      // ── Mídia recebida do cliente ────────────────────────────────────────'
    if marker in s:
        s = replace_once(s, marker, '      let mediaAnexo: any = null;\n\n' + marker, 'marcador de mídia')

old_audio = '''          const mediaId = msg.audio?.id ?? msg.voice?.id;
          const midia = mediaId ? await baixarMidiaWhatsApp(mediaId) : null;
          const transcricao = midia ? await transcreverAudio(midia.buffer, midia.mime) : null;'''
new_audio = '''          const mediaId = msg.audio?.id ?? msg.voice?.id;
          const midia = mediaId ? await baixarMidiaWhatsApp(mediaId) : null;
          if (mediaId && midia) mediaAnexo = await salvarMidiaRecebida(telefone, msg.id, mediaId, midia);
          const transcricao = midia ? await transcreverAudio(midia.buffer, midia.mime) : null;'''
if old_audio in s:
    s = replace_once(s, old_audio, new_audio, 'bloco de áudio')

old_image = '''          const mediaId = msg.image?.id;
          const legendaCliente = msg.image?.caption?.trim();
          const midia = mediaId ? await baixarMidiaWhatsApp(mediaId) : null;
          const descricao = midia ? await analisarImagem(midia.bytes, midia.mime) : null;'''
new_image = '''          const mediaId = msg.image?.id;
          const legendaCliente = msg.image?.caption?.trim();
          const midia = mediaId ? await baixarMidiaWhatsApp(mediaId) : null;
          if (mediaId && midia) mediaAnexo = await salvarMidiaRecebida(telefone, msg.id, mediaId, midia);
          const descricao = midia ? await analisarImagem(midia.bytes, midia.mime) : null;'''
if old_image in s:
    s = replace_once(s, old_image, new_image, 'bloco de imagem')

old_append = '      historico = await appendMensagem(conversa.id, historico, { role: "user", content: texto });'
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
if old_append in s:
    s = replace_once(s, old_append, new_append, 'persistência principal')

p.write_text(s, encoding='utf-8')

# ── Frontend: render image/audio/document stored in conversation messages ────
fp = Path('src/routes/admin/agente.tsx')
f = fp.read_text(encoding='utf-8')

if 'function MidiaRecebida({ msg, dark }' not in f:
    marker = '// ── Tela de chat de uma conversa ──────────────────────────────────────────────\n'
    helper = '''// Renderiza mídia recebida do WhatsApp usando URL assinada do bucket privado.
function MidiaRecebida({ msg, dark }: { msg: any; dark: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    const path = msg?.media_path;
    if (!path) return () => { ativo = false; };

    supabase.storage
      .from("whatsapp-midias")
      .createSignedUrl(path, 60 * 60)
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error || !data?.signedUrl) setErro(true);
        else setUrl(data.signedUrl);
      });

    return () => { ativo = false; };
  }, [msg?.media_path]);

  if (!msg?.media_path) return null;
  if (erro) {
    return <div className={`text-xs opacity-60 mt-1 ${dark ? "text-[#8696a0]" : "text-[#667781]"}`}>Mídia indisponível</div>;
  }
  if (!url) {
    return <div className={`text-xs opacity-60 mt-1 ${dark ? "text-[#8696a0]" : "text-[#667781]"}`}>Carregando mídia…</div>;
  }

  const tipo = String(msg.media_type || "").toLowerCase();
  const mime = String(msg.mime_type || "").toLowerCase();

  if (tipo === "image" || mime.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block mt-1">
        <img src={url} alt="Imagem recebida" className="max-w-full max-h-[360px] rounded-xl object-contain cursor-pointer" loading="lazy" />
      </a>
    );
  }

  if (tipo === "audio" || tipo === "voice" || mime.startsWith("audio/")) {
    return <audio className="w-full min-w-[240px] mt-1" controls preload="metadata" src={url} />;
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-1 rounded-lg px-3 py-2 bg-black/10 hover:bg-black/15 transition-colors">
      <FileText size={18} />
      <span className="text-xs font-semibold">Abrir documento</span>
    </a>
  );
}

'''
    f = replace_once(f, marker, helper + marker, 'ChatView marker')

old_span = '<span className="whitespace-pre-wrap break-words">{msg.content}</span>'
new_span = '''{msg.content && !msg.media_path && (
                  <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                )}
                {msg.media_path && <MidiaRecebida msg={msg} dark={dark} />}'''
if old_span in f:
    f = replace_once(f, old_span, new_span, 'renderização da mensagem')

fp.write_text(f, encoding='utf-8')
print('whatsapp-agent + admin/agente: patch aplicado')

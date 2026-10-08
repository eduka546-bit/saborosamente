import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ultimaMensagemRecebida, novaMensagemRecebida, type ConversaNotificacao } from "@/lib/whatsapp-notification-rules";

const STORAGE_KEY = "saborosamente:whatsapp-alerts";
const SETTINGS_QUERY_KEY = ["admin-whatsapp-alerts-setting"] as const;
const SETTINGS_EVENT = "saborosamente:whatsapp-alerts-changed";

function tocarAlerta(contexto: AudioContext | null) {
  if (!contexto || contexto.state !== "running") return;
  const inicio = contexto.currentTime;
  [0, 0.34].forEach((atraso, indice) => {
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();
    const inicioToque = inicio + atraso;
    oscilador.type = "square";
    oscilador.frequency.setValueAtTime(indice === 0 ? 1046 : 1318, inicioToque);
    ganho.gain.setValueAtTime(0.0001, inicioToque);
    ganho.gain.exponentialRampToValueAtTime(0.42, inicioToque + 0.015);
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicioToque + 0.28);
    oscilador.connect(ganho).connect(contexto.destination);
    oscilador.start(inicioToque);
    oscilador.stop(inicioToque + 0.3);
  });
}

export function AdminWhatsappAlerts() {
  const [ativoNesteNavegador, setAtivoNesteNavegador] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mensagensVistas = useRef(new Map<string, string>());

  const { data: ativoNaLoja = true } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("parametros_loja")
        .maybeSingle();
      if (error) throw error;
      const parametros = (data?.parametros_loja as any) ?? {};
      return parametros.notificacoes_admin?.whatsapp_novas_mensagens !== false;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    const sincronizarPreferenciaLocal = () => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        setAtivoNesteNavegador(false);
        return;
      }
      setAtivoNesteNavegador(
        localStorage.getItem(STORAGE_KEY) === "true" && Notification.permission === "granted",
      );
    };

    sincronizarPreferenciaLocal();
    window.addEventListener(SETTINGS_EVENT, sincronizarPreferenciaLocal);
    window.addEventListener("storage", sincronizarPreferenciaLocal);

    return () => {
      window.removeEventListener(SETTINGS_EVENT, sincronizarPreferenciaLocal);
      window.removeEventListener("storage", sincronizarPreferenciaLocal);
    };
  }, []);

  const ativo = ativoNaLoja && ativoNesteNavegador;

  useEffect(() => {
    if (!ativo) return;

    const prepararAudio = async () => {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      audioContextRef.current ??= new AudioContextClass();
      if (audioContextRef.current.state !== "running") {
        await audioContextRef.current.resume().catch(() => undefined);
      }
    };

    window.addEventListener("pointerdown", prepararAudio, { once: true });
    window.addEventListener("keydown", prepararAudio, { once: true });

    let inscrito = true;
    const carregarEstadoInicial = async () => {
      const { data } = await supabase
        .from("whatsapp_conversas")
        .select("id, nome, telefone, ultima_msg, mensagens")
        .order("ultima_msg", { ascending: false })
        .limit(100);
      if (!inscrito) return;
      // Registra tambem o ultimo recebimento de conversas cuja mensagem mais
      // recente foi enviada pela loja. Um envio nosso nao vira evento novo.
      (data || []).forEach((conversa: ConversaNotificacao) => {
        const mensagem = ultimaMensagemRecebida(conversa);
        if (mensagem) mensagensVistas.current.set(conversa.id, mensagem.key);
      });
    };

    carregarEstadoInicial();
    const channel = supabase
      .channel(`whatsapp-alertas-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_conversas" },
        (payload) => {
          const conversa = payload.new as ConversaNotificacao;
          if (!conversa?.id) return;
          // Atualizacoes do historico, status, nome ou envios nossos nao notificam.
          // Mesmo que a ultima mensagem RECEBIDA seja de segundos atras, ela nao
          // deve ser avisada novamente quando o atendente envia uma resposta.
          const ultimaRecebida = ultimaMensagemRecebida(conversa);
          if (!ultimaRecebida) return;
          const anterior = mensagensVistas.current.get(conversa.id);
          mensagensVistas.current.set(conversa.id, ultimaRecebida.key);
          if (anterior === ultimaRecebida.key) return;
          const mensagem = novaMensagemRecebida(conversa);
          if (!mensagem || mensagem.key !== ultimaRecebida.key) return;
          // Mensagens antigas/sincronizadas nao geram avisos retroativos.
          const instante = Date.parse(mensagem.timestamp);
          if (!Number.isFinite(instante) || Math.abs(Date.now() - instante) > 2 * 60_000) return;

          const remetente = conversa.nome || conversa.telefone || "Cliente";
          tocarAlerta(audioContextRef.current);
          new Notification(`Mensagem de ${remetente}`, {
            body: mensagem.content.slice(0, 160),
            icon: "/favicon.png",
            tag: `whatsapp-${conversa.id}`,
          });
        },
      )
      .subscribe();

    return () => {
      inscrito = false;
      window.removeEventListener("pointerdown", prepararAudio);
      window.removeEventListener("keydown", prepararAudio);
      supabase.removeChannel(channel);
    };
  }, [ativo]);

  // O controle agora fica em Configurações > Parâmetros.
  // Este componente não exibe mais nenhum botão ou aviso flutuante no admin.
  return null;
}

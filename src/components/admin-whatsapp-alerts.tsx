import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "saborosamente:whatsapp-alerts";
const SETTINGS_QUERY_KEY = ["admin-whatsapp-alerts-setting"] as const;
const SETTINGS_EVENT = "saborosamente:whatsapp-alerts-changed";

type Conversa = {
  id: string;
  nome?: string | null;
  telefone?: string | null;
  ultima_msg?: string | null;
  mensagens?: Array<{ role?: string; content?: string; timestamp?: string }> | null;
};

function mensagemAtual(conversa: Conversa) {
  const ultima = conversa.mensagens?.at(-1);
  if (!ultima) return null;
  return {
    role: ultima.role,
    content: ultima.content || "Nova mensagem",
    key: `${ultima.timestamp || conversa.ultima_msg || ""}:${ultima.role || ""}:${ultima.content || ""}`,
  };
}

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
      (data || []).forEach((conversa: Conversa) => {
        const mensagem = mensagemAtual(conversa);
        if (mensagem) mensagensVistas.current.set(conversa.id, mensagem.key);
      });
    };

    carregarEstadoInicial();
    const channel = supabase
      .channel(`whatsapp-alertas-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "whatsapp_conversas" },
        (payload) => {
          const conversa = payload.new as Conversa;
          const mensagem = mensagemAtual(conversa);
          if (!mensagem) return;
          const anterior = mensagensVistas.current.get(conversa.id);
          mensagensVistas.current.set(conversa.id, mensagem.key);
          if (anterior === mensagem.key || mensagem.role === "assistant") return;

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

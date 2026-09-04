import { useEffect, useRef, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "saborosamente:whatsapp-alerts";

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
  const [ativo, setAtivo] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mensagensVistas = useRef(new Map<string, string>());

  useEffect(() => {
    const preferenciaAtiva = localStorage.getItem(STORAGE_KEY) === "true";
    setAtivo(preferenciaAtiva && Notification.permission === "granted");
  }, []);

  useEffect(() => {
    if (!ativo) return;

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
      supabase.removeChannel(channel);
    };
  }, [ativo]);

  const ativar = async () => {
    if (!("Notification" in window) || !("AudioContext" in window || "webkitAudioContext" in window)) {
      toast.error("Este navegador não oferece suporte a alertas.");
      return;
    }
    const permissao = await Notification.requestPermission();
    if (permissao !== "granted") {
      toast.error("Permita as notificações do navegador para receber os avisos.");
      return;
    }
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current ??= new AudioContextClass();
    await audioContextRef.current.resume();
    tocarAlerta(audioContextRef.current);
    localStorage.setItem(STORAGE_KEY, "true");
    setAtivo(true);
    toast.success("Alertas do WhatsApp ativados.");
  };

  if (ativo) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-lg">
        <BellRing size={15} /> Alertas do WhatsApp ativos
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={ativar}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-[#5850ec] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#4740c9]"
      title="Ativar notificação e som para novas mensagens do WhatsApp"
    >
      <Bell size={17} /> Ativar alertas do WhatsApp
    </button>
  );
}

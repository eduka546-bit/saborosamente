import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Bot, MessageCircle, Clock, Phone, User, Zap, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/agente")({
  component: AdminAgentePage,
});

const WHATSAPP_PHONE_NUMBER_ID = "1273335069191981"; // atualizar quando trocar para número real

async function sendManualMessage(to: string, text: string) {
  // Chama a edge function para enviar mensagem manual
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ to, text }),
    }
  );
  return response.ok;
}

function ConversaCard({ c, onToggleModo }: { c: any; onToggleModo: (id: string, modo: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const isHumano = c.modo === "humano";
  const mensagens: any[] = c.mensagens ?? [];

  const handleSend = async () => {
    if (!msgText.trim()) return;
    setSending(true);
    try {
      // Salva no banco
      const novas = [...mensagens, { role: "assistant", content: msgText, manual: true }].slice(-20);
      await supabase.from("whatsapp_conversas").update({
        mensagens: novas,
        ultima_msg: new Date().toISOString(),
      }).eq("id", c.id);

      // Envia pelo WhatsApp via edge function
      const ok = await sendManualMessage(c.telefone, msgText);
      if (ok) {
        toast.success("Mensagem enviada!");
        setMsgText("");
        queryClient.invalidateQueries({ queryKey: ["whatsapp-conversas"] });
      } else {
        toast.error("Erro ao enviar. Verifique os logs da Edge Function.");
      }
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${isHumano ? "border-orange-200 bg-orange-50/30" : "border-gray-100 bg-white"}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${isHumano ? "bg-orange-100 text-orange-600" : "bg-[#5850ec]/10 text-[#5850ec]"}`}>
            {isHumano ? <User size={18} /> : <Bot size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-sm">{c.nome || "Desconhecido"}</p>
              <Badge className={isHumano ? "bg-orange-100 text-orange-700 text-[10px]" : "bg-[#5850ec]/10 text-[#5850ec] text-[10px]"}>
                {isHumano ? "👤 Humano" : "🤖 IA"}
              </Badge>
            </div>
            <p className="text-xs text-gray-400">{c.telefone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <p className="text-[10px] text-gray-400 flex items-center gap-1 justify-end">
              <Clock size={10} />
              {format(new Date(c.ultima_msg), "dd/MM HH:mm", { locale: ptBR })}
            </p>
            <p className="text-[10px] text-gray-400">{mensagens.length} msgs</p>
          </div>

          {/* Toggle modo */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleModo(c.id, c.modo); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              isHumano
                ? "bg-[#5850ec] text-white hover:bg-[#4338ca]"
                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
            }`}
          >
            {isHumano ? <><Zap size={12} /> Devolver à IA</> : <><User size={12} /> Assumir</>}
          </button>

          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* Preview última msg */}
      {!expanded && mensagens.length > 0 && (
        <div className="px-5 pb-3 ml-14">
          <p className="text-xs text-gray-500 truncate">
            <span className={`font-bold mr-1 ${mensagens.at(-1)?.role === "assistant" ? "text-[#5850ec]" : "text-gray-600"}`}>
              {mensagens.at(-1)?.role === "assistant" ? "IA:" : "Cliente:"}
            </span>
            {mensagens.at(-1)?.content?.slice(0, 80)}
          </p>
        </div>
      )}

      {/* Histórico expandido */}
      {expanded && (
        <div className="border-t bg-gray-50/50 p-4 space-y-3">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {mensagens.map((msg: any, i: number) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                  msg.role === "user"
                    ? "bg-white border text-gray-800 rounded-tl-sm"
                    : msg.manual
                    ? "bg-orange-500 text-white rounded-tr-sm"
                    : "bg-[#5850ec] text-white rounded-tr-sm"
                }`}>
                  {msg.manual && <p className="text-[9px] opacity-70 mb-0.5">👤 Você</p>}
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Campo de resposta manual — só quando em modo humano */}
          {isHumano && (
            <div className="flex gap-2 pt-2 border-t">
              <input
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Digite sua resposta..."
                className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
              />
              <Button
                onClick={handleSend}
                disabled={sending || !msgText.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white shrink-0 gap-1.5"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminAgentePage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [filterModo, setFilterModo] = useState<"todos" | "ia" | "humano">("todos");

  const { isLoading: loadingConfig } = useQuery({
    queryKey: ["agente-config"],
    queryFn: async () => {
      const { data } = await supabase.from("agente_config").select("*").maybeSingle();
      if (data) setConfig(data);
      return data;
    },
  });

  const { data: conversas = [], isLoading: loadingConversas } = useQuery({
    queryKey: ["whatsapp-conversas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_conversas")
        .select("*")
        .order("ultima_msg", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const toggleModoMutation = useMutation({
    mutationFn: async ({ id, modoAtual }: { id: string; modoAtual: string }) => {
      const novoModo = modoAtual === "humano" ? "ia" : "humano";
      const { error } = await supabase
        .from("whatsapp_conversas")
        .update({ modo: novoModo })
        .eq("id", id);
      if (error) throw error;
      return novoModo;
    },
    onSuccess: (novoModo) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversas"] });
      toast.success(novoModo === "humano" ? "Você assumiu a conversa!" : "IA voltou a responder!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase
      .from("agente_config")
      .update({ nome_agente: config.nome_agente, system_prompt: config.system_prompt, ativo: config.ativo, updated_at: new Date().toISOString() })
      .eq("id", config.id);
    setSaving(false);
    if (error) toast.error("Erro: " + error.message);
    else { queryClient.invalidateQueries({ queryKey: ["agente-config"] }); toast.success("Configurações salvas!"); }
  };

  const filteredConversas = conversas.filter((c: any) =>
    filterModo === "todos" ? true : c.modo === filterModo
  );

  const humanasCount = conversas.filter((c: any) => c.modo === "humano").length;

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec] flex items-center gap-2">
            <Bot size={24} /> Agente IA — WhatsApp
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie o assistente virtual e intervenha quando necessário.</p>
        </div>
        <div className="flex items-center gap-3">
          {humanasCount > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
              <User size={16} className="text-orange-600" />
              <span className="text-sm font-bold text-orange-700">{humanasCount} aguardando você</span>
            </div>
          )}
          {config && (
            <>
              <span className="text-sm text-gray-500">{config.ativo ? "Agente ativo" : "Pausado"}</span>
              <Switch checked={config.ativo} onCheckedChange={v => setConfig({ ...config, ativo: v })} />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Config */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border p-6 space-y-5">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Bot size={18} className="text-[#5850ec]" /> Configuração</h3>
            {loadingConfig ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#5850ec]" size={28} /></div> : config ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">Nome do Agente</label>
                  <input value={config.nome_agente} onChange={e => setConfig({ ...config, nome_agente: e.target.value })} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">Instruções da IA</label>
                  <p className="text-[11px] text-gray-400">Tom, regras, o que pode/não pode falar. Cardápio é adicionado automaticamente.</p>
                  <textarea value={config.system_prompt} onChange={e => setConfig({ ...config, system_prompt: e.target.value })} rows={8} className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30 resize-none font-mono" />
                </div>
                <Button onClick={saveConfig} disabled={saving} className="w-full bg-[#5850ec] text-white">
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Salvar
                </Button>
              </>
            ) : null}
          </div>

          {/* Webhook info */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 space-y-2">
            <h4 className="font-bold text-blue-800 text-sm flex items-center gap-2"><Phone size={14} /> Webhook URL</h4>
            <p className="font-mono text-[11px] text-blue-900 break-all bg-white rounded-lg px-3 py-2 border border-blue-100">
              {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-agent`}
            </p>
            <p className="text-[11px] text-blue-600"><strong>Verify Token:</strong> saborosamente-webhook-2026</p>
          </div>
        </div>

        {/* Conversas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle size={18} className="text-[#5850ec]" /> Conversas
              <span className="text-xs text-gray-400 font-normal">{conversas.length} contatos</span>
            </h3>
            <div className="flex gap-2">
              {(["todos", "ia", "humano"] as const).map(f => (
                <button key={f} onClick={() => setFilterModo(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterModo === f ? "bg-[#5850ec] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {f === "todos" ? "Todos" : f === "ia" ? "🤖 IA" : "👤 Humano"}
                </button>
              ))}
            </div>
          </div>

          {loadingConversas ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#5850ec]" size={28} /></div>
          ) : filteredConversas.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed">
              <MessageCircle size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Nenhuma conversa ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConversas.map((c: any) => (
                <ConversaCard
                  key={c.id}
                  c={c}
                  onToggleModo={(id, modo) => toggleModoMutation.mutate({ id, modoAtual: modo })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

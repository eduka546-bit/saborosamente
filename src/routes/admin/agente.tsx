import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Bot, MessageCircle, Clock, Phone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/agente")({
  component: AdminAgentePage,
});

function AdminAgentePage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<any>(null);
  const [selectedConversa, setSelectedConversa] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const { isLoading: loadingConfig } = useQuery({
    queryKey: ["agente-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agente_config")
        .select("*")
        .maybeSingle();
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
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase
      .from("agente_config")
      .update({
        nome_agente: config.nome_agente,
        system_prompt: config.system_prompt,
        ativo: config.ativo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.id);
    setSaving(false);
    if (error) toast.error("Erro: " + error.message);
    else {
      queryClient.invalidateQueries({ queryKey: ["agente-config"] });
      toast.success("Configurações do agente salvas!");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec] flex items-center gap-2">
            <Bot size={24} /> Agente IA — WhatsApp
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure o assistente virtual que responde clientes automaticamente no WhatsApp.
          </p>
        </div>
        {config && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{config.ativo ? "Agente ativo" : "Agente pausado"}</span>
            <Switch
              checked={config.ativo}
              onCheckedChange={v => setConfig({ ...config, ativo: v })}
            />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuração */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border p-6 space-y-5">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Bot size={18} className="text-[#5850ec]" /> Configuração do Agente
            </h3>

            {loadingConfig ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#5850ec]" size={28} /></div>
            ) : config ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">Nome do Agente</label>
                  <input
                    value={config.nome_agente}
                    onChange={e => setConfig({ ...config, nome_agente: e.target.value })}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">
                    Instruções / Personalidade (System Prompt)
                  </label>
                  <p className="text-[11px] text-gray-400">
                    Defina como o agente deve se comportar, o tom de voz, o que pode e não pode falar.
                    O cardápio e informações do site são adicionados automaticamente.
                  </p>
                  <textarea
                    value={config.system_prompt}
                    onChange={e => setConfig({ ...config, system_prompt: e.target.value })}
                    rows={10}
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30 resize-none font-mono"
                  />
                </div>

                <Button onClick={saveConfig} disabled={saving} className="w-full bg-[#5850ec] text-white">
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  Salvar Configurações
                </Button>
              </>
            ) : null}
          </div>

          {/* Instrução do webhook */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 space-y-3">
            <h4 className="font-bold text-blue-800 text-sm flex items-center gap-2">
              <Phone size={16} /> URL do Webhook para a Meta
            </h4>
            <p className="text-xs text-blue-700">
              Configure esse URL no painel da Meta (WhatsApp → Configuration → Webhook):
            </p>
            <div className="bg-white rounded-xl border border-blue-200 px-4 py-3 font-mono text-xs text-blue-900 break-all">
              {`${window.location.origin.replace("saborosamente.vercel.app", "lxcgbrovdmpjatywweiv.supabase.co")}/functions/v1/whatsapp-agent`}
            </div>
            <p className="text-xs text-blue-600">
              <strong>Verify Token:</strong> saborosamente-webhook-2026
            </p>
            <p className="text-xs text-blue-600">
              <strong>Campos assinados:</strong> messages
            </p>
          </div>
        </div>

        {/* Conversas */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle size={18} className="text-[#5850ec]" /> Conversas
              <span className="ml-2 text-xs text-gray-400 font-normal">{conversas.length} contatos</span>
            </h3>
          </div>

          {loadingConversas ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#5850ec]" size={28} /></div>
          ) : conversas.length === 0 ? (
            <div className="py-16 text-center">
              <MessageCircle size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Nenhuma conversa ainda.</p>
              <p className="text-gray-400 text-xs mt-1">As mensagens aparecerão aqui assim que chegarem.</p>
            </div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {conversas.map((c: any) => (
                <div
                  key={c.id}
                  className="px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedConversa(selectedConversa?.id === c.id ? null : c)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-[#5850ec]/10 flex items-center justify-center text-[#5850ec] font-black text-sm shrink-0">
                        {(c.nome || c.telefone)?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.nome || "Desconhecido"}</p>
                        <p className="text-xs text-gray-400">{c.telefone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {format(new Date(c.ultima_msg), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {(c.mensagens as any[])?.length ?? 0} msgs
                      </p>
                    </div>
                  </div>

                  {/* Preview da última mensagem */}
                  {(c.mensagens as any[])?.length > 0 && (
                    <p className="text-xs text-gray-500 truncate ml-11">
                      {(c.mensagens as any[]).at(-1)?.content?.slice(0, 80)}...
                    </p>
                  )}

                  {/* Histórico expandido */}
                  {selectedConversa?.id === c.id && (
                    <div className="mt-4 space-y-2 border-t pt-3" onClick={e => e.stopPropagation()}>
                      {(c.mensagens as any[]).map((msg: any, i: number) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                            msg.role === "user"
                              ? "bg-[#5850ec] text-white rounded-tr-sm"
                              : "bg-gray-100 text-gray-800 rounded-tl-sm"
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

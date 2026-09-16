import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, MessageCircle, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/whatsapp-notificacoes")({
  component: WhatsAppNotificacoesPage,
});

type EtapaConfig = {
  ativo: boolean;
  texto: string;
  template_meta: string;
};

type Config = {
  confirmado: EtapaConfig;
  saiu_entrega: EtapaConfig;
  pronto_retirada: EtapaConfig;
  feedback: EtapaConfig;
};

const DEFAULT_CONFIG: Config = {
  confirmado: {
    ativo: true,
    texto: "✅ Oii, *{nome}*! Seu pedido *#{protocolo}* foi recebido e confirmado com sucesso.\n\nSaborosaMente 🍱",
    template_meta: "pedido_confirmado",
  },
  saiu_entrega: {
    ativo: true,
    texto: "🚚 Oii, *{nome}*! Seu pedido *#{protocolo}* saiu para entrega e já está a caminho.\n\nSaborosaMente 🍱",
    template_meta: "pedido_saiu_entrega",
  },
  pronto_retirada: {
    ativo: true,
    texto: "🛍️ Oii, *{nome}*! Seu pedido *#{protocolo}* já está pronto para retirada na loja.\n\nSaborosaMente 🍱",
    template_meta: "pedido_pronto_retirada",
  },
  feedback: {
    ativo: true,
    texto: "Oii, *{nome}*! 😊 Seu pedido *#{protocolo}* foi finalizado.\n\nQueremos muito saber como foi sua experiência com a SaborosaMente 💚\nSe puder, conta pra gente por aqui mesmo o que achou do pedido, dos pratos e do atendimento.\n\nSeu feedback ajuda bastante a gente a melhorar cada vez mais. 🫶🏼\n\nSaborosaMente 🍱",
    template_meta: "feedback_pedido",
  },
};

const ETAPAS: Array<{ key: keyof Config; titulo: string; descricao: string }> = [
  { key: "confirmado", titulo: "Pedido recebido e confirmado", descricao: "Enviado quando o pedido é confirmado." },
  { key: "saiu_entrega", titulo: "Pedido saiu para entrega", descricao: "Usado apenas quando o pedido é entrega." },
  { key: "pronto_retirada", titulo: "Pedido pronto para retirada", descricao: "Usado automaticamente quando o pedido é retirada." },
  { key: "feedback", titulo: "Pedido finalizado / feedback", descricao: "Pede um feedback escrito após a finalização." },
];

function WhatsAppNotificacoesPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  const { isLoading } = useQuery({
    queryKey: ["config-whatsapp-notificacoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("parametros_loja").maybeSingle();
      if (error) throw error;
      const parametros = (data?.parametros_loja as any) ?? {};
      const salvo = parametros.whatsapp_notificacoes ?? {};
      const merged: Config = {
        confirmado: { ...DEFAULT_CONFIG.confirmado, ...(salvo.confirmado ?? {}) },
        saiu_entrega: { ...DEFAULT_CONFIG.saiu_entrega, ...(salvo.saiu_entrega ?? {}) },
        pronto_retirada: { ...DEFAULT_CONFIG.pronto_retirada, ...(salvo.pronto_retirada ?? {}) },
        feedback: { ...DEFAULT_CONFIG.feedback, ...(salvo.feedback ?? {}) },
      };
      setConfig(merged);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("id,parametros_loja").maybeSingle();
      if (error) throw error;
      if (!data?.id) throw new Error("Configuração geral não encontrada.");
      const parametros = (data.parametros_loja as any) ?? {};
      const { error: updateError } = await supabase
        .from("site_settings")
        .update({ parametros_loja: { ...parametros, whatsapp_notificacoes: config } } as any)
        .eq("id", data.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-whatsapp-notificacoes"] });
      toast.success("Notificações do WhatsApp salvas!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  const setEtapa = (key: keyof Config, patch: Partial<EtapaConfig>) => {
    setConfig((atual) => ({ ...atual, [key]: { ...atual[key], ...patch } }));
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec] flex items-center gap-2">
            <MessageCircle size={24} /> Notificações de pedido no WhatsApp
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Edite os textos e vincule os templates Utility aprovados pela Meta.
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isLoading} className="bg-[#5850ec] text-white">
          {saveMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
          Salvar
        </Button>
      </div>

      <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Dentro da janela de atendimento, o sistema pode enviar a mensagem normal. Fora dela, use o nome do template Utility aprovado pela Meta. Variáveis disponíveis: <b>{"{nome}"}</b> e <b>{"{protocolo}"}</b>.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : (
        <div className="space-y-4">
          {ETAPAS.map((etapa) => {
            const item = config[etapa.key];
            return (
              <div key={etapa.key} className="bg-white border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-bold text-gray-900">{etapa.titulo}</h2>
                    <p className="text-xs text-gray-500 mt-1">{etapa.descricao}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    {item.ativo ? "Ativo" : "Desativado"}
                    <Switch checked={item.ativo} onCheckedChange={(ativo) => setEtapa(etapa.key, { ativo })} />
                  </div>
                </div>

                <label className="text-xs font-bold uppercase text-gray-400">Mensagem</label>
                <textarea
                  value={item.texto}
                  onChange={(e) => setEtapa(etapa.key, { texto: e.target.value })}
                  rows={6}
                  disabled={!item.ativo}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm resize-y outline-none focus:ring-2 focus:ring-[#5850ec]/20 disabled:bg-gray-50 disabled:text-gray-400"
                />

                <div className="mt-4">
                  <label className="text-xs font-bold uppercase text-gray-400">Nome do template Utility na Meta</label>
                  <Input
                    value={item.template_meta}
                    onChange={(e) => setEtapa(etapa.key, { template_meta: e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                    placeholder="ex: pedido_confirmado"
                    disabled={!item.ativo}
                    className="mt-1"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

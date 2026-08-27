import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Loader2, Save, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DEFAULT_MENSAGENS,
  normalizarMensagens,
  STATUS_MENSAGENS,
  type MensagensWhatsappConfig,
} from "@/lib/mensagens-whatsapp-config";

export const Route = createFileRoute("/admin/config/mensagens")({
  component: AdminMensagensPage,
  ssr: false,
});

function AdminMensagensPage() {
  const queryClient = useQueryClient();
  const [mensagens, setMensagens] = useState<MensagensWhatsappConfig>(DEFAULT_MENSAGENS);

  const { isLoading } = useQuery({
    queryKey: ["config-mensagens-whatsapp"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("parametros_loja").maybeSingle();
      const pl = (data?.parametros_loja as any) ?? {};
      setMensagens(normalizarMensagens(pl.mensagens_whatsapp));
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await supabase.from("site_settings").select("parametros_loja").maybeSingle();
      const pl = (data?.parametros_loja as any) ?? {};
      const payload = { ...pl, mensagens_whatsapp: mensagens };
      const { error } = await supabase
        .from("site_settings")
        .update({ parametros_loja: payload } as any)
        .neq("id", "");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-mensagens-whatsapp"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Mensagens salvas! As próximas notificações usarão os novos textos.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-8 flex items-center gap-2">
        <MessageCircle size={22} className="text-[#5850ec]" />
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Mensagens do WhatsApp</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Edite os textos que o cliente recebe quando o status do pedido muda.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Placeholders disponíveis:</p>
            <ul className="text-xs space-y-0.5">
              <li>
                <code className="bg-amber-100 px-1 rounded">{"{nome}"}</code> → primeiro nome do
                cliente
              </li>
              <li>
                <code className="bg-amber-100 px-1 rounded">{"{protocolo}"}</code> → código do
                pedido (ex: A1B2C3D4)
              </li>
              <li>
                <code className="bg-amber-100 px-1 rounded">{"{link}"}</code> → link de
                acompanhamento
              </li>
            </ul>
            <p className="text-xs mt-2 text-amber-600">
              Use <code>*texto*</code> para negrito e <code>_texto_</code> para itálico (formatação
              do WhatsApp).
            </p>
          </div>

          {STATUS_MENSAGENS.map(({ key, label }) => (
            <div key={key} className="bg-white rounded-xl border p-5 space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block">
                {label}
              </label>
              <textarea
                value={mensagens[key]}
                onChange={(e) => setMensagens({ ...mensagens, [key]: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none h-32 outline-none focus:ring-2 focus:ring-[#5850ec]/30 font-mono leading-relaxed"
                placeholder={DEFAULT_MENSAGENS[key]}
              />
              <button
                type="button"
                onClick={() => setMensagens({ ...mensagens, [key]: DEFAULT_MENSAGENS[key] })}
                className="text-[10px] uppercase font-bold text-gray-400 hover:text-[#5850ec]"
              >
                Restaurar padrão
              </button>
            </div>
          ))}

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full bg-[#5850ec] text-white"
          >
            {saveMutation.isPending ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Save size={16} className="mr-2" />
            )}{" "}
            Salvar Mensagens
          </Button>
        </div>
      )}
    </div>
  );
}

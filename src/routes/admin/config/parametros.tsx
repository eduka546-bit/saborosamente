import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/parametros")({
  component: AdminConfigParametrosPage,
});

const DEFAULT_PARAMS = {
  pedido_minimo: "0",
  frete_gratis_acima: "120",
  tempo_entrega_estimado: "45-60 min",
  aceitar_retirada: true,
  aceitar_delivery: true,
  maximo_itens_pedido: "50",
};

function AdminConfigParametrosPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<any>(DEFAULT_PARAMS);

  const { isLoading } = useQuery({
    queryKey: ["config-parametros"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("parametros_loja").maybeSingle();
      if (data?.parametros_loja) setParams({ ...DEFAULT_PARAMS, ...(data.parametros_loja as any) });
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").update({ parametros_loja: params } as any).neq("id", "");
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["config-parametros"] }); toast.success("Parâmetros salvos!"); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-8"><h1 className="text-2xl font-bold text-[#5850ec]">Parâmetros da Loja</h1><p className="text-gray-500 text-sm mt-1">Configurações gerais de operação.</p></div>

      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div> : (
        <div className="bg-white rounded-xl border p-6 space-y-5">
          {[
            { key: "pedido_minimo", label: "Pedido mínimo (R$)", type: "number" },
            { key: "frete_gratis_acima", label: "Frete grátis acima de (R$)", type: "number" },
            { key: "tempo_entrega_estimado", label: "Tempo de entrega estimado", type: "text" },
            { key: "maximo_itens_pedido", label: "Máximo de itens por pedido", type: "number" },
          ].map(field => (
            <div key={field.key}>
              <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">{field.label}</label>
              <Input type={field.type} value={params[field.key]} onChange={e => setParams({ ...params, [field.key]: e.target.value })} />
            </div>
          ))}

          {[
            { key: "aceitar_delivery", label: "Aceitar Delivery" },
            { key: "aceitar_retirada", label: "Aceitar Retirada no Local" },
          ].map(toggle => (
            <div key={toggle.key} className="flex items-center justify-between p-3 border rounded-xl">
              <p className="text-sm font-semibold text-gray-700">{toggle.label}</p>
              <Switch checked={!!params[toggle.key]} onCheckedChange={v => setParams({ ...params, [toggle.key]: v })} />
            </div>
          ))}

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full bg-[#5850ec] text-white">
            {saveMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Salvar Parâmetros
          </Button>
        </div>
      )}
    </div>
  );
}

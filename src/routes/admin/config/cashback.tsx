import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/cashback")({
  component: AdminConfigCashbackPage,
});

function AdminConfigCashbackPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    ativo: false,
    percentual: "5",
    minimo_pedido: "0",
    validade_dias: "30",
  });

  const { isLoading } = useQuery({
    queryKey: ["config-cashback"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("cashback_config").maybeSingle();
      if (data?.cashback_config) setConfig(data.cashback_config as any);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .update({ cashback_config: config } as any)
        .neq("id", "");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-cashback"] });
      toast.success("Configurações de cashback salvas!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Configurações de Cashback</h1>
        <p className="text-gray-500 text-sm mt-1">Defina as regras do programa de cashback.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <p className="font-semibold text-gray-800">Cashback Ativo</p>
              <p className="text-xs text-gray-500">Habilitar programa de cashback</p>
            </div>
            <Switch
              checked={config.ativo}
              onCheckedChange={(v) => setConfig({ ...config, ativo: v })}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                Percentual de Cashback (%)
              </label>
              <Input
                type="number"
                step="0.5"
                value={config.percentual}
                onChange={(e) => setConfig({ ...config, percentual: e.target.value })}
                placeholder="5"
              />
              <p className="text-xs text-gray-400 mt-1">
                Porcentagem do valor do pedido retornada como cashback
              </p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                Pedido mínimo para gerar cashback (R$)
              </label>
              <Input
                type="number"
                step="1"
                value={config.minimo_pedido}
                onChange={(e) => setConfig({ ...config, minimo_pedido: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                Validade do cashback (dias)
              </label>
              <Input
                type="number"
                step="1"
                value={config.validade_dias}
                onChange={(e) => setConfig({ ...config, validade_dias: e.target.value })}
                placeholder="30"
              />
            </div>
          </div>

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
            Salvar Configurações
          </Button>
        </div>
      )}
    </div>
  );
}

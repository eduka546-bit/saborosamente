import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Printer } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/impressao")({
  component: AdminConfigImpressaoPage,
});

const DEFAULT = {
  impressao_automatica: false,
  impressora_ip: "",
  impressora_porta: "9100",
  imprimir_ao_confirmar: true,
  imprimir_ao_entregar: false,
  copias: "1",
  tamanho_papel: "80mm",
};

function AdminConfigImpressaoPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<any>(DEFAULT);

  const { isLoading } = useQuery({
    queryKey: ["config-impressao"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("config_impressao").maybeSingle();
      if (data?.config_impressao) setConfig({ ...DEFAULT, ...(data.config_impressao as any) });
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").update({ config_impressao: config } as any).neq("id", "");
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["config-impressao"] }); toast.success("Configurações salvas!"); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-8"><h1 className="text-2xl font-bold text-[#5850ec]">Impressão Automática</h1><p className="text-gray-500 text-sm mt-1">Configure a impressão automática de tickets de pedido.</p></div>

      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div> : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-6 space-y-5">
            <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50">
              <div className="flex items-center gap-2"><Printer size={18} className="text-[#5850ec]" /><div><p className="font-semibold text-gray-800">Impressão Automática</p><p className="text-xs text-gray-500">Imprimir pedidos automaticamente</p></div></div>
              <Switch checked={config.impressao_automatica} onCheckedChange={v => setConfig({ ...config, impressao_automatica: v })} />
            </div>

            {config.impressao_automatica && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div><label className="text-xs font-bold uppercase text-gray-400 mb-1 block">IP da Impressora</label><Input value={config.impressora_ip} onChange={e => setConfig({ ...config, impressora_ip: e.target.value })} placeholder="192.168.1.100" /></div>
                <div><label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Porta</label><Input value={config.impressora_porta} onChange={e => setConfig({ ...config, impressora_porta: e.target.value })} placeholder="9100" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Cópias</label><Input type="number" value={config.copias} onChange={e => setConfig({ ...config, copias: e.target.value })} /></div>
                  <div><label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Papel</label>
                    <select value={config.tamanho_papel} onChange={e => setConfig({ ...config, tamanho_papel: e.target.value })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                      <option value="58mm">58mm</option>
                      <option value="80mm">80mm</option>
                    </select>
                  </div>
                </div>
                {[{ key: "imprimir_ao_confirmar", label: "Imprimir ao confirmar pedido" }, { key: "imprimir_ao_entregar", label: "Imprimir ao marcar como entregue" }].map(t => (
                  <div key={t.key} className="flex items-center justify-between p-3 border rounded-xl">
                    <p className="text-sm font-medium text-gray-700">{t.label}</p>
                    <Switch checked={!!config[t.key]} onCheckedChange={v => setConfig({ ...config, [t.key]: v })} />
                  </div>
                ))}
              </div>
            )}

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full bg-[#5850ec] text-white">
              {saveMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

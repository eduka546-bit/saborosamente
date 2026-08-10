import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/horarios")({
  component: AdminConfigHorariosPage,
});

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DEFAULT_HORARIOS = DIAS.map(d => ({ dia: d, aberto: true, abertura: "09:00", fechamento: "18:00" }));

function AdminConfigHorariosPage() {
  const queryClient = useQueryClient();
  const [horarios, setHorarios] = useState<any[]>([]);

  const { isLoading } = useQuery({
    queryKey: ["config-horarios"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("horarios_funcionamento").maybeSingle();
      const h = data?.horarios_funcionamento;
      setHorarios(Array.isArray(h) && h.length === 7 ? h : DEFAULT_HORARIOS);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").update({ horarios_funcionamento: horarios } as any).neq("id", "");
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["config-horarios"] }); toast.success("Horários salvos!"); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const update = (idx: number, field: string, value: any) => {
    const next = [...horarios];
    next[idx] = { ...next[idx], [field]: value };
    setHorarios(next);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-[#5850ec]">Horários de Funcionamento</h1><p className="text-gray-500 text-sm mt-1">Configure os horários de atendimento por dia da semana.</p></div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-[#5850ec] text-white">
          {saveMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Salvar
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          {horarios.map((h, idx) => (
            <div key={h.dia} className="flex items-center gap-4 px-6 py-4 border-b last:border-0 hover:bg-gray-50">
              <div className="w-24">
                <p className="text-sm font-bold text-gray-900">{h.dia}</p>
              </div>
              <Switch checked={h.aberto} onCheckedChange={v => update(idx, "aberto", v)} />
              {h.aberto ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input type="time" value={h.abertura} onChange={e => update(idx, "abertura", e.target.value)} className="h-8 w-32 text-sm" />
                  <span className="text-gray-400 text-sm">até</span>
                  <Input type="time" value={h.fechamento} onChange={e => update(idx, "fechamento", e.target.value)} className="h-8 w-32 text-sm" />
                </div>
              ) : (
                <span className="text-sm text-gray-400 flex-1">Fechado</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

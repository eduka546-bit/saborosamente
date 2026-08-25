import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Truck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/horarios")({
  component: AdminConfigHorariosPage,
});

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DEFAULT_HORARIOS = DIAS.map((d) => ({
  dia: d,
  aberto: true,
  abertura: "09:00",
  fechamento: "18:00",
  entrega_ativa: true, // entrega disponível neste dia
  entrega_abertura: "09:00", // horário início das entregas
  entrega_fechamento: "18:00",
}));

function AdminConfigHorariosPage() {
  const queryClient = useQueryClient();
  const [horarios, setHorarios] = useState<any[]>([]);
  const [aba, setAba] = useState<"atendimento" | "entrega">("atendimento");

  const { isLoading } = useQuery({
    queryKey: ["config-horarios"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("horarios_funcionamento")
        .maybeSingle();
      const h = data?.horarios_funcionamento;
      setHorarios(
        Array.isArray(h) && h.length === 7
          ? h.map((d: any, i: number) => ({
              ...DEFAULT_HORARIOS[i],
              ...d,
            }))
          : DEFAULT_HORARIOS,
      );
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .update({ horarios_funcionamento: horarios } as any)
        .neq("id", "");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-horarios"] });
      toast.success("Horários salvos!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const update = (idx: number, field: string, value: any) => {
    const next = [...horarios];
    next[idx] = { ...next[idx], [field]: value };
    setHorarios(next);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Horários</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure atendimento e entregas por dia da semana.
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-[#5850ec] text-white"
        >
          {saveMutation.isPending ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Save size={16} className="mr-2" />
          )}{" "}
          Salvar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "atendimento", label: "🕐 Atendimento" },
          { id: "entrega", label: "🚚 Entregas" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAba(t.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${aba === t.id ? "bg-[#5850ec] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            {aba === "atendimento" ? (
              <>
                <Clock size={14} /> Horário de atendimento ao cliente
              </>
            ) : (
              <>
                <Truck size={14} /> Dias e horários de entrega
              </>
            )}
          </div>
          {horarios.map((h, idx) => (
            <div
              key={h.dia}
              className={`flex items-center gap-4 px-6 py-4 border-b last:border-0 hover:bg-gray-50 ${
                (aba === "atendimento" ? !h.aberto : !h.entrega_ativa) ? "opacity-60" : ""
              }`}
            >
              <div className="w-20 shrink-0">
                <p className="text-sm font-bold text-gray-900">{h.dia}</p>
              </div>
              <Switch
                checked={aba === "atendimento" ? h.aberto : h.entrega_ativa}
                onCheckedChange={(v) =>
                  update(idx, aba === "atendimento" ? "aberto" : "entrega_ativa", v)
                }
              />
              {(aba === "atendimento" ? h.aberto : h.entrega_ativa) ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={aba === "atendimento" ? h.abertura : h.entrega_abertura}
                    onChange={(e) =>
                      update(
                        idx,
                        aba === "atendimento" ? "abertura" : "entrega_abertura",
                        e.target.value,
                      )
                    }
                    className="h-8 w-28 text-sm"
                  />
                  <span className="text-gray-400 text-xs">às</span>
                  <Input
                    type="time"
                    value={aba === "atendimento" ? h.fechamento : h.entrega_fechamento}
                    onChange={(e) =>
                      update(
                        idx,
                        aba === "atendimento" ? "fechamento" : "entrega_fechamento",
                        e.target.value,
                      )
                    }
                    className="h-8 w-28 text-sm"
                  />
                </div>
              ) : (
                <span className="text-xs text-gray-400 flex-1">
                  {aba === "atendimento" ? "Fechado" : "Sem entrega"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

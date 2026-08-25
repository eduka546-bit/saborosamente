import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, CalendarX } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/config/excecoes")({
  component: AdminConfigExceoesPage,
});

function AdminConfigExceoesPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ data: "", motivo: "" });

  const { data = [], isLoading } = useQuery({
    queryKey: ["excecoes-funcionamento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("excecoes_funcionamento")
        .select("*")
        .order("data");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("excecoes_funcionamento").insert(v);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excecoes-funcionamento"] });
      toast.success("Exceção adicionada!");
      setIsAdding(false);
      setForm({ data: "", motivo: "" });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("excecoes_funcionamento").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excecoes-funcionamento"] });
      toast.success("Removida.");
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Exceções de Funcionamento</h1>
          <p className="text-gray-500 text-sm mt-1">
            Dias fechados por feriado ou evento especial.
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-[#5850ec] text-white flex items-center gap-2"
        >
          <Plus size={16} /> Adicionar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          {data.length === 0 && (
            <div className="p-16 text-center">
              <CalendarX size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400">Nenhuma exceção cadastrada.</p>
            </div>
          )}
          {data.map((ex: any) => (
            <div
              key={ex.id}
              className="flex items-center justify-between px-6 py-4 border-b last:border-0"
            >
              <div>
                <p className="font-bold text-gray-900">
                  {ex.data
                    ? format(new Date(ex.data + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })
                    : "—"}
                </p>
                <p className="text-sm text-gray-500">{ex.motivo ?? "Sem motivo especificado"}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-red-500"
                onClick={() => deleteMutation.mutate(ex.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-5 text-[#5850ec]">Nova Exceção</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Data *
                </label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Motivo
                </label>
                <Input
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  placeholder="Ex: Feriado Nacional"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={() => addMutation.mutate(form)}
                  className="flex-1 bg-[#5850ec] text-white"
                  disabled={!form.data}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

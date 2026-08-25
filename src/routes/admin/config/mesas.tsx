import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/mesas")({
  component: AdminConfigMesasPage,
});

function AdminConfigMesasPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ numero: "", capacidade: "4", ativo: true });

  const { data = [], isLoading } = useQuery({
    queryKey: ["mesas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mesas").select("*").order("numero");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("mesas").insert(v);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mesas"] });
      toast.success("Mesa adicionada!");
      setIsAdding(false);
      setForm({ numero: "", capacidade: "4", ativo: true });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: any) => {
      const { error } = await supabase.from("mesas").update({ ativo: !ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mesas"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mesas"] });
      toast.success("Mesa removida.");
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Mesas</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie as mesas do estabelecimento.</p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-[#5850ec] text-white flex items-center gap-2"
        >
          <Plus size={16} /> Nova Mesa
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {data.length === 0 && (
            <div className="col-span-8 bg-white rounded-2xl border border-dashed p-16 text-center">
              <UtensilsCrossed size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400">Nenhuma mesa cadastrada.</p>
            </div>
          )}
          {data.map((mesa: any) => (
            <div
              key={mesa.id}
              className={`relative bg-white rounded-xl border p-4 text-center ${mesa.ativo ? "" : "opacity-50"}`}
            >
              <p className="text-2xl font-black text-[#5850ec]">{mesa.numero}</p>
              <p className="text-xs text-gray-400">{mesa.capacidade} lugares</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Switch
                  checked={mesa.ativo}
                  onCheckedChange={() => toggleMutation.mutate({ id: mesa.id, ativo: mesa.ativo })}
                  className="scale-75"
                />
                <button
                  onClick={() => deleteMutation.mutate(mesa.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-5 text-[#5850ec]">Nova Mesa</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Número da Mesa *
                </label>
                <Input
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  placeholder="Ex: 1, 2, A1..."
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Capacidade (lugares)
                </label>
                <Input
                  type="number"
                  value={form.capacidade}
                  onChange={(e) => setForm({ ...form, capacidade: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={() =>
                    addMutation.mutate({
                      numero: form.numero,
                      capacidade: Number(form.capacidade),
                      ativo: true,
                    })
                  }
                  className="flex-1 bg-[#5850ec] text-white"
                  disabled={!form.numero}
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

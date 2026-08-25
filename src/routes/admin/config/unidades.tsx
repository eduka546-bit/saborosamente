import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Edit3, Save, X, Store } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/unidades")({
  component: AdminConfigUnidadesPage,
});

function AdminConfigUnidadesPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", endereco: "", telefone: "", horario: "" });
  const [editForm, setEditForm] = useState({ nome: "", endereco: "", telefone: "", horario: "" });

  const { data = [], isLoading } = useQuery({
    queryKey: ["unidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("unidades").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("unidades").insert(v);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      toast.success("Unidade criada!");
      setIsAdding(false);
      setForm({ nome: "", endereco: "", telefone: "", horario: "" });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, v }: any) => {
      const { error } = await supabase.from("unidades").update(v).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      toast.success("Atualizado!");
      setEditingId(null);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("unidades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      toast.success("Removida.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Unidades</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie as unidades / pontos de atendimento.
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-[#5850ec] text-white flex items-center gap-2"
        >
          <Plus size={16} /> Nova Unidade
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.length === 0 && (
            <div className="md:col-span-2 bg-white rounded-2xl border border-dashed p-16 text-center">
              <Store size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400">Nenhuma unidade cadastrada.</p>
            </div>
          )}
          {data.map((u: any) => (
            <div key={u.id} className="bg-white rounded-xl border p-5">
              {editingId === u.id ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    placeholder="Nome"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={editForm.endereco}
                    onChange={(e) => setEditForm({ ...editForm, endereco: e.target.value })}
                    placeholder="Endereço"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={editForm.telefone}
                    onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                    placeholder="Telefone"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={editForm.horario}
                    onChange={(e) => setEditForm({ ...editForm, horario: e.target.value })}
                    placeholder="Horário"
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-green-600"
                      onClick={() => updateMutation.mutate({ id: u.id, v: editForm })}
                    >
                      <Save size={14} className="mr-1" /> Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400"
                      onClick={() => setEditingId(null)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{u.nome}</p>
                      <p className="text-sm text-gray-500 mt-1">{u.endereco}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-[#5850ec]"
                        onClick={() => {
                          setEditingId(u.id);
                          setEditForm({
                            nome: u.nome,
                            endereco: u.endereco ?? "",
                            telefone: u.telefone ?? "",
                            horario: u.horario ?? "",
                          });
                        }}
                      >
                        <Edit3 size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                        onClick={() => deleteMutation.mutate(u.id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                  {u.telefone && <p className="text-xs text-gray-400 mt-2">📞 {u.telefone}</p>}
                  {u.horario && <p className="text-xs text-gray-400 mt-1">🕐 {u.horario}</p>}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-5 text-[#5850ec]">Nova Unidade</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Nome *
                </label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Endereço
                </label>
                <Input
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Telefone
                </label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Horário
                </label>
                <Input
                  value={form.horario}
                  onChange={(e) => setForm({ ...form, horario: e.target.value })}
                  placeholder="Ex: Seg-Sex 9h–18h"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={() => addMutation.mutate(form)}
                  className="flex-1 bg-[#5850ec] text-white"
                  disabled={!form.nome}
                >
                  Criar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

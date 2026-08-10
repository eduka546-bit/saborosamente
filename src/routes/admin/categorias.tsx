import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Edit3, Save, X, GripVertical } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategoriasPage,
});

function AdminCategoriasPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "" });
  const [editForm, setEditForm] = useState({ nome: "", descricao: "" });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("*, produtos(count)")
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("categorias").insert({ ...values, ordem: categories.length });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Categoria criada!");
      setIsAdding(false);
      setForm({ nome: "", descricao: "" });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: any) => {
      const { error } = await supabase.from("categorias").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Categoria atualizada!");
      setEditingId(null);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categorias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Categoria removida.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Categorias</h1>
          <p className="text-gray-500 text-sm mt-1">Organize os itens do cardápio por categorias.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-[#5850ec] text-white flex items-center gap-2">
          <Plus size={16} /> Nova Categoria
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4 w-8"></th>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Produtos</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((cat: any) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-300"><GripVertical size={16} /></td>
                  {editingId === cat.id ? (
                    <>
                      <td className="px-3 py-2"><Input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} className="h-8 text-xs" /></td>
                      <td className="px-3 py-2"><Input value={editForm.descricao} onChange={e => setEditForm({ ...editForm, descricao: e.target.value })} className="h-8 text-xs" /></td>
                      <td className="px-6 py-4 text-gray-400">{cat.produtos?.[0]?.count ?? 0}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => updateMutation.mutate({ id: cat.id, values: editForm })}><Save size={14} /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400" onClick={() => setEditingId(null)}><X size={14} /></Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-bold text-gray-900">{cat.nome}</td>
                      <td className="px-6 py-4 text-gray-500">{cat.descricao ?? "—"}</td>
                      <td className="px-6 py-4 text-[#5850ec] font-bold">{cat.produtos?.[0]?.count ?? 0}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-[#5850ec]" onClick={() => { setEditingId(cat.id); setEditForm({ nome: cat.nome, descricao: cat.descricao ?? "" }); }}><Edit3 size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => { if (confirm("Excluir categoria?")) deleteMutation.mutate(cat.id); }}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6 text-[#5850ec]">Nova Categoria</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Nome *</label>
                <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Marmitas" required />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Descrição</label>
                <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Refeições completas" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">Cancelar</Button>
                <Button onClick={() => addMutation.mutate(form)} className="flex-1 bg-[#5850ec] text-white" disabled={!form.nome || addMutation.isPending}>
                  {addMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null} Criar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

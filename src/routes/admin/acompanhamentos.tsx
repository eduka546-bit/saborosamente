import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/acompanhamentos")({
  component: AdminAcompanhamentosPage,
});

function AdminAcompanhamentosPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", preco_adicional: "0" });
  const [editForm, setEditForm] = useState({ nome: "", descricao: "", preco_adicional: "0" });

  const { data = [], isLoading } = useQuery({
    queryKey: ["acompanhamentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("acompanhamentos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (v: any) => { const { error } = await supabase.from("acompanhamentos").insert(v); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] }); toast.success("Acompanhamento criado!"); setIsAdding(false); setForm({ nome: "", descricao: "", preco_adicional: "0" }); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, v }: any) => { const { error } = await supabase.from("acompanhamentos").update(v).eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] }); toast.success("Atualizado!"); setEditingId(null); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("acompanhamentos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] }); toast.success("Removido."); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Acompanhamentos</h1>
          <p className="text-gray-500 text-sm mt-1">Itens extras que podem acompanhar os pedidos.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-[#5850ec] text-white flex items-center gap-2">
          <Plus size={16} /> Novo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Preço adicional</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Nenhum acompanhamento cadastrado.</td></tr>
              )}
              {data.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {editingId === item.id ? (
                    <>
                      <td className="px-3 py-2"><Input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} className="h-8 text-xs" /></td>
                      <td className="px-3 py-2"><Input value={editForm.descricao} onChange={e => setEditForm({ ...editForm, descricao: e.target.value })} className="h-8 text-xs" /></td>
                      <td className="px-3 py-2"><Input type="number" step="0.01" value={editForm.preco_adicional} onChange={e => setEditForm({ ...editForm, preco_adicional: e.target.value })} className="h-8 text-xs w-24" /></td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => updateMutation.mutate({ id: item.id, v: { nome: editForm.nome, descricao: editForm.descricao, preco_adicional: Number(editForm.preco_adicional) } })}><Save size={14} /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400" onClick={() => setEditingId(null)}><X size={14} /></Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-bold text-gray-900">{item.nome}</td>
                      <td className="px-6 py-4 text-gray-500">{item.descricao ?? "—"}</td>
                      <td className="px-6 py-4 text-green-600 font-bold">R$ {Number(item.preco_adicional ?? 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-[#5850ec]" onClick={() => { setEditingId(item.id); setEditForm({ nome: item.nome, descricao: item.descricao ?? "", preco_adicional: String(item.preco_adicional ?? 0) }); }}><Edit3 size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => deleteMutation.mutate(item.id)}><Trash2 size={14} /></Button>
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
            <h2 className="text-xl font-bold mb-6 text-[#5850ec]">Novo Acompanhamento</h2>
            <div className="space-y-4">
              <div><label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Nome *</label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
              <div><label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Descrição</label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
              <div><label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Preço adicional (R$)</label><Input type="number" step="0.01" value={form.preco_adicional} onChange={e => setForm({ ...form, preco_adicional: e.target.value })} /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">Cancelar</Button>
                <Button onClick={() => addMutation.mutate({ nome: form.nome, descricao: form.descricao, preco_adicional: Number(form.preco_adicional) })} className="flex-1 bg-[#5850ec] text-white" disabled={!form.nome || addMutation.isPending}>Criar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

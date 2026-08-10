import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Truck, Edit3, Save, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config/entregador")({
  component: AdminConfigEntregadorPage,
});

function AdminConfigEntregadorPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", telefone: "", veiculo: "", ativo: true });
  const [editForm, setEditForm] = useState({ nome: "", telefone: "", veiculo: "" });

  const { data = [], isLoading } = useQuery({
    queryKey: ["entregadores"],
    queryFn: async () => { const { data, error } = await supabase.from("entregadores").select("*").order("nome"); if (error) throw error; return data; },
  });

  const addMutation = useMutation({
    mutationFn: async (v: any) => { const { error } = await supabase.from("entregadores").insert(v); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["entregadores"] }); toast.success("Entregador adicionado!"); setIsAdding(false); setForm({ nome: "", telefone: "", veiculo: "", ativo: true }); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, v }: any) => { const { error } = await supabase.from("entregadores").update(v).eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["entregadores"] }); toast.success("Atualizado!"); setEditingId(null); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("entregadores").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["entregadores"] }); toast.success("Removido."); },
  });

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-[#5850ec]">Entregadores</h1><p className="text-gray-500 text-sm mt-1">Gerencie os entregadores da sua loja.</p></div>
        <Button onClick={() => setIsAdding(true)} className="bg-[#5850ec] text-white flex items-center gap-2"><Plus size={16} /> Novo</Button>
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.length === 0 && <div className="col-span-3 bg-white rounded-2xl border border-dashed p-16 text-center"><Truck size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400">Nenhum entregador cadastrado.</p></div>}
          {data.map((e: any) => (
            <div key={e.id} className="bg-white rounded-xl border p-5">
              {editingId === e.id ? (
                <div className="space-y-2">
                  <Input value={editForm.nome} onChange={x => setEditForm({ ...editForm, nome: x.target.value })} className="h-8 text-sm" placeholder="Nome" />
                  <Input value={editForm.telefone} onChange={x => setEditForm({ ...editForm, telefone: x.target.value })} className="h-8 text-sm" placeholder="Telefone" />
                  <Input value={editForm.veiculo} onChange={x => setEditForm({ ...editForm, veiculo: x.target.value })} className="h-8 text-sm" placeholder="Veículo" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="text-green-600" onClick={() => updateMutation.mutate({ id: e.id, v: editForm })}><Save size={14} /></Button>
                    <Button size="sm" variant="ghost" className="text-gray-400" onClick={() => setEditingId(null)}><X size={14} /></Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#5850ec]/10 flex items-center justify-center text-[#5850ec] font-black">{e.nome?.[0]}</div>
                      <div><p className="font-bold text-gray-900">{e.nome}</p><p className="text-xs text-gray-400">{e.telefone}</p></div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-[#5850ec]" onClick={() => { setEditingId(e.id); setEditForm({ nome: e.nome, telefone: e.telefone ?? "", veiculo: e.veiculo ?? "" }); }}><Edit3 size={13} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => deleteMutation.mutate(e.id)}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                  {e.veiculo && <p className="text-xs text-gray-400 mt-2">🛵 {e.veiculo}</p>}
                  <Badge className={`mt-2 ${e.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{e.ativo ? "Ativo" : "Inativo"}</Badge>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-5 text-[#5850ec]">Novo Entregador</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Nome *</label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
              <div><label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Telefone</label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
              <div><label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Veículo</label><Input value={form.veiculo} onChange={e => setForm({ ...form, veiculo: e.target.value })} placeholder="Ex: Moto Honda CG 160" /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">Cancelar</Button>
                <Button onClick={() => addMutation.mutate(form)} className="flex-1 bg-[#5850ec] text-white" disabled={!form.nome}>Adicionar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Gift, Search, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cashback")({
  component: AdminCashbackPage,
});

function AdminCashbackPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ user_id: "", valor: "", descricao: "" });

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-cashback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashback")
        .select("*, profiles(nome, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("cashback").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cashback"] });
      toast.success("Cashback adicionado!");
      setIsAdding(false);
      setForm({ user_id: "", valor: "", descricao: "" });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cashback").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cashback"] });
      toast.success("Registro removido.");
    },
  });

  const filtered = data.filter((c: any) =>
    c.profiles?.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.profiles?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const total = data.reduce((s: number, c: any) => s + (c.valor ?? 0), 0);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Cashback</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie saldos de cashback dos clientes.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-[#5850ec] text-white flex items-center gap-2">
          <Plus size={16} /> Adicionar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-bold uppercase text-gray-400 tracking-widest">Total distribuído</p>
          <p className="text-2xl font-black text-green-600 mt-1">R$ {total.toFixed(2).replace(".", ",")}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-bold uppercase text-gray-400 tracking-widest">Registros</p>
          <p className="text-2xl font-black text-[#5850ec] mt-1">{data.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Buscar por cliente..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed p-16 text-center">
          <Gift size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">Nenhum cashback registrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{c.profiles?.nome ?? "—"}</p>
                    <p className="text-xs text-gray-400">{c.profiles?.email}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">R$ {Number(c.valor).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600">{c.descricao ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500 h-7 w-7" onClick={() => deleteMutation.mutate(c.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6 text-[#5850ec]">Adicionar Cashback</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">ID do Usuário</label>
                <Input value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} placeholder="UUID do usuário" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Valor (R$)</label>
                <Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} placeholder="10.00" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Descrição</label>
                <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Bônus de fidelidade" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">Cancelar</Button>
                <Button onClick={() => addMutation.mutate({ user_id: form.user_id, valor: Number(form.valor), descricao: form.descricao })} className="flex-1 bg-[#5850ec] text-white" disabled={addMutation.isPending}>
                  {addMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null} Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

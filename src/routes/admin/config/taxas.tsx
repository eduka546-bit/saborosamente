import { createFileRoute } from "@tanstack/react-router";
import { Settings, MapPin, DollarSign, Clock, Store, Plus, Trash2, Loader2, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/config/taxas")({
  component: AdminConfigTaxasPage,
});

const EMPTY = { bairro: "", cidade: "", taxa: "", tempo: "" };

function AdminConfigTaxasPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [editForm, setEditForm] = useState<any>(EMPTY);
  const [search, setSearch] = useState("");

  const { data: locais = [], isLoading } = useQuery({
    queryKey: ["delivery-rates-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_rates")
        .select("*")
        .order("city")
        .order("neighborhood");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("delivery_rates").insert({
        neighborhood: values.bairro,
        city: values.cidade,
        rate: Number(values.taxa),
        estimated_time: values.tempo || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-rates-admin"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-rates"] });
      toast.success("Bairro adicionado!");
      setIsAdding(false);
      setForm(EMPTY);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const { error } = await supabase.from("delivery_rates").update({
        neighborhood: values.bairro,
        city: values.cidade,
        rate: Number(values.taxa),
        estimated_time: values.tempo || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-rates-admin"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-rates"] });
      toast.success("Atualizado!");
      setEditingId(null);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_rates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-rates-admin"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-rates"] });
      toast.success("Bairro removido.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const startEdit = (local: any) => {
    setEditingId(local.id);
    setEditForm({
      bairro: local.neighborhood,
      cidade: local.city,
      taxa: local.rate,
      tempo: local.estimated_time || "",
    });
  };

  const filtered = locais.filter((l: any) =>
    l.neighborhood?.toLowerCase().includes(search.toLowerCase()) ||
    l.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Entregas e Locais</h1>
          <p className="text-gray-500 text-sm mt-1">Configure taxas por bairro e tempos estimados.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-[#5850ec] hover:bg-[#5850ec]/90 flex items-center gap-2">
          <Plus size={18} /> Adicionar Bairro
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar por bairro ou cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <MapPin size={18} className="text-[#5850ec]" /> Bairros Atendidos
                {!isLoading && <span className="ml-auto text-xs font-normal text-gray-400">{filtered.length} bairros</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#5850ec]" size={28} /></div>
              ) : (
                <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-widest border-b sticky top-0">
                      <tr>
                        <th className="px-6 py-4">Bairro</th>
                        <th className="px-6 py-4">Cidade</th>
                        <th className="px-6 py-4">Taxa (R$)</th>
                        <th className="px-6 py-4">Tempo Est.</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((local: any) => (
                        <tr key={local.id} className="hover:bg-gray-50 transition-colors">
                          {editingId === local.id ? (
                            <>
                              <td className="px-3 py-2"><Input value={editForm.bairro} onChange={e => setEditForm({ ...editForm, bairro: e.target.value })} className="h-8 text-xs" /></td>
                              <td className="px-3 py-2"><Input value={editForm.cidade} onChange={e => setEditForm({ ...editForm, cidade: e.target.value })} className="h-8 text-xs" /></td>
                              <td className="px-3 py-2"><Input type="number" value={editForm.taxa} onChange={e => setEditForm({ ...editForm, taxa: e.target.value })} className="h-8 text-xs w-20" /></td>
                              <td className="px-3 py-2"><Input value={editForm.tempo} onChange={e => setEditForm({ ...editForm, tempo: e.target.value })} placeholder="30-45 min" className="h-8 text-xs" /></td>
                              <td className="px-3 py-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => updateMutation.mutate({ id: local.id, values: editForm })}><Save size={14} /></Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400" onClick={() => setEditingId(null)}><X size={14} /></Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 font-bold text-gray-900">{local.neighborhood}</td>
                              <td className="px-6 py-4 text-gray-500">{local.city}</td>
                              <td className="px-6 py-4 text-green-600 font-bold">R$ {Number(local.rate).toFixed(2)}</td>
                              <td className="px-6 py-4 text-gray-500 flex items-center gap-1">
                                <Clock size={14} /> {local.estimated_time || "—"}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-[#5850ec]" onClick={() => startEdit(local)}><Edit3 size={14} /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => deleteMutation.mutate(local.id)}><Trash2 size={14} /></Button>
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
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#5850ec]/5 border-[#5850ec]/10">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-[#5850ec] flex items-center justify-center text-white shrink-0">
                  <Store size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Retirada no Local</h4>
                  <p className="text-xs text-gray-500">Permite que o cliente retire o pedido sem taxa de entrega.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6 text-[#5850ec]">Novo Bairro de Entrega</h2>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate(form); }} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Nome do Bairro</label>
                <Input value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} required placeholder="Centro" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Cidade</label>
                <Input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} required placeholder="São Bento do Sul" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Taxa (R$)</label>
                  <Input type="number" step="0.01" value={form.taxa} onChange={e => setForm({ ...form, taxa: e.target.value })} required placeholder="10.00" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Tempo Est.</label>
                  <Input value={form.tempo} onChange={e => setForm({ ...form, tempo: e.target.value })} placeholder="30-45 min" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setForm(EMPTY); }} className="flex-1">Cancelar</Button>
                <Button type="submit" disabled={addMutation.isPending} className="flex-1 bg-[#5850ec] text-white">
                  {addMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null} Adicionar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/financeiro/lancamentos")({
  component: AdminLancamentosPage,
});

function AdminLancamentosPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    descricao: "",
    tipo: "receita",
    valor: "",
    categoria: "",
    data: "2024-01-01",
  }); // Valor determinístico
  const [mounted, setMounted] = useState(false);

  // Inicializa com data atual após mount (evita hydration mismatch)
  useEffect(() => {
    setForm((prev) => ({ ...prev, data: new Date().toISOString().split("T")[0] }));
    setMounted(true);
  }, []);

  const { data = [], isLoading } = useQuery({
    queryKey: ["lancamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("lancamentos").insert(v);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
      toast.success("Lançamento adicionado!");
      setIsAdding(false);
      setForm({
        descricao: "",
        tipo: "receita",
        valor: "",
        categoria: "",
        data: new Date().toISOString().split("T")[0],
      });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lancamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
      toast.success("Removido.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const totalReceitas = data
    .filter((l: any) => l.tipo === "receita")
    .reduce((s: number, l: any) => s + Number(l.valor), 0);
  const totalDespesas = data
    .filter((l: any) => l.tipo === "despesa")
    .reduce((s: number, l: any) => s + Number(l.valor), 0);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Lançamentos</h1>
          <p className="text-gray-500 text-sm mt-1">Registre receitas e despesas manualmente.</p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-[#5850ec] text-white flex items-center gap-2"
        >
          <Plus size={16} /> Novo Lançamento
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-bold uppercase text-gray-400">Receitas</p>
          <p className="text-2xl font-black text-green-600 mt-1">
            R$ {totalReceitas.toFixed(2).replace(".", ",")}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-bold uppercase text-gray-400">Despesas</p>
          <p className="text-2xl font-black text-red-500 mt-1">
            R$ {totalDespesas.toFixed(2).replace(".", ",")}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-bold uppercase text-gray-400">Saldo</p>
          <p
            className={`text-2xl font-black mt-1 ${totalReceitas - totalDespesas >= 0 ? "text-blue-600" : "text-red-600"}`}
          >
            R$ {(totalReceitas - totalDespesas).toFixed(2).replace(".", ",")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Nenhum lançamento registrado.
                  </td>
                </tr>
              )}
              {data.map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {l.tipo === "receita" ? (
                      <span className="flex items-center gap-1 text-green-600 font-bold">
                        <ArrowUpCircle size={14} /> Receita
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 font-bold">
                        <ArrowDownCircle size={14} /> Despesa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-900">{l.descricao}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline">{l.categoria ?? "—"}</Badge>
                  </td>
                  <td
                    className={`px-6 py-4 font-bold ${l.tipo === "receita" ? "text-green-600" : "text-red-500"}`}
                  >
                    R$ {Number(l.valor).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {l.data ? format(new Date(l.data), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-500"
                      onClick={() => deleteMutation.mutate(l.id)}
                    >
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
            <h2 className="text-xl font-bold mb-6 text-[#5850ec]">Novo Lançamento</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                    Tipo
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                    Valor (R$) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Descrição *
                </label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Categoria
                </label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ex: Ingredientes, Aluguel..."
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Data</label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={() =>
                    addMutation.mutate({
                      descricao: form.descricao,
                      tipo: form.tipo,
                      valor: Number(form.valor),
                      categoria: form.categoria,
                      data: form.data,
                    })
                  }
                  className="flex-1 bg-[#5850ec] text-white"
                  disabled={!form.descricao || !form.valor}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Ticket, Plus, Search, Trash2, Edit3, CheckCircle2, Clock, Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cupons")({
  component: AdminCuponsPage,
});

const EMPTY_FORM = { codigo: "", tipo: "Fixo", valor: 0, regra: "", validade: "", ativo: true, max_uso: "" };

function AdminCuponsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCupom, setEditingCupom] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);

  const { data: cupons = [], isLoading } = useQuery({
    queryKey: ["admin-cupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingCupom?.id) {
        const { error } = await supabase.from("cupons").update(values).eq("id", editingCupom.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cupons").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cupons"] });
      toast.success(editingCupom ? "Cupom atualizado!" : "Cupom criado!");
      setIsModalOpen(false);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("cupons").update({ ativo: !ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cupons"] }),
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cupons"] });
      toast.success("Cupom removido.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const openNew = () => {
    setEditingCupom(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingCupom(c);
    setForm({
      codigo: c.codigo,
      tipo: c.tipo,
      valor: c.valor,
      regra: c.regra || "",
      validade: c.validade || "",
      ativo: c.ativo,
      max_uso: c.max_uso !== null && c.max_uso !== undefined ? String(c.max_uso) : "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const max_uso = form.max_uso === "" ? null : Number(form.max_uso);
    saveMutation.mutate({ ...form, valor: Number(form.valor), uso: editingCupom?.uso || 0, max_uso });
  };

  const filtered = cupons.filter((c: any) =>
    c.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Cupons de Desconto</h1>
          <p className="text-gray-500 text-sm mt-1">Crie e gerencie ofertas para atrair mais clientes.</p>
        </div>
        <Button onClick={openNew} className="bg-[#5850ec] hover:bg-[#5850ec]/90 flex items-center gap-2">
          <Plus size={18} /> Novo Cupom
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar por código..."
            className="pl-10 rounded-lg border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed p-16 text-center text-gray-400">
          <Ticket size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum cupom encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cupom: any) => (
            <div key={cupom.id} className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${cupom.ativo ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}`}>
                  <Ticket size={24} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(cupom)} className="text-gray-400 hover:text-[#5850ec] transition-colors"><Edit3 size={18} /></button>
                  <button
                    onClick={() => toggleMutation.mutate({ id: cupom.id, ativo: cupom.ativo })}
                    className={`transition-colors ${cupom.ativo ? "text-green-500 hover:text-green-600" : "text-gray-300 hover:text-green-400"}`}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(cupom.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Código</p>
                <h3 className="text-xl font-black text-gray-900">{cupom.codigo}</h3>
                {cupom.regra && <p className="text-xs text-[#5850ec] font-bold mt-1">{cupom.regra}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Desconto</p>
                  <p className="font-bold text-gray-800">
                    {cupom.tipo === "Percentual" ? `${cupom.valor}%` : cupom.tipo === "Entrega Grátis" ? "Grátis" : `R$ ${Number(cupom.valor).toFixed(2)}`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Usos</p>
                  <p className="font-bold text-gray-800">
                    {cupom.uso ?? 0}
                    {cupom.max_uso !== null && cupom.max_uso !== undefined
                      ? <span className="text-gray-400 font-normal"> / {cupom.max_uso}</span>
                      : <span className="text-gray-400 font-normal"> / ∞</span>
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge className={cupom.ativo ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                    {cupom.ativo ? "Ativo" : "Pausado"}
                  </Badge>
                  {cupom.max_uso === 1 && (
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                      Uso único
                    </Badge>
                  )}
                  {cupom.max_uso !== null && cupom.max_uso !== undefined && cupom.max_uso > 1 && cupom.uso >= cupom.max_uso && (
                    <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100">
                      Esgotado
                    </Badge>
                  )}
                </div>
                {cupom.validade && (
                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                    <Calendar size={12} /> {new Date(cupom.validade).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6 text-[#5850ec]">{editingCupom ? "Editar Cupom" : "Novo Cupom"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Código do Cupom</label>
                <Input
                  value={form.codigo}
                  onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                  required placeholder="EX: SABOR20"
                  className="uppercase font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm({ ...form, tipo: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="Fixo">Fixo (R$)</option>
                    <option value="Percentual">Percentual (%)</option>
                    <option value="Entrega Grátis">Entrega Grátis</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Valor</label>
                  <Input
                    type="number"
                    value={form.valor}
                    onChange={e => setForm({ ...form, valor: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Regra / Descrição</label>
                <Input
                  value={form.regra}
                  onChange={e => setForm({ ...form, regra: e.target.value })}
                  placeholder="EX: Mínimo R$ 100"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Data de Validade</label>
                <Input
                  type="date"
                  value={form.validade}
                  onChange={e => setForm({ ...form, validade: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Limite de usos
                </label>
                <Input
                  type="number"
                  min="1"
                  value={form.max_uso}
                  onChange={e => setForm({ ...form, max_uso: e.target.value })}
                  placeholder="Deixe vazio para sem limite"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Ex: <strong>1</strong> = uso único · <strong>50</strong> = 50 usos · vazio = ilimitado.
                  Cupons gerados automaticamente pelo exit intent são sempre <strong>uso único</strong>.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" disabled={saveMutation.isPending} className="flex-1 bg-[#5850ec] text-white">
                  {saveMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                  Salvar Cupom
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

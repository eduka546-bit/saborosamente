import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/cupons/novo")({
  component: AdminCuponsNovoPage,
});

function AdminCuponsNovoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    codigo: "",
    tipo: "Fixo",
    valor: "",
    regra: "",
    validade: "",
    ativo: true,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("cupons").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cupons"] });
      toast.success("Cupom criado!");
      navigate({ to: "/admin/cupons" });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo) return;
    saveMutation.mutate({ ...form, valor: Number(form.valor), uso: 0 });
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Novo Cupom</h1>
        <p className="text-gray-500 text-sm mt-1">
          Preencha os dados para criar um novo cupom de desconto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-5">
        <div>
          <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
            Código do Cupom *
          </label>
          <Input
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
            required
            placeholder="EX: SABOR20"
            className="uppercase font-bold"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
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
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
            Regra / Condição
          </label>
          <Input
            value={form.regra}
            onChange={(e) => setForm({ ...form, regra: e.target.value })}
            placeholder="Ex: Mínimo R$ 100"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
            Data de Validade
          </label>
          <Input
            type="date"
            value={form.validade}
            onChange={(e) => setForm({ ...form, validade: e.target.value })}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/admin/cupons" })}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!form.codigo || saveMutation.isPending}
            className="flex-1 bg-[#5850ec] text-white"
          >
            {saveMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}{" "}
            Criar Cupom
          </Button>
        </div>
      </form>
    </div>
  );
}

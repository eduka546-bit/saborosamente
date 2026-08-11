import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Loader2, Plus, Trash2, Edit3, Save, X, ShoppingBag, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { COMBO_RULES } from "@/lib/combo-rules";

export const Route = createFileRoute("/admin/combos")({
  component: AdminCombosPage,
});

// Regras de desconto — editáveis futuramente via banco
const REGRAS = COMBO_RULES;

function AdminCombosPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", descricao: "", ativo: true });

  // Busca produtos que são combos (categoria contém "combo" ou nome contém "monte")
  const { data: combos = [], isLoading } = useQuery({
    queryKey: ["admin-combos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*, categorias(nome)")
        .order("nome");
      if (error) throw error;
      // Filtra apenas combos
      return (data ?? []).filter((p: any) => {
        const cat = (p.categorias?.nome || "").toLowerCase();
        const nome = (p.nome || "").toLowerCase();
        return (
          cat.includes("combo") ||
          nome.includes("monte você mesmo") ||
          nome.includes("monte voce mesmo") ||
          nome.includes("combo a escolha") ||
          nome.includes("combo à escolha")
        );
      });
    },
  });

  // Busca todas as categorias para o select
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categorias").select("*").order("nome");
      return data ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const { error } = await supabase.from("produtos").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-combos"] });
      queryClient.invalidateQueries({ queryKey: ["public-products-all"] });
      toast.success("Combo atualizado!");
      setEditingId(null);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const status = ativo ? "ativo" : "pausado";
      const { error } = await supabase.from("produtos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-combos"] });
      queryClient.invalidateQueries({ queryKey: ["public-products-all"] });
      toast.success("Status atualizado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const startEdit = (combo: any) => {
    setEditingId(combo.id);
    setEditForm({
      nome: combo.nome,
      descricao: combo.descricao ?? "",
      ativo: (combo.status || "ativo").toLowerCase() === "ativo",
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Combos "Monte Você Mesmo"</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie os combos do cardápio. Para criar um novo combo, adicione um produto na categoria "Combos" pelo Cardápio.
        </p>
      </div>

      {/* Regras de desconto — informativo */}
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 mb-4">
          <Tag size={16} className="text-[#5850ec]" /> Regras de Desconto Progressivo
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          O desconto é aplicado automaticamente com base na quantidade total de itens no carrinho.
          Sopas e complementos <strong>contam na quantidade</strong> mas não recebem desconto.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {REGRAS.map(rule => (
            <div key={rule.min} className="flex flex-col items-center p-4 rounded-xl bg-[#5850ec]/5 border border-[#5850ec]/10">
              <span className="text-2xl font-black text-[#5850ec]">{(rule.discount * 100).toFixed(0)}%</span>
              <span className="text-xs text-gray-500 mt-1">a partir de {rule.min} itens</span>
              <Badge className="mt-2 bg-[#5850ec]/10 text-[#5850ec] hover:bg-[#5850ec]/10">{rule.label}</Badge>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mt-4 border border-amber-100">
          Para alterar os percentuais de desconto, entre em contato com o desenvolvedor — está definido no código em <code>src/components/combo-builder-modal.tsx</code>.
        </p>
      </div>

      {/* Lista de combos */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : combos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed p-16 text-center">
          <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-medium">Nenhum combo encontrado.</p>
          <p className="text-xs text-gray-400 mt-2">
            Adicione um produto com categoria "Combos" ou nome contendo "Monte Você Mesmo" pelo Cardápio.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {combos.map((combo: any) => {
            const isAtivo = (combo.status || "ativo").toLowerCase() === "ativo";
            return (
              <div key={combo.id} className="bg-white rounded-2xl border p-5 shadow-sm">
                {editingId === combo.id ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Nome</label>
                        <Input
                          value={editForm.nome}
                          onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Descrição</label>
                        <Input
                          value={editForm.descricao}
                          onChange={e => setEditForm({ ...editForm, descricao: e.target.value })}
                          placeholder="Descreva o combo..."
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        size="sm"
                        className="bg-[#5850ec] text-white"
                        onClick={() => updateMutation.mutate({
                          id: combo.id,
                          values: {
                            nome: editForm.nome,
                            descricao: editForm.descricao,
                            status: editForm.ativo ? "ativo" : "pausado",
                          }
                        })}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X size={14} className="mr-1" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {/* Imagem */}
                    {combo.imagem_url && (
                      <img src={combo.imagem_url} className="h-16 w-16 rounded-xl object-cover border shrink-0" alt="" />
                    )}
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900">{combo.nome}</p>
                        <Badge className={isAtivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {isAtivo ? "Ativo" : "Pausado"}
                        </Badge>
                        <Badge variant="outline" className="text-[#5850ec]">
                          {combo.categorias?.nome ?? "Combo"}
                        </Badge>
                      </div>
                      {combo.descricao && (
                        <p className="text-sm text-gray-500 mt-1 truncate">{combo.descricao}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        A partir de <strong className="text-[#086e45]">R$ {Number(combo.preco).toFixed(2)}</strong>
                      </p>
                    </div>
                    {/* Ações */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{isAtivo ? "Ativo" : "Pausado"}</span>
                        <Switch
                          checked={isAtivo}
                          onCheckedChange={(v) => toggleMutation.mutate({ id: combo.id, ativo: v })}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-[#5850ec]"
                        onClick={() => startEdit(combo)}
                      >
                        <Edit3 size={15} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Admin Combos Prontos — gerencia quais sabores estão disponíveis em cada combo pronto.
 * O admin seleciona produtos do cardápio como opções de sabor.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Loader2, Plus, Trash2, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/combos-prontos")({
  component: AdminCombosProntosPage,
  ssr: false,
});

function AdminCombosProntosPage() {
  const queryClient = useQueryClient();
  const [selectedCombo, setSelectedCombo] = useState<string | null>(null);

  // Busca combos prontos (produtos com "combo pronto" na categoria)
  const { data: combos = [], isLoading: loadingCombos } = useQuery({
    queryKey: ["admin-combos-prontos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id, nome, preco, preco_300g, preco_400g, categorias(nome)")
        .eq("ativo", true)
        .order("nome");
      // Filtra só combos prontos (categoria contém "combo pronto")
      return (data ?? []).filter(
        (p: any) => p.categorias?.nome?.toLowerCase().includes("combo pronto"),
      );
    },
  });

  // Busca produtos disponíveis pra serem sabores (marmitas ativas)
  const { data: produtos = [] } = useQuery({
    queryKey: ["admin-produtos-sabores"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id, nome, categorias(nome)")
        .eq("ativo", true)
        .eq("visivel_online", true)
        .order("nome");
      // Filtra só marmitas (exclui combos, sopas podem ficar ou não)
      return (data ?? []).filter((p: any) => {
        const cat = (p.categorias?.nome ?? "").toLowerCase();
        return !cat.includes("combo") && !cat.includes("complemento");
      });
    },
  });

  // Sabores configurados pro combo selecionado
  const { data: saboresAtivos = [], isLoading: loadingSabores } = useQuery({
    queryKey: ["combo-sabores", selectedCombo],
    enabled: !!selectedCombo,
    queryFn: async () => {
      const { data } = await supabase
        .from("combo_sabores")
        .select("produto_id")
        .eq("combo_id", selectedCombo!)
        .eq("ativo", true);
      return (data ?? []).map((s: any) => s.produto_id);
    },
  });

  const toggleSabor = useMutation({
    mutationFn: async ({ comboId, produtoId, ativo }: any) => {
      if (ativo) {
        // Adiciona
        const { error } = await supabase
          .from("combo_sabores")
          .upsert({ combo_id: comboId, produto_id: produtoId, ativo: true }, { onConflict: "combo_id,produto_id" });
        if (error) throw error;
      } else {
        // Remove
        const { error } = await supabase
          .from("combo_sabores")
          .delete()
          .eq("combo_id", comboId)
          .eq("produto_id", produtoId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combo-sabores", selectedCombo] });
      queryClient.invalidateQueries({ queryKey: ["combo-sabores-public"] });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const marcarTodos = useMutation({
    mutationFn: async (comboId: string) => {
      const inserts = produtos.map((p: any) => ({
        combo_id: comboId,
        produto_id: p.id,
        ativo: true,
      }));
      const { error } = await supabase
        .from("combo_sabores")
        .upsert(inserts, { onConflict: "combo_id,produto_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combo-sabores", selectedCombo] });
      toast.success("Todos os sabores marcados!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const desmarcarTodos = useMutation({
    mutationFn: async (comboId: string) => {
      const { error } = await supabase
        .from("combo_sabores")
        .delete()
        .eq("combo_id", comboId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combo-sabores", selectedCombo] });
      toast.success("Todos desmarcados.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec] flex items-center gap-2">
          <Package size={22} /> Combos Prontos — Sabores
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Selecione quais produtos ficam disponíveis como opção de sabor em cada combo pronto.
        </p>
      </div>

      {loadingCombos ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          {/* Lista de combos */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-gray-400 mb-2">Combos</p>
            {combos.length === 0 && (
              <p className="text-sm text-gray-400">Nenhum combo pronto encontrado.</p>
            )}
            {combos.map((combo: any) => (
              <button
                key={combo.id}
                onClick={() => setSelectedCombo(combo.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl border text-sm font-bold transition-all",
                  selectedCombo === combo.id
                    ? "border-[#5850ec] bg-[#5850ec]/5 text-[#5850ec]"
                    : "border-gray-200 text-gray-700 hover:border-[#5850ec]/30",
                )}
              >
                {combo.nome}
              </button>
            ))}
          </div>

          {/* Sabores do combo selecionado */}
          <div>
            {!selectedCombo ? (
              <div className="flex items-center justify-center h-60 text-gray-400 text-sm border border-dashed rounded-xl">
                Selecione um combo à esquerda pra configurar os sabores.
              </div>
            ) : loadingSabores ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#5850ec]" size={24} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Sabores disponíveis ({saboresAtivos.length} selecionados)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => marcarTodos.mutate(selectedCombo!)}
                    >
                      Marcar todos
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-500"
                      onClick={() => desmarcarTodos.mutate(selectedCombo!)}
                    >
                      Desmarcar todos
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {produtos.map((p: any) => {
                    const ativo = saboresAtivos.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() =>
                          toggleSabor.mutate({
                            comboId: selectedCombo,
                            produtoId: p.id,
                            ativo: !ativo,
                          })
                        }
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left",
                          ativo
                            ? "border-green-200 bg-green-50"
                            : "border-gray-100 hover:border-gray-200",
                        )}
                      >
                        <div
                          className={cn(
                            "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0",
                            ativo
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-gray-300",
                          )}
                        >
                          {ativo && <CheckCircle2 size={12} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.nome}</p>
                          <p className="text-[10px] text-gray-400">{p.categorias?.nome}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

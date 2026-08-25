import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Plus, Trash2, Loader2, Edit3, Save, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/config/taxas")({
  component: AdminConfigTaxasPage,
});

const EMPTY_BAIRRO = { bairro: "", taxa: "" };

function AdminConfigTaxasPage() {
  const queryClient = useQueryClient();
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ bairro: "", taxa: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_BAIRRO);
  const [novaCidade, setNovaCidade] = useState("");
  const [showNovaCidade, setShowNovaCidade] = useState(false);
  const [search, setSearch] = useState("");

  const { data: locais = [], isLoading } = useQuery({
    queryKey: ["delivery-rates-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_rates")
        .select("*")
        .order("cidade")
        .order("bairro");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Agrupa por cidade
  const cidades = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const l of locais) {
      if (!map[l.cidade]) map[l.cidade] = [];
      map[l.cidade].push(l);
    }
    return map;
  }, [locais]);

  const cidadesList = Object.keys(cidades).sort();

  // Bairros da cidade selecionada, com filtro de busca
  const bairrosFiltrados = useMemo(() => {
    if (!cidadeSelecionada) return [];
    const lista = cidades[cidadeSelecionada] ?? [];
    if (!search) return lista;
    return lista.filter((b) => b.bairro.toLowerCase().includes(search.toLowerCase()));
  }, [cidadeSelecionada, cidades, search]);

  const addMutation = useMutation({
    mutationFn: async (values: { bairro: string; taxa: string; cidade: string }) => {
      const { error } = await supabase.from("delivery_rates").insert({
        bairro: values.bairro.trim(),
        cidade: values.cidade.trim(),
        valor: Number(values.taxa),
        ativo: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-rates-admin"] });
      queryClient.invalidateQueries({ queryKey: ["taxas"] });
      toast.success("Bairro adicionado!");
      setIsAdding(false);
      setAddForm(EMPTY_BAIRRO);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const { error } = await supabase
        .from("delivery_rates")
        .update({
          bairro: values.bairro,
          valor: Number(values.taxa),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-rates-admin"] });
      queryClient.invalidateQueries({ queryKey: ["taxas"] });
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
      queryClient.invalidateQueries({ queryKey: ["taxas"] });
      toast.success("Bairro removido.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteCidadeMutation = useMutation({
    mutationFn: async (cidade: string) => {
      const { error } = await supabase.from("delivery_rates").delete().eq("cidade", cidade);
      if (error) throw error;
    },
    onSuccess: (_, cidade) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-rates-admin"] });
      queryClient.invalidateQueries({ queryKey: ["taxas"] });
      if (cidadeSelecionada === cidade) setCidadeSelecionada(null);
      toast.success("Cidade removida.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Áreas de Entrega</h1>
          <p className="text-gray-500 text-sm mt-1">
            {cidadesList.length} cidades · {locais.length} bairros atendidos
          </p>
        </div>
        <Button
          onClick={() => setShowNovaCidade(true)}
          className="bg-[#5850ec] hover:bg-[#5850ec]/90 gap-2"
        >
          <Plus size={16} /> Nova cidade
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-[#5850ec]" size={28} />
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* ── Coluna esquerda: cidades ── */}
          <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
            {cidadesList.map((cidade) => {
              const count = cidades[cidade]?.length ?? 0;
              const ativa = cidadeSelecionada === cidade;
              return (
                <button
                  key={cidade}
                  onClick={() => {
                    setCidadeSelecionada(cidade);
                    setSearch("");
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group ${
                    ativa
                      ? "bg-[#5850ec] text-white border-[#5850ec] shadow-md"
                      : "bg-white text-gray-700 border-gray-100 hover:border-[#5850ec]/30 hover:bg-[#5850ec]/5"
                  }`}
                >
                  <div>
                    <p
                      className={`font-semibold text-sm ${ativa ? "text-white" : "text-gray-800"}`}
                    >
                      {cidade}
                    </p>
                    <p
                      className={`text-[11px] mt-0.5 ${ativa ? "text-white/70" : "text-gray-400"}`}
                    >
                      {count} bairros
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={ativa ? "text-white/70" : "text-gray-300 group-hover:text-[#5850ec]"}
                  />
                </button>
              );
            })}

            {cidadesList.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-sm">
                Nenhuma cidade cadastrada.
              </div>
            )}
          </div>

          {/* ── Coluna direita: bairros ── */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl border overflow-hidden">
            {!cidadeSelecionada ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <MapPin size={40} className="opacity-20" />
                <p className="text-sm font-medium">Selecione uma cidade para ver os bairros</p>
              </div>
            ) : (
              <>
                {/* Header da cidade */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-[#5850ec]" />
                    <h2 className="font-bold text-gray-800">{cidadeSelecionada}</h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {bairrosFiltrados.length} bairros
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Buscar bairro..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8 text-sm w-48"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsAdding(true);
                        setAddForm(EMPTY_BAIRRO);
                      }}
                      className="bg-[#5850ec] text-white h-8 gap-1"
                    >
                      <Plus size={14} /> Bairro
                    </Button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Remover a cidade "${cidadeSelecionada}" e todos os seus bairros?`,
                          )
                        ) {
                          deleteCidadeMutation.mutate(cidadeSelecionada);
                        }
                      }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Remover cidade"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Formulário de novo bairro */}
                {isAdding && (
                  <div className="flex items-center gap-3 px-6 py-3 bg-[#5850ec]/5 border-b">
                    <Input
                      autoFocus
                      placeholder="Nome do bairro"
                      value={addForm.bairro}
                      onChange={(e) => setAddForm((p) => ({ ...p, bairro: e.target.value }))}
                      className="flex-1 h-8 text-sm"
                      onKeyDown={(e) => e.key === "Escape" && setIsAdding(false)}
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="10.00"
                        value={addForm.taxa}
                        onChange={(e) => setAddForm((p) => ({ ...p, taxa: e.target.value }))}
                        className="w-24 h-8 text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="h-8 bg-[#5850ec] text-white"
                      disabled={addMutation.isPending || !addForm.bairro || !addForm.taxa}
                      onClick={() => addMutation.mutate({ ...addForm, cidade: cidadeSelecionada })}
                    >
                      {addMutation.isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} />
                      )}
                    </Button>
                    <button
                      onClick={() => setIsAdding(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Lista de bairros */}
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-widest border-b sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left">Bairro</th>
                        <th className="px-6 py-3 text-left">Taxa de entrega</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bairrosFiltrados.map((b: any) => (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                          {editingId === b.id ? (
                            <>
                              <td className="px-4 py-2">
                                <Input
                                  value={editForm.bairro}
                                  onChange={(e) =>
                                    setEditForm((p) => ({ ...p, bairro: e.target.value }))
                                  }
                                  className="h-8 text-xs"
                                  autoFocus
                                />
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-400">R$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editForm.taxa}
                                    onChange={(e) =>
                                      setEditForm((p) => ({ ...p, taxa: e.target.value }))
                                    }
                                    className="h-8 text-xs w-24"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-green-600 hover:bg-green-50"
                                    onClick={() =>
                                      updateMutation.mutate({ id: b.id, values: editForm })
                                    }
                                  >
                                    <Save size={13} />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-gray-400"
                                    onClick={() => setEditingId(null)}
                                  >
                                    <X size={13} />
                                  </Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-3.5 font-medium text-gray-900">{b.bairro}</td>
                              <td className="px-6 py-3.5">
                                <span className="text-green-700 font-bold bg-green-50 border border-green-100 px-3 py-1 rounded-full text-xs">
                                  R$ {Number(b.valor).toFixed(2).replace(".", ",")}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <div className="flex gap-1 justify-end">
                                  <button
                                    onClick={() => {
                                      setEditingId(b.id);
                                      setEditForm({ bairro: b.bairro, taxa: b.valor });
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-[#5850ec] hover:bg-[#5850ec]/10 rounded-lg transition-all"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      confirm(`Remover "${b.bairro}"?`) &&
                                      deleteMutation.mutate(b.id)
                                    }
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}

                      {bairrosFiltrados.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-gray-400 text-sm">
                            {search
                              ? `Nenhum bairro encontrado para "${search}"`
                              : "Nenhum bairro cadastrado."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal nova cidade */}
      {showNovaCidade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#5850ec]">Nova Cidade</h2>
            <Input
              autoFocus
              placeholder="Nome da cidade"
              value={novaCidade}
              onChange={(e) => setNovaCidade(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && novaCidade.trim()) {
                  setCidadeSelecionada(novaCidade.trim());
                  setNovaCidade("");
                  setShowNovaCidade(false);
                  setIsAdding(true);
                  toast.info(`Cidade "${novaCidade.trim()}" criada. Adicione os bairros agora.`);
                }
              }}
            />
            <p className="text-xs text-gray-400">
              A cidade será criada quando você adicionar o primeiro bairro.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowNovaCidade(false);
                  setNovaCidade("");
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-[#5850ec] text-white"
                disabled={!novaCidade.trim()}
                onClick={() => {
                  setCidadeSelecionada(novaCidade.trim());
                  setNovaCidade("");
                  setShowNovaCidade(false);
                  setIsAdding(true);
                  toast.info(`Adicione os bairros de "${novaCidade.trim()}".`);
                }}
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

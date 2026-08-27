import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Plus, Trash2, ChefHat, GripVertical } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  DEFAULT_MARMITA_CONFIG,
  normalizarMarmitaConfig,
  type MarmitaPersonalizadaConfig,
  type MarmitaTamanho,
} from "@/lib/marmita-personalizada-config";

export const Route = createFileRoute("/admin/config/marmita-personalizada")({
  component: AdminMarmitaPersonalizadaPage,
  ssr: false,
});

function AdminMarmitaPersonalizadaPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<MarmitaPersonalizadaConfig>(DEFAULT_MARMITA_CONFIG);

  // ── Config (tamanhos/preços/regras) — parametros_loja.marmita_personalizada ──
  const { isLoading: loadingConfig } = useQuery({
    queryKey: ["config-marmita-personalizada"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("parametros_loja").maybeSingle();
      const pl = (data?.parametros_loja as any) ?? {};
      setConfig(normalizarMarmitaConfig(pl.marmita_personalizada));
      return data;
    },
  });

  const saveConfig = useMutation({
    mutationFn: async () => {
      const { data } = await supabase.from("site_settings").select("parametros_loja").maybeSingle();
      const pl = (data?.parametros_loja as any) ?? {};
      const payload = { ...pl, marmita_personalizada: config };
      const { error } = await supabase
        .from("site_settings")
        .update({ parametros_loja: payload } as any)
        .neq("id", "");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-marmita-personalizada"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Configuração salva!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  // ── Grupos e ingredientes (tabelas) ─────────────────────────────────────────
  const { data: grupos = [], isLoading: loadingGrupos } = useQuery({
    queryKey: ["admin-marmita-grupos"],
    queryFn: async () => {
      const { data: g } = await supabase
        .from("marmita_grupos")
        .select("*")
        .order("ordem", { ascending: true });
      const { data: i } = await supabase
        .from("marmita_ingredientes")
        .select("*")
        .order("ordem", { ascending: true });
      return (g ?? []).map((grp: any) => ({
        ...grp,
        ingredientes: (i ?? []).filter((ing: any) => ing.grupo_id === grp.id),
      }));
    },
  });

  const addGrupo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("marmita_grupos")
        .insert({ nome: "Novo grupo", ordem: grupos.length, ativo: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marmita-grupos"] });
      queryClient.invalidateQueries({ queryKey: ["marmita-grupos"] });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateGrupo = useMutation({
    mutationFn: async ({ id, values }: any) => {
      const { error } = await supabase.from("marmita_grupos").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marmita-grupos"] });
      queryClient.invalidateQueries({ queryKey: ["marmita-grupos"] });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteGrupo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marmita_grupos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marmita-grupos"] });
      queryClient.invalidateQueries({ queryKey: ["marmita-grupos"] });
      toast.success("Grupo removido.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const addIngrediente = useMutation({
    mutationFn: async (grupoId: string) => {
      const count = grupos.find((g: any) => g.id === grupoId)?.ingredientes?.length ?? 0;
      const { error } = await supabase.from("marmita_ingredientes").insert({
        grupo_id: grupoId,
        nome: "Novo ingrediente",
        modos_preparo: [],
        ordem: count,
        ativo: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marmita-grupos"] });
      queryClient.invalidateQueries({ queryKey: ["marmita-grupos"] });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateIngrediente = useMutation({
    mutationFn: async ({ id, values }: any) => {
      const { error } = await supabase.from("marmita_ingredientes").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marmita-grupos"] });
      queryClient.invalidateQueries({ queryKey: ["marmita-grupos"] });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteIngrediente = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marmita_ingredientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marmita-grupos"] });
      queryClient.invalidateQueries({ queryKey: ["marmita-grupos"] });
      toast.success("Ingrediente removido.");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateTamanho = (idx: number, campo: keyof MarmitaTamanho, valor: string) => {
    setConfig((prev) => {
      const tamanhos = [...prev.tamanhos];
      const t = { ...tamanhos[idx] };
      if (campo === "sigla" || campo === "label") (t as any)[campo] = valor;
      else (t as any)[campo] = Number(valor) || 0;
      tamanhos[idx] = t;
      return { ...prev, tamanhos };
    });
  };

  const addTamanho = () => {
    setConfig((prev) => ({
      ...prev,
      tamanhos: [...prev.tamanhos, { sigla: "", label: "", pesoMin: 0, pesoMax: 0, preco: 0 }],
    }));
  };

  const removeTamanho = (idx: number) => {
    setConfig((prev) => ({ ...prev, tamanhos: prev.tamanhos.filter((_, i) => i !== idx) }));
  };

  const isLoading = loadingConfig || loadingGrupos;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-2">
        <ChefHat size={22} className="text-[#5850ec]" />
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Marmita Personalizada</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gerencie ingredientes, modos de preparo, tamanhos/preços e regras.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ativar / textos */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-xl">
              <p className="text-sm font-semibold text-gray-700">
                Mostrar no cardápio (card e modal)
              </p>
              <Switch
                checked={config.ativo}
                onCheckedChange={(v) => setConfig((p) => ({ ...p, ativo: v }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Título</label>
              <Input
                value={config.titulo}
                onChange={(e) => setConfig((p) => ({ ...p, titulo: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                Descrição
              </label>
              <Input
                value={config.descricao}
                onChange={(e) => setConfig((p) => ({ ...p, descricao: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Mínimo por combinação
                </label>
                <Input
                  type="number"
                  min={1}
                  value={config.minUnidades}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, minUnidades: Math.max(1, Number(e.target.value) || 1) }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  Peso máximo (g)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={config.pesoMaximo}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, pesoMaximo: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                Aviso de prazo (mostrado no modal e checkout)
              </label>
              <Input
                value={config.avisoPrazo}
                onChange={(e) => setConfig((p) => ({ ...p, avisoPrazo: e.target.value }))}
              />
            </div>
          </div>

          {/* Tamanhos e preços */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-800">Tamanhos e Preços</h2>
                <p className="text-xs text-gray-500 mt-1">
                  O preço é definido pela faixa de peso total da marmita montada.
                </p>
              </div>
              <Button type="button" onClick={addTamanho} size="sm" className="bg-[#5850ec] text-white">
                <Plus size={14} />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="py-2 pr-2">Sigla</th>
                    <th className="py-2 px-1">Rótulo</th>
                    <th className="py-2 px-1">Peso mín (g)</th>
                    <th className="py-2 px-1">Peso máx (g)</th>
                    <th className="py-2 px-1">Preço (R$)</th>
                    <th className="py-2 pl-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {config.tamanhos.map((t, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-2">
                        <Input
                          value={t.sigla}
                          onChange={(e) => updateTamanho(idx, "sigla", e.target.value)}
                          className="h-9 w-14 text-xs"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <Input
                          value={t.label}
                          onChange={(e) => updateTamanho(idx, "label", e.target.value)}
                          className="h-9 w-28 text-xs"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <Input
                          type="number"
                          value={t.pesoMin}
                          onChange={(e) => updateTamanho(idx, "pesoMin", e.target.value)}
                          className="h-9 w-20 text-xs"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <Input
                          type="number"
                          value={t.pesoMax}
                          onChange={(e) => updateTamanho(idx, "pesoMax", e.target.value)}
                          className="h-9 w-20 text-xs"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={t.preco}
                          onChange={(e) => updateTamanho(idx, "preco", e.target.value)}
                          className="h-9 w-20 text-xs"
                        />
                      </td>
                      <td className="py-2 pl-1">
                        <button
                          type="button"
                          onClick={() => removeTamanho(idx)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Button
            onClick={() => saveConfig.mutate()}
            disabled={saveConfig.isPending}
            className="w-full bg-[#5850ec] text-white"
          >
            {saveConfig.isPending ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Save size={16} className="mr-2" />
            )}{" "}
            Salvar Configuração
          </Button>

          {/* Grupos e ingredientes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">Ingredientes por Grupo</h2>
              <Button
                type="button"
                onClick={() => addGrupo.mutate()}
                size="sm"
                className="bg-[#5850ec] text-white"
              >
                <Plus size={14} className="mr-1" /> Grupo
              </Button>
            </div>

            {grupos.map((grupo: any) => (
              <div key={grupo.id} className="bg-white rounded-xl border p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-gray-300" />
                  <Input
                    value={grupo.nome}
                    onChange={(e) =>
                      updateGrupo.mutate({ id: grupo.id, values: { nome: e.target.value } })
                    }
                    className="h-9 font-bold flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Ativo</span>
                    <Switch
                      checked={grupo.ativo}
                      onCheckedChange={(v) =>
                        updateGrupo.mutate({ id: grupo.id, values: { ativo: v } })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Excluir o grupo "${grupo.nome}" e seus ingredientes?`))
                        deleteGrupo.mutate(grupo.id);
                    }}
                    className="text-red-400 hover:text-red-600 ml-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2 pl-6">
                  {(grupo.ingredientes ?? []).map((ing: any) => (
                    <div key={ing.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={ing.nome}
                          onChange={(e) =>
                            updateIngrediente.mutate({
                              id: ing.id,
                              values: { nome: e.target.value },
                            })
                          }
                          className="h-9 flex-1 text-sm"
                          placeholder="Nome do ingrediente"
                        />
                        <Switch
                          checked={ing.ativo}
                          onCheckedChange={(v) =>
                            updateIngrediente.mutate({ id: ing.id, values: { ativo: v } })
                          }
                        />
                        <button
                          type="button"
                          onClick={() => deleteIngrediente.mutate(ing.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <Input
                        defaultValue={ing.observacao ?? ""}
                        onBlur={(e) =>
                          updateIngrediente.mutate({
                            id: ing.id,
                            values: { observacao: e.target.value || null },
                          })
                        }
                        className="h-8 text-xs"
                        placeholder="Observação (opcional). Ex: Branco ou integral"
                      />
                      <Input
                        defaultValue={(ing.modos_preparo ?? []).join(", ")}
                        onBlur={(e) => {
                          const modos = e.target.value
                            .split(",")
                            .map((m) => m.trim())
                            .filter(Boolean);
                          updateIngrediente.mutate({
                            id: ing.id,
                            values: { modos_preparo: modos },
                          });
                        }}
                        className="h-8 text-xs"
                        placeholder="Modos de preparo separados por vírgula. Ex: Desfiado, Grelhado, Parmegiana"
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addIngrediente.mutate(grupo.id)}
                    className="text-xs"
                  >
                    <Plus size={13} className="mr-1" /> Ingrediente
                  </Button>
                </div>
              </div>
            ))}

            {grupos.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm border border-dashed rounded-xl">
                Nenhum grupo cadastrado. Clique em "Grupo" para começar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

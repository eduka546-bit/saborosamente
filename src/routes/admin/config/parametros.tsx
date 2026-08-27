import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Plus, Trash2, Clock } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  DEFAULT_ENTREGA_CONFIG,
  DIAS_SEMANA,
  normalizarEntregaConfig,
  type EntregaConfig,
} from "@/lib/entrega-config";
import {
  normalizarPrecosMarmita,
  MARMITA_PRICE_TABLE,
  type TabelaPrecosMarmita,
  type TamanhoMarmita,
} from "@/lib/combo-rules";

export const Route = createFileRoute("/admin/config/parametros")({
  component: AdminConfigParametrosPage,
});

const DEFAULT_PARAMS = {
  pedido_minimo: "0",
  frete_gratis_acima: "120",
  tempo_entrega_estimado: "45-60 min",
  aceitar_retirada: true,
  aceitar_delivery: true,
  maximo_itens_pedido: "50",
};

function AdminConfigParametrosPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<any>(DEFAULT_PARAMS);
  const [entrega, setEntrega] = useState<EntregaConfig>(DEFAULT_ENTREGA_CONFIG);
  const [novoHorario, setNovoHorario] = useState("");
  const [precos, setPrecos] = useState<TabelaPrecosMarmita>(MARMITA_PRICE_TABLE);

  const { isLoading } = useQuery({
    queryKey: ["config-parametros"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("parametros_loja").maybeSingle();
      const pl = (data?.parametros_loja as any) ?? {};
      setParams({ ...DEFAULT_PARAMS, ...pl });
      setEntrega(normalizarEntregaConfig(pl.entrega));
      setPrecos(normalizarPrecosMarmita(pl.precos_marmita));
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...params, entrega, precos_marmita: precos };
      const { error } = await supabase
        .from("site_settings")
        .update({ parametros_loja: payload } as any)
        .neq("id", "");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-parametros"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-precos"] });
      toast.success("Parâmetros salvos!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const toggleDia = (idx: number) => {
    setEntrega((prev) => {
      const set = new Set(prev.diasPermitidos);
      if (set.has(idx)) set.delete(idx);
      else set.add(idx);
      return { ...prev, diasPermitidos: Array.from(set).sort((a, b) => a - b) };
    });
  };

  const addHorario = () => {
    const h = novoHorario.trim();
    if (!h) return;
    if (entrega.horarios.includes(h)) {
      toast.error("Esse horário já existe.");
      return;
    }
    setEntrega((prev) => ({ ...prev, horarios: [...prev.horarios, h] }));
    setNovoHorario("");
  };

  const removeHorario = (h: string) => {
    setEntrega((prev) => ({ ...prev, horarios: prev.horarios.filter((x) => x !== h) }));
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Parâmetros da Loja</h1>
        <p className="text-gray-500 text-sm mt-1">Configurações gerais de operação.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Parâmetros gerais */}
          <div className="bg-white rounded-xl border p-6 space-y-5">
            {[
              { key: "pedido_minimo", label: "Pedido mínimo (R$)", type: "number" },
              { key: "frete_gratis_acima", label: "Frete grátis acima de (R$)", type: "number" },
              { key: "tempo_entrega_estimado", label: "Tempo de entrega estimado", type: "text" },
              { key: "maximo_itens_pedido", label: "Máximo de itens por pedido", type: "number" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                  {field.label}
                </label>
                <Input
                  type={field.type}
                  value={params[field.key]}
                  onChange={(e) => setParams({ ...params, [field.key]: e.target.value })}
                />
              </div>
            ))}

            {[
              { key: "aceitar_delivery", label: "Aceitar Delivery" },
              { key: "aceitar_retirada", label: "Aceitar Retirada no Local" },
            ].map((toggle) => (
              <div
                key={toggle.key}
                className="flex items-center justify-between p-3 border rounded-xl"
              >
                <p className="text-sm font-semibold text-gray-700">{toggle.label}</p>
                <Switch
                  checked={!!params[toggle.key]}
                  onCheckedChange={(v) => setParams({ ...params, [toggle.key]: v })}
                />
              </div>
            ))}
          </div>

          {/* Entrega programada */}
          <div className="bg-white rounded-xl border p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#5850ec]" />
              <h2 className="text-base font-bold text-gray-800">Entrega Programada</h2>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Define os dias e horários que o cliente pode escolher no checkout.
            </p>

            {/* Dias permitidos */}
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">
                Dias de entrega
              </label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map((nome, idx) => {
                  const ativo = entrega.diasPermitidos.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDia(idx)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                        ativo
                          ? "bg-[#5850ec] text-white border-[#5850ec]"
                          : "bg-white text-gray-500 border-gray-200 hover:border-[#5850ec]/40"
                      }`}
                    >
                      {nome.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantidade de datas */}
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">
                Quantas datas oferecer
              </label>
              <Input
                type="number"
                min={1}
                max={30}
                value={entrega.qtdDatas}
                onChange={(e) =>
                  setEntrega((prev) => ({
                    ...prev,
                    qtdDatas: Math.max(1, Math.min(30, Number(e.target.value) || 1)),
                  }))
                }
              />
            </div>

            {/* Faixas de horário */}
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">
                Faixas de horário
              </label>
              <div className="space-y-2">
                {entrega.horarios.map((h) => (
                  <div
                    key={h}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-gray-700">{h}</span>
                    <button
                      type="button"
                      onClick={() => removeHorario(h)}
                      className="text-red-400 hover:text-red-600"
                      title="Remover"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {entrega.horarios.length === 0 && (
                  <p className="text-xs text-gray-400 italic">Nenhuma faixa cadastrada.</p>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Ex: 09:30h ~ 10:30h"
                  value={novoHorario}
                  onChange={(e) => setNovoHorario(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addHorario();
                    }
                  }}
                />
                <Button type="button" onClick={addHorario} className="bg-[#5850ec] text-white shrink-0">
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Preços das marmitas por faixa (valem para TODAS as marmitas) */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">Preços das Marmitas</h2>
              <p className="text-xs text-gray-500 mt-1">
                Valor unitário por tamanho e faixa de quantidade. Vale para todas as marmitas.
                Sopas e complementos não usam esta tabela.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="py-2 pr-2">Tamanho</th>
                    <th className="py-2 px-1">Unitário</th>
                    <th className="py-2 px-1">5+ un</th>
                    <th className="py-2 px-1">10+ un</th>
                    <th className="py-2 px-1">20+ un</th>
                  </tr>
                </thead>
                <tbody>
                  {(["200g", "300g", "400g"] as TamanhoMarmita[]).map((tam) => {
                    const rotulo = tam === "200g" ? "P (200g)" : tam === "300g" ? "M (300g)" : "G (400g)";
                    return (
                      <tr key={tam} className="border-t">
                        <td className="py-2 pr-2 font-bold text-gray-700 whitespace-nowrap">
                          {rotulo}
                        </td>
                        {(["unit", "t5", "t10", "t20"] as const).map((faixa) => (
                          <td key={faixa} className="py-2 px-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={precos[tam][faixa]}
                              onChange={(e) =>
                                setPrecos((prev) => ({
                                  ...prev,
                                  [tam]: { ...prev[tam], [faixa]: Number(e.target.value) || 0 },
                                }))
                              }
                              className="h-9 w-20 text-xs"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full bg-[#5850ec] text-white"
          >
            {saveMutation.isPending ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Save size={16} className="mr-2" />
            )}{" "}
            Salvar Parâmetros
          </Button>
        </div>
      )}
    </div>
  );
}

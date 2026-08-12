import { createFileRoute } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Loader2, Save, Gift, Users, Search, ArrowUpCircle, ArrowDownCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/config/cashback-config")({
  component: AdminCashbackConfigPage,
});

function AdminCashbackConfigPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    ativo: true,
    percentual: "1",
    validade_dias: "30",
    minimo_uso: "5",
    limite_desconto_pct: "10",
  });
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useQuery({
    queryKey: ["cashback-config-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings")
        .select("id, cashback_percentual, cashback_validade_dias, cashback_minimo_uso, cashback_limite_desconto_pct, cashback_ativo")
        .maybeSingle();
      if (data) {
        setSettingsId(data.id);
        setConfig({
          ativo: (data as any).cashback_ativo !== false,
          percentual: String((data as any).cashback_percentual ?? 1),
          validade_dias: String((data as any).cashback_validade_dias ?? 30),
          minimo_uso: String((data as any).cashback_minimo_uso ?? 5),
          limite_desconto_pct: String((data as any).cashback_limite_desconto_pct ?? 10),
        });
      }
      return data;
    },
  });

  const { data: transacoes = [], isLoading } = useQuery({
    queryKey: ["admin-cashback-transacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashback_transacoes")
        .select("*, profiles:user_id(nome, email)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: saldos = [] } = useQuery({
    queryKey: ["admin-cashback-saldos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashback_saldo")
        .select("*, profiles:user_id(nome, email)")
        .order("saldo", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveConfig = async () => {
    if (!settingsId) return;
    setSaving(true);
    const { error } = await supabase.from("site_settings").update({
      cashback_ativo: config.ativo,
      cashback_percentual: Number(config.percentual),
      cashback_validade_dias: Number(config.validade_dias),
      cashback_minimo_uso: Number(config.minimo_uso),
      cashback_limite_desconto_pct: Number(config.limite_desconto_pct),
    } as any).eq("id", settingsId);
    setSaving(false);
    if (error) toast.error("Erro: " + error.message);
    else { queryClient.invalidateQueries({ queryKey: ["site-settings"] }); toast.success("Configurações de cashback salvas!"); }
  };

  const totalDistribuido = transacoes.filter((t: any) => t.tipo === "recebido").reduce((s: number, t: any) => s + Math.abs(t.valor), 0);
  const totalUsado = transacoes.filter((t: any) => t.tipo === "usado").reduce((s: number, t: any) => s + Math.abs(t.valor), 0);
  const totalSaldo = saldos.reduce((s: number, t: any) => s + (t.saldo || 0), 0);

  const filteredTransacoes = transacoes.filter((t: any) =>
    (t.profiles?.nome || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.profiles?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const tipoColors: any = { recebido: "bg-green-100 text-green-700", usado: "bg-blue-100 text-blue-700", expirado: "bg-red-100 text-red-700" };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#5850ec] flex items-center gap-2"><Gift size={22} /> Cashback</h1>
        <p className="text-gray-500 text-sm mt-1">Configure as regras e acompanhe os saldos dos clientes.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5"><p className="text-xs font-bold uppercase text-gray-400">Total distribuído</p><p className="text-2xl font-black text-green-600 mt-1">R$ {totalDistribuido.toFixed(2).replace(".", ",")}</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-xs font-bold uppercase text-gray-400">Total usado</p><p className="text-2xl font-black text-blue-600 mt-1">R$ {totalUsado.toFixed(2).replace(".", ",")}</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-xs font-bold uppercase text-gray-400">Saldo em aberto</p><p className="text-2xl font-black text-[#5850ec] mt-1">R$ {totalSaldo.toFixed(2).replace(".", ",")}</p></div>
      </div>

      {/* Config */}
      <div className="bg-white rounded-2xl border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Regras do Cashback</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{config.ativo ? "Ativo" : "Desativado"}</span>
            <Switch checked={config.ativo} onCheckedChange={v => setConfig({ ...config, ativo: v })} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: "percentual", label: "% ganho por pedido", placeholder: "1", suffix: "%" },
            { key: "validade_dias", label: "Validade (dias)", placeholder: "30", suffix: "dias" },
            { key: "minimo_uso", label: "Saldo mínimo para usar", placeholder: "5", suffix: "R$" },
            { key: "limite_desconto_pct", label: "Limite de desconto", placeholder: "10", suffix: "% do pedido" },
          ].map(f => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-gray-400">{f.label}</Label>
              <div className="relative">
                <Input type="number" step="0.1" min="0" value={(config as any)[f.key]} onChange={e => setConfig({ ...config, [f.key]: e.target.value })} placeholder={f.placeholder} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{f.suffix}</span>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={saveConfig} disabled={saving} className="bg-[#5850ec] text-white">
          {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Salvar Configurações
        </Button>
      </div>

      {/* Saldos por cliente */}
      {saldos.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <Users size={18} className="text-[#5850ec]" />
            <h3 className="font-bold text-gray-800">Saldo por Cliente</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr><th className="px-6 py-3">Cliente</th><th className="px-6 py-3 text-right">Saldo</th></tr>
            </thead>
            <tbody className="divide-y">
              {saldos.map((s: any) => (
                <tr key={s.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{(s as any).profiles?.nome || "—"}</p>
                    <p className="text-xs text-gray-400">{(s as any).profiles?.email}</p>
                  </td>
                  <td className="px-6 py-3 text-right font-black text-[#5850ec]">R$ {Number(s.saldo).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Histórico de transações */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={18} className="text-[#5850ec]" /> Histórico de Transações</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <Input placeholder="Buscar cliente..." className="pl-8 h-8 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {isLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#5850ec]" size={28} /></div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr><th className="px-6 py-3">Cliente</th><th className="px-6 py-3">Tipo</th><th className="px-6 py-3">Valor</th><th className="px-6 py-3">Descrição</th><th className="px-6 py-3">Data</th></tr>
            </thead>
            <tbody className="divide-y">
              {filteredTransacoes.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Nenhuma transação encontrada.</td></tr>}
              {filteredTransacoes.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{t.profiles?.nome || "—"}</p>
                    <p className="text-xs text-gray-400">{t.profiles?.email}</p>
                  </td>
                  <td className="px-6 py-3"><Badge className={`${tipoColors[t.tipo] || "bg-gray-100 text-gray-500"} capitalize`}>{t.tipo}</Badge></td>
                  <td className={`px-6 py-3 font-bold ${t.tipo === "recebido" ? "text-green-600" : "text-red-500"}`}>
                    {t.tipo === "recebido" ? "+" : "-"} R$ {Math.abs(t.valor).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{t.descricao || "—"}</td>
                  <td className="px-6 py-3 text-gray-400 text-xs">{format(new Date(t.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

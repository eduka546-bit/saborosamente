import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/financeiro/transacoes")({
  component: AdminTransacoesPage,
});

function AdminTransacoesPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["transacoes-pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("id, nome_cliente, valor_total, taxa_entrega, desconto_aplicado, metodo_pagamento, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() =>
    orders.filter((o: any) =>
      (filterStatus === "Todos" || o.status === filterStatus) &&
      (o.nome_cliente?.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search))
    ), [orders, search, filterStatus]
  );

  const exportCSV = () => {
    const header = "ID,Cliente,Valor,Entrega,Desconto,Pagamento,Status,Data\n";
    const rows = filtered.map((o: any) =>
      `${o.id},${o.nome_cliente ?? ""},${o.valor_total},${o.taxa_entrega ?? 0},${o.desconto_aplicado ?? 0},${o.metodo_pagamento ?? ""},${o.status},${o.created_at}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "transacoes.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const statusColors: any = {
    pendente: "bg-yellow-100 text-yellow-700",
    preparando: "bg-blue-100 text-blue-700",
    "saiu para entrega": "bg-purple-100 text-purple-700",
    entregue: "bg-green-100 text-green-700",
    cancelado: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Transações</h1>
          <p className="text-gray-500 text-sm mt-1">Histórico financeiro de todos os pedidos.</p>
        </div>
        <Button onClick={exportCSV} className="bg-[#5850ec] text-white flex items-center gap-2">
          <Download size={16} /> Exportar CSV
        </Button>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Buscar por cliente ou ID..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-10 px-3 rounded-md border border-input bg-background text-sm font-medium">
          {["Todos", "pendente", "preparando", "saiu para entrega", "entregue", "cancelado"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Pagamento</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Desconto</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Nenhuma transação encontrada.</td></tr>}
              {filtered.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs text-[#5850ec]">#{o.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{o.nome_cliente ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-500">{o.metodo_pagamento ?? "—"}</td>
                  <td className="px-6 py-4 font-bold text-green-600">R$ {Number(o.valor_total).toFixed(2)}</td>
                  <td className="px-6 py-4 text-red-500">{o.desconto_aplicado ? `- R$ ${Number(o.desconto_aplicado).toFixed(2)}` : "—"}</td>
                  <td className="px-6 py-4"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColors[o.status] ?? "bg-gray-100 text-gray-600"}`}>{o.status}</span></td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{format(new Date(o.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

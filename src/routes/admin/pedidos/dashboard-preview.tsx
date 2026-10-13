import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, CalendarDays, PackageCheck, ChefHat, Truck, CircleCheck, CircleX, Clock3, Eye, Printer, ArrowLeft, ShoppingBag, RefreshCw, X } from "lucide-react";
import { printReceipt } from "@/components/thermal-receipt";

export const Route = createFileRoute("/admin/pedidos/dashboard-preview")({
  component: DashboardPedidosPreview,
  ssr: false,
});

const money = (v: unknown) => Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateOnly = (v: unknown) => {
  if (!v) return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(8, 10) + "/" + s.slice(5, 7) + "/" + s.slice(0, 4);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString("pt-BR");
};
const deliveryDate = (o: any) => o.data_entrega || o.data_recebimento || o.data_agendada || null;
const deliveryTime = (o: any) => o.horario_entrega || o.horario_recebimento || o.horario_agendado || "";
const sections = [
  { id: "novo", title: "Solicitados / Novos", icon: Clock3, accent: "#d58a18", bg: "#fff7e7", statuses: ["pendente", "rascunho"] },
  { id: "preparando", title: "Em preparação", icon: ChefHat, accent: "#347e4e", bg: "#eff8f1", statuses: ["preparando"] },
  { id: "rota", title: "Pronto / Saiu para entrega", icon: Truck, accent: "#327bb4", bg: "#eef6fd", statuses: ["pronto para retirada", "saiu para entrega"] },
  { id: "entregue", title: "Entregues", icon: CircleCheck, accent: "#8259b6", bg: "#f6f1fc", statuses: ["entregue"] },
  { id: "cancelado", title: "Cancelados", icon: CircleX, accent: "#bd4b4b", bg: "#fff0f0", statuses: ["cancelado"] },
];

export function DashboardPedidosPreview() {
  const client = useQueryClient();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("7");
  const [selected, setSelected] = useState<any>(null);
  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ["admin-orders-dashboard-preview"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pedidos").select("*, itens:pedido_itens(*)").order("created_at", { ascending: false }).limit(800);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });
  useEffect(() => {
    const channel = supabase.channel("dashboard-pedidos-preview").on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => {
      client.invalidateQueries({ queryKey: ["admin-orders-dashboard-preview"] });
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [client]);

  const filtered = useMemo(() => {
    const cutoff = range === "all" ? null : new Date(Date.now() - Number(range) * 86400000);
    const search = query.trim().toLowerCase();
    return orders.filter((o: any) => {
      if (cutoff && new Date(o.created_at) < cutoff) return false;
      return !search || [o.id, o.nome_cliente, o.telefone_cliente, o.endereco_cidade].some((v) => String(v ?? "").toLowerCase().includes(search));
    });
  }, [orders, query, range]);
  const shown = filtered.filter((o: any) => o.status !== "rascunho");
  const today = new Date().toLocaleDateString("pt-BR");
  const summary = [
    { text: "Pedidos no período", value: shown.length, color: "#24563e" },
    { text: "Em preparação", value: shown.filter((o: any) => o.status === "preparando").length, color: "#37814b" },
    { text: "A entregar / retirar", value: shown.filter((o: any) => ["pronto para retirada", "saiu para entrega"].includes(o.status)).length, color: "#2f79b8" },
    { text: "Concluídos", value: shown.filter((o: any) => o.status === "entregue").length, color: "#7f5aae" },
  ];
  return (
    <div className="min-h-screen bg-[#f7f8f5] px-3 py-5 text-[#273b30] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#668071]">
              <a href="/admin/pedidos?modo=lista" className="inline-flex items-center gap-1 hover:underline"><ArrowLeft size={13} /> Pedidos atuais</a>
              <span>/</span><span>Prévia do dashboard</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#194e32]">Painel de Pedidos</h1>
            <p className="text-xs text-[#758379]">SaborosaMente • Painel experimental, utilizando os pedidos reais em modo de consulta</p>
          </div>
          <span className="rounded-full border border-[#d1e5d5] bg-[#eff8ef] px-3 py-1.5 text-xs font-semibold text-[#347a44]">● Prévia — sem alterar pedidos</span>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {summary.map((s) => <div key={s.text} className="rounded-xl border border-[#e5e9e3] bg-white p-3 shadow-sm">
            <p className="text-[11px] text-[#7c8a80]">{s.text}</p><p className="mt-1 text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>)}
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-[#e5e9e3] bg-white p-3 shadow-sm">
          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-[#e1e5dd] px-3 py-2">
            <Search size={15} className="text-[#7f9284]" />
            <input className="w-full bg-transparent text-sm outline-none" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pedido, cliente, cidade ou telefone" />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#e1e5dd] px-3 py-2">
            <CalendarDays size={15} className="text-[#64816f]" />
            <select className="bg-transparent text-sm outline-none" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="1">Últimas 24 horas</option><option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option><option value="all">Todos (até 800 recentes)</option>
            </select>
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-[#d2dfd3] px-3 py-2 text-sm hover:bg-[#f0f7ef]" onClick={() => client.invalidateQueries({ queryKey: ["admin-orders-dashboard-preview"] })}>
            <RefreshCw size={15} /> Atualizar
          </button>
          <a href="/admin/pedidos?modo=lista" className="rounded-lg bg-[#28633c] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#1d4d2e]">Gerenciar pedidos</a>
        </div>
        {isError && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">Não foi possível carregar os pedidos. Verifique sua sessão e tente atualizar.</div>}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          {sections.map((section) => {
            const list = filtered.filter((o: any) => section.statuses.includes(String(o.status)));
            const Icon = section.icon;
            return <section key={section.id} className="overflow-hidden rounded-xl border border-[#e5e9e3] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#edf0ea] px-4 py-3">
                <div className="flex items-center gap-2" style={{color: section.accent}}><Icon size={18}/><h2 className="text-sm font-semibold">{section.title}</h2></div>
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{background: section.bg, color: section.accent}}>{list.length}</span>
              </div>
              <div className="hidden grid-cols-[.8fr_1.5fr_1.1fr_.7fr_auto] gap-2 border-b border-[#ebedea] bg-[#fafbf9] px-4 py-2 text-[11px] font-semibold text-[#738077] sm:grid">
                <span>Pedido</span><span>Cliente</span><span>Entrega / Retirada</span><span>Valor</span><span>Ações</span>
              </div>
              <div className="max-h-[330px] overflow-y-auto">
                {isLoading ? <p className="p-8 text-center text-sm text-[#829083]">Carregando pedidos...</p> :
                  list.length === 0 ? <p className="p-7 text-center text-sm text-[#9ba59b]">Nenhum pedido neste período</p> :
                  list.map((o: any) => <div key={o.id} className="grid grid-cols-1 gap-1 border-b border-[#f0f1ee] px-4 py-3 text-xs last:border-b-0 hover:bg-[#fbfdfb] sm:grid-cols-[.8fr_1.5fr_1.1fr_.7fr_auto] sm:items-center sm:gap-2">
                    <span className="font-bold text-[#315c3e]">#{String(o.id).slice(0,8).toUpperCase()}</span>
                    <div className="min-w-0"><p className="truncate font-semibold">{o.nome_cliente || "Cliente sem nome"}</p><p className="truncate text-[10px] text-[#96a098]">{o.origem || "site"} • {o.endereco_cidade || "São Bento do Sul"}</p></div>
                    <div className="text-[#667a69]">
                      <p className="font-semibold">{deliveryDate(o) ? dateOnly(deliveryDate(o)) : dateOnly(o.created_at)} {deliveryTime(o) ? " • " + deliveryTime(o) : ""}</p>
                      <p className="text-[10px]">{o.metodo_entrega === "retirada" ? "Retirada" : "Entrega"}</p>
                    </div>
                    <span className="font-bold text-[#245a38]">{money(o.valor_total)}</span>
                    <div className="flex items-center gap-1">
                      <button aria-label="Visualizar pedido" title="Visualizar pedido" onClick={() => setSelected(o)} className="rounded-lg bg-[#eff5ed] p-2 text-[#2f6941] hover:bg-[#dbe9da]"><Eye size={15}/></button>
                    </div>
                  </div>)}
              </div>
            </section>;
          })}
        </div>
        <p className="mt-4 text-center text-xs text-[#91a094]">Prévia visual conectada aos pedidos existentes • As alterações de status continuam na tela original</p>
      </div>
      {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3" onClick={() => setSelected(null)}>
        <div role="dialog" aria-modal="true" aria-label="Resumo do pedido" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-[#7c9482]">VISUALIZAR PEDIDO</p><h2 className="text-xl font-bold">#{String(selected.id).slice(0,8).toUpperCase()}</h2><p className="text-sm">{selected.nome_cliente || "Cliente"}</p></div><button onClick={() => setSelected(null)} aria-label="Fechar" className="rounded-lg p-2 hover:bg-gray-100"><X size={20}/></button></div>
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-[#f5f8f3] p-3 text-sm">
            <div><p className="text-xs text-gray-500">Status</p><p className="font-semibold capitalize">{selected.status}</p></div>
            <div><p className="text-xs text-gray-500">Origem</p><p className="font-semibold">{selected.origem || "site"}</p></div>
            <div><p className="text-xs text-gray-500">Data</p><p className="font-semibold">{dateOnly(deliveryDate(selected) || selected.created_at)}</p></div>
            <div><p className="text-xs text-gray-500">Horário</p><p className="font-semibold">{deliveryTime(selected) || "Não informado"}</p></div>
            <div><p className="text-xs text-gray-500">Modalidade</p><p className="font-semibold">{selected.metodo_entrega === "retirada" ? "Retirada" : "Entrega"}</p></div>
            <div><p className="text-xs text-gray-500">Cidade</p><p className="font-semibold">{selected.endereco_cidade || "Não informada"}</p></div>
          </div>
          <h3 className="mb-2 text-sm font-bold">Itens do pedido</h3>
          <div className="mb-4 divide-y rounded-lg border">{(selected.itens || []).map((item: any, i: number) => <div key={item.id || i} className="flex justify-between gap-3 px-3 py-2 text-sm"><span>{item.quantidade}x {item.nome_item || item.nome || "Produto"} {item.observacao ? "— " + item.observacao : ""}</span><span className="shrink-0 font-semibold">{money(Number(item.quantidade) * Number(item.preco_unitario))}</span></div>)}</div>
          <div className="mb-4 flex justify-between text-lg font-bold"><span>Total</span><span>{money(selected.valor_total)}</span></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => printReceipt({ ...selected, itens: (selected.itens || []).map((i: any) => ({ nome: i.nome_item || i.nome || "Produto", quantidade: i.quantidade, preco_unitario: i.preco_unitario, observacao: i.observacao })) })} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"><Printer size={15}/> Imprimir</button>
            <a href="/admin/pedidos?modo=lista" className="flex items-center gap-2 rounded-lg bg-[#28633c] px-4 py-2 text-sm font-semibold text-white"><PackageCheck size={15}/> Abrir gestão de pedidos</a>
          </div>
        </div>
      </div>}
    </div>
  );
}

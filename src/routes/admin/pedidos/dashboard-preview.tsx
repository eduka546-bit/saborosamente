import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { updateAdminOrderStatus } from "@/lib/orders.functions";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, CalendarDays, PackageCheck, ChefHat, Truck, CircleCheck, CircleX, Clock3, Eye, Printer, ShoppingBag, RefreshCw, X, Pencil, MessageCircle, List, LayoutDashboard, Bell, Plus, MapPin, Phone, CreditCard } from "lucide-react";
import { printReceipt } from "@/components/thermal-receipt";
import { sortOrderItems } from "@/lib/order-item-order";
import { orderWhatsappUrl, isOpenOrder } from "@/lib/order-whatsapp";
import { imprimirTCP } from "@/lib/qz-print";
import { ativarPush, desativarPush, statusPush } from "@/lib/push";

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
const deliveryTime = (o: any) => {
  const raw = String(o.horario_entrega || o.horario_recebimento || o.horario_agendado || "").trim();
  if (!raw) return "";
  // Algumas reservas armazenam data e intervalo no mesmo campo.
  const withoutDate = raw.replace(/\d{2}\/\d{2}\/\d{4}\s*[·,–-]?\s*/g, "").trim();
  return withoutDate || raw;
};
const itemName = (item: any) => item.produtos?.nome || item.nome_item || item.nome || "Produto não identificado";
const itemWeight = (item: any) => {
  const obs = String(item.observacao || "");
  const match = obs.match(/(?:Peso:\s*)?(200|300|400)\s*g/i);
  return match ? match[1] + "g" : "";
};
const itemNote = (item: any) => String(item.observacao || "").replace(/(?:Peso:\s*)?(?:200|300|400)\s*g/gi, "").replace(/[|—-]?\s*Congelada/gi, "").replace(/^[\s|—–,;-]+|[\s|—–,;-]+$/g, "").trim();
const sections = [
  { id: "novo", title: "Solicitados / Novos", icon: Clock3, accent: "#d58a18", bg: "#fff7e7", statuses: ["pendente", "rascunho"] },
  { id: "preparando", title: "Em preparação", icon: ChefHat, accent: "#347e4e", bg: "#eff8f1", statuses: ["preparando"] },
  { id: "rota", title: "Pronto / Saiu para entrega", icon: Truck, accent: "#327bb4", bg: "#eef6fd", statuses: ["pronto para retirada", "saiu para entrega"] },
  { id: "entregue", title: "Entregues", icon: CircleCheck, accent: "#8259b6", bg: "#f6f1fc", statuses: ["entregue"] },
  { id: "cancelado", title: "Cancelados", icon: CircleX, accent: "#bd4b4b", bg: "#fff0f0", statuses: ["cancelado"] },
];

export function DashboardPedidosPreview() {
  const client = useQueryClient();
  const statusFn = useServerFn(updateAdminOrderStatus);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"quadro" | "lista">("quadro");
  const [originFilter, setOriginFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [autoPrint, setAutoPrint] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("admin.autoPrint") === "true"
  );
  const [pushState, setPushState] = useState<"nao-suportado" | "inscrito" | "nao-inscrito" | "bloqueado" | "carregando">("carregando");
  const [pushBusy, setPushBusy] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const seenOrdersRef = useRef(new Set<string>());
  const { data: printSettings } = useQuery({
    queryKey: ["config-impressao"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("config_impressao").maybeSingle();
      return (data?.config_impressao as any) ?? null;
    },
    staleTime: 60_000,
  });
  useEffect(() => {
    void statusPush().then(setPushState).catch(() => setPushState("nao-suportado"));
    if (typeof window !== "undefined" && "Notification" in window) setPermission(Notification.permission);
  }, []);
  const togglePush = async () => {
    setPushBusy(true);
    try {
      if (pushState === "inscrito") {
        await desativarPush();
        setPushState("nao-inscrito");
        toast.success("Notificações push desativadas neste aparelho.");
      } else {
        await ativarPush();
        setPushState("inscrito");
        toast.success("Notificações push ativadas neste aparelho.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível configurar as notificações.");
      setPushState(await statusPush());
    } finally { setPushBusy(false); }
  };
  const printOrder = (order: any) => printReceipt({
    ...order,
    itens: (order.itens || []).map((i: any) => ({
      nome: itemName(i), quantidade: i.quantidade,
      preco_unitario: Number(i.preco_unitario || 0), observacao: i.observacao,
    })),
  });
  const orderActions = (order: any) => (
    <div className="flex flex-wrap items-center gap-1">
      <button aria-label="Visualizar pedido" title="Visualizar pedido"
        onClick={() => setSelected(order)}
        className="rounded-lg bg-[#eff5ed] p-2 text-[#2f6941] hover:bg-[#dceadc]"><Eye size={16}/></button>
      <button aria-label="Editar pedido" title="Editar informações"
        onClick={() => setEditing({ ...order })}
        className="rounded-lg bg-[#eff5ed] p-2 text-[#2f6941] hover:bg-[#dceadc]"><Pencil size={16}/></button>
      {isOpenOrder(order.status) && (orderWhatsappUrl(order)
        ? <a title="Enviar mensagem no WhatsApp" aria-label={"WhatsApp para " + (order.nome_cliente || "cliente")}
            href={orderWhatsappUrl(order)!} target="_blank" rel="noopener noreferrer"
            className="rounded-lg bg-[#e4f7e8] p-2 text-[#168443] hover:bg-[#c9efcf]"><MessageCircle size={16}/></a>
        : <button title="Telefone não cadastrado ou inválido" aria-label="WhatsApp indisponível"
            disabled className="cursor-not-allowed rounded-lg bg-gray-100 p-2 text-gray-300"><MessageCircle size={16}/></button>)}
      <button aria-label="Imprimir pedido" title="Imprimir comanda POS58" onClick={() => printOrder(order)}
        className="rounded-lg bg-[#eff5ed] p-2 text-[#2f6941] hover:bg-[#dceadc]"><Printer size={16}/></button>
    </div>
  );
  const changeStatus = async (order:any, status:string) => {
    if (order.status === status) return;
    if (status === "cancelado" && !window.confirm("Confirma cancelar este pedido?")) return;
    setBusyId(order.id);
    try {
      const {data:{session}} = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada");
      const result = await statusFn({data:{id:order.id,status:status as "pendente" | "preparando" | "saiu para entrega" | "pronto para retirada" | "entregue" | "cancelado",accessToken:session.access_token}});
      const effectiveStatus=String((result as any)?.status || status);
      try { await supabase.functions.invoke("whatsapp-notify",{body:{pedido_id:order.id,status_anterior:order.status,status_novo:effectiveStatus}}); } catch(err) { console.warn("Notificação",err); }
      await client.invalidateQueries({queryKey:["admin-orders-dashboard-preview"]});
      await client.invalidateQueries({queryKey:["admin-orders"]});
      toast.success("Status atualizado");
    } catch(err:any) { toast.error(err?.message || "Erro ao atualizar status"); }
    finally {setBusyId(null);}
  };
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ["admin-orders-dashboard-preview"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pedidos").select("*, itens:pedido_itens(*)").order("created_at", { ascending: false }).limit(800);
      if (error) throw error;
      const productIds = Array.from(new Set<string>(
        (data ?? []).flatMap((order: any) =>
          (order.itens ?? []).map((item: any) => String(item.produto_id || "")).filter(Boolean)
        )
      ));
      const names: Record<string, string> = {};
      // Produtos consultados em lotes para evitar limite de resposta em períodos extensos.
      for (let i = 0; i < productIds.length; i += 200) {
        const { data: products, error: productError } = await supabase.from("produtos").select("id,nome").in("id", productIds.slice(i, i + 200));
        if (productError) throw productError;
        for (const product of products ?? []) names[product.id] = product.nome;
      }
      return (data ?? []).map((order: any) => ({
        ...order,
        itens: (order.itens ?? []).map((item: any) => ({
          ...item,
          produtos: { nome: names[item.produto_id] || item.nome_item || item.nome || "" },
        })),
      }));
    },
    refetchInterval: 30000,
  });
  // Centraliza Realtime, aviso de novos pedidos e impressão automática
  // na mesma tela. A antiga tela não monta mais um segundo monitor.
  useEffect(() => {
    const channel = supabase.channel("pedidos-dashboard-unificado")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pedidos" }, async ({ new: row }) => {
        const order = row as any;
        if (!order?.id || seenOrdersRef.current.has(order.id)) return;
        seenOrdersRef.current.add(order.id);
        void client.invalidateQueries({ queryKey: ["admin-orders-dashboard-preview"] });
        if (order.status === "rascunho") return;
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const audio = new AudioCtx();
            if (audio.state === "suspended") await audio.resume();
            for (let i = 0; i < 3; i++) {
              const oscillator = audio.createOscillator(), gain = audio.createGain();
              oscillator.connect(gain); gain.connect(audio.destination);
              oscillator.frequency.value = [880, 1100, 1320][i];
              gain.gain.setValueAtTime(0.18, audio.currentTime + i * 0.26);
              gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + i * 0.26 + 0.22);
              oscillator.start(audio.currentTime + i * 0.26);
              oscillator.stop(audio.currentTime + i * 0.26 + 0.22);
            }
            window.setTimeout(() => void audio.close(), 1500);
          }
        } catch { /* navegador pode bloquear som sem interação */ }
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            const n = new Notification("🍱 Novo pedido SaborosaMente", {
              body: (order.nome_cliente || "Cliente") + " — " + money(order.valor_total),
              icon: "/favicon.png", tag: "pedido-" + order.id,
            });
            n.onclick = () => { window.focus(); n.close(); };
          } catch { /* permissão do sistema indisponível */ }
        }
        toast.info("Novo pedido de " + (order.nome_cliente || "cliente") + "!", { duration: 12000 });

        if (!(autoPrint || printSettings?.impressao_automatica) ||
            printSettings?.imprimir_ao_confirmar === false) return;
        try {
          // Espera o pedido e seus itens serem finalizados no banco.
          await new Promise(resolve => window.setTimeout(resolve, 1200));
          const { data: items, error } = await supabase
            .from("pedido_itens").select("*").eq("pedido_id", order.id);
          if (error || !items?.length) {
            console.warn("Impressão automática: pedido sem itens completos, confira a comanda manual.");
            return;
          }
          const ids = [...new Set(items.map((i: any) => i.produto_id).filter(Boolean))];
          const productNames: Record<string, string> = {};
          if (ids.length) {
            const { data: products } = await supabase.from("produtos").select("id,nome").in("id", ids);
            for (const product of products || []) productNames[product.id] = product.nome;
          }
          const printable = {
            ...order,
            itens: items.map((i: any) => ({
              nome: productNames[i.produto_id] || i.nome_item || "Produto",
              quantidade: i.quantidade, preco_unitario: i.preco_unitario,
              observacao: i.observacao,
            })),
          };
          const ip = printSettings?.impressora_ip;
          const porta = Number(printSettings?.impressora_porta || 9100);
          const copies = Number(printSettings?.copias || 1);
          const paper = printSettings?.tamanho_papel || "58mm";
          if (!ip || !(await imprimirTCP(printable, ip, porta, copies, paper))) printReceipt(printable);
        } catch (error) { console.error("Falha ao imprimir pedido automaticamente:", error); }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos" }, () => {
        void client.invalidateQueries({ queryKey: ["admin-orders-dashboard-preview"] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [client, autoPrint, printSettings]);

  const saveQuickEdit = async () => {
    if (!editing) return;
    setBusyId(editing.id);
    try {
      const {data:{session}} = await supabase.auth.getSession();
      if(!session?.access_token) throw new Error("Sessão expirada");
      const original = (orders as any[]).find(o=>o.id===editing.id);
      if(!original) throw new Error("Pedido não encontrado");
      const fields=["nome_cliente","telefone_cliente","endereco_rua","endereco_numero","endereco_bairro","endereco_cidade","horario_recebimento","metodo_pagamento"];
      const changes:Record<string,any>={};
      for(const field of fields) if(String(original[field]??"")!==String(editing[field]??"")) changes[field]=editing[field];
      if(Object.keys(changes).length){
        const {error}=await supabase.from("pedidos").update(changes).eq("id",editing.id);
        if(error) throw error;
      }
      await client.invalidateQueries({queryKey:["admin-orders-dashboard-preview"]});
      await client.invalidateQueries({queryKey:["admin-orders"]});
      setEditing(null);
      toast.success("Informações atualizadas");
    } catch(err:any){toast.error(err?.message||"Erro ao salvar pedido")}
    finally {setBusyId(null)}
  };
  const filtered = useMemo(() => {
    const cutoff = range === "all" ? null : new Date(Date.now() - Number(range) * 86400000);
    const search = query.trim().toLowerCase();
    return orders.filter((o: any) => {
      if (cutoff && new Date(o.created_at) < cutoff) return false;
      if (originFilter !== "todos" && String(o.origem || "site") !== originFilter) return false;
      if (statusFilter !== "todos" && String(o.status) !== statusFilter) return false;
      if (minValue !== "" && Number(o.valor_total || 0) < Number(minValue)) return false;
      if (maxValue !== "" && Number(o.valor_total || 0) > Number(maxValue)) return false;
      return !search || [o.id, o.nome_cliente, o.telefone_cliente, o.endereco_cidade]
        .some((v) => String(v ?? "").toLowerCase().includes(search));
    });
  }, [orders, query, range, originFilter, statusFilter, minValue, maxValue]);
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
            <h1 className="text-2xl font-bold tracking-tight text-[#194e32]">Gestão de Pedidos</h1>
            <p className="text-xs text-[#758379]">Todos os pedidos e ações em uma única tela, atualizados em tempo real</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href="/admin/pedidos/whatsapp" className="inline-flex items-center gap-1.5 rounded-lg bg-[#28633c] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1c4c31]">
              <Plus size={15}/> Novo pedido WhatsApp
            </a>
            <a href="/admin/pdv" className="rounded-lg border border-[#d4e2d3] bg-white px-3 py-2 text-xs font-semibold text-[#245a38] hover:bg-[#f0f7ef]">PDV</a>
            <a href="/admin/registrar-p10" className="rounded-lg border border-[#d4e2d3] bg-white px-3 py-2 text-xs font-semibold text-[#245a38] hover:bg-[#f0f7ef]">P10</a>
            <a href="/admin/pedidos/entregadores" className="rounded-lg border border-[#d4e2d3] bg-white px-3 py-2 text-xs font-semibold text-[#245a38] hover:bg-[#f0f7ef]">Entregadores</a>
            <a href="/admin/pedidos/leads" className="rounded-lg border border-[#d4e2d3] bg-white px-3 py-2 text-xs font-semibold text-[#245a38] hover:bg-[#f0f7ef]">Leads</a>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => {
            const next = !autoPrint;
            setAutoPrint(next);
            window.localStorage.setItem("admin.autoPrint", String(next));
            toast.success(next ? "Impressão automática ativada" : "Impressão automática desativada");
          }} aria-pressed={autoPrint} className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold " +
            (autoPrint ? "border-green-700 bg-green-700 text-white" : "border-[#d4e2d3] bg-white text-[#245a38]")}>
            <Printer size={15}/> Auto-imprimir {autoPrint ? "ON" : "OFF"}
          </button>
          {pushState !== "nao-suportado" && (
            <button type="button" disabled={pushBusy || pushState === "carregando" || pushState === "bloqueado"} onClick={togglePush}
              className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 " +
                (pushState === "inscrito" ? "border-green-700 bg-[#e6f5e9] text-green-800" : "border-[#d4e2d3] bg-white text-[#245a38]")}>
              <Bell size={15}/>{pushState === "inscrito" ? "Push ON" : "Ativar notificações"}
            </button>
          )}
          {permission === "denied" && <span className="text-xs text-amber-700">Notificações bloqueadas pelo navegador</span>}
          {permission === "default" && typeof window !== "undefined" && "Notification" in window && (
            <button type="button" onClick={async () => setPermission(await Notification.requestPermission())}
              className="text-xs font-medium text-amber-700 underline">Permitir avisos de novos pedidos</button>
          )}
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {summary.map((s) => <div key={s.text} className="rounded-xl border border-[#e5e9e3] bg-white p-3 shadow-sm">
            <p className="text-[11px] text-[#7c8a80]">{s.text}</p><p className="mt-1 text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>)}
        </div>
        <div className="mb-5 rounded-xl border border-[#e5e9e3] bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-[210px] flex-1 items-center gap-2 rounded-lg border border-[#e1e5dd] px-3 py-2">
              <Search size={15} className="text-[#7f9284]"/>
              <input className="w-full bg-transparent text-sm outline-none" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Pedido, nome, cidade ou telefone"/>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-[#e1e5dd] px-2 py-2">
              <CalendarDays size={15} className="text-[#64816f]"/>
              <select aria-label="Período" className="bg-transparent text-xs" value={range} onChange={e => setRange(e.target.value)}>
                <option value="1">Últimas 24 horas</option>
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="all">Todos os pedidos</option>
              </select>
            </label>
            <select aria-label="Filtrar por origem" value={originFilter} onChange={e => setOriginFilter(e.target.value)}
              className="rounded-lg border border-[#e1e5dd] bg-white px-3 py-2 text-xs">
              <option value="todos">Todas as origens</option>
              <option value="site">Site</option><option value="whatsapp">WhatsApp</option>
              <option value="pdv">PDV</option><option value="pedidos10">Pedidos10</option>
            </select>
            <select aria-label="Filtrar por status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#e1e5dd] bg-white px-3 py-2 text-xs">
              <option value="todos">Todos os status</option>
              {["pendente","rascunho","preparando","pronto para retirada","saiu para entrega","entregue","cancelado"].map(v =>
                <option key={v} value={v}>{v}</option>)}
            </select>
            <button title="Atualizar pedidos" aria-label="Atualizar pedidos" className="rounded-lg border border-[#d2dfd3] p-2 hover:bg-[#f0f7ef]"
              onClick={() => client.invalidateQueries({ queryKey: ["admin-orders-dashboard-preview"] })}>
              <RefreshCw size={16}/></button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-[#61776a]">
              <span>Valor de R$</span>
              <input aria-label="Valor mínimo" type="number" min={0} placeholder="mín." value={minValue}
                onChange={e=>setMinValue(e.target.value)} className="w-20 rounded-md border px-2 py-1.5"/>
              <span>até</span>
              <input aria-label="Valor máximo" type="number" min={0} placeholder="máx." value={maxValue}
                onChange={e=>setMaxValue(e.target.value)} className="w-20 rounded-md border px-2 py-1.5"/>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-[#f1f5ef] p-1">
              <button aria-pressed={viewMode==="quadro"} onClick={()=>setViewMode("quadro")}
                className={"inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold " +
                  (viewMode==="quadro"?"bg-white text-[#245a38] shadow-sm":"text-[#73877a]")}>
                <LayoutDashboard size={15}/> Etapas</button>
              <button aria-pressed={viewMode==="lista"} onClick={()=>setViewMode("lista")}
                className={"inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold " +
                  (viewMode==="lista"?"bg-white text-[#245a38] shadow-sm":"text-[#73877a]")}>
                <List size={15}/> Lista completa</button>
            </div>
          </div>
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
                      <select aria-label="Alterar status" disabled={busyId===o.id} value={o.status} onChange={e=>changeStatus(o,e.target.value)} className="mb-1 max-w-full rounded-md border border-[#dce6d9] bg-[#f2f8f2] px-1 py-1 text-[10px] font-semibold">{["pendente","preparando","pronto para retirada","saiu para entrega","entregue","cancelado"].map(v=><option value={v} key={v}>{v}</option>)}</select>
<p className="font-semibold">{deliveryDate(o) ? dateOnly(deliveryDate(o)) : dateOnly(o.created_at)} {deliveryTime(o) ? " • " + deliveryTime(o) : ""}</p>
                      <p className="text-[10px]">{o.metodo_entrega === "retirada" ? "Retirada" : "Entrega"}</p>
                    </div>
                    <span className="font-bold text-[#245a38]">{money(o.valor_total)}</span>
                    <div className="flex items-center gap-1">
                      <button aria-label="Visualizar pedido" title="Visualizar pedido" onClick={() => setSelected(o)} className="rounded-lg bg-[#eff5ed] p-2 text-[#2f6941] hover:bg-[#dbe9da]"><Eye size={15}/></button><button aria-label="Editar pedido" title="Editar informações" onClick={() => setEditing({...o})} className="rounded-lg bg-[#eff5ed] p-2 text-[#2f6941]"><Pencil size={15}/></button>
<button aria-label="Imprimir pedido" title="Imprimir pedido" onClick={() => printReceipt({...o,itens:(o.itens||[]).map((i:any)=>({nome:itemName(i),quantidade:i.quantidade,preco_unitario:i.preco_unitario,observacao:i.observacao}))})} className="rounded-lg bg-[#eff5ed] p-2 text-[#2f6941]"><Printer size={15}/></button>
                    </div>
                  </div>)}
              </div>
            </section>;
          })}
        </div>
        <p className="mt-4 text-center text-xs text-[#91a094]">Prévia visual conectada aos pedidos existentes • As alterações de status continuam na tela original</p>
      </div>
      {editing && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3" onClick={()=>setEditing(null)}>
        <div role="dialog" aria-modal="true" aria-label="Editar pedido" onClick={e=>e.stopPropagation()} className="flex max-h-[90dvh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b p-4"><h2 className="text-lg font-bold">Editar pedido #{String(editing.id).slice(0,8).toUpperCase()}</h2><button aria-label="Fechar" onClick={()=>setEditing(null)}><X size={20}/></button></div>
          <div className="grid min-h-0 grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2">
            {([["nome_cliente","Nome do cliente"],["telefone_cliente","Telefone"],["endereco_rua","Rua"],["endereco_numero","Número"],["endereco_bairro","Bairro"],["endereco_cidade","Cidade"],["horario_recebimento","Data e horário"],["metodo_pagamento","Forma de pagamento"]] as const).map(([field,label])=>
              <label key={field} className="flex flex-col gap-1 text-xs font-semibold"><span>{label}</span><input className="rounded-lg border p-2 text-sm font-normal" value={String(editing[field]??"")} onChange={e=>setEditing((prev:any)=>({...prev,[field]:e.target.value}))}/></label>)}
            <p className="text-xs text-gray-500 sm:col-span-2">Para editar itens, quantidades e valores, utilize a gestão completa para preservar as regras de estoque e cálculo.</p>
          </div>
          <div className="flex flex-wrap gap-2 border-t p-4"><button disabled={busyId===editing.id} onClick={saveQuickEdit} className="flex-1 rounded-lg bg-[#28633c] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Salvar alterações</button><button onClick={()=>setEditing(null)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button><a href="/admin/pedidos?modo=lista" className="rounded-lg border px-4 py-2 text-sm">Gestão completa</a></div>
        </div>
      </div>}
      {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-2 sm:p-4" onClick={() => setSelected(null)}>
        <div role="dialog" aria-modal="true" aria-label="Detalhes do pedido" className="flex h-[min(90dvh,790px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e8ede7] px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-wider text-[#799284]">VISUALIZAR PEDIDO</p>
              <h2 className="text-xl font-bold text-[#183e2b]">#{String(selected.id).slice(0, 8).toUpperCase()}</h2>
              <p className="truncate text-sm text-[#43594a]">{selected.nome_cliente || "Cliente sem nome"}</p>
            </div>
            <button onClick={() => setSelected(null)} aria-label="Fechar detalhes" className="rounded-lg p-2 hover:bg-gray-100"><X size={20}/></button>
          </div>
          <div className="shrink-0 px-4 pt-3 sm:px-5">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-[#f4f8f3] p-3 text-xs sm:grid-cols-3">
              {[
                ["Status", selected.status],
                ["Origem", selected.origem || "site"],
                ["Data de entrega", dateOnly(deliveryDate(selected) || selected.created_at)],
                ["Horário", deliveryTime(selected) || "Não informado"],
                ["Modalidade", selected.metodo_entrega === "retirada" ? "Retirada" : "Entrega"],
                ["Cidade", selected.endereco_cidade || "Não informada"],
              ].map(([label, value]) => <div key={label} className="min-w-0">
                <p className="mb-0.5 text-[11px] text-[#728478]">{label}</p>
                <p className="break-words font-semibold capitalize text-[#213d2a]">{value}</p>
              </div>)}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-4 pt-3 sm:px-5">
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <h3 className="text-sm font-bold">Itens do pedido</h3>
              <span className="text-xs text-[#75867a]">{(selected.itens || []).reduce((total: number, i: any) => total + Number(i.quantidade || 0), 0)} unidades</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#e0e9df]">
              {sortOrderItems(selected.itens || []).map((item: any, i: number) => <div key={item.id || i} className="flex justify-between gap-3 border-b border-[#edf1eb] px-3 py-2.5 text-sm last:border-b-0">
                <div className="min-w-0">
                  <p className="font-semibold text-[#234630]">{item.quantidade}x {itemName(item)}</p>
                  {(itemWeight(item) || itemNote(item)) && <p className="mt-0.5 text-xs text-[#78877b]">{[itemWeight(item), itemNote(item)].filter(Boolean).join(" • ")}</p>}
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-[#234630]">{money(Number(item.quantidade || 0) * Number(item.preco_unitario || 0))}</span>
              </div>)}
              {!(selected.itens || []).length && <p className="p-5 text-center text-sm text-gray-500">Nenhum item registrado.</p>}
            </div>
          </div>
          <div className="shrink-0 border-t border-[#e8ede7] bg-white px-4 py-3 sm:px-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-[#244a32]">Total do pedido</span>
              <strong className="text-xl font-bold tabular-nums text-[#1f5835]">{money(selected.valor_total)}</strong>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => printReceipt({ ...selected, itens: (selected.itens || []).map((i: any) => ({ nome: itemName(i), quantidade: i.quantidade, preco_unitario: i.preco_unitario, observacao: i.observacao })) })} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#cdddcf] px-4 py-2 text-sm font-semibold text-[#245b38] hover:bg-[#f1f7f0]"><Printer size={15}/> Imprimir</button>
              <a href="/admin/pedidos?modo=lista" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#28633c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4d2e]"><PackageCheck size={15}/> Gestão completa do pedido</a>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}

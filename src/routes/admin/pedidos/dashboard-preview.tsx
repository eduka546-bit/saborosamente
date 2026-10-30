import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useServerFn } from "@tanstack/react-start";
import { updateAdminOrder, updateAdminOrderStatus } from "@/lib/orders.functions";
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
const deliveryDate = (o: any) => {
  const raw = String(o.horario_recebimento || o.horario_entrega || "").trim();
  const dateMatch = raw.match(/\b\d{4}-\d{2}-\d{2}\b/) || raw.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
  return o.data_entrega || o.data_recebimento || o.data_agendada || dateMatch?.[0] || null;
};
const deliveryTime = (o: any) => {
  const raw = String(o.horario_entrega || o.horario_recebimento || o.horario_agendado || "").trim();
  if (!raw) return "";
  // Algumas reservas armazenam data e intervalo no mesmo campo.
  const withoutDate = raw.replace(/(?:\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\s*[·,–-]?\s*/g, "").trim();
  return withoutDate || raw;
};
const itemName = (item: any) => item.produtos?.nome || item.nome_item || item.nome || "Produto não identificado";
const itemWeight = (item: any) => {
  const raw = [item.tamanho, item.peso, item.gramatura, item.variacao, item.observacao, itemName(item)].filter(Boolean).join(" ");
  const match = raw.match(/\b(150|200|300|400)\s*g\b/i);
  return match ? match[1] + "g" : "";
};
const itemCategory = (item: any) => {
  const raw = [item.tipo, item.categoria, itemName(item), item.observacao].filter(Boolean).join(" ").toLowerCase();
  const productType = String(item.produtos?.tipo_produto || item.tipo_produto || "").toLowerCase();
  if (/personalizad/.test(raw)) return "Personalizados";
  if (productType === "sopa" || /\bsopas?\b|\b(?:so|sp)\d{1,3}\b/.test(raw)) return "Sopas";
  return itemWeight(item) || "Outros";
};
const orderPayments = (order: any) => {
  const fields = [order.pagamentos, order.formas_pagamento, order.payment_details];
  for (const value of fields) {
    let parsed = value;
    if (typeof parsed === "string") { try { parsed = JSON.parse(parsed); } catch { continue; } }
    if (Array.isArray(parsed) && parsed.length) return parsed.map((p: any) => ({
      name: String(p.metodo || p.forma || p.tipo || p.metodo_pagamento || "Pagamento"),
      amount: Number(p.valor ?? p.amount ?? 0),
      status: p.status ? String(p.status) : "",
    }));
  }
  return order.metodo_pagamento ? [{ name: String(order.metodo_pagamento), amount: Number(order.valor_total || 0), status: String(order.status_pagamento || "") }] : [];
};
const itemNote = (item: any) => String(item.observacao || "").replace(/(?:Peso:\s*)?(?:150|200|300|400)\s*g/gi, "").replace(/[|—-]?\s*Congelada/gi, "").replace(/^[\s|—–,;-]+|[\s|—–,;-]+$/g, "").trim();
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
  const updateOrderFn = useServerFn(updateAdminOrder);
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
  const openOrderEditor = (order: any) => {
    const subtotal = (order.itens || []).reduce(
      (sum: number, item: any) => sum + Number(item.quantidade || 0) * Number(item.preco_unitario || 0),
      0,
    );
    // O desconto já aplicado no valor final (cupom, indicação ou cashback) é
    // preservado. A faixa progressiva é calculada novamente pelo servidor.
    const descontoAdicional = Math.max(
      0,
      Math.round((subtotal + Number(order.taxa_entrega || 0) - Number(order.valor_total || 0)) * 100) / 100,
    );
    setEditing({ ...order, desconto_adicional: descontoAdicional });
  };
  const orderActions = (order: any) => (
    <div className="flex flex-wrap items-center gap-1">
      <button aria-label="Visualizar pedido" title="Visualizar pedido"
        onClick={() => setSelected(order)}
        className="rounded-lg bg-[#eff5ed] p-2 text-[#2f6941] hover:bg-[#dceadc]"><Eye size={16}/></button>
      <button aria-label="Editar pedido" title="Editar informações"
        onClick={() => openOrderEditor(order)}
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
      setSelected((current: any) => current?.id === order.id ? { ...current, status: effectiveStatus } : current);
      toast.success("Status atualizado");
    } catch(err:any) { toast.error(err?.message || "Erro ao atualizar status"); }
    finally {setBusyId(null);}
  };
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("7");
  const [selected, setSelected] = useState<any>(null);
  // Modais no document.body evitam o stacking context do cabeçalho sticky.
  useEffect(() => {
    if (!selected && !editing) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selected?.id, editing?.id]);
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
      const images: Record<string, string> = {};
      const types: Record<string, string> = {};
      // Produtos consultados em lotes para evitar limite de resposta em períodos extensos.
      for (let i = 0; i < productIds.length; i += 200) {
        const { data: products, error: productError } = await supabase.from("produtos").select("id,nome,imagem_url,tipo_produto").in("id", productIds.slice(i, i + 200));
        if (productError) throw productError;
        for (const product of products ?? []) { names[product.id] = product.nome; images[product.id] = product.imagem_url || ""; types[product.id] = product.tipo_produto || ""; }
      }
      return (data ?? []).map((order: any) => ({
        ...order,
        itens: (order.itens ?? []).map((item: any) => ({
          ...item,
          produtos: { nome: names[item.produto_id] || item.nome_item || item.nome || "", imagem_url: images[item.produto_id] || "", tipo_produto: types[item.produto_id] || "" },
        })),
      }));
    },
    refetchInterval: 30000,
  });
  const { data: productsForEdit = [] } = useQuery({
    queryKey: ["admin-products-order-edit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("id,nome,preco,preco_300g,preco_400g,tipo_produto,categorias(nome)").eq("ativo", true).order("nome");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
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
      const itens = (editing.itens ?? []).map((item:any) => ({
        produto_id: item.produto_id || null,
        nome_item: item.nome_item || item.produtos?.nome || "",
        quantidade: Math.max(1, Number(item.quantidade) || 1),
        preco_unitario: Math.max(0, Number(item.preco_unitario) || 0),
        observacao: item.observacao || "",
      })).filter((item:any) => item.produto_id || item.nome_item);
      if (!itens.length) throw new Error("Inclua pelo menos um item no pedido.");
      await updateOrderFn({ data: {
        id: editing.id, accessToken: session.access_token,
        nome_cliente: editing.nome_cliente || "Cliente final",
        telefone_cliente: editing.telefone_cliente || "Não informado",
        email_cliente: editing.email_cliente || "",
        metodo_entrega: editing.metodo_entrega === "retirada" ? "retirada" : "entrega",
        endereco_rua: editing.endereco_rua || "", endereco_numero: editing.endereco_numero || "",
        endereco_bairro: editing.endereco_bairro || "", endereco_cidade: editing.endereco_cidade || "",
        endereco_referencia: editing.endereco_referencia || "", endereco_complemento: editing.endereco_complemento || "",
        horario_recebimento: editing.horario_recebimento || "", metodo_pagamento: editing.metodo_pagamento || "",
        taxa_entrega: Number(editing.taxa_entrega) || 0, desconto_adicional: Number(editing.desconto_adicional) || 0,
        observacao: editing.observacao || editing.observacoes || "", itens,
      }});
      await client.invalidateQueries({queryKey:["admin-orders-dashboard-preview"]});
      await client.invalidateQueries({queryKey:["admin-orders"]});
      setEditing(null);
      toast.success("Pedido atualizado");
    } catch(err:any){toast.error(err?.message||"Erro ao salvar pedido")}
    finally {setBusyId(null)}
  };
  const filtered = useMemo(() => {
    const cutoff = range === "all" ? null : new Date(Date.now() - Number(range) * 86400000);
    const search = query.trim().toLowerCase();
    return orders.filter((o: any) => {
      // Pedidos ainda abertos não desaparecem só porque têm mais de 7 dias.
      if (cutoff && new Date(o.created_at) < cutoff && !isOpenOrder(o.status) && o.status !== "rascunho") return false;
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
    { text: "Pedidos exibidos", value: shown.length, color: "#24563e" },
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
        {viewMode === "quadro" ? (
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
                    {orderActions(o)}
                  </div>)}
              </div>
            </section>;
          })}
        </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#e1e8dc] bg-white shadow-sm">
            <div className="border-b border-[#edf0ea] px-4 py-3 text-sm font-semibold text-[#245a38]">
              Lista completa • {filtered.length} pedido(s)
            </div>
            <div className="max-h-[70vh] overflow-auto">
              {filtered.length === 0 ? <p className="p-8 text-center text-sm text-gray-500">Nenhum pedido encontrado.</p> :
                filtered.map((o: any) => (
                  <div key={o.id} className="grid gap-2 border-b border-[#edf0ea] p-3 text-xs last:border-b-0 hover:bg-[#f8fbf8] md:grid-cols-[110px_minmax(140px,1fr)_minmax(170px,1fr)_100px_160px] md:items-center">
                    <div><p className="font-bold text-[#245a38]">#{String(o.id).slice(0,8).toUpperCase()}</p>
                      <p className="text-[#89988e]">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p></div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{o.nome_cliente || "Cliente sem nome"}</p>
                      <p className="text-[#87958b]">{o.origem || "site"} • {o.endereco_cidade || "Sem cidade"}</p>
                    </div>
                    <div>
                      <select aria-label="Alterar status" disabled={busyId === o.id} value={o.status}
                        onChange={e => changeStatus(o,e.target.value)} className="mb-1 w-full rounded-md border border-[#dce6d9] bg-[#f2f8f2] px-2 py-1 text-xs">
                        {["rascunho","pendente","preparando","pronto para retirada","saiu para entrega","entregue","cancelado"].map(v=>
                          <option key={v} value={v}>{v}</option>)}
                      </select>
                      <p className="font-medium text-[#61776a]">{deliveryDate(o) ? dateOnly(deliveryDate(o)) : dateOnly(o.created_at)} {deliveryTime(o) ? " • " + deliveryTime(o) : ""}</p>
                    </div>
                    <strong className="text-[#245a38]">{money(o.valor_total)}</strong>
                    {orderActions(o)}
                  </div>
                ))}
            </div>
          </div>
        )}

      </div>
      {editing && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/50 p-3" onClick={()=>setEditing(null)}>
        <div role="dialog" aria-modal="true" aria-label="Editar pedido" onClick={e=>e.stopPropagation()} className="flex max-h-[92dvh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b p-4"><h2 className="text-lg font-bold">Editar pedido #{String(editing.id).slice(0,8).toUpperCase()}</h2><button aria-label="Fechar" onClick={()=>setEditing(null)}><X size={20}/></button></div>
          <div className="min-h-0 space-y-4 overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {([["nome_cliente","Nome do cliente"],["telefone_cliente","Telefone"],["email_cliente","E-mail"],["endereco_rua","Rua"],["endereco_numero","Número"],["endereco_bairro","Bairro"],["endereco_cidade","Cidade"],["endereco_referencia","Referência"],["endereco_complemento","Complemento"],["horario_recebimento","Data e horário"],["metodo_pagamento","Forma de pagamento"]] as const).map(([field,label])=>
              <label key={field} className="flex flex-col gap-1 text-xs font-semibold"><span>{label}</span><input className="rounded-lg border p-2 text-sm font-normal" value={String(editing[field]??"")} onChange={e=>setEditing((prev:any)=>({...prev,[field]:e.target.value}))}/></label>)}
              <label className="flex flex-col gap-1 text-xs font-semibold"><span>Como receber</span><select className="rounded-lg border p-2 text-sm font-normal" value={editing.metodo_entrega||"entrega"} onChange={e=>setEditing((prev:any)=>({...prev,metodo_entrega:e.target.value}))}><option value="entrega">Entrega</option><option value="retirada">Retirada</option></select></label>
              <label className="flex flex-col gap-1 text-xs font-semibold"><span>Taxa de entrega</span><input type="number" min="0" step="0.01" className="rounded-lg border p-2 text-sm font-normal" value={editing.taxa_entrega??0} onChange={e=>setEditing((prev:any)=>({...prev,taxa_entrega:e.target.value}))}/></label>
              <label className="flex flex-col gap-1 text-xs font-semibold"><span>Desconto adicional</span><input type="number" min="0" step="0.01" className="rounded-lg border p-2 text-sm font-normal" value={editing.desconto_adicional??0} onChange={e=>setEditing((prev:any)=>({...prev,desconto_adicional:e.target.value}))}/><span className="font-normal text-[#708078]">A faixa progressiva é recalculada ao salvar.</span></label>
            </div>
            <section className="rounded-xl border border-[#dfe9df] p-3"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-[#245b38]">Itens do pedido</h3><button type="button" onClick={()=>setEditing((prev:any)=>({...prev,itens:[...(prev.itens||[]),{produto_id:"",nome_item:"",quantidade:1,preco_unitario:0,observacao:""}]}))} className="inline-flex items-center gap-1 rounded-lg bg-[#e8f4ea] px-3 py-2 text-xs font-bold text-[#245b38]"><Plus size={14}/> Adicionar item</button></div>
              <div className="space-y-2">{(editing.itens||[]).map((item:any,index:number)=><div key={item.id||index} className="grid grid-cols-1 gap-2 rounded-xl border bg-[#fbfdfb] p-3 sm:grid-cols-[1fr_80px_110px_36px]">
                <select className="min-w-0 rounded-lg border p-2 text-sm" value={item.produto_id||""} onChange={e=>{const product=(productsForEdit as any[]).find(p=>p.id===e.target.value);setEditing((prev:any)=>({...prev,itens:(prev.itens||[]).map((row:any,i:number)=>i===index?{...row,produto_id:e.target.value,nome_item:product?.nome||row.nome_item,preco_unitario:product?Number(product.preco||0):row.preco_unitario}:row)}));}}><option value="">Item avulso</option>{(productsForEdit as any[]).map(product=><option key={product.id} value={product.id}>{product.nome}</option>)}</select>
                <input aria-label="Quantidade" type="number" min="1" className="rounded-lg border p-2 text-sm" value={item.quantidade??1} onChange={e=>setEditing((prev:any)=>({...prev,itens:(prev.itens||[]).map((row:any,i:number)=>i===index?{...row,quantidade:e.target.value}:row)}))}/><input aria-label="Preço unitário" type="number" min="0" step="0.01" className="rounded-lg border p-2 text-sm" value={item.preco_unitario??0} onChange={e=>setEditing((prev:any)=>({...prev,itens:(prev.itens||[]).map((row:any,i:number)=>i===index?{...row,preco_unitario:e.target.value}:row)}))}/><button type="button" aria-label="Remover item" disabled={(editing.itens||[]).length<=1} onClick={()=>setEditing((prev:any)=>({...prev,itens:(prev.itens||[]).filter((_:any,i:number)=>i!==index)}))} className="text-red-600 disabled:opacity-30"><X size={18}/></button>
                {!item.produto_id && <input className="sm:col-span-3 rounded-lg border p-2 text-sm" placeholder="Nome do item avulso" value={item.nome_item||""} onChange={e=>setEditing((prev:any)=>({...prev,itens:(prev.itens||[]).map((row:any,i:number)=>i===index?{...row,nome_item:e.target.value}:row)}))}/>}<input className="sm:col-span-3 rounded-lg border p-2 text-sm" placeholder="Observação do item, ex.: Peso: 300g" value={item.observacao||""} onChange={e=>setEditing((prev:any)=>({...prev,itens:(prev.itens||[]).map((row:any,i:number)=>i===index?{...row,observacao:e.target.value}:row)}))}/>
              </div>)}</div></section>
            <label className="flex flex-col gap-1 text-xs font-semibold"><span>Observações gerais</span><textarea className="rounded-lg border p-2 text-sm font-normal" rows={2} value={editing.observacao??editing.observacoes??""} onChange={e=>setEditing((prev:any)=>({...prev,observacao:e.target.value}))}/></label>
          </div>
          <div className="flex flex-wrap gap-2 border-t p-4"><button disabled={busyId===editing.id} onClick={saveQuickEdit} className="flex-1 rounded-lg bg-[#28633c] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Salvar alterações</button><button onClick={()=>setEditing(null)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button></div>
        </div>
      </div>, document.body)}
      {selected && typeof document !== "undefined" && (() => {
        const totalUnits = (selected.itens || []).reduce((sum: number, item: any) => sum + Number(item.quantidade || 0), 0);
        const counts: Record<string, number> = { "150g": 0, "200g": 0, "300g": 0, "400g": 0, "Sopas": 0, "Personalizados": 0 };
        for (const item of selected.itens || []) {
          const category = itemCategory(item);
          if (category in counts) counts[category] += Number(item.quantidade || 0);
        }
        const otherUnits = totalUnits - Object.values(counts).reduce((a, b) => a + b, 0);
        const payments = orderPayments(selected);
        const itemSubtotal = (selected.itens || []).reduce((sum: number, item: any) => sum + Number(item.quantidade || 0) * Number(item.preco_unitario || 0), 0);
        const discount = Number(selected.desconto_aplicado || 0);
        const deliveryFee = Number(selected.taxa_entrega || 0);
        const totalValue = Number(selected.valor_total || 0);
        const otherAdjustments = Math.round((totalValue - itemSubtotal + discount - deliveryFee) * 100) / 100;
        const created = selected.created_at ? new Date(selected.created_at) : null;
        const createdTime = created && !Number.isNaN(created.getTime()) ? created.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
        const unitStyle: Record<string, string> = {
          "150g": "bg-[#eaf4ff] text-[#1d547c]",
          "200g": "bg-[#edf7ed] text-[#226342]",
          "300g": "bg-[#fff5df] text-[#8a570e]",
          "400g": "bg-[#fff0f0] text-[#9d3939]",
          "Sopas": "bg-[#f4ebff] text-[#673b90]",
          "Personalizados": "bg-[#e9f6f0] text-[#245c4d]",
        };
        return createPortal(<div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/55 p-2 sm:p-4" onClick={() => setSelected(null)}>
          <div role="dialog" aria-modal="true" aria-label="Detalhes do pedido" className="flex h-[94dvh] max-h-[900px] w-full max-w-5xl flex-col overflow-hidden rounded-[22px] bg-white text-[#203b2b] shadow-2xl sm:rounded-[26px]" onClick={event => event.stopPropagation()}>
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[#e7ede8] bg-white px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f4ea] text-[#16593a] min-[355px]:flex sm:h-12 sm:w-12"><ShoppingBag size={22}/></div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#708178] sm:text-xs">Pedido</span>
                  <h2 className="text-base font-extrabold leading-tight tracking-tight text-[#143c2c] sm:text-2xl">#{String(selected.id).slice(0, 8).toUpperCase()}</h2>
                  <p className="text-[10px] text-[#7b8881] sm:text-xs">{dateOnly(selected.created_at)}{createdTime ? " · " + createdTime : ""} · {selected.origem || "site"}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                <select aria-label="Alterar status do pedido" value={selected.status || "pendente"} disabled={busyId === selected.id}
                  onChange={e => void changeStatus(selected, e.target.value)}
                  className="max-w-[126px] rounded-xl border-0 bg-[#e8f5ea] px-2 py-2 text-[11px] font-bold capitalize text-[#175934] outline-offset-2 disabled:opacity-50 sm:max-w-none sm:px-4 sm:text-sm">
                  {["rascunho", "pendente", "preparando", "pronto para retirada", "saiu para entrega", "entregue", "cancelado"].map(status => <option key={status} value={status} disabled={status === "rascunho"}>{status}</option>)}
                </select>
                <button onClick={() => setSelected(null)} aria-label="Fechar detalhes" className="rounded-xl p-2 text-[#365445] hover:bg-gray-100"><X size={19}/></button>
              </div>
            </header>
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-2.5 py-3 [scrollbar-width:thin] sm:space-y-3 sm:px-5">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <section className="min-w-0 rounded-2xl border border-[#e1e9e2] bg-white p-2.5 sm:p-4">
                  <div className="flex items-start gap-2">
                    <span className="hidden shrink-0 rounded-xl bg-[#eff4f1] p-2 text-[#21573b] min-[385px]:flex"><Phone size={16}/></span>
                    <div className="min-w-0">
                      <p className="break-words text-xs font-extrabold leading-snug text-[#172b21] sm:text-base">{selected.nome_cliente || "Cliente sem nome"}</p>
                      {selected.telefone_cliente && <p className="mt-1 break-all text-[11px] text-[#64766c] sm:text-sm">{selected.telefone_cliente}</p>}
                    </div>
                  </div>
                </section>
                <section className="min-w-0 rounded-2xl border border-[#e1e9e2] bg-white p-2.5 sm:p-4">
                  <div className="flex items-start gap-2">
                    <span className="hidden shrink-0 rounded-xl bg-[#fff0f0] p-2 text-[#9f303e] min-[385px]:flex"><MapPin size={16}/></span>
                    <div className="min-w-0">
                      <p className="break-words text-[11px] font-bold leading-snug text-[#172b21] sm:text-sm">
                        {[selected.endereco_rua, selected.endereco_numero].filter(Boolean).join(", ") || "Endereço não informado"}
                      </p>
                      <p className="mt-0.5 break-words text-[10px] leading-snug text-[#697a70] sm:text-xs">{[selected.endereco_bairro, selected.endereco_cidade].filter(Boolean).join(", ")}</p>
                      {(selected.endereco_referencia || selected.ponto_referencia) && <p className="mt-1 text-[10px] text-[#667a6e]">Ref.: {selected.endereco_referencia || selected.ponto_referencia}</p>}
                    </div>
                  </div>
                </section>
              </div>

              <section className="grid grid-cols-4 divide-x divide-[#d9e5da] rounded-2xl bg-[#f0f7f0] px-1.5 py-3 sm:px-3">
                {([
                  { label: "Entrega", text: dateOnly(deliveryDate(selected) || selected.created_at), Icon: CalendarDays },
                  { label: "Horário", text: deliveryTime(selected) || "Não informado", Icon: Clock3 },
                  { label: "Modalidade", text: selected.metodo_entrega === "retirada" ? "Retirada" : "Entrega", Icon: Truck },
                  { label: "Cidade", text: selected.endereco_cidade || "Não informada", Icon: MapPin },
                ]).map(({ label, text, Icon }) => <div key={label} className="flex min-w-0 flex-col gap-0.5 px-1.5 sm:flex-row sm:items-center sm:gap-2 sm:px-3">
                  <Icon size={16} className="hidden shrink-0 text-[#18583a] sm:block"/>
                  <div className="min-w-0"><p className="text-[9px] text-[#78887e] sm:text-xs">{label}</p><p className="break-words text-[10px] font-bold leading-tight text-[#193a29] sm:text-sm">{text}</p></div>
                </div>)}
              </section>

              <section className="rounded-2xl border border-[#e2ebe2] bg-white p-2 sm:p-3">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-extrabold text-[#1a3927] sm:text-sm"><PackageCheck size={17} className="text-[#195b3b]"/> Resumo das unidades</h3>
                <div className="grid grid-cols-7 gap-1 sm:gap-2 md:grid-cols-[repeat(6,minmax(0,1fr))_minmax(125px,1.45fr)]">
                  {Object.entries(counts).map(([label, amount]) => <div key={label} title={label} aria-label={label + ": " + amount + " unidades"}
                    className={"flex min-w-0 flex-col items-center justify-center rounded-lg px-0.5 py-2 text-center sm:rounded-xl sm:py-3 " + unitStyle[label]}>
                    <p className="w-full truncate text-[8px] font-bold leading-tight min-[420px]:text-[9px] sm:text-[11px]">
                      <span className="sm:hidden">{label === "Personalizados" ? "Pers." : label}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </p>
                    <p className="mt-0.5 text-base font-extrabold leading-none tabular-nums sm:text-xl">{amount}</p>
                    <p className="mt-0.5 hidden text-[10px] leading-none sm:block">unid.</p>
                  </div>)}
                  <div className="flex min-w-0 flex-col items-center justify-center rounded-lg bg-[#e0f0e2] px-0.5 py-2 text-center text-[#155436] sm:rounded-xl sm:py-3 md:ml-1 md:border-l md:border-[#c9ddcc]">
                    <p className="text-[8px] font-extrabold sm:text-[11px]"><span className="md:hidden">Total</span><span className="hidden md:inline">Total de itens</span></p>
                    <p className="mt-0.5 text-base font-black leading-none tabular-nums sm:text-xl">{totalUnits}</p>
                    <p className="mt-0.5 hidden text-[10px] leading-none sm:block">unidades</p>
                  </div>
                </div>
                {otherUnits > 0 && <p className="mt-1.5 text-[10px] text-[#7b6c51]">Outros tamanhos: {otherUnits} unidade(s), incluídas no total.</p>}
              </section>

              <section className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#1a3927]"><PackageCheck size={18} className="text-[#195b3b]"/> Itens do pedido</h3>
                  <span className="shrink-0 rounded-full bg-[#f1f4f2] px-2.5 py-1 text-[11px] font-semibold text-[#496357]">{totalUnits} unidades</span>
                </div>
                <div className="max-h-[290px] overflow-y-auto overscroll-contain rounded-2xl border border-[#e1eae1] [scrollbar-color:#8cab91_#edf3ec] [scrollbar-width:thin] sm:max-h-[360px]" tabIndex={0} aria-label="Lista de itens do pedido, rolável">
                  <div className="hidden grid-cols-[32px_52px_minmax(0,1fr)_65px_82px] items-center gap-2 bg-[#f7f9f7] px-3 py-2 text-[10px] font-bold text-[#6c7d71] sm:grid">
                    <span>QTD</span><span></span><span>PRODUTO</span><span>TAMANHO</span><span className="text-right">TOTAL</span>
                  </div>
                  {sortOrderItems(selected.itens || []).map((item: any, i: number) => <div key={item.id || i}
                    className="grid grid-cols-[auto_38px_minmax(0,1fr)_auto] items-center gap-1.5 border-b border-[#e8eee9] px-2 py-2 text-[11px] last:border-b-0 sm:grid-cols-[32px_52px_minmax(0,1fr)_65px_82px] sm:gap-2 sm:px-3 sm:py-2.5">
                    <span className="rounded-lg bg-[#e8f5e8] px-1.5 py-1.5 text-center text-xs font-extrabold text-[#155639]">{Number(item.quantidade || 0)}x</span>
                    <div className="flex h-10 w-[38px] items-center justify-center overflow-hidden rounded-lg bg-[#f0f6ef] sm:h-[46px] sm:w-[52px]">
                      {item.produtos?.imagem_url ? <img src={item.produtos.imagem_url} alt="" loading="lazy" className="h-full w-full object-contain"/> : <ShoppingBag size={18} className="text-[#9ab0a1]"/>}
                    </div>
                    <div className="min-w-0">
                      <p className="break-words font-semibold leading-snug text-[#19372a]">{itemName(item)}</p>
                      {(itemWeight(item) || itemNote(item)) && <p className="mt-0.5 text-[10px] leading-tight text-[#76887d] sm:hidden">{[itemWeight(item), itemNote(item)].filter(Boolean).join(" · ")}</p>}
                      {itemNote(item) && <p className="mt-0.5 hidden truncate text-[10px] text-[#76887d] sm:block">{itemNote(item)}</p>}
                    </div>
                    <span className="hidden justify-self-center rounded-lg bg-[#fff0f0] px-1.5 py-1 text-[11px] text-[#954646] sm:inline">{itemWeight(item) || "—"}</span>
                    <div className="min-w-0 text-right">
                      <strong className="whitespace-nowrap text-[11px] tabular-nums text-[#16392a] sm:text-sm">{money(Number(item.quantidade || 0) * Number(item.preco_unitario || 0))}</strong>
                      <p className="hidden text-[10px] text-[#809187] sm:block">{money(item.preco_unitario)} / un.</p>
                    </div>
                  </div>)}
                  {!(selected.itens || []).length && <p className="p-5 text-center text-sm text-gray-500">Nenhum item registrado.</p>}
                </div>
              </section>

              <div className="grid grid-cols-2 gap-2 xl:grid-cols-[1.25fr_1fr_.9fr]">
                <section className="min-w-0 rounded-2xl border border-[#e1eae1] p-2.5 sm:p-3">
                  <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold text-[#1a3927] sm:text-sm"><CreditCard size={16} className="shrink-0 text-[#195b3b]"/> Formas de pagamento</h3>
                  <div className="space-y-1.5">
                    {payments.map((payment, i) => <div key={i} className="flex flex-col gap-0.5 rounded-lg bg-[#f3f7f3] px-2 py-1.5 text-[10px] sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:text-xs">
                      <span className="min-w-0 break-words font-semibold">{payment.name}{payment.status ? <span className="ml-1 text-[#647e6d]">· {payment.status}</span> : null}</span><strong className="shrink-0 tabular-nums">{money(payment.amount)}</strong>
                    </div>)}
                    {!payments.length && <p className="text-xs text-[#728579]">Pagamento não informado.</p>}
                  </div>
                </section>
                <section className="min-w-0 rounded-2xl border border-[#e1eae1] p-2.5 sm:p-3">
                  <h3 className="mb-2 text-[11px] font-extrabold text-[#1a3927] sm:text-sm">Resumo financeiro</h3>
                  <div className="space-y-1 text-[10px] text-[#67786d] sm:text-xs">
                    <p className="flex justify-between gap-1"><span>Itens</span><span className="tabular-nums">{money(itemSubtotal)}</span></p>
                    <p className="flex justify-between gap-1"><span>Desconto</span><span className="tabular-nums">{money(discount)}</span></p>
                    <p className="flex justify-between gap-1"><span>Entrega</span><span className="tabular-nums">{money(deliveryFee)}</span></p>
                    {Math.abs(otherAdjustments) > 0.009 && <p className="flex justify-between gap-1"><span>Ajustes</span><span className="tabular-nums">{money(otherAdjustments)}</span></p>}
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-1 border-t border-[#e2ebe2] pt-2 text-[11px] font-extrabold text-[#165438] sm:text-sm"><span>Total</span><span className="text-sm tabular-nums sm:text-xl">{money(totalValue)}</span></div>
                </section>
                <section className="col-span-2 min-w-0 rounded-2xl border border-[#e1eae1] p-2.5 xl:col-span-1">
                  <h3 className="mb-2 text-[11px] font-extrabold text-[#1a3927] sm:text-sm">Observações</h3>
                  <p className="rounded-xl bg-[#fff7df] p-2 text-xs leading-relaxed text-[#7d6a39]">{selected.observacoes || selected.observacao || "Nenhuma observação registrada."}</p>
                </section>
              </div>
            </div>
            <footer className="flex shrink-0 items-center gap-1.5 border-t border-[#e5ede5] bg-white px-2.5 py-2.5 sm:gap-2 sm:px-5 sm:py-3">
              <button onClick={() => printOrder(selected)} className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[#cfdfd1] px-2 py-2 text-[10px] font-semibold text-[#245b38] hover:bg-[#f1f7f0] sm:px-4 sm:text-sm"><Printer size={16} className="shrink-0"/> Imprimir</button>
              <button onClick={() => { openOrderEditor(selected); setSelected(null); }} className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[#cfdfd1] px-2 py-2 text-[10px] font-semibold text-[#245b38] hover:bg-[#f1f7f0] sm:px-4 sm:text-sm"><Pencil size={15} className="shrink-0"/> Editar informações</button>
              {orderWhatsappUrl(selected) && <a href={orderWhatsappUrl(selected)!} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-[#175934] px-2 py-2 text-[10px] font-semibold text-white hover:bg-[#0f442a] sm:px-4 sm:text-sm"><MessageCircle size={16} className="shrink-0"/> WhatsApp</a>}
            </footer>
          </div>
        </div>, document.body);
      })()}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Search, Filter, Calendar, Package, Clock, 
  ChevronRight, MoreVertical, CheckCircle2, 
  Clock3, XCircle, AlertCircle, Eye, Printer,
  Smartphone, MapPin, User, Receipt, History, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { printReceipt } from "@/components/thermal-receipt";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminOrdersPage,
});

function OrderDetailsModal({ isOpen, onClose, order }: any) {
  if (!order) return null;

  const statusColors: any = {
    'pendente': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'preparando': 'bg-blue-100 text-blue-700 border-blue-200',
    'saiu para entrega': 'bg-purple-100 text-purple-700 border-purple-200',
    'entregue': 'bg-green-100 text-green-700 border-green-200',
    'cancelado': 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-xl">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between bg-gray-50">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-xl font-bold text-gray-800">Pedido #{order.id.slice(0, 8)}</DialogTitle>
            <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-700'}>
              {order.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                if (!order) return;
                printReceipt({
                  ...order,
                  itens: (order.itens ?? []).map((i: any) => ({
                    nome: i.produtos?.nome ?? "Produto",
                    quantidade: i.quantidade,
                    preco_unitario: i.preco_unitario,
                    observacao: i.observacao,
                  })),
                });
              }}
            >
              <Printer size={14} /> Imprimir
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 max-h-[70vh] overflow-y-auto">
          <div className="md:col-span-2 space-y-8">
            {/* Itens do Pedido */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <Package size={16} /> Itens do Pedido
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-semibold text-gray-600">Produto</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-center">Qtd</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-right">Preço</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {order.itens?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{item.produtos?.nome}</div>
                          {item.observacao && (
                            <div className="text-xs text-red-500 mt-1 italic">Obs: {item.observacao}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">{item.quantidade}x</td>
                        <td className="px-4 py-4 text-right">R$ {item.preco_unitario.toFixed(2).replace('.', ',')}</td>
                        <td className="px-4 py-4 text-right font-medium">R$ {(item.quantidade * item.preco_unitario).toFixed(2).replace('.', ',')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50/50 font-semibold">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-gray-500">Subtotal:</td>
                      <td className="px-4 py-3 text-right">R$ {order.valor_total.toFixed(2).replace('.', ',')}</td>
                    </tr>
                    {order.desconto_aplicado > 0 && (
                      <tr className="text-red-500">
                        <td colSpan={3} className="px-4 py-3 text-right">Desconto:</td>
                        <td className="px-4 py-3 text-right">- R$ {order.desconto_aplicado.toFixed(2).replace('.', ',')}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-gray-500">Taxa de Entrega:</td>
                      <td className="px-4 py-3 text-right">R$ {order.taxa_entrega?.toFixed(2).replace('.', ',') || "0,00"}</td>
                    </tr>
                    <tr className="text-lg text-[#5850ec]">
                      <td colSpan={3} className="px-4 py-3 text-right">Total:</td>
                      <td className="px-4 py-3 text-right font-bold">R$ {(order.valor_total - (order.desconto_aplicado || 0) + (order.taxa_entrega || 0)).toFixed(2).replace('.', ',')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* Pagamento */}
            <section className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-2">
                <Receipt size={16} /> Pagamento
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Método</p>
                  <p className="font-semibold text-gray-800">{order.metodo_pagamento || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status do Pagamento</p>
                  <p className="font-semibold text-green-600 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Confirmado
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {/* Cliente */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <User size={16} /> Cliente
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User className="text-gray-400" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{order.nome_cliente || "Cliente Final"}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Smartphone size={12} /> {order.telefone_cliente || "(00) 00000-0000"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Entrega */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <MapPin size={16} /> Endereço de Entrega
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg text-sm border">
                <p className="font-bold mb-1">{order.endereco_rua || "Endereço não informado"}, {order.endereco_numero}</p>
                <p className="text-gray-600">{order.endereco_bairro} - {order.endereco_cidade || "Cidade"}</p>
                {order.endereco_referencia && (
                  <p className="mt-2 text-xs text-gray-500 italic">Ref: {order.endereco_referencia}</p>
                )}
              </div>
            </section>

            {/* Data/Hora */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <Clock size={16} /> Horários
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Realizado:</span>
                  <span className="font-medium">{format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
                {order.updated_at !== order.created_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Última atualização:</span>
                    <span className="font-medium">{format(new Date(order.updated_at), "HH:mm")}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Histórico */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <History size={16} /> Histórico de Status
              </h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-gray-100">
                {order.historico?.length > 0 ? (
                  order.historico.map((h: any, idx: number) => (
                    <div key={h.id} className="relative pl-6">
                      <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-white bg-primary shadow-sm"></div>
                      <p className="text-xs font-bold text-gray-800">{h.status_novo}</p>
                      <p className="text-[10px] text-gray-500">{format(new Date(h.created_at), "dd/MM HH:mm", { locale: ptBR })}</p>
                    </div>
                  ))
                ) : (
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-white bg-gray-300 shadow-sm"></div>
                    <p className="text-xs font-bold text-gray-800">{order.status}</p>
                    <p className="text-[10px] text-gray-500">Status Inicial</p>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterDate, setFilterDate] = useState<"hoje" | "semana" | "mes" | "todos">("todos");
  const [autoPrint, setAutoPrint] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("admin.autoPrint") === "true";
  });
  const knownIdsRef = useRef<Set<string>>(new Set());

  // ── Pede permissão de notificação ao montar ───────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Impressão automática via Realtime ─────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("pedidos-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos" },
        async (payload) => {
          const newOrder = payload.new as any;

          // Atualiza a lista
          queryClient.invalidateQueries({ queryKey: ["admin-orders"] });

          // ── Beep sonoro ───────────────────────────────────────────────────
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const play = (freq: number, delay: number) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = freq;
              gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
              osc.start(ctx.currentTime + delay);
              osc.stop(ctx.currentTime + delay + 0.25);
            };
            play(880, 0);
            play(1100, 0.28);
            play(1320, 0.56);
          } catch {}

          // ── Notificação do sistema (funciona com aba minimizada) ──────────
          if ("Notification" in window && Notification.permission === "granted") {
            const n = new Notification("🛒 Novo pedido!", {
              body: `${newOrder.nome_cliente ?? "Cliente"} — R$ ${Number(newOrder.valor_total ?? 0).toFixed(2)}`,
              icon: "/favicon.png",
              tag: `pedido-${newOrder.id}`,
              requireInteraction: true, // não fecha sozinha até clicar
            });
            n.onclick = () => {
              window.focus();
              setSelectedOrder(newOrder);
              setIsDetailsModalOpen(true);
              n.close();
            };
          }

          // ── Toast na interface ────────────────────────────────────────────
          toast.info(`🛒 Novo pedido de ${newOrder.nome_cliente ?? "cliente"}!`, {
            duration: 10000,
            action: {
              label: "Ver",
              onClick: () => {
                setSelectedOrder(newOrder);
                setIsDetailsModalOpen(true);
              },
            },
          });

          // ── Impressão automática ──────────────────────────────────────────
          if (autoPrint) {
            try {
              const { data: itens } = await supabase
                .from("pedido_itens")
                .select("*, produtos(nome)")
                .eq("pedido_id", newOrder.id);

              printReceipt({
                ...newOrder,
                itens: (itens ?? []).map((i: any) => ({
                  nome: i.produtos?.nome ?? "Produto",
                  quantidade: i.quantidade,
                  preco_unitario: i.preco_unitario,
                  observacao: i.observacao,
                })),
              });
            } catch (e) {
              console.error("Erro ao imprimir automaticamente:", e);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoPrint, queryClient]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          *,
          itens:pedido_itens(
            *,
            produtos(nome)
          ),
          historico:pedido_status_historico(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from("pedidos")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Status do pedido atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  });

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((order: any) => {
      // filtro de texto
      const matchText =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase()));

      // filtro de status
      const matchStatus = filterStatus === "Todos" || order.status === filterStatus;

      // filtro de data
      const oDate = new Date(order.created_at);
      let matchDate = true;
      if (filterDate === "hoje") {
        matchDate = oDate.toDateString() === now.toDateString();
      } else if (filterDate === "semana") {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        matchDate = oDate >= weekAgo;
      } else if (filterDate === "mes") {
        matchDate = oDate.getMonth() === now.getMonth() && oDate.getFullYear() === now.getFullYear();
      }

      return matchText && matchStatus && matchDate;
    });
  }, [orders, searchTerm, filterStatus, filterDate]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((o: any) => o.created_at.startsWith(today));
    
    return {
      totalToday: todayOrders.length,
      revenueToday: todayOrders.reduce((acc: number, o: any) => acc + (o.valor_total || 0), 0),
      pendingCount: orders.filter((o: any) => o.status === 'pendente').length
    };
  }, [orders]);

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const statusOptions = [
    { label: 'pendente', icon: Clock3, color: 'text-yellow-500' },
    { label: 'preparando', icon: Package, color: 'text-blue-500' },
    { label: 'saiu para entrega', icon: MapPin, color: 'text-purple-500' },
    { label: 'entregue', icon: CheckCircle2, color: 'text-green-500' },
    { label: 'cancelado', icon: XCircle, color: 'text-red-500' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Gestão de Pedidos</h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe e gerencie as entregas em tempo real.</p>
        </div>
        
        <div className="flex gap-3 items-center flex-wrap">
           <div className="bg-white px-6 py-3 rounded-xl border flex flex-col items-center">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hoje</span>
             <span className="text-xl font-black text-[#5850ec]">{stats.totalToday}</span>
           </div>
           <div className="bg-white px-6 py-3 rounded-xl border flex flex-col items-center">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pendentes</span>
             <span className="text-xl font-black text-yellow-500">{stats.pendingCount}</span>
           </div>
           {/* Toggle de impressão automática */}
           <button
             onClick={() => {
               const next = !autoPrint;
               setAutoPrint(next);
               localStorage.setItem("admin.autoPrint", String(next));
               toast.success(next ? "Impressão automática ativada!" : "Impressão automática desativada.");
             }}
             title="Impressão automática ao receber novo pedido"
             className={cn(
               "flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all",
               autoPrint
                 ? "bg-green-500 text-white border-green-500"
                 : "bg-white text-gray-500 border-gray-200 hover:border-green-300"
             )}
           >
             <Printer size={16} />
             {autoPrint ? "Auto-imprimir ON" : "Auto-imprimir OFF"}
           </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Buscar por ID ou nome do cliente..." 
              className="pl-10 rounded-lg border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* filtro de data */}
            {(["todos", "hoje", "semana", "mes"] as const).map(d => (
              <button
                key={d}
                onClick={() => setFilterDate(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filterDate === d ? "bg-[#5850ec] text-white border-[#5850ec]" : "border-gray-200 text-gray-500 hover:border-[#5850ec]"}`}
              >
                {d === "todos" ? "Todos" : d === "hoje" ? "Hoje" : d === "semana" ? "7 dias" : "Este mês"}
              </button>
            ))}
            {/* filtro de status */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 bg-white"
            >
              {["Todos", "pendente", "preparando", "saiu para entrega", "entregue", "cancelado"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <span className="text-muted-foreground font-medium">Carregando pedidos...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-20 text-center">
          <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-muted-foreground font-medium">Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">ID / Hora</th>
                  <th className="px-6 py-4">Cliente / Local</th>
                  <th className="px-6 py-4">Itens</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order: any) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#5850ec]">#{order.id.slice(0, 8)}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock size={10} /> {format(new Date(order.created_at), "HH:mm")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{order.nome_cliente || "Cliente Final"}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin size={10} /> {order.endereco_bairro || "Retirada"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex -space-x-2 overflow-hidden">
                        {order.itens?.slice(0, 3).map((item: any, idx: number) => (
                           <div 
                             key={item.id} 
                             className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold"
                             title={item.produtos?.nome}
                           >
                             {item.quantidade}
                           </div>
                        ))}
                        {order.itens?.length > 3 && (
                          <div className="h-7 w-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] font-black">
                            +{order.itens.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-gray-900">R$ {order.valor_total.toFixed(2).replace('.', ',')}</span>
                    </td>
                    <td className="px-6 py-5">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <button className={cn(
                             "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border",
                             order.status === 'Pendente' ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                             order.status === 'Em preparo' ? "bg-blue-50 text-blue-600 border-blue-200" :
                             order.status === 'Saiu para entrega' ? "bg-purple-50 text-purple-600 border-purple-200" :
                             order.status === 'Entregue' ? "bg-green-50 text-green-600 border-green-200" :
                             "bg-red-50 text-red-600 border-red-200"
                           )}>
                             {order.status}
                             <ChevronRight size={12} className="rotate-90" />
                           </button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="start" className="w-56 p-1">
                           {statusOptions.map((opt) => (
                             <DropdownMenuItem 
                               key={opt.label}
                               onClick={() => updateOrderStatus.mutate({ id: order.id, status: opt.label })}
                               className="flex items-center gap-3 py-2 px-3 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                             >
                               <opt.icon size={16} className={opt.color} />
                               {opt.label}
                             </DropdownMenuItem>
                           ))}
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="flex items-center justify-center gap-2">
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-9 w-9 rounded-full bg-gray-100 hover:bg-[#5850ec] hover:text-white transition-all"
                           onClick={() => handleOrderClick(order)}
                         >
                           <Eye size={18} />
                         </Button>
                         <Button
                           variant="ghost"
                           size="icon"
                           title="Imprimir comanda"
                           className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-all"
                           onClick={() => printReceipt({
                             ...order,
                             itens: (order.itens ?? []).map((i: any) => ({
                               nome: i.produtos?.nome ?? "Produto",
                               quantidade: i.quantidade,
                               preco_unitario: i.preco_unitario,
                               observacao: i.observacao,
                             })),
                           })}
                         >
                           <Printer size={16} />
                         </Button>
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                               <MoreVertical size={18} />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem className="text-xs font-bold uppercase flex gap-2">
                               <Printer size={14} /> Imprimir Ticket
                             </DropdownMenuItem>
                             <DropdownMenuItem className="text-xs font-bold uppercase flex gap-2 text-red-600">
                               <XCircle size={14} /> Cancelar Pedido
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <OrderDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
  return <Clock className={cn("animate-spin", className)} size={size} />;
}

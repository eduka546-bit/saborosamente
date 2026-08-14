import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Package, Truck, CheckCircle2, Clock, XCircle, MapPin, Search, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/pedido/")({
  head: () => ({
    meta: [
      { title: "Rastrear Pedido | Saborosamente" },
      { name: "description", content: "Acompanhe o status do seu pedido em tempo real." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    p: typeof search.p === "string" ? search.p : undefined,
  }),
  component: RastrearPedidoPage,
});

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; step: number }> = {
  pendente:            { label: "Aguardando confirmação", icon: Clock,        color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", step: 1 },
  preparando:          { label: "Em preparação",          icon: Package,      color: "text-blue-600",   bg: "bg-blue-50 border-blue-200",     step: 2 },
  "saiu para entrega": { label: "Saiu para entrega",      icon: Truck,        color: "text-purple-600", bg: "bg-purple-50 border-purple-200", step: 3 },
  entregue:            { label: "Entregue",                icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50 border-green-200",   step: 4 },
  cancelado:           { label: "Cancelado",               icon: XCircle,      color: "text-red-600",    bg: "bg-red-50 border-red-200",       step: 0 },
};

const STEPS = [
  { step: 1, label: "Recebido",  icon: Clock },
  { step: 2, label: "Preparando", icon: Package },
  { step: 3, label: "A caminho", icon: Truck },
  { step: 4, label: "Entregue",  icon: CheckCircle2 },
];

function RastrearPedidoPage() {
  const search = Route.useSearch();
  const [protocolo, setProtocolo] = useState(search.p ?? "");
  const [busca, setBusca] = useState(search.p ?? "");

  // Se veio com ?p=PROTOCOLO, busca automaticamente
  
  const { data: pedido, isLoading, error } = useQuery({
    queryKey: ["rastrear", busca],
    enabled: busca.length >= 6,
    queryFn: async () => {
      // Busca por ID parcial (últimos 8 chars) ou protocolo completo
      const termo = busca.trim().toUpperCase().replace("#", "");
      const { data, error } = await supabase
        .from("pedidos")
        .select("id, nome_cliente, status, created_at, metodo_entrega, endereco_bairro, endereco_cidade, metodo_pagamento, valor_total, taxa_entrega, desconto_aplicado, itens:pedido_itens(quantidade, preco_unitario, produto_id, produtos:produto_id(nome))")
        .ilike("id", `%${termo}`)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  const config = pedido ? STATUS_CONFIG[pedido.status] ?? STATUS_CONFIG["pendente"] : null;
  const currentStep = config?.step ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Package size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Rastrear Pedido</h1>
          <p className="text-gray-500 text-sm mt-1">Digite o protocolo do seu pedido</p>
        </div>

        {/* Input de busca */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={protocolo}
                onChange={e => setProtocolo(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && setBusca(protocolo)}
                placeholder="Ex: B42018AD"
                className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 font-mono tracking-wider"
                maxLength={8}
              />
            </div>
            <button
              onClick={() => setBusca(protocolo)}
              disabled={protocolo.length < 6}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-all"
            >
              Buscar
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 ml-1">
            O protocolo está no e-mail de confirmação ou na mensagem do WhatsApp
          </p>
        </div>

        {/* Resultado */}
        {isLoading && (
          <div className="bg-white rounded-2xl border p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
          </div>
        )}

        {!isLoading && busca && !pedido && (
          <div className="bg-white rounded-2xl border p-8 text-center">
            <XCircle size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Pedido não encontrado</p>
            <p className="text-xs text-gray-400 mt-1">Verifique o protocolo e tente novamente</p>
          </div>
        )}

        {pedido && config && (
          <div className="space-y-4">
            {/* Status card */}
            <div className={`rounded-2xl border p-6 ${config.bg}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${config.bg} border ${config.color}`}>
                  <config.icon size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pedido #{pedido.id.slice(-8).toUpperCase()}</p>
                  <p className={`text-lg font-black ${config.color}`}>{config.label}</p>
                </div>
              </div>

              {/* Linha de progresso */}
              {pedido.status !== "cancelado" && (
                <div className="flex items-center gap-2 mt-2">
                  {STEPS.map((s, i) => {
                    const done = currentStep >= s.step;
                    const active = currentStep === s.step;
                    return (
                      <div key={s.step} className="flex items-center gap-2 flex-1">
                        <div className={`flex flex-col items-center gap-1 flex-1`}>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            done ? "bg-primary border-primary text-white" : "bg-white border-gray-200 text-gray-300"
                          }`}>
                            <s.icon size={14} />
                          </div>
                          <span className={`text-[10px] font-bold text-center ${done ? "text-primary" : "text-gray-300"}`}>{s.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`h-0.5 flex-1 mb-4 rounded-full ${currentStep > s.step ? "bg-primary" : "bg-gray-200"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detalhes */}
            <div className="bg-white rounded-2xl border p-5 space-y-4">
              <h3 className="font-bold text-gray-800">Detalhes do Pedido</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Cliente</p>
                  <p className="font-medium text-gray-900">{pedido.nome_cliente}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Data</p>
                  <p className="font-medium text-gray-900">{format(new Date(pedido.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Entrega</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    {pedido.metodo_entrega === "entrega"
                      ? <><MapPin size={12} /> {pedido.endereco_bairro}, {pedido.endereco_cidade}</>
                      : "🏪 Retirada na loja"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Pagamento</p>
                  <p className="font-medium text-gray-900">{pedido.metodo_pagamento}</p>
                </div>
              </div>

              {/* Itens */}
              <div className="border-t pt-4 space-y-2">
                {(pedido.itens ?? []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.quantidade}x {item.produtos?.nome ?? "Produto"}</span>
                    <span className="font-medium text-gray-900">R$ {(item.preco_unitario * item.quantidade).toFixed(2).replace(".", ",")}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold text-sm">
                  <span>Total</span>
                  <span className="text-primary">R$ {((pedido.valor_total ?? 0) - (pedido.desconto_aplicado ?? 0) + (pedido.taxa_entrega ?? 0)).toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Dúvidas? Fale conosco pelo WhatsApp 😊
        </p>
      </div>
    </div>
  );
}

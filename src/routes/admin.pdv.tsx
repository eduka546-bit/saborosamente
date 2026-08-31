/**
 * PDV — Ponto de Venda (loja física)
 *
 * Tela fullscreen para atendimento de balcão:
 * - Busca produto por EAN (leitor de barras) ou nome
 * - Escolhe tamanho (P/M/G)
 * - Aplica desconto progressivo (mesma tabela do site)
 * - Formas de pagamento do site
 * - Finaliza como pedido (origem="pdv", status="entregue")
 * - Decrementa estoque
 * - Imprime cupom na POS58
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Minus, Trash2, Printer, ShoppingBag, X, Barcode } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/products";
import { toast } from "sonner";
import { imprimirTCP, imprimirComanda } from "@/lib/qz-print";
import { printReceipt } from "@/components/thermal-receipt";
import { precoMarmitaPorFaixa, precoCheioMarmita } from "@/lib/combo-rules";
import { usePrecosMarmita } from "@/lib/use-precos-marmita";
import {
  enabledOrDefault,
  defaultPaymentMethods,
  defaultMealFlags,
} from "@/lib/payment-options";

export const Route = createFileRoute("/admin/pdv")({
  component: AdminPDV,
  ssr: false,
});

interface PdvItem {
  productId: string;
  nome: string;
  weight: string; // "200g" | "300g" | "400g"
  quantity: number;
  precoUnitario: number; // preço efetivo (com desconto de faixa)
  precoCheio: number; // preço sem desconto
  categoria: string;
  tipoProduto: string; // marmita | sopa | complemento | combo | bebida
}

function AdminPDV() {
  const tabelaPrecos = usePrecosMarmita();
  const [items, setItems] = useState<PdvItem[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [selectedCardType, setSelectedCardType] = useState(""); // Débito | Crédito
  const [selectedFlag, setSelectedFlag] = useState(""); // bandeira do cartão / vale
  const [troco, setTroco] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState<any>(null);
  const [descontoManual, setDescontoManual] = useState(0);
  const [acrescimoManual, setAcrescimoManual] = useState(0);
  // Origem da venda: "pdv" (Loja), "site" ou "pedidos10" (P10).
  // Permite lançar manualmente pedidos de outros canais e classificá-los certo.
  const [origemVenda, setOrigemVenda] = useState<"pdv" | "site" | "pedidos10">("pdv");
  // Tamanho fixo: quando setado, marmitas entram direto nesse tamanho sem abrir picker.
  // null = pede sempre (comportamento original). Sopas/complementos/bebidas ignoram isso.
  const [tamanhoFixo, setTamanhoFixo] = useState<"200g" | "300g" | "400g" | null>(null);
  // Faixa de preço forçada (clientes recorrentes com preço de combo garantido).
  // null = automática pela quantidade. Caso contrário, aplica a faixa escolhida
  // independente da quantidade (a quantidade representativa define a faixa).
  const [faixaForcada, setFaixaForcada] = useState<null | 5 | 10 | 20>(null);
  const [imprimirCupom, setImprimirCupom] = useState(true); // product waiting for weight
  // Identificação do cliente (opcional)
  const [clienteBusca, setClienteBusca] = useState("");
  const [cliente, setCliente] = useState<any>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  // Cadastro rápido — aberto quando o cliente não é encontrado.
  const [cadastroRapido, setCadastroRapido] = useState<{ telefone: string } | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Foco automático no campo de busca
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Refoca após fechar weight picker
  useEffect(() => {
    if (!showWeightPicker) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [showWeightPicker]);

  // Produtos do catálogo
  const { data: products = [] } = useQuery({
    queryKey: ["pdv-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select(
          "id, nome, preco, preco_300g, preco_400g, codigo_integracao, categoria_id, tipo_produto, estoque_200g, estoque_300g, estoque_400g, controle_estoque, categorias(nome)",
        )
        .eq("ativo", true)
        .order("nome");
      return data ?? [];
    },
    staleTime: 1000 * 60 * 2, // Cache 2 min — atualiza rápido após edição de EAN
  });

  // Config de impressão
  const { data: configImpressao } = useQuery({
    queryKey: ["pdv-config-impressao"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("config_impressao, payment_methods, card_flags, meal_flags")
        .maybeSingle();
      return data;
    },
  });

  const paymentMethods = enabledOrDefault(
    (configImpressao as any)?.payment_methods,
    defaultPaymentMethods,
  );
  const mealFlags = enabledOrDefault((configImpressao as any)?.meal_flags, defaultMealFlags);

  // Quantidade total (pra desconto progressivo)
  const totalQty = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  // Quantidade que define a faixa de preço: a forçada (se houver) manda sempre;
  // senão usa a quantidade real do carrinho.
  const qtyParaFaixa = faixaForcada ?? totalQty;

  // Recalcula preços quando quantidade (ou faixa forçada) muda.
  const recalculatedItems = useMemo(() => {
    return items.map((item) => {
      // Só marmita recalcula por faixa. Bebida/complemento/sopa/combo mantêm o
      // preço fixo próprio definido ao adicionar.
      if ((item.tipoProduto ?? "marmita") !== "marmita") return item;
      const cheio = precoCheioMarmita(item.weight, tabelaPrecos) || item.precoCheio;
      const efetivo = precoMarmitaPorFaixa(item.weight, qtyParaFaixa, cheio, tabelaPrecos);
      return { ...item, precoUnitario: efetivo, precoCheio: cheio };
    });
  }, [items, qtyParaFaixa, tabelaPrecos]);

  const subtotal = useMemo(
    () => recalculatedItems.reduce((s, i) => s + i.precoCheio * i.quantity, 0),
    [recalculatedItems],
  );
  const totalEfetivo = useMemo(
    () => recalculatedItems.reduce((s, i) => s + i.precoUnitario * i.quantity, 0),
    [recalculatedItems],
  );
  const desconto = Math.max(0, subtotal - totalEfetivo);
  const totalFinal = Math.max(0, totalEfetivo - descontoManual + acrescimoManual);

  // Busca produto por EAN ou nome
  const searchResults = useMemo(() => {
    if (!searchValue.trim()) return [];
    const term = searchValue.trim().replace(/\s+/g, "");
    // Se é numérico (4+ dígitos), busca por EAN
    const isEan = /^\d{4,}$/.test(term);
    if (isEan) {
      const byEan = products.filter((p: any) => {
        const ean = (p.codigo_integracao ?? "").replace(/\s+/g, "").trim();
        if (!ean) return false;
        // Compara com e sem zeros à esquerda
        const termClean = term.replace(/^0+/, "") || term;
        const eanClean = ean.replace(/^0+/, "") || ean;
        return ean === term || eanClean === termClean || ean.includes(term) || term.includes(ean);
      });
      if (byEan.length > 0) return byEan.slice(0, 10);
    }
    // Busca por nome
    const termLower = term.toLowerCase();
    return products.filter((p: any) => p.nome?.toLowerCase().includes(termLower)).slice(0, 10);
  }, [searchValue, products]);

  // Ao submeter a busca (Enter no leitor) → se resultado único, adiciona direto
  const handleSearchSubmit = useCallback(() => {
    if (searchResults.length === 1) {
      handleSelectProduct(searchResults[0]);
      setSearchValue("");
    } else if (searchResults.length === 0 && searchValue.trim()) {
      toast.error(`Produto não encontrado: "${searchValue.trim()}"`);
      setSearchValue("");
    }
  }, [searchResults, searchValue]);

  function handleSelectProduct(product: any) {
    const tipo = product.tipo_produto ?? "marmita";

    // Sopas, complementos e bebidas têm tamanho único — entram direto sem picker.
    if (tipo === "sopa") { addItem(product, "400g"); setSearchValue(""); return; }
    if (tipo === "complemento" || tipo === "bebida") { addItem(product, "200g"); setSearchValue(""); return; }

    const hasSizes = product.preco_300g || product.preco_400g;

    // Se há um tamanho fixo selecionado, usa direto — sem abrir picker.
    if (tamanhoFixo) {
      addItem(product, tamanhoFixo);
      setSearchValue("");
      return;
    }

    if (hasSizes) {
      setShowWeightPicker(product);
    } else {
      addItem(product, "300g"); // default 300g se não tem tamanhos
    }
    setSearchValue("");
  }

  function addItem(product: any, weight: string) {
    // Alerta de estoque zero
    const estoqueCol =
      weight === "200g" ? "estoque_200g" : weight === "400g" ? "estoque_400g" : "estoque_300g";
    const estoque = (product as any)[estoqueCol] ?? 0;
    if (product.controle_estoque && estoque <= 0) {
      toast.error(`${product.nome} (${weight}) está sem estoque!`, { duration: 4000 });
    }

    const cat = (product.categorias?.nome || "").toLowerCase();
    const tipo = product.tipo_produto ?? "marmita";
    // Só marmita tem preço por tamanho (200/300/400). Bebida, complemento, sopa
    // e combo têm preço fixo próprio (product.preco) e não entram em faixa.
    const semDesconto = tipo !== "marmita";
    const preco = semDesconto
      ? product.preco
      : weight === "200g"
        ? product.preco
        : weight === "400g" && product.preco_400g
          ? product.preco_400g
          : product.preco_300g || product.preco;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id && i.weight === weight);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.weight === weight
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          nome: product.nome,
          weight,
          quantity: 1,
          precoUnitario: preco,
          precoCheio: preco,
          categoria: cat,
          tipoProduto: tipo,
        },
      ];
    });
    setShowWeightPicker(null);
  }

  function changeQty(productId: string, weight: string, delta: number) {
    setItems((prev) => {
      const item = prev.find((i) => i.productId === productId && i.weight === weight);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0)
        return prev.filter((i) => !(i.productId === productId && i.weight === weight));
      return prev.map((i) =>
        i.productId === productId && i.weight === weight ? { ...i, quantity: newQty } : i,
      );
    });
  }

  function removeItem(productId: string, weight: string) {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.weight === weight)));
  }

  async function finalizarVenda() {
    if (recalculatedItems.length === 0) {
      toast.error("Adicione pelo menos um item.");
      return;
    }
    if (!selectedPayment) {
      toast.error("Selecione a forma de pagamento.");
      return;
    }
    // Cartão exige apenas o tipo (débito/crédito) — sem bandeira.
    if (selectedPayment === "Cartão" && !selectedCardType) {
      toast.error("Selecione o tipo de cartão (débito ou crédito).");
      return;
    }
    // Alimentação exige a bandeira do vale.
    if (selectedPayment === "Alimentação" && !selectedFlag) {
      toast.error("Selecione a bandeira do vale-alimentação.");
      return;
    }

    // Monta a descrição final do pagamento com o submenu escolhido.
    let metodoPagamentoFinal = selectedPayment;
    if (selectedPayment === "Cartão") {
      metodoPagamentoFinal = `Cartão ${selectedCardType}`;
    } else if (selectedPayment === "Alimentação") {
      metodoPagamentoFinal = `Alimentação - ${selectedFlag}`;
    }

    setIsProcessing(true);
    try {
      // 1. Criar pedido
      const { data: order, error: orderError } = await supabase
        .from("pedidos")
        .insert({
          user_id: cliente?.id ?? null,
          nome_cliente: cliente?.nome ?? "Balcão",
          telefone_cliente: cliente?.telefone ?? null,
          metodo_entrega: "retirada",
          metodo_pagamento: metodoPagamentoFinal,
          valor_total: totalFinal,
          taxa_entrega: 0,
          desconto_aplicado: desconto + descontoManual,
          troco: troco || null,
          status: "entregue",
          origem: origemVenda,
          observacao:
            [
              acrescimoManual > 0 ? `Acréscimo: +R$ ${acrescimoManual.toFixed(2)}` : null,
              descontoManual > 0 ? `Desconto manual: -R$ ${descontoManual.toFixed(2)}` : null,
            ]
              .filter(Boolean)
              .join(" | ") || null,
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      // 2. Inserir itens
      const itensInsert = recalculatedItems.map((item) => ({
        pedido_id: order.id,
        produto_id: item.productId,
        quantidade: item.quantity,
        preco_unitario: item.precoUnitario,
        observacao: `Peso: ${item.weight}`,
      }));

      const { error: itensError } = await supabase.from("pedido_itens").insert(itensInsert);
      if (itensError) throw new Error(itensError.message);

      // 3. Decrementar estoque (por tamanho)
      for (const item of recalculatedItems) {
        await supabase.rpc("decrementar_estoque", {
          p_produto_id: item.productId,
          p_qtd: item.quantity,
          p_tamanho: item.weight,
        });
      }

      // 4. Imprimir cupom (se marcado)
      if (imprimirCupom) {
        const orderParaImprimir = {
          id: order.id,
          nome_cliente: cliente?.nome ?? "Balcão",
          telefone_cliente: cliente?.telefone,
          created_at: order.created_at,
          status: "entregue",
          metodo_entrega: "retirada",
          metodo_pagamento: metodoPagamentoFinal,
          valor_total: totalFinal,
          taxa_entrega: 0,
          desconto_aplicado: desconto + descontoManual,
          troco: troco || undefined,
          itens: recalculatedItems.map((item) => ({
            nome: `${item.nome} (${item.weight})`,
            quantidade: item.quantity,
            preco_unitario: item.precoUnitario,
            observacao: null,
          })),
        };

        const cfg = (configImpressao as any)?.config_impressao;
        const ip = cfg?.impressora_ip;
        const porta = Number(cfg?.impressora_porta ?? 9100);
        const copias = Number(cfg?.copias ?? 1);
        const papel = cfg?.tamanho_papel ?? "58mm";

        if (ip) {
          const ok = await imprimirTCP(orderParaImprimir, ip, porta, copias, papel);
          if (!ok) printReceipt(orderParaImprimir);
        } else {
          printReceipt(orderParaImprimir);
        }
      }

      toast.success("Venda finalizada!", {
        description: `#${order.id.slice(0, 8).toUpperCase()} — ${formatBRL(totalFinal)}`,
      });

      // Reset
      setItems([]);
      setSelectedPayment("");
      setSelectedCardType("");
      setSelectedFlag("");
      setTroco("");
      setDescontoManual(0);
      setAcrescimoManual(0);
      setOrigemVenda("pdv");
      setFaixaForcada(null);
      setTamanhoFixo(null);
      setCliente(null);
      setClienteBusca("");
      setCadastroRapido(null);
      setNovoNome("");
      searchRef.current?.focus();
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-[#086e45] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 text-white">
          <ShoppingBag size={22} />
          <h1 className="text-lg font-black">PDV Saborosamente</h1>
        </div>
        <div className="flex items-center gap-3 text-white/80 text-sm">
          <span>
            {totalQty} {totalQty === 1 ? "item" : "itens"}
          </span>
          <a href="/admin" className="text-white/60 hover:text-white text-xs underline">
            Voltar
          </a>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Coluna esquerda — busca + lista de itens */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Busca */}
          <div className="p-4 border-b bg-white shrink-0">
            {/* Seletor de tamanho fixo — evita picker a cada bipagemitem */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase text-gray-400 shrink-0">
                Tamanho fixo:
              </span>
              {([null, "200g", "300g", "400g"] as const).map((t) => (
                <button
                  key={String(t)}
                  type="button"
                  onClick={() => {
                    setTamanhoFixo(t);
                    searchRef.current?.focus();
                  }}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold border transition-all",
                    tamanhoFixo === t
                      ? "bg-[#086e45] text-white border-[#086e45]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#086e45]/40",
                  )}
                >
                  {t === null ? "Auto" : t}
                </button>
              ))}
              {tamanhoFixo && (
                <span className="text-[10px] text-[#086e45] font-semibold ml-1">
                  Marmitas entram direto em {tamanhoFixo}
                </span>
              )}
            </div>
            <div className="relative">
              <Barcode
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref={searchRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder="Bipe o código de barras ou digite o nome..."
                className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-[#086e45] outline-none text-base font-medium"
                autoComplete="off"
              />
            </div>

            {/* Resultados da busca */}
            {searchResults.length > 0 && searchValue && (
              <div className="mt-2 rounded-xl border bg-white shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.nome}</p>
                      <p className="text-[10px] text-gray-400">
                        {p.codigo_integracao ? `EAN: ${p.codigo_integracao}` : ""}{" "}
                        {p.categorias?.nome}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#086e45]">
                      {formatBRL(p.preco_300g || p.preco)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista de itens adicionados */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {recalculatedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <Barcode size={64} className="mb-4" />
                <p className="text-lg font-bold">Bipe um produto para começar</p>
                <p className="text-sm mt-1">
                  O leitor de código de barras funciona automaticamente
                </p>
              </div>
            ) : (
              recalculatedItems.map((item) => (
                <div
                  key={`${item.productId}|${item.weight}`}
                  className="flex items-center gap-3 bg-white rounded-xl p-3 border shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.nome}</p>
                    <p className="text-[11px] text-gray-400">{item.weight}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => changeQty(item.productId, item.weight, -1)}
                      className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                    <button
                      onClick={() => changeQty(item.productId, item.weight, 1)}
                      className="h-8 w-8 rounded-full bg-[#086e45] text-white flex items-center justify-center hover:bg-[#065a38]"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-right w-20 shrink-0">
                    {item.precoUnitario < item.precoCheio && (
                      <p className="text-[9px] text-gray-400 line-through">
                        {formatBRL(item.precoCheio * item.quantity)}
                      </p>
                    )}
                    <p className="text-sm font-black text-[#086e45]">
                      {formatBRL(item.precoUnitario * item.quantity)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.weight)}
                    className="text-red-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coluna direita — totais + pagamento + finalizar */}
        <div className="w-80 bg-white border-l flex flex-col shrink-0">
          {/* Origem da venda (Loja / Site / P10) */}
          <div className="p-4 border-b">
            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">
              Origem da venda
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { v: "pdv", label: "Loja" },
                  { v: "site", label: "Site" },
                  { v: "pedidos10", label: "P10" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setOrigemVenda(opt.v)}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold border transition-all",
                    origemVenda === opt.v
                      ? "bg-[#086e45] text-white border-[#086e45]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#086e45]/40",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Faixa de preço (para clientes com preço de combo garantido) */}
          <div className="p-4 border-b">
            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">
              Faixa de preço
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { v: null, label: "Auto" },
                  { v: 5, label: "5+" },
                  { v: 10, label: "10+" },
                  { v: 20, label: "20+" },
                ] as const
              ).map((opt) => (
                <button
                  key={String(opt.v)}
                  type="button"
                  onClick={() => setFaixaForcada(opt.v)}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold border transition-all",
                    faixaForcada === opt.v
                      ? "bg-[#5850ec] text-white border-[#5850ec]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#5850ec]/40",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {faixaForcada !== null && (
              <p className="text-[10px] text-[#5850ec] font-semibold mt-1.5">
                Preço fixado na faixa {faixaForcada}+ (independente da quantidade)
              </p>
            )}
          </div>

          {/* Totais */}
          <div className="p-4 border-b space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal ({totalQty} itens)</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            {desconto > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-bold">
                <span>Desconto progressivo</span>
                <span>-{formatBRL(desconto)}</span>
              </div>
            )}

            {/* Desconto / acréscimo manual */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">
                  Desconto (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={descontoManual || ""}
                  onChange={(e) => setDescontoManual(Number(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full h-8 px-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">
                  Acréscimo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={acrescimoManual || ""}
                  onChange={(e) => setAcrescimoManual(Number(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full h-8 px-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
            </div>

            {descontoManual > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-bold">
                <span>Desconto manual</span>
                <span>-{formatBRL(descontoManual)}</span>
              </div>
            )}
            {acrescimoManual > 0 && (
              <div className="flex justify-between text-sm text-orange-600 font-bold">
                <span>Acréscimo</span>
                <span>+{formatBRL(acrescimoManual)}</span>
              </div>
            )}

            <div className="flex justify-between text-xl font-black pt-2 border-t">
              <span>TOTAL</span>
              <span className="text-[#086e45]">{formatBRL(totalFinal)}</span>
            </div>
          </div>

          {/* Pagamento */}
          <div className="p-4 border-b space-y-2 flex-1 overflow-y-auto">
            {/* Identificação do cliente (opcional) */}
            <div className="mb-3 pb-3 border-b">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Cliente (opcional)</p>
              {cliente ? (
                <div className="flex items-center justify-between bg-[#086e45]/5 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{cliente.nome}</p>
                    <p className="text-[10px] text-gray-500">{cliente.telefone}</p>
                  </div>
                  <button
                    onClick={() => setCliente(null)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clienteBusca}
                    onChange={(e) => setClienteBusca(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && clienteBusca.trim()) {
                        e.preventDefault();
                        setBuscandoCliente(true);
                        const termo = clienteBusca.trim().replace(/\D/g, "");
                        // Busca por telefone ou CPF
                        const { data } = await supabase
                          .from("profiles")
                          .select("id, nome, telefone, cpf")
                          .or(`telefone.ilike.%${termo}%,cpf.ilike.%${termo}%`)
                          .limit(1)
                          .maybeSingle();
                        if (data) {
                          setCliente(data);
                          setClienteBusca("");
                          toast.success(`Cliente: ${data.nome}`);
                        } else {
                          // Abre mini-formulário de cadastro rápido com o número já preenchido.
                          setCadastroRapido({ telefone: clienteBusca.trim() });
                          setNovoNome("");
                        }
                        setBuscandoCliente(false);
                      }
                    }}
                    placeholder="Telefone ou CPF"
                    className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm"
                    disabled={buscandoCliente}
                  />
                </div>
              )}

              {/* Mini-formulário de cadastro rápido */}
              {cadastroRapido && (
                <div className="mt-2 rounded-xl border border-[#086e45]/30 bg-[#086e45]/5 p-3 space-y-2">
                  <p className="text-[11px] font-bold text-[#086e45]">
                    Número não cadastrado. Quer salvar?
                  </p>
                  <input
                    autoFocus
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm"
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && novoNome.trim()) {
                        e.preventDefault();
                        const tel = cadastroRapido.telefone.replace(/\D/g, "");
                        const { data, error } = await supabase
                          .from("profiles")
                          .insert({ nome: novoNome.trim(), telefone: tel })
                          .select()
                          .single();
                        if (error) {
                          toast.error("Erro ao cadastrar: " + error.message);
                          return;
                        }
                        setCliente(data);
                        setClienteBusca("");
                        setCadastroRapido(null);
                        setNovoNome("");
                        toast.success(`Cliente ${data.nome} cadastrado!`);
                      }
                      if (e.key === "Escape") {
                        setCadastroRapido(null);
                        setNovoNome("");
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!novoNome.trim()) return;
                        const tel = cadastroRapido.telefone.replace(/\D/g, "");
                        const { data, error } = await supabase
                          .from("profiles")
                          .insert({ nome: novoNome.trim(), telefone: tel })
                          .select()
                          .single();
                        if (error) { toast.error("Erro: " + error.message); return; }
                        setCliente(data);
                        setClienteBusca("");
                        setCadastroRapido(null);
                        setNovoNome("");
                        toast.success(`Cliente ${data.nome} cadastrado!`);
                      }}
                      disabled={!novoNome.trim()}
                      className="flex-1 h-8 rounded-lg bg-[#086e45] text-white text-xs font-bold disabled:opacity-50"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => { setCadastroRapido(null); setNovoNome(""); }}
                      className="flex-1 h-8 rounded-lg border text-xs font-bold text-gray-500"
                    >
                      Pular
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs font-bold text-gray-400 uppercase">Pagamento</p>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((m: any) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => {
                    setSelectedPayment(m.label);
                    // Ao trocar de forma, limpa os submenus (tipo de cartão / bandeira).
                    setSelectedCardType("");
                    setSelectedFlag("");
                  }}
                  className={cn(
                    "rounded-xl border-2 p-3 text-xs font-bold text-center transition-all",
                    selectedPayment === m.label
                      ? "border-[#086e45] bg-[#086e45]/5 text-[#086e45]"
                      : "border-gray-200 text-gray-500 hover:border-[#086e45]/30",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Submenu: Cartão → Débito ou Crédito + bandeira */}
            {selectedPayment === "Cartão" && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Tipo</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Débito", "Crédito"].map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setSelectedCardType(tipo)}
                      className={cn(
                        "rounded-xl border-2 p-2 text-xs font-bold text-center transition-all",
                        selectedCardType === tipo
                          ? "border-[#086e45] bg-[#086e45]/5 text-[#086e45]"
                          : "border-gray-200 text-gray-500 hover:border-[#086e45]/30",
                      )}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submenu: Alimentação → bandeira do vale */}
            {selectedPayment === "Alimentação" && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Bandeira do vale</p>
                <div className="grid grid-cols-3 gap-2">
                  {mealFlags.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setSelectedFlag(f.name ?? "")}
                      className={cn(
                        "rounded-lg border-2 p-2 text-[11px] font-bold text-center transition-all",
                        selectedFlag === f.name
                          ? "border-[#086e45] bg-[#086e45]/5 text-[#086e45]"
                          : "border-gray-200 text-gray-500 hover:border-[#086e45]/30",
                      )}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedPayment === "Dinheiro" && (
              <div className="mt-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  Troco para
                </label>
                <input
                  type="text"
                  value={troco}
                  onChange={(e) => setTroco(e.target.value)}
                  placeholder="R$ 50,00"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm"
                />
              </div>
            )}
          </div>

          {/* Botão finalizar */}
          <div className="p-4 shrink-0 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={imprimirCupom}
                onChange={(e) => setImprimirCupom(e.target.checked)}
                className="size-4 accent-[#086e45]"
              />
              <span className="text-xs font-bold text-gray-600">Imprimir cupom</span>
            </label>
            <button
              onClick={finalizarVenda}
              disabled={isProcessing || recalculatedItems.length === 0 || !selectedPayment}
              className={cn(
                "w-full rounded-2xl py-4 text-base font-black flex items-center justify-center gap-2 transition-all",
                recalculatedItems.length > 0 && selectedPayment && !isProcessing
                  ? "bg-[#086e45] text-white hover:bg-[#065a38] shadow-lg"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed",
              )}
            >
              <Printer size={20} />
              {isProcessing ? "Processando..." : "Finalizar Venda"}
            </button>
          </div>
        </div>
      </div>

      {/* Weight Picker Modal */}
      {showWeightPicker && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Escolha o tamanho</h3>
            <p className="text-sm text-gray-500 mb-4">{showWeightPicker.nome}</p>
            <div className="space-y-2">
              {[
                { label: "P (200g)", weight: "200g", preco: showWeightPicker.preco },
                ...(showWeightPicker.preco_300g
                  ? [{ label: "M (300g)", weight: "300g", preco: showWeightPicker.preco_300g }]
                  : []),
                ...(showWeightPicker.preco_400g
                  ? [{ label: "G (400g)", weight: "400g", preco: showWeightPicker.preco_400g }]
                  : []),
              ].map((opt) => (
                <button
                  key={opt.weight}
                  onClick={() => addItem(showWeightPicker, opt.weight)}
                  className="w-full flex items-center justify-between rounded-xl border-2 border-gray-200 hover:border-[#086e45] p-4 transition-all"
                >
                  <span className="font-bold text-gray-900">{opt.label}</span>
                  <span className="font-bold text-[#086e45]">{formatBRL(opt.preco)}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowWeightPicker(null)}
              className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useCommerceDialog } from "@/lib/use-commerce-dialog";
/**
 * ComboSaboresModal — Modal de escolha de sabores para combos prontos.
 * O cliente escolhe os sabores (com +/-) até completar a quantidade do combo.
 * Ex: Combo de 5un → escolhe 5 sabores (pode repetir).
 */

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Minus, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { imgUrl } from "@/lib/image-proxy";

interface ComboSaboresModalProps {
  isOpen: boolean;
  onClose: () => void;
  combo: any; // produto do combo pronto
}

export function ComboSaboresModal({ isOpen, onClose, combo }: ComboSaboresModalProps) {
  const dialogRef = useCommerceDialog(isOpen, onClose);
  const { addComboPronto } = useCart();
  const [selectedWeight, setSelectedWeight] = useState("300g");
  const [sabores, setSabores] = useState<Record<string, number>>({}); // produto_id → qty

  // Quantidade total do combo (extraída do nome: "5un", "10un", "20un")
  const totalCombo = useMemo(() => {
    const match = (combo?.nome ?? "").match(/(\d+)\s*un/i);
    return match ? parseInt(match[1]) : 5;
  }, [combo]);

  // Busca sabores disponíveis por RPC pública segura.
  // Não faz join direto em produtos porque a tabela não é exposta ao usuário anônimo.
  const {
    data: saboresDisponiveis = [],
    isLoading: saboresLoading,
    isError: saboresError,
  } = useQuery({
    queryKey: ["combo-sabores-public", combo?.id],
    enabled: !!combo?.id && isOpen,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("combo_sabores_publicos", {
        p_combo_id: combo.id,
      });

      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 30_000,
  });

  const totalSelecionado = useMemo(
    () => Object.values(sabores).reduce((s, q) => s + q, 0),
    [sabores],
  );

  const precoCombo = useMemo(() => {
    if (selectedWeight === "200g") return combo?.preco ?? 0;
    if (selectedWeight === "400g") return combo?.preco_400g ?? combo?.preco ?? 0;
    return combo?.preco_300g ?? combo?.preco ?? 0;
  }, [combo, selectedWeight]);

  const estoqueDisponivel = (prod: any) => {
    if (!prod?.controle_estoque) return Number.POSITIVE_INFINITY;
    if (selectedWeight === "400g") return Number(prod.estoque_400g ?? 0);
    if (selectedWeight === "300g") return Number(prod.estoque_300g ?? 0);
    return Number(prod.estoque_200g ?? 0);
  };

  const estoqueTotalDisponivel = useMemo(() => {
    if (saboresDisponiveis.some((prod: any) => !prod?.controle_estoque)) {
      return Number.POSITIVE_INFINITY;
    }
    return saboresDisponiveis.reduce((total: number, prod: any) => {
      if (selectedWeight === "400g") return total + Number(prod.estoque_400g ?? 0);
      if (selectedWeight === "300g") return total + Number(prod.estoque_300g ?? 0);
      return total + Number(prod.estoque_200g ?? 0);
    }, 0);
  }, [saboresDisponiveis, selectedWeight]);

  const comboIndisponivel =
    saboresDisponiveis.length > 0 &&
    Number.isFinite(estoqueTotalDisponivel) &&
    estoqueTotalDisponivel < totalCombo;

  if (!isOpen || !combo) return null;

  function changeQty(produtoId: string, delta: number) {
    setSabores((prev) => {
      const atual = prev[produtoId] ?? 0;
      const novo = Math.max(0, atual + delta);
      const produto = saboresDisponiveis.find((p: any) => p.id === produtoId);
      if (delta > 0 && produto && novo > estoqueDisponivel(produto)) {
        toast.error(`${produto.nome} está sem estoque suficiente em ${selectedWeight}.`);
        return prev;
      }
      // Não deixa passar do total
      const totalAtual = Object.entries(prev).reduce(
        (s, [k, v]) => s + (k === produtoId ? 0 : v),
        0,
      );
      if (novo + totalAtual > totalCombo) return prev;
      const next = { ...prev };
      if (novo === 0) delete next[produtoId];
      else next[produtoId] = novo;
      return next;
    });
  }

  function handleAddToCart() {
    if (comboIndisponivel) {
      toast.error(`Não há ${totalCombo} unidades disponíveis em ${selectedWeight} para montar este combo.`);
      return;
    }
    if (totalSelecionado !== totalCombo) {
      toast.error(`Escolha exatamente ${totalCombo} sabores.`);
      return;
    }

    for (const [produtoId, qty] of Object.entries(sabores)) {
      const produto = saboresDisponiveis.find((p: any) => p.id === produtoId);
      if (!produto || qty > estoqueDisponivel(produto)) {
        toast.error(`Estoque insuficiente para ${produto?.nome ?? "um dos sabores"} em ${selectedWeight}.`);
        return;
      }
    }

    addComboPronto(
      combo.id,
      selectedWeight,
      totalCombo,
      Object.entries(sabores).map(([productId, quantity]) => ({ productId, quantity })),
    );

    toast.success(`${combo.nome} adicionado!`, {
      description: `${totalCombo} marmitas (${selectedWeight})`,
    });

    onClose();
    setSabores({});
  }

  const weights = [
    { label: "P", value: "200g", preco: combo.preco },
    ...(combo.preco_300g ? [{ label: "M", value: "300g", preco: combo.preco_300g }] : []),
    ...(combo.preco_400g ? [{ label: "G", value: "400g", preco: combo.preco_400g }] : []),
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Escolha os sabores do combo" className="relative w-full max-w-2xl max-h-[100dvh] md:max-h-[90vh] rounded-t-3xl md:rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#086e45] px-4 md:px-6 py-3 md:py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold">{combo.nome}</h2>
            <p className="text-base text-white/75">
              Escolha {totalCombo} sabores — {formatBRL(precoCombo)}
            </p>
          </div>
          <button
            aria-label="Fechar modal"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tamanho */}
        <div className="px-4 py-3 border-b flex gap-2 shrink-0">
          {weights.map((w) => (
            <button
              key={w.value}
              onClick={() => {
                setSelectedWeight(w.value);
                setSabores({});
              }}
              className={cn(
                "flex-1 rounded-xl border-2 py-2.5 text-center text-base font-semibold transition-all",
                selectedWeight === w.value
                  ? "border-[#086e45] bg-[#086e45]/5 text-[#086e45]"
                  : "border-gray-200 text-gray-500 hover:border-[#086e45]/30",
              )}
            >
              {w.label} ({w.value})
              <span className="block text-sm font-medium text-gray-600 mt-0.5">
                {formatBRL(w.preco)}
              </span>
            </button>
          ))}
        </div>

        {/* Progresso */}
        <div className="shrink-0 border-b px-4 py-2">
          <div className="flex items-center justify-between text-base">
            <span className="text-gray-500">
              Selecionados: <strong className="text-[#086e45]">{totalSelecionado}</strong> / {totalCombo}
            </span>
            {totalSelecionado === totalCombo && !comboIndisponivel && (
              <span className="text-[#086e45] font-bold text-sm">✓ Completo!</span>
            )}
          </div>
          {comboIndisponivel && (
            <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              Esta gramatura está temporariamente indisponível: há {estoqueTotalDisponivel} unidades somando os sabores disponíveis e o combo precisa de {totalCombo}.
            </div>
          )}
        </div>

        {/* Lista de sabores */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {saboresLoading ? (
            <div className="py-12 text-center text-gray-600 text-base">
              Carregando sabores...
            </div>
          ) : saboresError ? (
            <div className="py-12 text-center text-red-500 text-base">
              Não foi possível carregar os sabores agora. Tente novamente.
            </div>
          ) : saboresDisponiveis.length === 0 ? (
            <div className="py-12 text-center text-gray-600 text-base">
              Nenhum sabor disponível para este combo no momento.
            </div>
          ) : (
            saboresDisponiveis.map((prod: any) => {
              const qty = sabores[prod.id] ?? 0;
              const estoque = estoqueDisponivel(prod);
              const saborEsgotado = Number.isFinite(estoque) && estoque <= 0;
              return (
                <div
                  key={prod.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#086e45]/20 transition-all"
                >
                  {prod.imagem_url && (
                    <img
                      src={imgUrl(prod.imagem_url)}
                      alt={prod.nome}
                      className="h-12 w-12 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 leading-snug line-clamp-3">{prod.nome}</p>
                    {saborEsgotado ? (
                      <p className="mt-0.5 text-sm font-semibold text-red-500">
                        Esgotado em {selectedWeight}
                      </p>
                    ) : Number.isFinite(estoque) && estoque <= 5 ? (
                      <p className="mt-0.5 text-sm font-semibold text-amber-600">
                        Restam {estoque}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      aria-label={`Diminuir ${prod.nome}`}
                      onClick={() => changeQty(prod.id, -1)}
                      disabled={qty === 0}
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center border transition-all",
                        qty > 0
                          ? "border-[#086e45] text-[#086e45] hover:bg-[#086e45] hover:text-white"
                          : "border-gray-200 text-gray-300 cursor-not-allowed",
                      )}
                    >
                      <Minus size={14} />
                    </button>
                    <span
                      className={cn(
                        "w-7 text-center text-base font-semibold",
                        qty > 0 ? "text-[#086e45]" : "text-gray-300",
                      )}
                    >
                      {qty}
                    </span>
                    <button
                      aria-label={`Aumentar ${prod.nome}`}
                      onClick={() => changeQty(prod.id, 1)}
                      disabled={
                        comboIndisponivel ||
                        totalSelecionado >= totalCombo ||
                        (prod.controle_estoque && qty >= estoqueDisponivel(prod))
                      }
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                        !comboIndisponivel &&
                        totalSelecionado < totalCombo &&
                          (!prod.controle_estoque || qty < estoqueDisponivel(prod))
                          ? "bg-[#086e45] text-white hover:bg-[#065a38]"
                          : "bg-gray-100 text-gray-300 cursor-not-allowed",
                      )}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CTA */}
        <div className="px-4 py-3 border-t shrink-0">
          <button
            onClick={handleAddToCart}
            disabled={comboIndisponivel || totalSelecionado !== totalCombo}
            className={cn(
              "w-full rounded-2xl py-3.5 text-base font-semibold flex items-center justify-center gap-2 transition-all",
              !comboIndisponivel && totalSelecionado === totalCombo
                ? "bg-[#086e45] text-white hover:bg-[#065a38] shadow-lg"
                : "bg-gray-100 text-gray-600 cursor-not-allowed",
            )}
          >
            <ShoppingCart size={16} />
            Adicionar ao carrinho — {formatBRL(precoCombo)}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}

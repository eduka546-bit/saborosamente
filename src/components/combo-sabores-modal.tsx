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
  const { add } = useCart();
  const [selectedWeight, setSelectedWeight] = useState("300g");
  const [sabores, setSabores] = useState<Record<string, number>>({}); // produto_id → qty

  // Quantidade total do combo (extraída do nome: "5un", "10un", "20un")
  const totalCombo = useMemo(() => {
    const match = (combo?.nome ?? "").match(/(\d+)\s*un/i);
    return match ? parseInt(match[1]) : 5;
  }, [combo]);

  // Busca sabores disponíveis pra esse combo
  const { data: saboresDisponiveis = [] } = useQuery({
    queryKey: ["combo-sabores-public", combo?.id],
    enabled: !!combo?.id && isOpen,
    queryFn: async () => {
      const { data } = await supabase
        .from("combo_sabores")
        .select("produto_id, produtos:produto_id(id, nome, imagem_url)")
        .eq("combo_id", combo.id)
        .eq("ativo", true)
        .order("ordem");
      return (data ?? []).map((s: any) => s.produtos).filter(Boolean);
    },
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

  if (!isOpen || !combo) return null;

  function changeQty(produtoId: string, delta: number) {
    setSabores((prev) => {
      const atual = prev[produtoId] ?? 0;
      const novo = Math.max(0, atual + delta);
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
    if (totalSelecionado !== totalCombo) {
      toast.error(`Escolha exatamente ${totalCombo} sabores.`);
      return;
    }

    // Adiciona cada sabor como item individual no carrinho (pro estoque decrementar certinho)
    Object.entries(sabores).forEach(([produtoId, qty]) => {
      add(produtoId, qty, selectedWeight);
    });

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

      <div className="relative w-full max-w-2xl max-h-[100dvh] md:max-h-[90vh] rounded-t-3xl md:rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#086e45] px-4 md:px-6 py-3 md:py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black">{combo.nome}</h2>
            <p className="text-sm text-white/75">
              Escolha {totalCombo} sabores — {formatBRL(precoCombo)}
            </p>
          </div>
          <button
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
              onClick={() => setSelectedWeight(w.value)}
              className={cn(
                "flex-1 rounded-xl border-2 py-2.5 text-center text-sm font-bold transition-all",
                selectedWeight === w.value
                  ? "border-[#086e45] bg-[#086e45]/5 text-[#086e45]"
                  : "border-gray-200 text-gray-500 hover:border-[#086e45]/30",
              )}
            >
              {w.label} ({w.value})
              <span className="block text-[10px] font-medium text-gray-400 mt-0.5">
                {formatBRL(w.preco)}
              </span>
            </button>
          ))}
        </div>

        {/* Progresso */}
        <div className="px-4 py-2 border-b flex items-center justify-between text-sm shrink-0">
          <span className="text-gray-500">
            Selecionados: <strong className="text-[#086e45]">{totalSelecionado}</strong> / {totalCombo}
          </span>
          {totalSelecionado === totalCombo && (
            <span className="text-[#086e45] font-bold text-xs">✓ Completo!</span>
          )}
        </div>

        {/* Lista de sabores */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {saboresDisponiveis.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Nenhum sabor configurado pra este combo. Contate o administrador.
            </div>
          ) : (
            saboresDisponiveis.map((prod: any) => {
              const qty = sabores[prod.id] ?? 0;
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
                    <p className="text-sm font-semibold text-gray-900 truncate">{prod.nome}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => changeQty(prod.id, -1)}
                      disabled={qty === 0}
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center border transition-all",
                        qty > 0
                          ? "border-[#086e45] text-[#086e45] hover:bg-[#086e45] hover:text-white"
                          : "border-gray-200 text-gray-300 cursor-not-allowed",
                      )}
                    >
                      <Minus size={14} />
                    </button>
                    <span
                      className={cn(
                        "w-7 text-center text-sm font-black",
                        qty > 0 ? "text-[#086e45]" : "text-gray-300",
                      )}
                    >
                      {qty}
                    </span>
                    <button
                      onClick={() => changeQty(prod.id, 1)}
                      disabled={totalSelecionado >= totalCombo}
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                        totalSelecionado < totalCombo
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
            disabled={totalSelecionado !== totalCombo}
            className={cn(
              "w-full rounded-2xl py-3.5 text-sm font-black flex items-center justify-center gap-2 transition-all",
              totalSelecionado === totalCombo
                ? "bg-[#086e45] text-white hover:bg-[#065a38] shadow-lg"
                : "bg-gray-100 text-gray-400 cursor-not-allowed",
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

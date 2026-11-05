import { useCommerceDialog } from "@/lib/use-commerce-dialog";
/**
 * ComboSaboresModal — Modal de escolha de sabores para combos prontos.
 * O cliente escolhe os sabores (com +/-) até completar a quantidade do combo.
 * Ex: Combo de 5un → escolhe 5 sabores (pode repetir).
 */

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Minus, ShoppingCart, ArrowLeftRight, AlertTriangle } from "lucide-react";
import { combinarTrocasMaisLeves, composicaoBaseMaisLeves, estoqueLivreCombo, somarComposicao } from "@/lib/combo-pronto-estoque";
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
  initialWeight?: string;
}

export function ComboSaboresModal({ isOpen, onClose, combo, initialWeight = "200g" }: ComboSaboresModalProps) {
  const dialogRef = useCommerceDialog(isOpen, onClose);
  const { addComboPronto, lines } = useCart();
  const isMaisLeves = combo?.subgrupo === "MAIS LEVES" || /^Combo Pratos Mais Leves\s*-/i.test(combo?.nome ?? "");
  const [selectedWeight, setSelectedWeight] = useState(initialWeight);
  const [sabores, setSabores] = useState<Record<string, number>>({}); // produto_id → qty
  const [trocasExtras, setTrocasExtras] = useState<Record<string, number>>({});
  const [trocaAberta, setTrocaAberta] = useState(false);
  const [trocaAdiada, setTrocaAdiada] = useState(false);
  const [adicionando, setAdicionando] = useState(false);

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
    refetch: atualizarSabores,
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

  // Combos "Mais Leves" têm composição fechada: 1x de cada (5/10un) ou 2x de cada (20un).
  // A escolha do cliente é a gramatura, não a substituição dos pratos do ranking.
  useEffect(() => {
    if (isOpen) {
      setSelectedWeight(["200g", "300g", "400g"].includes(initialWeight) ? initialWeight : "200g");
      setSabores({});
      setTrocasExtras({});
      setTrocaAberta(false);
      setTrocaAdiada(false);
    }
  }, [isOpen, combo?.id, initialWeight]);

  const precoCombo = useMemo(() => {
    if (selectedWeight === "200g") return combo?.preco ?? 0;
    if (selectedWeight === "400g") return combo?.preco_400g ?? combo?.preco ?? 0;
    return combo?.preco_300g ?? combo?.preco ?? 0;
  }, [combo, selectedWeight]);

  const estoqueDisponivel = (prod: any) =>
    estoqueLivreCombo(prod, selectedWeight, lines);

  // Mantem todas as unidades originais que ainda existem em estoque.
  // Se faltar uma unidade, apenas a quantidade faltante podera ser substituida.
  const baseMaisLeves = useMemo(
    () => composicaoBaseMaisLeves(saboresDisponiveis, totalCombo, selectedWeight, lines),
    [saboresDisponiveis, totalCombo, selectedWeight, lines],
  );
  const saboresSelecionados = useMemo<Record<string, number>>(() => {
    if (!isMaisLeves) return sabores;
    return combinarTrocasMaisLeves(saboresDisponiveis, baseMaisLeves, trocasExtras, selectedWeight, lines);
  }, [isMaisLeves, sabores, saboresDisponiveis, baseMaisLeves, trocasExtras, selectedWeight, lines]);

  const totalSelecionado = useMemo(
    () => somarComposicao(saboresSelecionados),
    [saboresSelecionados],
  );
  const faltasOriginais = isMaisLeves ? Math.max(0, totalCombo - somarComposicao(baseMaisLeves)) : 0;
  const faltamTrocas = isMaisLeves ? Math.max(0, totalCombo - totalSelecionado) : 0;

  const estoqueTotalDisponivel = useMemo(() => {
    if (saboresDisponiveis.some((prod: any) => !prod?.controle_estoque)) {
      return Number.POSITIVE_INFINITY;
    }
    return saboresDisponiveis.reduce(
      (total: number, prod: any) => total + estoqueLivreCombo(prod, selectedWeight, lines),
      0,
    );
  }, [saboresDisponiveis, selectedWeight, lines]);

  const comboIndisponivel = !saboresLoading && (
    saboresDisponiveis.length === 0 ||
    (Number.isFinite(estoqueTotalDisponivel) && estoqueTotalDisponivel < totalCombo)
  );

  // Quando falta um item nos Mais Leves, abre automaticamente a escolha de
  // substitutos, sem deixar o pedido prosseguir incompleto.
  useEffect(() => {
    if (!isOpen || !isMaisLeves || saboresLoading || saboresError) return;
    if (faltamTrocas > 0 && !trocaAdiada) setTrocaAberta(true);
  }, [isOpen, isMaisLeves, saboresLoading, saboresError, faltamTrocas, trocaAdiada, selectedWeight]);

  if (!isOpen || !combo) return null;

  function changeQty(produtoId: string, delta: number) {
    if (isMaisLeves) return;
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

  function changeTroca(produtoId: string, delta: number) {
    setTrocasExtras((atual) => {
      const produto = saboresDisponiveis.find((item: any) => item.id === produtoId);
      if (!produto) return atual;
      const extrasAtuais = atual[produtoId] ?? 0;
      const proximo = Math.max(0, extrasAtuais + delta);
      const livre = estoqueDisponivel(produto);
      if (proximo + (baseMaisLeves[produtoId] ?? 0) > livre) return atual;
      if (delta > 0 && faltamTrocas === 0) return atual;
      return { ...atual, [produtoId]: proximo };
    });
  }

  async function handleAddToCart() {
    if (isMaisLeves && faltamTrocas > 0) {
      setTrocaAdiada(false);
      setTrocaAberta(true);
      return;
    }
    if (trocaAberta || adicionando) return;
    if (comboIndisponivel || saboresLoading || saboresError) {
      toast.error(`Não há estoque suficiente dos sabores deste combo em ${selectedWeight}.`);
      return;
    }
    if (totalSelecionado !== totalCombo) {
      toast.error(`Escolha exatamente ${totalCombo} sabores.`);
      return;
    }

    setAdicionando(true);
    try {
      // Revalidar o estoque ao adicionar, inclusive o que ja esta no carrinho.
      const { data: atualizados, error } = await atualizarSabores();
      if (error || !atualizados) throw new Error("Não foi possível conferir o estoque. Tente novamente.");
      for (const [produtoId, qty] of Object.entries(saboresSelecionados)) {
        const produto = (atualizados as any[]).find((p: any) => p.id === produtoId);
        if (!produto || qty > estoqueLivreCombo(produto, selectedWeight, lines)) {
          if (isMaisLeves) {
            setTrocaAdiada(false);
            setTrocaAberta(true);
          }
          toast.error("O estoque de um dos pratos mudou. Confira as opções disponíveis para troca.");
          return;
        }
      }

      addComboPronto(
        combo.id,
        selectedWeight,
        totalCombo,
        Object.entries(saboresSelecionados)
          .filter(([, quantity]) => quantity > 0)
          .map(([productId, quantity]) => ({ productId, quantity })),
      );

      toast.success(`${combo.nome} adicionado!`, {
        description: `${totalCombo} marmitas (${selectedWeight})`,
      });
      onClose();
      setSabores({});
      setTrocasExtras({});
      setTrocaAberta(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível verificar o estoque.");
    } finally {
      setAdicionando(false);
    }
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
              {isMaisLeves ? "Pratos mais leves selecionados para você" : `Escolha ${totalCombo} sabores`} — {formatBRL(precoCombo)}
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
                setTrocasExtras({});
                setTrocaAberta(false);
                setTrocaAdiada(false);
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
              {isMaisLeves ? "Unidades incluídas:" : "Selecionados:"} <strong className="text-[#086e45]">{totalSelecionado}</strong> / {totalCombo}
            </span>
            {totalSelecionado === totalCombo && !comboIndisponivel && (
              <span className="text-[#086e45] font-bold text-sm">✓ Completo!</span>
            )}
          </div>
          {isMaisLeves && faltasOriginais > 0 && !saboresLoading && !saboresError && (
            <button
              type="button"
              onClick={() => { setTrocaAdiada(false); setTrocaAberta(true); }}
              className="mt-2 flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm font-semibold text-amber-900"
            >
              <ArrowLeftRight size={18} className="shrink-0" />
              <span>{faltamTrocas > 0
                ? `É necessário substituir ${faltamTrocas} unidade(s) sem estoque. Toque para escolher.`
                : "Substituições escolhidas. Toque para revisar as trocas."}</span>
            </button>
          )}
          {comboIndisponivel && !saboresLoading && (
            <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
              Estoque insuficiente para completar {totalCombo} unidades em {selectedWeight} com os sabores deste combo.
              Selecione outra gramatura.
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
              const qty = saboresSelecionados[prod.id] ?? 0;
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
                  {isMaisLeves ? (
                    <div className="shrink-0 text-right">
                      <div className="rounded-full bg-[#edf5e6] px-3 py-1.5 text-sm font-bold text-[#086e45]">
                        {qty} un
                      </div>
                      {(trocasExtras[prod.id] ?? 0) > 0 && (
                        <span className="text-[11px] font-medium text-[#086e45]">Substituição</span>
                      )}
                    </div>
                  ) : (
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
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Acao fixa: sem permitir carrinho incompleto. */}
        <div className="px-4 py-3 border-t shrink-0 bg-white">
          <button
            onClick={handleAddToCart}
            disabled={saboresLoading || saboresError || adicionando || (!isMaisLeves && (comboIndisponivel || totalSelecionado !== totalCombo)) || (isMaisLeves && (comboIndisponivel || (faltamTrocas === 0 && trocaAberta)))}
            className={cn(
              "w-full rounded-2xl py-3.5 text-base font-semibold flex items-center justify-center gap-2 transition-all",
              !saboresLoading && !saboresError && !adicionando && !comboIndisponivel && (
                isMaisLeves ? (faltamTrocas > 0 || (!trocaAberta && totalSelecionado === totalCombo)) : totalSelecionado === totalCombo
              )
                ? "bg-[#086e45] text-white hover:bg-[#065a38] shadow-lg"
                : "bg-gray-100 text-gray-600 cursor-not-allowed",
            )}
          >
            {isMaisLeves && faltamTrocas > 0 ? (
              <><ArrowLeftRight size={17} /> Trocar {faltamTrocas} unidade(s) para continuar</>
            ) : (
              <><ShoppingCart size={16} /> {adicionando ? "Conferindo estoque..." : `Adicionar ao carrinho — ${formatBRL(precoCombo)}`}</>
            )}
          </button>
        </div>

        {isMaisLeves && trocaAberta && !saboresLoading && !saboresError && (
          <div className="absolute inset-0 z-30 flex flex-col bg-white" role="dialog" aria-modal="true" aria-label="Trocar pratos sem estoque">
            <div className="shrink-0 bg-[#086e45] px-4 py-4 text-white">
              <div className="flex items-center gap-2 text-lg font-bold">
                <ArrowLeftRight size={21} /> Substitua os pratos sem estoque
              </div>
              <p className="mt-1 text-sm text-white/85">
                Escolha substitutos somente entre os sabores deste combo ({selectedWeight}).
                O valor e a quantidade total não mudam.
              </p>
            </div>
            <div className="shrink-0 border-b bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={18} className="shrink-0" />
                {faltamTrocas > 0
                  ? `Faltam ${faltamTrocas} unidade(s) para completar as ${totalCombo} do combo.`
                  : `Pronto! As ${totalCombo} unidades estão completas.`}
              </div>
              <p className="mt-1 text-xs leading-relaxed">
                Mantivemos automaticamente as unidades da composição original que ainda estão disponíveis.
                Escolha abaixo apenas as que faltam.
              </p>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {saboresDisponiveis.map((prod: any) => {
                const reservado = baseMaisLeves[prod.id] ?? 0;
                const extra = trocasExtras[prod.id] ?? 0;
                const livre = estoqueDisponivel(prod);
                const podeSomar = faltamTrocas > 0 && reservado + extra < livre;
                return (
                  <div key={prod.id} className="flex items-center gap-2 rounded-xl border border-gray-200 p-2.5">
                    {prod.imagem_url && (
                      <img src={imgUrl(prod.imagem_url)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-gray-900">{prod.nome}</p>
                      <p className="text-xs text-gray-600">
                        {reservado} da composição original · {extra} substituição(ões)
                      </p>
                      {Number.isFinite(livre) && livre <= reservado + extra && (
                        <p className="text-xs font-semibold text-red-600">Sem mais estoque em {selectedWeight}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" aria-label={`Retirar substituição de ${prod.nome}`}
                        disabled={extra <= 0} onClick={() => changeTroca(prod.id, -1)}
                        className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 text-[#086e45] disabled:opacity-30">
                        <Minus size={16} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-[#086e45]">{extra}</span>
                      <button type="button" aria-label={`Adicionar substituição de ${prod.nome}`}
                        disabled={!podeSomar} onClick={() => changeTroca(prod.id, 1)}
                        className="grid h-9 w-9 place-items-center rounded-full bg-[#086e45] text-white disabled:bg-gray-100 disabled:text-gray-400">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="shrink-0 space-y-2 border-t bg-white px-4 py-3">
              <button type="button"
                disabled={faltamTrocas !== 0 || comboIndisponivel}
                onClick={() => { setTrocaAberta(false); setTrocaAdiada(false); }}
                className="w-full rounded-xl bg-[#086e45] px-4 py-3 font-semibold text-white disabled:bg-gray-100 disabled:text-gray-500">
                {faltamTrocas === 0 ? "Confirmar substituições" : `Escolha mais ${faltamTrocas} unidade(s)`}
              </button>
              <button type="button" onClick={() => { setTrocaAberta(false); setTrocaAdiada(true); }}
                className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Voltar e escolher outra gramatura
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}

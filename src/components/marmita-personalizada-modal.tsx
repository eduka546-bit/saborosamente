/**
 * MarmitaPersonalizadaModal
 *
 * Fluxo "Monte sua Marmita Personalizada":
 *  1. Escolhe ingredientes por grupo (Proteínas, Carboidratos, Legumes, Molhos),
 *     com modo de preparo quando o ingrediente oferecer.
 *  2. Define a gramatura de cada ingrediente escolhido.
 *  3. O preço vem da faixa de peso total (P/M/G/GG).
 * Regras: mínimo N unidades por combinação, peso máximo (ex.: 600g).
 */

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Minus, ShoppingCart, Scale, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/products";
import { useCart, type CartCustomItem } from "@/lib/cart";
import { toast } from "sonner";
import {
  type MarmitaGrupo,
  type MarmitaPersonalizadaConfig,
  tamanhoPorPeso,
  limiteProteina,
} from "@/lib/marmita-personalizada-config";

interface MarmitaPersonalizadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  grupos: MarmitaGrupo[];
  config: MarmitaPersonalizadaConfig;
}

// Item em construção (antes de virar CartCustomItem).
interface Selecao {
  ingredienteId: string;
  grupo: string;
  nome: string;
  modoPreparo?: string;
  gramatura: number;
}

const GRAMATURA_PADRAO = 50; // g ao adicionar um ingrediente
const PASSO_GRAMATURA = 10; // g por clique +/-

export function MarmitaPersonalizadaModal({
  isOpen,
  onClose,
  grupos,
  config,
}: MarmitaPersonalizadaModalProps) {
  const { addCustom } = useCart();
  const [selecoes, setSelecoes] = useState<Record<string, Selecao>>({});
  const [quantidade, setQuantidade] = useState(config.minUnidades);

  const selecionados = useMemo(() => Object.values(selecoes), [selecoes]);

  const pesoTotal = useMemo(
    () => selecionados.reduce((s, it) => s + (it.gramatura || 0), 0),
    [selecionados],
  );

  const tamanho = useMemo(() => tamanhoPorPeso(pesoTotal, config), [pesoTotal, config]);
  const acimaDoMax = pesoTotal > config.pesoMaximo;

  // Peso de proteína = soma das gramaturas do(s) grupo(s) cujo nome contém "prote".
  const pesoProteina = useMemo(
    () =>
      selecionados
        .filter((it) => it.grupo.toLowerCase().includes("prote"))
        .reduce((s, it) => s + (it.gramatura || 0), 0),
    [selecionados],
  );

  // Limite de proteína e excedente (60% do teto do tamanho atual).
  const limiteProt = tamanho ? limiteProteina(tamanho, config) : 0;
  const excedenteProteina = tamanho ? Math.max(0, pesoProteina - limiteProt) : 0;
  const adicionalProteina = excedenteProteina * config.adicionalProteinaPorGrama;

  const precoBase = tamanho?.preco ?? 0;
  const precoUnitario = precoBase + adicionalProteina;

  // Early return após hooks
  if (!isOpen) return null;

  function toggleIngrediente(grupo: MarmitaGrupo, ing: MarmitaGrupo["ingredientes"][number]) {
    setSelecoes((prev) => {
      const next = { ...prev };
      if (next[ing.id]) {
        delete next[ing.id];
      } else {
        next[ing.id] = {
          ingredienteId: ing.id,
          grupo: grupo.nome,
          nome: ing.nome,
          modoPreparo: ing.modos_preparo?.[0],
          gramatura: GRAMATURA_PADRAO,
        };
      }
      return next;
    });
  }

  function setModo(ingId: string, modo: string) {
    setSelecoes((prev) => ({ ...prev, [ingId]: { ...prev[ingId], modoPreparo: modo } }));
  }

  function mudarGramatura(ingId: string, delta: number) {
    setSelecoes((prev) => {
      const atual = prev[ingId];
      if (!atual) return prev;
      const nova = Math.max(0, atual.gramatura + delta);
      if (nova === 0) {
        const next = { ...prev };
        delete next[ingId];
        return next;
      }
      return { ...prev, [ingId]: { ...atual, gramatura: nova } };
    });
  }

  function handleAdd() {
    if (selecionados.length === 0) {
      toast.error("Escolha pelo menos um ingrediente.");
      return;
    }
    if (pesoTotal <= 0) {
      toast.error("Defina a gramatura dos ingredientes.");
      return;
    }
    if (acimaDoMax) {
      toast.error(`Peso máximo de ${config.pesoMaximo}g por marmita.`);
      return;
    }
    if (!tamanho) {
      toast.error("Peso fora das faixas disponíveis.");
      return;
    }
    if (quantidade < config.minUnidades) {
      toast.error(`Mínimo de ${config.minUnidades} unidades por combinação.`);
      return;
    }

    const itens: CartCustomItem[] = selecionados.map((s) => ({
      grupo: s.grupo,
      nome: s.nome,
      modoPreparo: s.modoPreparo,
      gramatura: s.gramatura,
    }));

    // Se houve excedente de proteína, registra o adicional como um "item" da
    // composição para aparecer na comanda/observação do pedido.
    if (excedenteProteina > 0) {
      itens.push({
        grupo: "Adicional",
        nome: `Excedente proteína ${excedenteProteina}g (+${formatBRL(adicionalProteina)})`,
        gramatura: 0,
      });
    }

    addCustom(
      {
        label: `Marmita Personalizada (${tamanho.sigla})`,
        tamanhoSigla: tamanho.sigla,
        precoUnitario,
        pesoTotal,
        itens,
      },
      quantidade,
    );

    toast.success("Marmita personalizada adicionada!", {
      description: `${quantidade}× ${tamanho.sigla} (${pesoTotal}g) — ${formatBRL(precoUnitario)} cada`,
    });
    onClose();
    setSelecoes({});
    setQuantidade(config.minUnidades);
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[100dvh] md:max-h-[95vh] rounded-t-3xl md:rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#086e45] px-4 md:px-6 py-3 md:py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black">{config.titulo}</h2>
            <p className="text-sm text-white/75 mt-0.5">{config.descricao}</p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tamanhos + limite de proteína por tamanho */}
        <div className="bg-[#086e45] border-b px-4 py-3 shrink-0 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {config.tamanhos.map((t) => {
              const isAtual = tamanho?.sigla === t.sigla;
              const limProt = limiteProteina(t, config);
              return (
                <div
                  key={t.sigla}
                  className={cn(
                    "rounded-xl px-3 py-2 text-center transition-all min-w-[92px] border",
                    isAtual
                      ? "border-white/60 bg-white/15 shadow-sm"
                      : "border-white/20 bg-white/5",
                  )}
                >
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm font-black text-white">{t.sigla}</span>
                    <span className="text-[10px] text-white/70">{t.label}</span>
                  </div>
                  <div className="text-xs font-bold text-white">{formatBRL(t.preco)}</div>
                  <div className="text-[10px] text-white/60 mt-0.5">
                    proteína até <span className="font-bold text-white/90">{limProt}g</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Coluna esquerda — ingredientes */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 md:border-r">
            {grupos.map((grupo) => (
              <div key={grupo.id}>
                <h3 className="text-sm font-black text-[#086e45] uppercase tracking-wider mb-2">
                  {grupo.nome}
                </h3>
                <div className="space-y-2">
                  {grupo.ingredientes.map((ing) => {
                    const sel = selecoes[ing.id];
                    const ativo = !!sel;
                    return (
                      <div
                        key={ing.id}
                        className={cn(
                          "rounded-2xl border transition-all",
                          ativo
                            ? "border-[#086e45] bg-[#086e45]/5"
                            : "border-gray-100 hover:border-[#086e45]/20",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleIngrediente(grupo, ing)}
                          className="w-full flex items-center gap-3 p-3 text-left"
                        >
                          <div
                            className={cn(
                              "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0",
                              ativo
                                ? "border-[#086e45] bg-[#086e45] text-white"
                                : "border-gray-300",
                            )}
                          >
                            {ativo && <Check size={12} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{ing.nome}</p>
                            {ing.observacao && (
                              <p className="text-[11px] text-gray-400">{ing.observacao}</p>
                            )}
                          </div>
                        </button>

                        {ativo && (
                          <div className="px-3 pb-3 space-y-2">
                            {/* Modos de preparo */}
                            {ing.modos_preparo && ing.modos_preparo.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {ing.modos_preparo.map((modo) => (
                                  <button
                                    key={modo}
                                    type="button"
                                    onClick={() => setModo(ing.id, modo)}
                                    className={cn(
                                      "px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border",
                                      sel?.modoPreparo === modo
                                        ? "bg-[#086e45] text-white border-[#086e45]"
                                        : "bg-white text-gray-500 border-gray-200 hover:border-[#086e45]/40",
                                    )}
                                  >
                                    {modo}
                                  </button>
                                ))}
                              </div>
                            )}
                            {/* Gramatura */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-400 font-bold uppercase">
                                Gramatura
                              </span>
                              <div className="flex items-center gap-1 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => mudarGramatura(ing.id, -PASSO_GRAMATURA)}
                                  className="h-7 w-7 rounded-full border border-[#086e45] text-[#086e45] flex items-center justify-center hover:bg-[#086e45] hover:text-white transition-all"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-14 text-center text-sm font-black text-[#086e45]">
                                  {sel?.gramatura ?? 0}g
                                </span>
                                <button
                                  type="button"
                                  onClick={() => mudarGramatura(ing.id, PASSO_GRAMATURA)}
                                  className="h-7 w-7 rounded-full bg-[#086e45] text-white flex items-center justify-center hover:bg-[#065a38] transition-colors"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Coluna direita — resumo / calculadora */}
          <div className="w-full md:w-80 flex flex-col shrink-0 border-t md:border-t-0">
            {/* Resumo compacto (mobile: barra + preço + quantidade + botão) */}
            <div className="px-4 py-3 md:pt-4 md:pb-3 border-b space-y-2 md:space-y-3 shrink-0">
              {/* Header + barra de peso */}
              <div className="flex items-center gap-3">
                <Scale size={14} className="text-gray-500 shrink-0 hidden md:block" />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg md:text-2xl font-black text-[#086e45]">{pesoTotal}g</span>
                    {tamanho && !acimaDoMax && (
                      <span className="text-xs font-bold text-gray-500">
                        {tamanho.sigla} — {formatBRL(precoUnitario)}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 md:h-2.5 w-full rounded-full bg-gray-100 overflow-hidden mt-1">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        acimaDoMax ? "bg-red-500" : "bg-[#086e45]",
                      )}
                      style={{
                        width: `${Math.min(100, (pesoTotal / config.pesoMaximo) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {acimaDoMax && (
                <p className="text-[10px] text-red-600 font-medium">
                  Peso máximo {config.pesoMaximo}g excedido. Reduza a gramatura.
                </p>
              )}

              {/* Proteína — só mostra se excedeu ou se está no desktop */}
              {excedenteProteina > 0 && (
                <p className="text-[10px] text-red-600 font-medium">
                  Proteína excedeu {limiteProt}g (+{excedenteProteina}g = {formatBRL(adicionalProteina)}/un)
                </p>
              )}
            </div>

            {/* Composição — escondida no mobile, visível no desktop */}
            <div className="hidden md:block max-h-none md:flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
              {selecionados.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="text-3xl mb-2">🍱</div>
                  <p className="text-xs text-gray-400">Monte sua marmita ao lado</p>
                </div>
              ) : (
                selecionados.map((s) => (
                  <div key={s.ingredienteId} className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-[#086e45] w-12 text-right shrink-0">
                      {s.gramatura}g
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-gray-800 font-medium leading-tight">
                        {s.nome}
                        {s.modoPreparo ? ` (${s.modoPreparo})` : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quantidade + CTA */}
            <div className="px-4 pb-3 md:pb-4 pt-2 md:pt-3 border-t space-y-2 md:space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">
                  Qtd <span className="text-gray-400 normal-case">(mín {config.minUnidades})</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQuantidade((q) => Math.max(config.minUnidades, q - 1))}
                    className="h-7 w-7 md:h-8 md:w-8 rounded-full border border-[#086e45] text-[#086e45] flex items-center justify-center hover:bg-[#086e45] hover:text-white transition-all"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-7 text-center text-sm font-black text-[#086e45]">
                    {quantidade}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantidade((q) => q + 1)}
                    className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-[#086e45] text-white flex items-center justify-center hover:bg-[#065a38] transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Aviso de prazo — compacto no mobile */}
              <p className="text-[9px] md:text-[10px] text-amber-700 leading-tight">
                ⏳ Preparo em ~1 semana. Entrega na semana seguinte.
              </p>

              <button
                onClick={handleAdd}
                disabled={selecionados.length === 0 || acimaDoMax || !tamanho}
                className={cn(
                  "w-full rounded-2xl py-3 md:py-3.5 text-sm font-black transition-all flex items-center justify-center gap-2",
                  selecionados.length > 0 && !acimaDoMax && tamanho
                    ? "bg-[#086e45] text-white hover:bg-[#065a38] shadow-lg hover:shadow-[#086e45]/30"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed",
                )}
              >
                <ShoppingCart size={16} />
                Adicionar ao carrinho
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}

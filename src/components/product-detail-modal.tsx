import { WhatsappIcon } from "@/components/whatsapp-icon";
import { ProductFacts } from "@/components/product-facts";
import { useEffect, useRef, useState } from "react";
import { isMarmita } from "@/lib/combo-rules";
import { isNoDiscount, precoMarmitaPorFaixa, precoCheioMarmita } from "@/lib/combo-rules";
import { usePrecosMarmita } from "@/lib/use-precos-marmita";
import { FoodTypeIcon } from "@/components/food-type-icon";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Share2,
  ShoppingCart,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { formatBRL } from "@/lib/products";
import { useCart, ADICIONAL_PRONTA, ADICIONAL_GARFO_FACA } from "@/lib/cart";
import { imgUrl } from "@/lib/image-proxy";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { experimentVariant, trackEvent } from "@/lib/analytics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  allProducts?: any[];
  // Em Monte seu Combo, adiciona ao combo em vez de ir direto ao carrinho.
  onAddToCombo?: (weight: string, quantity: number) => void;
  comboCount?: number;
}

const stockForWeight = (product: any, weight: string): number | null => {
  const raw =
    weight === "200g"
      ? product?.estoque_200g
      : weight === "300g"
        ? product?.estoque_300g
        : weight === "400g"
          ? product?.estoque_400g
          : (product?.estoque ?? product?.estoque_200g);

  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const initialAvailableWeight = (product: any, weights: string[]): string => {
  if (!weights.length) return "";

  const preferred = weights.includes("300g") ? "300g" : weights[0];
  const isAvailable = (weight: string) => {
    const stock = stockForWeight(product, weight);
    return stock === null || stock > 0;
  };

  if (preferred && isAvailable(preferred)) return preferred;
  return weights.find(isAvailable) || preferred || weights[0];
};

// Modal de detalhes do produto — layout robusto (imagem grande + ficha completa),
// abre por cima do catálogo sem trocar de página.
export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  allProducts = [],
  onAddToCombo,
  comboCount,
}: ProductDetailModalProps) {
  const { add, count, lines } = useCart();
  const tabelaPrecos = usePrecosMarmita();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(true);
  const updateScrollHint = () => {
    const node = mobileScrollRef.current;
    if (!node) return;
    setHasMoreBelow(node.scrollHeight - node.scrollTop - node.clientHeight > 36);
  };
  useEffect(() => {
    if (!isOpen) return;
    setRequestedQuantity(1);
    setCurrentImageIndex(0);
    setConsumo("congelada");
    setGarfoEFaca(false);
    setTabelaNutricionalAberta(false);
  }, [isOpen, product?.id]);

  // Tamanhos disponíveis
  const weights = (() => {
    if (product?.tipo_produto === "complemento") return ["150g"];
    if (product?.tipo_produto === "sopa") return ["400g"];
    const hasSizes = product?.preco_300g || product?.preco_400g;
    if (hasSizes) {
      const sizes: string[] = ["200g"];
      if (product.preco_300g) sizes.push("300g");
      if (product.preco_400g) sizes.push("400g");
      return sizes;
    }
    const peso: string | undefined = product?.peso;
    if (peso?.includes("-")) return peso.split("-").map((w: string) => w.trim());
    if (peso?.includes(",")) return peso.split(",").map((w: string) => w.trim());
    return peso ? [peso] : [];
  })();

  const [selectedWeight, setSelectedWeight] = useState<string>(() =>
    initialAvailableWeight(product, weights),
  );
  const weightsKey = weights.join("|");

  useEffect(() => {
    if (!isOpen || !product?.id) return;
    setSelectedWeight(initialAvailableWeight(product, weights));
  }, [
    isOpen,
    product?.id,
    product?.estoque_200g,
    product?.estoque_300g,
    product?.estoque_400g,
    weightsKey,
  ]);

  // Opções (só marmitas): consumo pronta/congelada + garfo e faca.
  const [consumo, setConsumo] = useState<"congelada" | "pronta">("congelada");
  const [garfoEFaca, setGarfoEFaca] = useState(false);
  const [tabelaNutricionalAberta, setTabelaNutricionalAberta] = useState(false);
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    const frame = window.requestAnimationFrame(updateScrollHint);
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, product?.id, selectedWeight, tabelaNutricionalAberta]);
  const [restockContact, setRestockContact] = useState("");
  const [restockSending, setRestockSending] = useState(false);
  const ctaVariant = experimentVariant("product_modal_cta_v1");

  useEffect(() => {
    if (!isOpen || !product?.id) return;
    trackEvent("product_view", {
      produtoId: product.id,
      metadata: {
        origem: window.location.pathname.startsWith("/produto/") ? "product_page" : "modal",
      },
    });
    trackEvent("experiment_exposure", {
      produtoId: product.id,
      metadata: { experimento: "product_modal_cta_v1", variante: ctaVariant },
    });
  }, [isOpen, product?.id, ctaVariant]);

  if (!product) return null;

  const title =
    product.tipo_produto === "complemento"
      ? product.nome.replace(/\s*150\s*g\s*$/i, "")
      : product.nome;
  const codeMatch = title.match(/^((?:TD|SO|CO)\d+)\s*[-–—:.]?\s*/i);
  const categoriaNome = product.categorias?.nome || product.categoria || "Marmita";
  const ehMarmita = isMarmita(product.nome, categoriaNome);

  const ingredientesDetalhados = Array.isArray(product.ingredientes)
    ? product.ingredientes.join(", ")
    : String(product.ingredientes || "");

  // A foto principal acompanha a gramatura selecionada, sem alterar o produto.
  const imagemDoTamanho =
    selectedWeight === "200g" ? product.imagem_200g :
    selectedWeight === "300g" ? product.imagem_300g :
    selectedWeight === "400g" ? product.imagem_400g : null;
  const principal = imgUrl(imagemDoTamanho || product.imagem_url || product.imagem);
  const allImages = [...new Set(
    [principal, ...(Array.isArray(product.imagens) ? product.imagens : [])]
      .filter(Boolean)
      .map((url: string) => imgUrl(url)),
  )];
  const currentImage = allImages[currentImageIndex] || principal;

  const isSopa = categoriaNome.toLowerCase().includes("sopa");
  const currentPrice = isSopa
    ? 18.0
    : selectedWeight === "300g" && product.preco_300g
      ? product.preco_300g
      : selectedWeight === "400g" && product.preco_400g
        ? product.preco_400g
        : product.preco;

  const currentNutritional =
    selectedWeight === "200g" && product.tabela_nutricional_200g
      ? product.tabela_nutricional_200g
      : selectedWeight === "300g" && product.tabela_nutricional_300g
        ? product.tabela_nutricional_300g
        : selectedWeight === "400g" && product.tabela_nutricional_400g
          ? product.tabela_nutricional_400g
          : product.tabela_nutricional;

  const currentStock = (() => {
    if (selectedWeight === "200g") return product.estoque_200g;
    if (selectedWeight === "300g") return product.estoque_300g;
    if (selectedWeight === "400g") return product.estoque_400g;
    return product.estoque ?? product.estoque_200g ?? null;
  })();
  const stockNumber =
    currentStock === null || currentStock === undefined || currentStock === ""
      ? null
      : Number(currentStock);
  const quantityAlreadyInCart = lines.reduce((sum, line) => {
    if (line.custom || line.comboPronto) return sum;
    return line.productId === product.id && line.weight === selectedWeight
      ? sum + Number(line.quantity || 0)
      : sum;
  }, 0);
  const remainingStock =
    stockNumber === null || !Number.isFinite(stockNumber)
      ? null
      : Math.max(0, stockNumber - quantityAlreadyInCart);
  const soldOut = remainingStock !== null && remainingStock <= 0;
  const quantity = Math.max(1, Math.min(requestedQuantity, remainingStock ?? requestedQuantity));
  const projectedCount = (comboCount ?? count) + quantity;

  const currentRestrictions =
    selectedWeight === "200g" && product.restricoes_200g
      ? product.restricoes_200g
      : selectedWeight === "300g" && product.restricoes_300g
        ? product.restricoes_300g
        : selectedWeight === "400g" && product.restricoes_400g
          ? product.restricoes_400g
          : product.restricoes;

  const restrictionText = Array.isArray(currentRestrictions)
    ? currentRestrictions.join(" | ")
    : typeof currentRestrictions === "string"
      ? currentRestrictions
      : "";

  const glutenStatus = /N[ÃA]O\s+CONT[ÉE]M\s+GL[ÚU]TEN/i.test(restrictionText)
    ? "não contém"
    : /CONT[ÉE]M\s+GL[ÚU]TEN/i.test(restrictionText)
      ? "contém"
      : product.sem_gluten === true
        ? "não contém"
        : product.sem_gluten === false
          ? "contém"
          : "consultar embalagem";

  const lactoseStatus = /N[ÃA]O\s+CONT[ÉE]M\s+LACTOSE/i.test(restrictionText)
    ? "não contém"
    : /CONT[ÉE]M\s+LACTOSE/i.test(restrictionText)
      ? "contém"
      : product.sem_lactose === true
        ? "não contém"
        : product.sem_lactose === false
          ? "contém"
          : "consultar embalagem";

  const isComboPronto = categoriaNome.toLowerCase().includes("combo pronto");
  const weightLabel = (w: string) => {
    if (!isComboPronto) return w;
    if (w === "200g") return "P";
    if (w === "300g") return "M";
    if (w === "400g") return "G";
    return w;
  };

  const fullPriceForWeight = (w: string) => {
    if (isSopa) return 18;
    if (ehMarmita && !isNoDiscount(categoriaNome)) {
      return precoCheioMarmita(w, tabelaPrecos) || Number(product.preco || 0);
    }
    if (w === "300g" && product.preco_300g) return Number(product.preco_300g);
    if (w === "400g" && product.preco_400g) return Number(product.preco_400g);
    return Number(product.preco || 0);
  };

  const priceForWeight = (w: string) => {
    const full = fullPriceForWeight(w);
    return ehMarmita && !isNoDiscount(categoriaNome)
      ? precoMarmitaPorFaixa(w, projectedCount, full, tabelaPrecos)
      : full;
  };

  const selectedWeightIndex = weights.indexOf(selectedWeight);
  const nextWeight =
    selectedWeightIndex >= 0 && selectedWeightIndex < weights.length - 1
      ? weights[selectedWeightIndex + 1]
      : null;
  const upgradePriceDifference = nextWeight
    ? Math.max(0, priceForWeight(nextWeight) - priceForWeight(selectedWeight))
    : 0;

  const relatedProducts = allProducts
    .filter((candidate: any) => {
      if (
        !candidate ||
        candidate.id === product.id ||
        candidate.ativo === false ||
        candidate.visivel_online === false
      ) {
        return false;
      }
      const candidateCategory = candidate.categorias?.nome || candidate.categoria || "";
      if (
        /escolha você mesmo|escolha voce mesmo|monte você mesmo|monte voce mesmo/i.test(
          candidateCategory + " " + (candidate.nome || ""),
        )
      ) {
        return false;
      }
      return candidateCategory === categoriaNome;
    })
    .slice(0, 3);

  const addRelatedProduct = (candidate: any) => {
    const relatedCategory = candidate.categorias?.nome || candidate.categoria || "";
    const relatedIsMarmita = isMarmita(candidate.nome, relatedCategory);
    const relatedWeight = candidate.preco_300g
      ? "300g"
      : candidate.preco_400g
        ? "400g"
        : candidate.peso || "";
    add(
      candidate.id,
      1,
      relatedWeight,
      relatedIsMarmita ? { consumo: "congelada", garfoEFaca: false } : undefined,
    );
    toast.success("Adicionado ao carrinho!", {
      description: `${candidate.nome}${relatedWeight ? ` (${relatedWeight})` : ""}`,
    });
  };

  const handleShare = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/produto/${product.id}`
        : `https://saborosamente.com/produto/${product.id}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: product.nome, text: product.nome, url });
        trackEvent("product_share", { produtoId: product.id, metadata: { metodo: "native" } });
        return;
      }
      await navigator.clipboard.writeText(url);
      trackEvent("product_share", { produtoId: product.id, metadata: { metodo: "clipboard" } });
      toast.success("Link do produto copiado!");
    } catch {
      // Usuário pode cancelar o compartilhamento nativo; não precisa exibir erro.
    }
  };

  const requestRestock = async () => {
    if (restockSending) return;
    setRestockSending(true);
    const contact = restockContact.trim();
    try {
      const { data: authData } = contact ? { data: null } : await supabase.auth.getUser();
      const email = contact.includes("@") ? contact : (authData?.user?.email || null);
      const telefone = contact && !contact.includes("@") ? contact : null;
      if (!email && !telefone) {
        toast.error("Informe seu WhatsApp ou e-mail para receber o aviso.");
        return;
      }
      const { error } = await supabase.rpc("solicitar_alerta_reposicao", {
        p_produto_id: product.id,
        p_gramatura: selectedWeight || null,
        p_nome: null,
        p_telefone: telefone,
        p_email: email,
      });
      if (error) throw error;
      trackEvent("restock_request", {
        produtoId: product.id,
        metadata: {
          gramatura: selectedWeight,
          canal: email ? "email" : telefone ? "telefone" : "conta",
        },
      });
      toast.success(`Solicitação registrada para ${selectedWeight || "este produto"}!`);
      setRestockContact("");
    } catch (error: any) {
      const msg = String(error?.message || "");
      toast.error(/telefone.inválido/i.test(msg)
        ? "Informe um WhatsApp válido com DDD."
        : /email.inválido/i.test(msg)
          ? "Informe um e-mail válido."
          : "Não foi possível registrar o aviso. Confira o contato e tente novamente.");
    } finally {
      setRestockSending(false);
    }
  };

  const handleAddToCart = () => {
    if (soldOut) {
      toast.info("Esta gramatura já atingiu a quantidade disponível.");
      return;
    }
    if (onAddToCombo) {
      onAddToCombo(selectedWeight, quantity);
      toast.success("Adicionado ao seu combo!", {
        description: quantity + " × " + product.nome + " (" + selectedWeight + ")",
      });
      return;
    }
    const opcoes = ehMarmita
      ? { consumo, garfoEFaca: consumo === "pronta" ? garfoEFaca : false }
      : undefined;
    add(product.id, quantity, selectedWeight, opcoes);
    trackEvent("add_to_cart", {
      produtoId: product.id,
      valor: Number(priceForWeight(selectedWeight) || 0),
      metadata: { gramatura: selectedWeight, consumo, quantidade: quantity },
    });
    const detalheOpcao = ehMarmita
      ? ` — ${consumo === "pronta" ? "pronta para consumo" : "congelada"}`
      : "";
    toast.success("Adicionado ao carrinho!", {
      description: `${quantity} × ${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}${detalheOpcao}`,
    });
    onClose();
  };

  const chooseWeight = (weight: string) => {
    if (selectedWeight === weight) return;
    // Tamanhos esgotados continuam selecionáveis para consulta e pedido de aviso.
    setSelectedWeight(weight);
    setCurrentImageIndex(0);
    setRequestedQuantity(1);
    trackEvent("size_select", { produtoId: product.id, metadata: { gramatura: weight } });
  };

  const purchaseControls = (
    <div className="shrink-0 border-t border-[#dce7dd] bg-card px-3 py-2 sm:px-4 sm:py-3 md:py-4">
      {/* Mobile: preço/tamanho na primeira linha, quantidade/CTA na segunda.
          Desktop mantém as posições originais sem duplicar controles. */}
      <div className="grid min-w-0 grid-cols-[minmax(0,0.91fr)_minmax(0,1.09fr)] items-end gap-x-2 gap-y-2 sm:gap-x-3 md:grid-cols-2 md:gap-x-4">
        <div className="col-start-1 row-start-1 min-w-0">
          {(() => {
            const semDesconto = isNoDiscount(categoriaNome);
            const podeTerDesconto = ehMarmita && !semDesconto;
            const precoCheio = podeTerDesconto
              ? precoCheioMarmita(selectedWeight, tabelaPrecos) || currentPrice
              : currentPrice;
            const precoComFaixa = podeTerDesconto
              ? precoMarmitaPorFaixa(selectedWeight, projectedCount, precoCheio, tabelaPrecos)
              : currentPrice;
            const adicional =
              (consumo === "pronta" ? ADICIONAL_PRONTA : 0) +
              (consumo === "pronta" && garfoEFaca ? ADICIONAL_GARFO_FACA : 0);
            const precoFinal = precoComFaixa + adicional;
            const precoCheioTotal = precoCheio + adicional;

            return (
              <div className="flex min-w-0 flex-col">
                <span className="text-[11px] font-semibold leading-tight text-muted-foreground md:text-sm">
                  Total · {quantity} {quantity === 1 ? "unidade" : "unidades"}
                </span>
                {precoComFaixa < precoCheio ? (
                  <>
                    <span className="text-xs font-semibold leading-tight text-muted-foreground line-through md:text-sm">
                      {formatBRL(precoCheioTotal * quantity)}
                    </span>
                    <span className="text-[21px] font-bold leading-tight text-[#086e45] min-[390px]:text-2xl md:text-3xl">
                      {formatBRL(precoFinal * quantity)}
                    </span>
                  </>
                ) : (
                  <span className="text-[21px] font-bold leading-tight text-primary min-[390px]:text-2xl md:text-3xl">
                    {formatBRL(precoFinal * quantity)}
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        <div className="col-start-2 row-start-1 min-w-0">
          <p className="mb-1 text-[11px] font-semibold leading-tight text-[#075636] min-[390px]:text-xs md:mb-1.5 md:text-sm">
            {weights.length > 1 ? "Escolha o tamanho:" : "Tamanho"}
          </p>
          {weights.length > 1 ? (
            <div
              role="group"
              aria-label="Escolha o tamanho da marmita"
              className="flex w-full min-w-0 items-center justify-between gap-0.5 rounded-full bg-[#f2f4eb] p-0.5 md:w-fit md:max-w-full md:gap-1 md:p-1"
            >
              {weights.map((w: string) => {
                const stock = stockForWeight(product, w);
                const unavailable = stock !== null && stock <= 0;
                return (
                  <button
                    key={w}
                    type="button"
                    aria-label={`Selecionar tamanho ${w}${unavailable ? ", esgotado" : ""}`}
                    aria-pressed={selectedWeight === w}
                    title={unavailable ? "Esgotado — veja informações e peça aviso" : undefined}
                    onClick={() => chooseWeight(w)}
                    className={cn(
                      "min-h-9 min-w-0 flex-1 rounded-full px-0.5 text-[11px] font-semibold transition-colors min-[390px]:text-xs md:min-w-[42px] md:flex-none md:px-2 md:text-sm lg:min-w-[52px] lg:text-base",
                      selectedWeight === w
                        ? "bg-[#086e45] text-white shadow-sm"
                        : "bg-transparent text-[#375244] hover:bg-white",
                      unavailable && selectedWeight !== w && "ring-1 ring-inset ring-rose-300 text-rose-700",
                    )}
                  >
                    {weightLabel(w)}
                  </button>
                );
              })}
            </div>
          ) : selectedWeight ? (
            <Badge variant="secondary" className="font-semibold">{selectedWeight}</Badge>
          ) : null}
        </div>

        {!soldOut && (
          <div className="col-start-1 row-start-2 flex min-w-0 items-center justify-start border-t border-[#e3e9e2] pt-2 md:col-start-2 md:justify-between md:border-t-0 md:pt-0">
            <span className="sr-only md:not-sr-only md:mr-2 md:text-sm md:font-medium">Quantidade</span>
            <div className="flex min-w-0 items-center gap-0.5 rounded-full border border-border bg-white p-0.5 md:gap-1.5 md:p-1">
              <button
                type="button"
                aria-label="Diminuir quantidade do produto"
                disabled={quantity <= 1}
                onClick={() => setRequestedQuantity(quantity - 1)}
                className="grid size-9 shrink-0 place-items-center rounded-full text-primary disabled:opacity-40"
              >
                <Minus size={17} />
              </button>
              <span aria-live="polite" className="min-w-4 flex-1 text-center text-sm font-semibold md:min-w-5 md:text-base">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade do produto"
                disabled={remainingStock !== null && quantity >= remainingStock}
                onClick={() => setRequestedQuantity(quantity + 1)}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-white disabled:opacity-40"
              >
                <Plus size={17} />
              </button>
            </div>
          </div>
        )}

        {soldOut ? (
          <div className="col-span-2 row-start-2 min-w-0 space-y-2 border-t border-[#e3e9e2] pt-2 md:col-span-1 md:col-start-1 md:border-t-0 md:pt-0">
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <input
                value={restockContact}
                onChange={(e) => setRestockContact(e.target.value)}
                placeholder="WhatsApp ou e-mail"
                aria-label="WhatsApp ou e-mail para aviso de reposição"
                className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button
                type="button"
                onClick={requestRestock}
                disabled={restockSending}
                className="shrink-0 rounded-xl font-semibold"
              >
                {restockSending ? "Salvando..." : "Avise-me quando voltar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Informe seu WhatsApp ou e-mail. Se sua conta tiver e-mail, podemos utilizá-lo.
            </p>
          </div>
        ) : (
          <Button
            onClick={handleAddToCart}
            className="col-start-2 row-start-2 h-10 w-full min-w-0 gap-1 rounded-xl px-1.5 text-[11px] font-semibold shadow-sm transition-colors hover:shadow-md min-[390px]:text-xs md:col-start-1 md:h-12 md:gap-2 md:px-2 md:text-base"
          >
            <ShoppingCart className="size-4 shrink-0" />
            {onAddToCombo ? "Adicionar ao combo" : ctaVariant === "B" ? "Adicionar ao pedido" : "Adicionar ao Carrinho"}
          </Button>
        )}

      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent hideCloseButton className="flex h-[94dvh] max-h-[94dvh] w-[calc(100vw-12px)] flex-col gap-0 overflow-hidden rounded-2xl p-0 md:h-[90vh] md:max-h-[900px] sm:max-w-5xl lg:max-w-7xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes e voltar ao catálogo"
          title="Fechar e voltar"
          className="absolute right-3 top-3 z-50 grid h-11 w-11 place-items-center rounded-full border border-[#c9d9cd] bg-white text-[#075d3a] shadow-lg transition hover:bg-[#edf5e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075d3a]"
        >
          <X className="size-6" aria-hidden="true" />
        </button>
        <div ref={mobileScrollRef} onScroll={updateScrollHint} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain md:flex-row md:overflow-hidden">
          {/* Imagem grande / galeria + ação de engajamento */}
          <div className="flex w-full flex-col bg-[#fbfaf5] md:min-h-0 md:w-[44%] md:shrink-0 md:overflow-hidden">
            <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-[#f4f1e8] md:aspect-auto md:min-h-0 md:flex-1">
              <img src={currentImage} alt={product.nome} className="absolute inset-0 h-full w-full object-contain p-2 md:p-3" />
              <div className="absolute left-4 top-4 z-10 flex flex-col items-start gap-2">
                <Badge className="bg-sun text-sun-foreground hover:bg-sun">{categoriaNome}</Badge>
                {product.proteina && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-base font-semibold uppercase tracking-[0.04em] text-[#28513a] shadow-sm backdrop-blur">
                    <FoodTypeIcon label={String(product.proteina)} size={13} />
                    {String(product.proteina)}
                  </span>
                )}
              </div>
              {/* O estoque fica sobre a foto, sem deslocar o seletor ou o botão de compra. */}
              {remainingStock !== null && (
                <div
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "pointer-events-none absolute bottom-3 left-3 z-20 max-w-[calc(100%-1.5rem)] rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm",
                    remainingStock <= 0
                      ? "border-red-200 bg-red-100 text-red-800"
                      : remainingStock <= 5
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-[#d2e5d4] bg-[#e6f2e5] text-[#225a3a]",
                  )}
                >
                  {remainingStock <= 0
                    ? `Sem unidades disponíveis · ${selectedWeight}`
                    : remainingStock <= 5
                      ? `${remainingStock === 1 ? "Última unidade" : `Últimas ${remainingStock} unidades`} · ${selectedWeight}`
                      : `Estoque: ${remainingStock} unidades · ${selectedWeight}`}
                </div>
              )}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Foto anterior"
                    onClick={() =>
                      setCurrentImageIndex((p) => (p === 0 ? allImages.length - 1 : p - 1))
                    }
                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg hover:bg-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    aria-label="Próxima foto"
                    onClick={() => setCurrentImageIndex((p) => (p + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg hover:bg-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className={cn(
                    "absolute bottom-4 z-20 flex gap-2",
                    remainingStock !== null ? "right-3" : "left-1/2 -translate-x-1/2",
                  )}>
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`Ir para foto ${idx + 1}`}
                        aria-current={currentImageIndex === idx ? "true" : undefined}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={cn(
                          "rounded-full transition-all",
                          currentImageIndex === idx ? "h-2 w-6 bg-white" : "h-2 w-2 bg-white/50",
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Compra fixa abaixo da imagem: apenas o painel direito tem rolagem no desktop. */}
            <div className="hidden shrink-0 md:block">{purchaseControls}</div>
          </div>

          {/* Ficha do produto */}
          <div className="flex min-w-0 flex-1 flex-col px-4 pb-5 pt-4 sm:px-6 sm:pt-6 md:min-h-0 md:overflow-y-auto md:overscroll-contain md:p-6">
            <DialogHeader className="mb-4 text-left">
              <DialogTitle
                title={title}
                className="line-clamp-2 w-full min-w-0 break-words text-[18px] font-semibold leading-snug text-[#075636] sm:text-xl lg:text-2xl"
              >
                {codeMatch && (
                  <span className="mr-2 inline-block rounded-lg bg-[#e4ede1] px-2 py-1 align-middle text-sm font-semibold sm:text-base">
                    {codeMatch[1]}
                  </span>
                )}
                {codeMatch ? title.slice(codeMatch[0].length) : title}
              </DialogTitle>
            </DialogHeader>

            <div className="mb-6 space-y-4 text-base text-muted-foreground">
              {product.descricao && (
                <section>
                  <h4 className="mb-1 text-base font-semibold text-[#075636] sm:text-lg">Descrição</h4>
                  <p className="whitespace-pre-line text-sm leading-relaxed sm:text-base">{String(product.descricao)}</p>
                </section>
              )}
              {ingredientesDetalhados && (
                <div>
                  <h4 className="mb-1 text-lg font-semibold text-[#075636]">Ingredientes</h4>
                  <p className="text-sm leading-relaxed sm:text-base">{ingredientesDetalhados}</p>
                </div>
              )}

              <ProductFacts
                product={product}
                weight={selectedWeight}
                nutrition={currentNutritional}
                glutenStatus={glutenStatus}
                lactoseStatus={lactoseStatus}
              />
              {nextWeight && (
                <div className="mt-2 rounded-xl bg-[#edf5e6] px-3 py-2 text-base text-[#315440]">
                  <strong>Quer subir para {nextWeight}?</strong>{" "}
                  {upgradePriceDifference > 0
                    ? `Por +${formatBRL(upgradePriceDifference)}`
                    : "Sem aumento de preço"}
                  {` você leva +${parseInt(nextWeight) - parseInt(selectedWeight)}g de comida.`}
                </div>
              )}

              <TabelaNutricionalExpansivel
                valores={currentNutritional}
                aberta={tabelaNutricionalAberta}
                aoAlternar={() => setTabelaNutricionalAberta((aberta) => !aberta)}
              />

              {ehMarmita && (
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-[#075636]">
                      Como você quer receber?
                    </h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConsumo("congelada")}
                        className={cn(
                          "flex-1 rounded-xl border-2 py-3 text-base font-semibold transition-all",
                          consumo === "congelada"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-primary/30",
                        )}
                      >
                        Congelada
                      </button>
                      <button
                        type="button"
                        onClick={() => setConsumo("pronta")}
                        className={cn(
                          "flex-1 rounded-xl border-2 py-3 text-base font-semibold transition-all",
                          consumo === "pronta"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-primary/30",
                        )}
                      >
                        Pronta para consumo
                        <span className="block text-base font-medium text-muted-foreground mt-0.5">
                          +R$ 1,00
                        </span>
                      </button>
                    </div>
                  </div>

                  {consumo === "pronta" && (
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-background p-3">
                      <input
                        type="checkbox"
                        checked={garfoEFaca}
                        onChange={(e) => setGarfoEFaca(e.target.checked)}
                        className="size-4 accent-primary"
                      />
                      <span className="text-base font-medium text-foreground">
                        Quero garfo e faca
                        <span className="text-base font-medium text-muted-foreground ml-1">
                          +R$ 1,00
                        </span>
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {relatedProducts.length > 0 && (
              <section className="mt-2 border-t border-border pt-5">
                <div className="mb-3">
                  <p className="text-base font-semibold text-foreground">Você também pode gostar</p>
                  <p className="text-base text-muted-foreground">
                    Outras opções da mesma categoria.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {relatedProducts.map((candidate: any) => {
                    const relatedWeight = candidate.preco_300g
                      ? "300g"
                      : candidate.preco_400g
                        ? "400g"
                        : candidate.peso || "";
                    const relatedPrice =
                      relatedWeight === "300g" && candidate.preco_300g
                        ? candidate.preco_300g
                        : relatedWeight === "400g" && candidate.preco_400g
                          ? candidate.preco_400g
                          : candidate.preco;
                    return (
                      <div
                        key={candidate.id}
                        className="flex items-center gap-2 rounded-xl border bg-background p-2 sm:flex-col sm:items-stretch"
                      >
                        <img
                          src={imgUrl(candidate.imagem_url || candidate.imagem)}
                          alt={candidate.nome}
                          className="size-14 rounded-lg object-cover sm:h-24 sm:w-full"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-base font-semibold leading-snug">
                            {candidate.nome}
                          </p>
                          <p className="mt-1 text-base font-semibold text-primary">
                            {formatBRL(Number(relatedPrice || 0))}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addRelatedProduct(candidate)}
                          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-base font-semibold text-primary-foreground"
                        >
                          Adicionar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="mt-5 border-t border-[#075636]/10 pt-4">
              <p className="mb-3 text-center text-sm text-muted-foreground">
                Gostou deste prato ou ficou com alguma dúvida?
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#cedece] bg-white px-4 py-2 text-sm font-semibold text-[#075636] transition hover:bg-[#f0f7ee]"
                >
                  <Share2 className="size-4" aria-hidden="true" />
                  Compartilhar
                </button>
                <a
                  href={`https://wa.me/5547991607757?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre ${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#086e45] bg-[#086e45] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#075d3a]"
                >
                  <WhatsappIcon className="size-4" />
                  Tirar dúvidas no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
        {hasMoreBelow && (
          <div aria-hidden="true" className="z-20 flex shrink-0 items-center justify-center gap-1 bg-[#f3f7ef] py-1.5 text-xs font-semibold text-[#075d3a] md:hidden">
            <ChevronDown className="size-4" />
            Deslize para ver mais informações
          </div>
        )}
        <div className="z-30 shrink-0 pb-[env(safe-area-inset-bottom)] md:hidden">{purchaseControls}</div>
      </DialogContent>
    </Dialog>
  );
}

export function TabelaNutricionalExpansivel({
  valores,
  aberta,
  aoAlternar,
}: {
  valores: any;
  aberta: boolean;
  aoAlternar: () => void;
}) {
  if (!valores?.kcal) return null;

  const temColuna100g =
    valores.kcal_100g != null || valores.carb_100g != null || valores.prot_100g != null;

  const linhas = [
    {
      rotulo: "Valor energético",
      valor100g: valores.kcal_100g != null ? `${valores.kcal_100g} kcal` : "—",
      valor: valores.kcal != null ? `${valores.kcal} kcal` : "—",
      vd: valores.vd_kcal,
    },
    {
      rotulo: "Carboidratos totais",
      valor100g: valores.carb_100g != null ? `${valores.carb_100g} g` : "—",
      valor: valores.carb != null ? `${valores.carb} g` : "—",
      vd: valores.vd_carb,
    },
    {
      rotulo: "Açúcares totais",
      valor100g: valores.acucares_totais_100g != null ? `${valores.acucares_totais_100g} g` : "—",
      valor: valores.acucares_totais != null ? `${valores.acucares_totais} g` : "—",
      vd: null,
    },
    {
      rotulo: "Açúcares adicionados",
      valor100g:
        valores.acucares_adicionados_100g != null ? `${valores.acucares_adicionados_100g} g` : "—",
      valor: valores.acucares_adicionados != null ? `${valores.acucares_adicionados} g` : "—",
      vd: valores.vd_acucares_adicionados,
    },
    {
      rotulo: "Proteínas",
      valor100g: valores.prot_100g != null ? `${valores.prot_100g} g` : "—",
      valor: valores.prot != null ? `${valores.prot} g` : "—",
      vd: valores.vd_prot,
    },
    {
      rotulo: "Gorduras totais",
      valor100g: valores.gorduras_totais_100g != null ? `${valores.gorduras_totais_100g} g` : "—",
      valor: valores.gorduras_totais != null ? `${valores.gorduras_totais} g` : "—",
      vd: valores.vd_gorduras_totais,
    },
    {
      rotulo: "Gorduras saturadas",
      valor100g:
        valores.gorduras_saturadas_100g != null ? `${valores.gorduras_saturadas_100g} g` : "—",
      valor: valores.gorduras_saturadas != null ? `${valores.gorduras_saturadas} g` : "—",
      vd: valores.vd_gorduras_saturadas,
    },
    {
      rotulo: "Gorduras trans",
      valor100g: valores.gorduras_trans_100g != null ? `${valores.gorduras_trans_100g} g` : "—",
      valor: valores.gorduras_trans != null ? `${valores.gorduras_trans} g` : "—",
      vd: valores.vd_gorduras_trans,
    },
    {
      rotulo: "Fibra alimentar",
      valor100g: valores.fibra_100g != null ? `${valores.fibra_100g} g` : "—",
      valor: valores.fibra != null ? `${valores.fibra} g` : "—",
      vd: valores.vd_fibra,
    },
    {
      rotulo: "Sódio",
      valor100g: valores.sodio_100g != null ? `${valores.sodio_100g} mg` : "—",
      valor: valores.sodio != null ? `${valores.sodio} mg` : "—",
      vd: valores.vd_sodio,
    },
  ];

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background">
      <button
        type="button"
        onClick={aoAlternar}
        aria-expanded={aberta}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-semibold text-foreground"
      >
        Tabela nutricional
        <ChevronDown className={cn("size-5 shrink-0 transition-transform", aberta && "rotate-180")} />
      </button>

      {aberta && (
        <div className="min-w-0 border-t border-border px-2 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
          <div className="w-full min-w-0 overflow-hidden rounded-lg border border-foreground/20 text-[11px] leading-snug sm:text-sm">
            <div className="border-b border-foreground/20 px-2 py-2 text-center font-semibold">
              Informação nutricional
            </div>
            <div className="border-b border-foreground/20 px-2 py-2 text-xs sm:px-3 sm:text-sm">
              {valores.porcoes_embalagem != null && (
                <div>Porções por embalagem: {valores.porcoes_embalagem}</div>
              )}
              <div>Porção: {valores.porcao_g ?? "—"} g</div>
            </div>

            <table className="w-full table-fixed border-collapse" aria-label="Tabela nutricional do tamanho selecionado">
              {temColuna100g ? (
                <colgroup>
                  <col style={{ width: "43%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "23%" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
              ) : (
                <colgroup>
                  <col style={{ width: "68%" }} />
                  <col style={{ width: "32%" }} />
                </colgroup>
              )}
              <thead className="bg-muted/30">
                {temColuna100g ? (
                  <tr>
                    <th scope="col" className="break-words px-1.5 py-2 text-left font-semibold sm:px-3">Nutriente</th>
                    <th scope="col" className="border-l border-foreground/20 px-1 py-2 text-center font-semibold sm:px-2">100 g</th>
                    <th scope="col" className="border-l border-foreground/20 px-1 py-2 text-center font-semibold sm:px-2">
                      {valores.porcao_g != null ? `${valores.porcao_g} g` : "Porção"}
                    </th>
                    <th scope="col" className="border-l border-foreground/20 px-0.5 py-2 text-center font-semibold sm:px-2">% VD*</th>
                  </tr>
                ) : (
                  <tr>
                    <th scope="col" className="px-2 py-2 text-left font-semibold">Nutriente</th>
                    <th scope="col" className="border-l border-foreground/20 px-2 py-2 text-center font-semibold">Porção</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={linha.rotulo} className="border-t border-foreground/20">
                    <th scope="row" className="break-words px-1.5 py-2 text-left font-normal sm:px-3">
                      {linha.rotulo}
                    </th>
                    {temColuna100g && (
                      <td className="break-words border-l border-foreground/20 px-1 py-2 text-center sm:px-2">
                        {linha.valor100g}
                      </td>
                    )}
                    <td className="break-words border-l border-foreground/20 px-1 py-2 text-center font-semibold sm:px-2">
                      {linha.valor}
                    </td>
                    {temColuna100g && (
                      <td className="break-words border-l border-foreground/20 px-0.5 py-2 text-center sm:px-2">
                        {linha.vd != null ? linha.vd : "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
            * Percentual de valores diários fornecidos pela porção.
          </p>
        </div>
      )}
    </section>
  );
}

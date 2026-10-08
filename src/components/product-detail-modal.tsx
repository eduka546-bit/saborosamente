import { useEffect, useState } from "react";
import { isMarmita } from "@/lib/combo-rules";
import { isNoDiscount, precoMarmitaPorFaixa, precoCheioMarmita } from "@/lib/combo-rules";
import { usePrecosMarmita } from "@/lib/use-precos-marmita";
import { ProductSeals } from "@/components/product-seals";
import { FoodTypeIcon } from "@/components/food-type-icon";
import { ChevronDown, ChevronLeft, ChevronRight, Share2, ShoppingCart, Minus, Plus } from "lucide-react";
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
}

const stockForWeight = (product: any, weight: string): number | null => {
  const raw =
    weight === "200g"
      ? product?.estoque_200g
      : weight === "300g"
        ? product?.estoque_300g
        : weight === "400g"
          ? product?.estoque_400g
          : product?.estoque ?? product?.estoque_200g;

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
export function ProductDetailModal({ isOpen, onClose, product, allProducts = [] }: ProductDetailModalProps) {
  const { add, count, lines } = useCart();
  const tabelaPrecos = usePrecosMarmita();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  useEffect(() => { if (isOpen) setRequestedQuantity(1); }, [isOpen, product?.id]);

  // Tamanhos disponíveis
  const weights = (() => {
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
  const [restockContact, setRestockContact] = useState("");
  const [restockSending, setRestockSending] = useState(false);
  const ctaVariant = experimentVariant("product_modal_cta_v1");

  useEffect(() => {
    if (!isOpen || !product?.id) return;
    trackEvent("product_view", {
      produtoId: product.id,
      metadata: { origem: window.location.pathname.startsWith("/produto/") ? "product_page" : "modal" },
    });
    trackEvent("experiment_exposure", {
      produtoId: product.id,
      metadata: { experimento: "product_modal_cta_v1", variante: ctaVariant },
    });
  }, [isOpen, product?.id, ctaVariant]);

  if (!product) return null;

  const categoriaNome = product.categorias?.nome || product.categoria || "Marmita";
  const ehMarmita = isMarmita(product.nome, categoriaNome);

  const ingredientesDetalhados = Array.isArray(product.ingredientes) ? product.ingredientes.join(", ") : String(product.ingredientes || "");

  // Imagens (aceita imagem_url ou imagem, mais galeria opcional)
  const principal = imgUrl(product.imagem_url || product.imagem);
  const allImages = [principal, ...(Array.isArray(product.imagens) ? product.imagens : [])].filter(
    Boolean,
  );
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
  const projectedCount = count + quantity;

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

  const nutritionalForWeight = (w: string) =>
    w === "200g"
      ? product.tabela_nutricional_200g || product.tabela_nutricional
      : w === "300g"
        ? product.tabela_nutricional_300g || product.tabela_nutricional
        : w === "400g"
          ? product.tabela_nutricional_400g || product.tabela_nutricional
          : product.tabela_nutricional;

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
      if (!candidate || candidate.id === product.id || candidate.ativo === false || candidate.visivel_online === false) {
        return false;
      }
      const candidateCategory = candidate.categorias?.nome || candidate.categoria || "";
      if (/escolha você mesmo|escolha voce mesmo|monte você mesmo|monte voce mesmo/i.test(candidateCategory + " " + (candidate.nome || ""))) {
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
    const email = contact.includes("@") ? contact : null;
    const telefone = contact && !email ? contact : null;
    try {
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
        metadata: { gramatura: selectedWeight, canal: email ? "email" : telefone ? "telefone" : "conta" },
      });
      toast.success("Pronto! Vamos registrar seu interesse.");
      setRestockContact("");
    } catch {
      toast.error("Informe seu WhatsApp ou e-mail para receber o aviso.");
    } finally {
      setRestockSending(false);
    }
  };

  const handleAddToCart = () => {
    if (soldOut) {
      toast.info("Esta gramatura já atingiu a quantidade disponível.");
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[95vh] w-[95vw] overflow-y-auto md:overflow-hidden p-0 sm:max-w-5xl lg:max-w-7xl">
        <div className="flex flex-col md:flex-row min-h-full md:h-[90vh]">
          {/* Imagem grande / galeria + ação de engajamento */}
          <div className="flex w-full flex-col bg-[#fbfaf5] md:w-[44%] md:shrink-0">
            <div className="relative aspect-square w-full overflow-hidden bg-muted md:aspect-auto md:min-h-0 md:flex-1">
              <img src={currentImage} alt={product.nome} className="size-full object-cover" />
              <ProductSeals product={product} size={52} />
              <div className="absolute left-4 top-4 z-10 flex flex-col items-start gap-2">
                <Badge className="bg-sun text-sun-foreground hover:bg-sun">
                  {categoriaNome}
                </Badge>
                {product.proteina && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-base font-semibold uppercase tracking-[0.04em] text-[#28513a] shadow-sm backdrop-blur">
                    <FoodTypeIcon label={String(product.proteina)} size={13} />
                    {String(product.proteina)}
                  </span>
                )}
              </div>
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((p) => (p === 0 ? allImages.length - 1 : p - 1))
                    }
                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg hover:bg-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((p) => (p + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg hover:bg-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
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


            <div className="shrink-0 border-t bg-card px-5 py-4">
              {(() => {
                // Calcula preço efetivo: desconto progressivo (se marmita) + acréscimos
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
                  (garfoEFaca ? ADICIONAL_GARFO_FACA : 0);
                const precoFinal = precoComFaixa + adicional;
                const temDesconto = precoFinal < precoCheio + adicional || adicional > 0 || precoComFaixa < precoCheio;
                const precoCheioTotal = precoCheio + adicional;

                return (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-muted-foreground">Total · {quantity} {quantity === 1 ? "unidade" : "unidades"}</span>
                      {precoComFaixa < precoCheio ? (
                        <>
                          <span className="text-base font-semibold text-muted-foreground line-through">
                            {formatBRL(precoCheioTotal * quantity)}
                          </span>
                          <span className="text-3xl font-semibold text-[#086e45]">
                            {formatBRL(precoFinal * quantity)}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-semibold text-primary">
                          {formatBRL(precoFinal * quantity)}
                        </span>
                      )}
                    </div>
                    {selectedWeight && (
                      <Badge variant="secondary" className="font-semibold">
                        {selectedWeight}
                      </Badge>
                    )}
                  </div>
                );
              })()}

              {!soldOut && (
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-base font-medium">Quantidade</span>
                  <div className="flex items-center gap-3 rounded-full border border-border bg-white p-1">
                    <button type="button" aria-label="Diminuir quantidade do produto" disabled={quantity <= 1} onClick={() => setRequestedQuantity(quantity - 1)} className="grid size-9 place-items-center rounded-full text-primary disabled:opacity-40"><Minus size={18} /></button>
                    <span aria-live="polite" className="min-w-6 text-center text-base font-semibold">{quantity}</span>
                    <button type="button" aria-label="Aumentar quantidade do produto" disabled={remainingStock !== null && quantity >= remainingStock} onClick={() => setRequestedQuantity(quantity + 1)} className="grid size-9 place-items-center rounded-full bg-primary text-white disabled:opacity-40"><Plus size={18} /></button>
                  </div>
                </div>
              )}
              {remainingStock !== null && remainingStock > 0 && remainingStock <= 5 && (
                <p className="mb-2 text-center text-base font-semibold text-[#9a5b00]">
                  {remainingStock === 1 ? "Última unidade disponível" : `Últimas ${remainingStock} unidades disponíveis`}
                </p>
              )}
              {soldOut ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={restockContact}
                      onChange={(e) => setRestockContact(e.target.value)}
                      placeholder="WhatsApp ou e-mail"
                      aria-label="WhatsApp ou e-mail para aviso de reposição"
                      className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-3 text-base outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button
                      type="button"
                      onClick={requestRestock}
                      disabled={restockSending}
                      className="shrink-0 rounded-xl px-4 font-semibold"
                    >
                      {restockSending ? "Salvando..." : "Avise-me"}
                    </Button>
                  </div>
                  <p className="text-base text-muted-foreground">
                    Se você estiver logado, pode deixar o campo em branco.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  className="w-full h-14 rounded-2xl text-lg font-semibold gap-2 shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                  <ShoppingCart className="size-5" />
                  {ctaVariant === "B" ? "Adicionar ao pedido" : "Adicionar ao Carrinho"}
                </Button>
              )}
            </div>
          </div>

          {/* Ficha do produto */}
          <div className="flex min-w-0 flex-1 flex-col p-6 md:overflow-y-auto">
            <DialogHeader className="mb-4">
              <div className="flex items-start justify-between gap-3 pr-8">
                <DialogTitle className="text-2xl font-semibold text-primary-dark">
                  {product.tipo_produto === "complemento" ? product.nome.replace(/\s*150\s*g\s*$/i, "") : product.nome}
                </DialogTitle>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Compartilhar produto"
                  title="Compartilhar produto"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-primary transition hover:bg-primary/5"
                >
                  <Share2 className="size-4" />
                </button>
              </div>
            </DialogHeader>

            <div className="mb-6 space-y-4 text-base text-muted-foreground">
              {ingredientesDetalhados && (
                <div>
                  <h4 className="mb-1 text-lg font-semibold text-primary-dark">Ingredientes</h4>
                  <p className="leading-relaxed">{ingredientesDetalhados}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 rounded-2xl bg-muted/50 p-4">
                <div>
                  <h4 className="text-lg font-semibold tracking-normal text-primary-dark">
                    Valor Nutricional
                  </h4>
                  <div className="mt-1 flex flex-col items-start gap-1 text-base text-muted-foreground">
                    {currentNutritional?.kcal ? (
                      <>
                        <span className="font-semibold text-primary">
                          {currentNutritional.kcal} KCAL
                        </span>
                        <span>{currentNutritional.prot}g PROT</span>
                        <span>{currentNutritional.carb}g CARB</span>
                      </>
                    ) : (
                      <span className="italic">Consulte a embalagem para detalhes</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold tracking-normal text-primary-dark">
                    Restrições
                  </h4>
                  <div className="mt-1 flex flex-col gap-1 text-base text-muted-foreground">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="text-foreground">Glúten:</strong> {glutenStatus}
                      {product.sem_gluten && <img src="/selo-sem-gluten.png" alt="Sem glúten" className="size-5" />}
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="text-foreground">Lactose:</strong> {lactoseStatus}
                      {product.sem_lactose && <img src="/selo-sem-lactose.png" alt="Sem lactose" className="size-5" />}
                    </span>
                  </div>
                </div>
              </div>

              {weights.length > 1 && (
                <div>
                  <h4 className="mb-2 text-lg font-semibold text-primary-dark">Escolha o tamanho:</h4>
                  <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
                    {weights.map((w: string) => {
                      const nutrition = nutritionalForWeight(w);
                      const price = priceForWeight(w);
                      const selected = selectedWeight === w;
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => {
                            setSelectedWeight(w);
                            trackEvent("size_select", {
                              produtoId: product.id,
                              metadata: { gramatura: w },
                            });
                          }}
                          className={cn(
                            "min-w-0 rounded-xl border-2 px-2 py-3 text-center transition-all",
                            selected
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:border-primary/30",
                          )}
                        >
                          <span className="block text-base font-semibold">{weightLabel(w)}</span>
                          {isComboPronto && (
                            <span className="block text-base font-normal text-muted-foreground">
                              {w}
                            </span>
                          )}
                          <span className={cn("mt-1 block text-base font-semibold", selected ? "text-[#086e45]" : "text-foreground")}>
                            {formatBRL(price)}
                          </span>
                          {nutrition?.kcal != null && (
                            <span className="mt-1 flex flex-wrap justify-center gap-1 text-sm font-normal leading-tight text-muted-foreground">
                              <span>{nutrition.kcal} KCAL</span>
                              {nutrition?.prot != null && <><span aria-hidden="true">•</span><span>{nutrition.prot}g PROT</span></>}
                              {nutrition?.carb != null && <><span aria-hidden="true">•</span><span>{nutrition.carb}g CARB</span></>}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {nextWeight && (
                    <div className="mt-2 rounded-xl bg-[#edf5e6] px-3 py-2 text-base text-[#315440]">
                      <strong>Quer subir para {nextWeight}?</strong>{" "}
                      {upgradePriceDifference > 0
                        ? `Por +${formatBRL(upgradePriceDifference)}`
                        : "Sem aumento de preço"}
                      {` você leva +${parseInt(nextWeight) - parseInt(selectedWeight)}g de comida.`}
                    </div>
                  )}
                </div>
              )}

              <TabelaNutricionalExpansivel valores={currentNutritional} aberta={tabelaNutricionalAberta} aoAlternar={() => setTabelaNutricionalAberta((aberta) => !aberta)} />

              {ehMarmita && (
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-primary-dark">Como você quer receber?</h4>
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
                  <p className="text-base text-muted-foreground">Outras opções da mesma categoria.</p>
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
                      <div key={candidate.id} className="flex items-center gap-2 rounded-xl border bg-background p-2 sm:flex-col sm:items-stretch">
                        <img
                          src={imgUrl(candidate.imagem_url || candidate.imagem)}
                          alt={candidate.nome}
                          className="size-14 rounded-lg object-cover sm:h-24 sm:w-full"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-base font-semibold leading-snug">{candidate.nome}</p>
                          <p className="mt-1 text-base font-semibold text-primary">{formatBRL(Number(relatedPrice || 0))}</p>
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


          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabelaNutricionalExpansivel({
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
    valores.kcal_100g != null ||
    valores.carb_100g != null ||
    valores.prot_100g != null;

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
      valor100g:
        valores.acucares_totais_100g != null ? `${valores.acucares_totais_100g} g` : "—",
      valor: valores.acucares_totais != null ? `${valores.acucares_totais} g` : "—",
      vd: null,
    },
    {
      rotulo: "Açúcares adicionados",
      valor100g:
        valores.acucares_adicionados_100g != null
          ? `${valores.acucares_adicionados_100g} g`
          : "—",
      valor:
        valores.acucares_adicionados != null ? `${valores.acucares_adicionados} g` : "—",
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
      valor100g:
        valores.gorduras_totais_100g != null ? `${valores.gorduras_totais_100g} g` : "—",
      valor: valores.gorduras_totais != null ? `${valores.gorduras_totais} g` : "—",
      vd: valores.vd_gorduras_totais,
    },
    {
      rotulo: "Gorduras saturadas",
      valor100g:
        valores.gorduras_saturadas_100g != null
          ? `${valores.gorduras_saturadas_100g} g`
          : "—",
      valor:
        valores.gorduras_saturadas != null ? `${valores.gorduras_saturadas} g` : "—",
      vd: valores.vd_gorduras_saturadas,
    },
    {
      rotulo: "Gorduras trans",
      valor100g:
        valores.gorduras_trans_100g != null ? `${valores.gorduras_trans_100g} g` : "—",
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
    <section className="overflow-hidden rounded-2xl border border-border bg-background">
      <button
        type="button"
        onClick={aoAlternar}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-foreground"
      >
        Tabela nutricional
        <ChevronDown className={cn("size-5 transition-transform", aberta && "rotate-180")} />
      </button>

      {aberta && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <div className="overflow-x-auto rounded-lg border border-foreground/20 text-base sm:text-base">
            <div className="border-b border-foreground/20 py-2 text-center font-semibold">
              Informação nutricional
            </div>

            <div className="border-b border-foreground/20 px-3 py-2">
              {valores.porcoes_embalagem != null && (
                <div>Porções por embalagem: {valores.porcoes_embalagem}</div>
              )}
              <div>Porção: {valores.porcao_g || "—"} g</div>
            </div>

            {temColuna100g ? (
              <>
                <div className="grid min-w-[460px] grid-cols-[1.7fr_0.75fr_0.75fr_0.55fr] border-b border-foreground/20 bg-muted/30 font-semibold">
                  <span className="px-3 py-2">Nutriente</span>
                  <span className="border-l border-foreground/20 px-2 py-2 text-center">100 g</span>
                  <span className="border-l border-foreground/20 px-2 py-2 text-center">
                    {valores.porcao_g || "Porção"} g
                  </span>
                  <span className="border-l border-foreground/20 px-2 py-2 text-center">% VD*</span>
                </div>
                {linhas.map((linha) => (
                  <div
                    key={linha.rotulo}
                    className="grid min-w-[460px] grid-cols-[1.7fr_0.75fr_0.75fr_0.55fr] border-b border-foreground/20 last:border-b-0"
                  >
                    <span className="px-3 py-2">{linha.rotulo}</span>
                    <span className="border-l border-foreground/20 px-2 py-2 text-center">
                      {linha.valor100g}
                    </span>
                    <b className="border-l border-foreground/20 px-2 py-2 text-center">
                      {linha.valor}
                    </b>
                    <span className="border-l border-foreground/20 px-2 py-2 text-center">
                      {linha.vd != null ? linha.vd : "—"}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <>
                {linhas.map((linha) => (
                  <div
                    key={linha.rotulo}
                    className="grid grid-cols-[1fr_auto] border-b border-foreground/20 last:border-b-0"
                  >
                    <span className="px-3 py-2">{linha.rotulo}</span>
                    <b className="border-l border-foreground/20 px-3 py-2">{linha.valor}</b>
                  </div>
                ))}
              </>
            )}
          </div>
          <p className="mt-2 text-base text-muted-foreground">
            * Percentual de valores diários fornecidos pela porção.
          </p>
        </div>
      )}
    </section>
  );
}

import { useState } from "react";
import { isMarmita } from "@/lib/combo-rules";
import { isNoDiscount, precoMarmitaPorFaixa, precoCheioMarmita } from "@/lib/combo-rules";
import { usePrecosMarmita } from "@/lib/use-precos-marmita";
import { ProductSeals } from "@/components/product-seals";
import { ChevronDown, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { formatBRL } from "@/lib/products";
import { useCart, ADICIONAL_PRONTA, ADICIONAL_GARFO_FACA } from "@/lib/cart";
import { imgUrl } from "@/lib/image-proxy";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

// Modal de detalhes do produto — layout robusto (imagem grande + ficha completa),
// abre por cima do catálogo sem trocar de página.
export function ProductDetailModal({ isOpen, onClose, product }: ProductDetailModalProps) {
  const { add, count } = useCart();
  const tabelaPrecos = usePrecosMarmita();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const [selectedWeight, setSelectedWeight] = useState<string>(
    weights.includes("300g") ? "300g" : weights[0] || "",
  );

  // Opções (só marmitas): consumo pronta/congelada + garfo e faca.
  const [consumo, setConsumo] = useState<"congelada" | "pronta">("congelada");
  const [garfoEFaca, setGarfoEFaca] = useState(false);
  const [tabelaNutricionalAberta, setTabelaNutricionalAberta] = useState(false);

  if (!product) return null;

  const categoriaNome = product.categorias?.nome || product.categoria || "Marmita";
  const ehMarmita = isMarmita(product.nome, categoriaNome);

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

  const handleAddToCart = () => {
    const opcoes = ehMarmita
      ? { consumo, garfoEFaca: consumo === "pronta" ? garfoEFaca : false }
      : undefined;
    add(product.id, 1, selectedWeight, opcoes);
    const detalheOpcao = ehMarmita
      ? ` — ${consumo === "pronta" ? "pronta para consumo" : "congelada"}`
      : "";
    toast.success("Adicionado ao carrinho!", {
      description: `${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}${detalheOpcao}`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[95vh] w-[95vw] overflow-y-auto p-0 sm:max-w-4xl lg:max-w-5xl">
        <div className="flex flex-col md:flex-row min-h-full">
          {/* Imagem grande / galeria */}
          <div className="relative aspect-square w-full md:aspect-auto md:w-1/2 md:min-h-[500px] bg-muted overflow-hidden">
            <img src={currentImage} alt={product.nome} className="size-full object-cover" />
            <ProductSeals product={product} size={52} />
            <Badge className="absolute left-4 top-4 bg-sun text-sun-foreground hover:bg-sun z-10">
              {categoriaNome}
            </Badge>
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex((p) => (p === 0 ? allImages.length - 1 : p - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg hover:bg-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((p) => (p + 1) % allImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg hover:bg-white"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "rounded-full transition-all",
                        currentImageIndex === idx ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/50",
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Ficha do produto */}
          <div className="flex flex-1 flex-col p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-primary-dark">
                {product.nome}
              </DialogTitle>
            </DialogHeader>

            <div className="mb-6 space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="mb-1 font-bold text-foreground">Descrição / Ingredientes:</h4>
                <p className="leading-relaxed">
                  {product.descricao ||
                    "Ingredientes frescos e selecionados, preparados com o tempero especial da casa para garantir sabor e saúde na sua mesa."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-muted/50 p-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">
                    Valor Nutricional
                  </h4>
                  <div className="text-xs mt-1 flex flex-wrap gap-x-2 text-muted-foreground">
                    {currentNutritional?.kcal ? (
                      <>
                        <span className="font-bold text-primary">
                          {currentNutritional.kcal} KCAL
                        </span>
                        <span>|</span>
                        <span>{currentNutritional.carb}g CARB</span>
                        <span>|</span>
                        <span>{currentNutritional.prot}g PROT</span>
                      </>
                    ) : (
                      <span className="italic">Consulte a embalagem para detalhes</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">
                    Restrições
                  </h4>
                  <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                    <span>
                      <strong className="text-foreground">Glúten:</strong> {glutenStatus}
                    </span>
                    <span>
                      <strong className="text-foreground">Lactose:</strong> {lactoseStatus}
                    </span>
                  </div>
                </div>
              </div>

              {weights.length > 1 && (
                <div>
                  <h4 className="mb-2 font-bold text-foreground">Escolha o tamanho:</h4>
                  <div className="flex gap-2">
                    {weights.map((w: string) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSelectedWeight(w)}
                        className={cn(
                          "flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all",
                          selectedWeight === w
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-primary/30",
                        )}
                      >
                        {weightLabel(w)}
                        {isComboPronto && (
                          <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                            {w}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <TabelaNutricionalExpansivel valores={currentNutritional} aberta={tabelaNutricionalAberta} aoAlternar={() => setTabelaNutricionalAberta((aberta) => !aberta)} />

              {ehMarmita && (
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-2 font-bold text-foreground">Como você quer receber?</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConsumo("congelada")}
                        className={cn(
                          "flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all",
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
                          "flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all",
                          consumo === "pronta"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-primary/30",
                        )}
                      >
                        Pronta para consumo
                        <span className="block text-[10px] font-medium text-muted-foreground mt-0.5">
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
                      <span className="text-sm font-medium text-foreground">
                        Quero garfo e faca
                        <span className="text-[10px] font-medium text-muted-foreground ml-1">
                          +R$ 1,00
                        </span>
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 border-t">
              {(() => {
                // Calcula preço efetivo: desconto progressivo (se marmita) + acréscimos
                const semDesconto = isNoDiscount(categoriaNome);
                const podeTerDesconto = ehMarmita && !semDesconto;
                const precoCheio = podeTerDesconto
                  ? precoCheioMarmita(selectedWeight, tabelaPrecos) || currentPrice
                  : currentPrice;
                const precoComFaixa = podeTerDesconto
                  ? precoMarmitaPorFaixa(selectedWeight, count, precoCheio, tabelaPrecos)
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
                      <span className="text-xs font-bold text-muted-foreground">Valor</span>
                      {precoComFaixa < precoCheio ? (
                        <>
                          <span className="text-sm font-bold text-muted-foreground line-through">
                            {formatBRL(precoCheioTotal)}
                          </span>
                          <span className="text-3xl font-black text-[#086e45]">
                            {formatBRL(precoFinal)}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-black text-primary">
                          {formatBRL(precoFinal)}
                        </span>
                      )}
                    </div>
                    {selectedWeight && (
                      <Badge variant="secondary" className="font-bold">
                        {selectedWeight}
                      </Badge>
                    )}
                  </div>
                );
              })()}

              <Button
                onClick={handleAddToCart}
                className="w-full h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                <ShoppingCart className="size-5" />
                Adicionar ao Carrinho
              </Button>
            </div>
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
        className="flex w-full items-center justify-between px-4 py-3 text-left font-bold text-foreground"
      >
        Tabela nutricional
        <ChevronDown className={cn("size-5 transition-transform", aberta && "rotate-180")} />
      </button>

      {aberta && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <div className="overflow-x-auto rounded-lg border border-foreground/20 text-[11px] sm:text-xs">
            <div className="border-b border-foreground/20 py-2 text-center font-black uppercase">
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
                <div className="grid min-w-[460px] grid-cols-[1.7fr_0.75fr_0.75fr_0.55fr] border-b border-foreground/20 bg-muted/30 font-bold">
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
          <p className="mt-2 text-[10px] text-muted-foreground">
            * Percentual de valores diários fornecidos pela porção.
          </p>
        </div>
      )}
    </section>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { formatBRL, type Product } from "@/lib/products";
import { getPublicProducts } from "./products.functions";
import { getTaxas } from "./taxas.functions";
import { useQuery } from "@tanstack/react-query";
import { useAbandonedCart } from "@/hooks/useAbandonedCart";
import { ExitIntentModal } from "@/components/exit-intent-modal";
import {
  calcularFrete,
  isNoDiscount,
  precoMarmitaPorFaixa,
  precoCheioMarmita,
  normalizarPrecosMarmita,
  unidadesDoItem,
  MARMITA_PRICE_TABLE,
} from "@/lib/combo-rules";
import { supabase } from "@/integrations/supabase/client";

// Variável global para cache de produtos no lado do cliente
let cachedProducts: any[] = [];

const STORAGE_KEY = "saborosamente.cart.v1";
export const FREE_SHIPPING_FROM = 999999; // Desativado
export const SHIPPING_FEE = 14.9;

export const RULES = {
  MIN_ORDER_AMOUNT: 70,
  MIN_ORDER_QUANTITY: 5, // 5+ unidades → frete promocional em SBS
  SBS_DISCOUNTED_SHIPPING: 5.0, // R$ 5,00 para São Bento do Sul com 5+ unidades
  // Desconto progressivo — sopas e complementos CONTAM na qtd mas NÃO recebem desconto
  PROGRESSIVE_DISCOUNT: [
    { min: 5, discount: 0.03 },
    { min: 10, discount: 0.05 },
    { min: 20, discount: 0.07 },
  ],
};

// Re-exporta de combo-rules para uso no carrinho
export { isNoDiscount } from "@/lib/combo-rules";

// Mantém também para compatibilidade interna
export const NO_DISCOUNT_CATEGORIES = ["sopa", "sopas", "complemento", "complementos"];

/** Opções por item — atualmente só para marmitas. */
export interface CartItemOpcoes {
  /** "pronta" (para consumo) ou "congelada". */
  consumo: "pronta" | "congelada";
  /** Só relevante quando consumo === "pronta". */
  garfoEFaca?: boolean;
}

/** Item escolhido dentro de uma marmita personalizada. */
export interface CartCustomItem {
  grupo: string;
  nome: string;
  modoPreparo?: string;
  gramatura: number; // g
}

/** Marmita personalizada montada pelo cliente (não existe no catálogo). */
export interface CartCustomMarmita {
  label: string; // ex.: "Marmita Personalizada (M)"
  tamanhoSigla: string; // "P" | "M" | "G" | "GG"
  precoUnitario: number; // preço já calculado pela faixa de peso
  pesoTotal: number; // g
  itens: CartCustomItem[];
}

export interface CartLine {
  productId: string;
  quantity: number;
  weight?: string;
  opcoes?: CartItemOpcoes;
  /** Presente apenas em marmitas personalizadas (item sem produto de catálogo). */
  custom?: CartCustomMarmita;
}

export interface CartLineDetailed extends CartLine {
  /** Produto do catálogo. Ausente em itens personalizados (custom). */
  product: Product;
  subtotal: number;
  /** Preço unitário cheio (sem desconto de faixa) — usado para exibir economia. */
  precoCheio?: number;
}

interface CartContextValue {
  lines: CartLineDetailed[];
  count: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  selectedCity: string;
  selectedBairro: string;
  taxas: any[];
  exitIntentCoupon: string | null;
  setSelectedCity: (city: string) => void;
  setSelectedBairro: (bairro: string) => void;
  add: (productId: string, quantity?: number, weight?: string, opcoes?: CartItemOpcoes) => void;
  /** Adiciona uma marmita personalizada (item sem produto de catálogo). */
  addCustom: (custom: CartCustomMarmita, quantity: number) => void;
  setQuantity: (
    productId: string,
    quantity: number,
    weight?: string,
    opcoes?: CartItemOpcoes,
  ) => void;
  remove: (productId: string, weight?: string, opcoes?: CartItemOpcoes) => void;
  clear: () => void;
  markConverted: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

// Compara opções por item para identificar a mesma linha no carrinho.
// Duas marmitas iguais com opções diferentes (ex.: "congelada" vs "pronta")
// são linhas distintas e não devem ser mescladas.
function mesmaOpcao(a?: CartItemOpcoes, b?: CartItemOpcoes): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.consumo === b.consumo && Boolean(a.garfoEFaca) === Boolean(b.garfoEFaca);
}

// Constrói um Product "sintético" para uma marmita personalizada, de modo que
// o restante do carrinho (que espera line.product) funcione sem exceções.
function customToProduct(custom: CartCustomMarmita): Product {
  return {
    id: "custom",
    nome: custom.label,
    descricao: custom.itens.map((i) => i.nome).join(", "),
    ingredientes: [],
    preco: custom.precoUnitario,
    peso: `${custom.pesoTotal}g`,
    categoria: "Marmita Personalizada" as any,
    categorias: { nome: "Marmita Personalizada" },
    imagem: "/icon-app.jpg",
  } as Product;
}

function readStorage(): CartLine[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is CartLine =>
          typeof l === "object" &&
          l !== null &&
          typeof (l as CartLine).productId === "string" &&
          typeof (l as CartLine).quantity === "number",
      )
      .filter((l) => l.quantity > 0);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedBairro, setSelectedBairro] = useState<string>("");
  const [exitIntentCoupon, setExitIntentCoupon] = useState<string | null>(null);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [exitDiscountPercent, setExitDiscountPercent] = useState(5);

  // Efeito para carregar o carrinho logo no início
  useEffect(() => {
    const stored = readStorage();
    if (stored.length > 0) {
      setLines(stored);
    }
  }, []);

  const MOCK_TAXAS = useMemo(() => {
    const dataMap = {
      "São Bento do Sul": [
        { neighborhood: "Centro", rate: 8.9 },
        { neighborhood: "Progresso", rate: 8.9 },
        { neighborhood: "25 de Julho", rate: 10.5 },
        { neighborhood: "Alpino", rate: 17.0 },
        { neighborhood: "Boehmerwald", rate: 10.5 },
        { neighborhood: "Brasília", rate: 12.0 },
        { neighborhood: "Centenário", rate: 10.5 },
        { neighborhood: "Colonial", rate: 10.5 },
        { neighborhood: "Cruzeiro", rate: 10.5 },
        { neighborhood: "Industrial Sudoeste", rate: 11.0 },
        { neighborhood: "Loteamento Itália", rate: 9.5 },
        { neighborhood: "Mato Preto", rate: 12.0 },
        { neighborhood: "Oxford", rate: 11.0 },
        { neighborhood: "Parque Mariani", rate: 9.5 },
        { neighborhood: "Residencial Santa Fé", rate: 12.5 },
        { neighborhood: "Rio Negro", rate: 10.0 },
        { neighborhood: "Schramm", rate: 9.0 },
        { neighborhood: "Serra Alta", rate: 13.0 },
        { neighborhood: "Dona Francisca", rate: 15.0 },
        { neighborhood: "Bela Aliança", rate: 10.0 },
        { neighborhood: "Campo do Meio", rate: 10.0 },
        { neighborhood: "Castelo Branco", rate: 10.0 },
        { neighborhood: "Estrada das Neves", rate: 10.0 },
        { neighborhood: "Estrada dos Bugres", rate: 10.0 },
        { neighborhood: "Lençol", rate: 10.0 },
        { neighborhood: "Rio Natal", rate: 10.0 },
        { neighborhood: "Rio Represo", rate: 10.0 },
        { neighborhood: "Rio Vermelho Estação", rate: 10.0 },
        { neighborhood: "Rio Vermelho Povoado", rate: 10.0 },
        { neighborhood: "Sertãozinho", rate: 10.0 },
      ],
      "Rio Negrinho": [
        "Ceramarte",
        "Alegre",
        "Bairro Preto",
        "Barro Preto",
        "Bela Vista",
        "Campo Lençol",
        "Centro",
        "Colônia Olsen",
        "Cruzeiro",
        "Industrial Norte",
        "Industrial Sul",
        "Jardim Hantschel",
        "Pinheirinho",
        "Quitandinha",
        "Rio Casa de Pedra",
        "Rio Preto",
        "Rio dos Bugres",
        "Serro Azul",
        "São Pedro",
        "São Rafael",
        "Vila Nova",
        "Vista Alegre",
        "Volta Grande",
      ],
      "Campo Alegre": [
        "Avenquinha",
        "Bateias de Baixo",
        "Bateias de Cima",
        "Belo Horizonte",
        "Cascata",
        "Cascatas",
        "Centro",
        "Corredeiras",
        "Fragosos",
        "Lajeado",
        "Mato Limpo",
        "Pinhais",
        "Povoado de Fragosos",
        "Ribeirão do Meio",
        "Rio Represo",
        "Rio do Bugre",
        "Saltinho",
        "Santo Antônio",
        "São Miguel",
        "Vila Novo Mundo",
      ],
      Corupá: [
        "Ano Bom",
        "Bomplandt",
        "Caminho Pequeno",
        "Centro",
        "Faxinal",
        "Itapocu",
        "Izabel",
        "João Tozini",
        "Pedra de Amolar",
        "Poço D'Anta",
        "Putinga",
        "Rio Correa",
        "Rio Feio",
        "Rio Novo",
        "Rio Paulo",
        "Rio da Veada",
        "Seminário",
        "XV de Novembro",
      ],
      Mafra: [
        "Augusta Vitória",
        "Autódromo",
        "Avencal São Sebastião",
        "Avencal de Cima",
        "Avencal do Meio",
        "Bairro do Autódromo",
        "Bela Vista do Sul",
        "Bituvinha",
        "Butiá dos Tabordas",
        "Campina Konkel",
        "Campo da Lança",
        "Caçador",
        "Centro I - Baixada",
        "Centro II - Alto de Mafra",
        "Centro III Monte Alegre",
        "Espigão do Bugre",
        "Faxinal",
        "Fazenda Potreiro",
        "General Brito",
        "Imbuial",
        "Jardim América",
        "Jardim Novo Horizonte",
        "Jardim do Moinho",
        "Maurício Caillet",
        "Nossa Senhora Aparecida",
        "Passo",
        "Restinga",
        "Rio Preto",
        "Rio da Areia",
        "Rio da Areia de Baixo",
        "Rio da Areia de Cima",
        "Rio do Cedro",
        "Saltinho do Canivete",
        "São Lourenço",
        "Vila Argentina",
        "Vila Buenos Aires",
        "Vila Clementina",
        "Vila Edson Luis",
        "Vila Ferroviária",
        "Vila Formosa",
        "Vila Industrial",
        "Vila Ivete",
        "Vila Nova",
        "Vila Ruthes",
        "Vila Solidariedade",
        "Vila Velha",
        "Vila das Flores",
        "Vilinha",
        "Vista Alegre",
      ],
      Piên: [
        "Aterrado Alto",
        "Avencal",
        "Boa Vista",
        "Cachoeirinha",
        "Campina dos Crespins",
        "Campina dos Maia",
        "Campo Novo",
        "Centro",
        "Cerro Verde",
        "Gramados",
        "Lageado",
        "Letreiro",
        "Mosquito",
        "Palmito",
        "Palmito de Cima",
        "Picacinho",
        "Pocinho",
        "Poço Frio",
        "Poço Frio dos Moreiras",
        "Quicé",
        "Trigolândia",
        "Vermelhinho",
      ],
      "Rio Negro": [
        "Bairro Alto",
        "Bairro do Seminário",
        "Bom Jesus",
        "Bom Jesus do Rio Negro",
        "Campina dos Andrades",
        "Campo do Gado",
        "Centro",
        "Estação Nova",
        "Fazendinha",
        "Jardim Zelinda",
        "Lageado dos Vieiras",
        "Maitaca",
        "Passa Três",
        "Passo do Valo",
        "Retiro",
        "Roseira",
        "Seminário",
        "Sítio dos Rauen",
        "Tijuco Preto",
        "Vila Militar",
        "Vila Paraná",
        "Vila Paraíso",
        "Volta Grande",
      ],
    };

    const flat: any[] = [];
    let id = 1000;
    Object.entries(dataMap).forEach(([city, neighborhoods]) => {
      neighborhoods.forEach((n) => {
        const name = typeof n === "string" ? n : n.neighborhood;
        const rate = typeof n === "string" ? 10.0 : n.rate;
        flat.push({ id: id++, bairro: name, taxa: rate, cidade: city, ativo: true });
      });
    });
    return flat;
  }, []);

  const { data: serverTaxas } = useQuery({
    queryKey: ["taxas"],
    queryFn: () => getTaxas(),
  });

  const taxas = serverTaxas || MOCK_TAXAS;

  // Tabela de preços das marmitas — editável no admin (Parâmetros).
  const { data: settingsPrecos } = useQuery({
    queryKey: ["site-settings-precos"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("parametros_loja").maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
  const tabelaPrecos = normalizarPrecosMarmita(
    (settingsPrecos as any)?.parametros_loja?.precos_marmita,
  );

  const { data: serverProducts = [] } = useQuery({
    queryKey: ["public-products-cart"],
    queryFn: () => getPublicProducts(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  useEffect(() => {
    if (serverProducts.length > 0) {
      cachedProducts = serverProducts.map((p) => ({
        ...p,
        categoria: p.categorias?.nome || "Marmita",
        imagem: p.imagem_url,
      }));
      // Forçar atualização do estado das linhas para que o useMemo recalcule os detalhes
      // agora que temos os produtos carregados
      setLines((prev) => [...prev]);
    }
  }, [serverProducts]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = readStorage();
        // Só salva se o estado atual for diferente do que está no storage
        // para evitar sobrescrever com array vazio durante a hidratação inicial
        const isInitialLoad = lines.length === 0 && stored.length > 0;
        if (!isInitialLoad) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
        }
      }
    } catch {
      /* localStorage indisponível (modo privado/quota) — ignora */
    }
  }, [lines]);

  const findProduct = useCallback((id: string) => {
    return cachedProducts.find((p) => p.id === id);
  }, []);

  const add = useCallback(
    (productId: string, quantity = 1, weight?: string, opcoes?: CartItemOpcoes) => {
      setLines((prev) => {
        const existing = prev.find(
          (l) => l.productId === productId && l.weight === weight && mesmaOpcao(l.opcoes, opcoes),
        );
        if (existing) {
          return prev.map((l) =>
            l.productId === productId && l.weight === weight && mesmaOpcao(l.opcoes, opcoes)
              ? { ...l, quantity: l.quantity + quantity }
              : l,
          );
        }
        return [...prev, { productId, quantity, weight, opcoes }];
      });
    },
    [],
  );

  // Marmita personalizada: cada combinação é uma linha única (id sintético).
  const addCustom = useCallback((custom: CartCustomMarmita, quantity: number) => {
    const uid =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(36).slice(2);
    setLines((prev) => [...prev, { productId: `custom:${uid}`, quantity, custom }]);
  }, []);

  const setQuantity = useCallback(
    (productId: string, quantity: number, weight?: string, opcoes?: CartItemOpcoes) => {
      setLines((prev) =>
        quantity <= 0
          ? prev.filter(
              (l) =>
                !(l.productId === productId && l.weight === weight && mesmaOpcao(l.opcoes, opcoes)),
            )
          : prev.map((l) =>
              l.productId === productId && l.weight === weight && mesmaOpcao(l.opcoes, opcoes)
                ? { ...l, quantity }
                : l,
            ),
      );
    },
    [],
  );

  const remove = useCallback((productId: string, weight?: string, opcoes?: CartItemOpcoes) => {
    setLines((prev) =>
      prev.filter(
        (l) => !(l.productId === productId && l.weight === weight && mesmaOpcao(l.opcoes, opcoes)),
      ),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  // ── Carrinho abandonado ───────────────────────────────────────────────────
  // Precisa do value calculado abaixo, então usamos um useMemo intermediário
  // para passar lines detalhadas ao hook sem duplicar a lógica.
  const detailedForHook = useMemo(
    () =>
      lines.flatMap((line) => {
        // Marmita personalizada: dados vêm do próprio item, não do catálogo.
        if (line.custom) {
          const product = customToProduct(line.custom);
          return [{ ...line, product, subtotal: line.custom.precoUnitario * line.quantity }];
        }
        const product = cachedProducts.find((p) => p.id === line.productId);
        if (!product) return [];
        const price =
          line.weight === "300g" && product.preco_300g
            ? product.preco_300g
            : line.weight === "400g" && product.preco_400g
              ? product.preco_400g
              : product.preco;
        return [{ ...line, product, subtotal: price * line.quantity }];
      }),
    [lines],
  );

  const totalForHook = useMemo(
    () => detailedForHook.reduce((s, l) => s + l.subtotal, 0),
    [detailedForHook],
  );

  const { markConverted } = useAbandonedCart({
    lines: detailedForHook,
    total: totalForHook,
    onExitIntent: (coupon, discountPercent) => {
      setExitIntentCoupon(coupon);
      setExitDiscountPercent(discountPercent);
      setExitModalOpen(true);
    },
  });

  const value = useMemo<CartContextValue>(() => {
    // Resolve os produtos das linhas (ignora os que ainda não carregaram).
    // Marmitas personalizadas usam um Product sintético (customToProduct).
    const linhasResolvidas = lines.flatMap((line) => {
      if (line.custom) return [{ line, product: customToProduct(line.custom) }];
      const product = cachedProducts.find((p) => p.id === line.productId);
      return product ? [{ line, product }] : [];
    });

    // Quantidade total do carrinho — define a faixa de preço das marmitas.
    // Sopas e complementos CONTAM aqui, mas não recebem o preço de faixa.
    // Combos prontos contam como 5/10/20 unidades (unidadesDoItem), empurrando a
    // faixa das marmitas avulsas, mesmo sendo uma única linha no carrinho.
    // Marmitas personalizadas contam a própria quantidade (1 un cada).
    const count = linhasResolvidas.reduce((acc, { line, product }) => {
      const un = line.custom ? 1 : unidadesDoItem(product.nome, product.categoria);
      return acc + line.quantity * un;
    }, 0);

    const detailed = linhasResolvidas.map<CartLineDetailed>(({ line, product }) => {
      // Marmita personalizada: preço fixo próprio, sem desconto de faixa.
      if (line.custom) {
        return {
          ...line,
          product,
          subtotal: line.custom.precoUnitario * line.quantity,
          precoCheio: line.custom.precoUnitario,
        };
      }
      const categoria = product.categoria ?? "";
      const isSopa = categoria.toLowerCase().includes("sopa");
      const semDesconto = isNoDiscount(categoria);

      // Preço "cheio" do item (sem desconto de faixa)
      let precoCheio: number;
      if (isSopa) {
        precoCheio = 18.0;
      } else if (semDesconto) {
        // Complementos / combos prontos: preço próprio do produto por tamanho.
        precoCheio =
          line.weight === "300g" && product.preco_300g
            ? product.preco_300g
            : line.weight === "400g" && product.preco_400g
              ? product.preco_400g
              : product.preco;
      } else {
        // Marmita: preço cheio (faixa unitária) por tamanho.
        precoCheio = precoCheioMarmita(line.weight, tabelaPrecos) || product.preco;
      }

      // Preço efetivo pago pelo item — marmitas usam a faixa por quantidade total.
      const precoEfetivo =
        isSopa || semDesconto
          ? precoCheio
          : precoMarmitaPorFaixa(line.weight, count, precoCheio, tabelaPrecos);

      return {
        ...line,
        product,
        subtotal: precoEfetivo * line.quantity,
        precoCheio,
      };
    });

    // Subtotal = soma dos preços CHEIOS (o desconto aparece separado).
    const subtotal = detailed.reduce((acc, l) => acc + (l.precoCheio ?? 0) * l.quantity, 0);

    // Taxa base do frete: taxa específica do bairro selecionado, ou a padrão.
    let taxaBase = SHIPPING_FEE;
    if (selectedBairro) {
      const taxaItem = taxas.find((t) => t.bairro === selectedBairro && t.cidade === selectedCity);
      if (taxaItem) {
        taxaBase = taxaItem.taxa;
      }
    }

    // Frete e desconto calculados por funções puras testadas (ver combo-rules.ts).
    const shipping = calcularFrete({
      subtotal,
      totalUnidades: count,
      taxaBase,
      cidade: selectedCity,
      freteGratisAPartirDe: FREE_SHIPPING_FROM,
      minQuantidadeSBS: RULES.MIN_ORDER_QUANTITY,
      fretePromoSBS: RULES.SBS_DISCOUNTED_SHIPPING,
    });

    // Total efetivo (já com preço de faixa nas marmitas).
    const subtotalEfetivo = detailed.reduce((acc, l) => acc + l.subtotal, 0);
    // Desconto = quanto o cliente economiza vs. preço cheio.
    const discount = Math.max(0, subtotal - subtotalEfetivo);

    return {
      lines: detailed,
      count,
      subtotal,
      discount,
      shipping,
      total: subtotal - discount + shipping,
      selectedCity,
      selectedBairro,
      taxas,
      setSelectedCity,
      setSelectedBairro,

      add,
      addCustom,
      setQuantity,
      remove,
      clear,
      exitIntentCoupon,
      markConverted,
    };
  }, [lines, serverProducts, selectedCity, selectedBairro, tabelaPrecos, add, addCustom, setQuantity, remove, clear, exitIntentCoupon, markConverted]);

  return (
    <>
      <CartContext.Provider value={value}>
        {children}
      </CartContext.Provider>
      <ExitIntentModal
        isOpen={exitModalOpen}
        onClose={() => setExitModalOpen(false)}
        coupon={exitIntentCoupon ?? ""}
        cartTotal={value.total}
        cartCount={value.count}
        discountPercent={exitDiscountPercent}
        onApplyCoupon={(coupon) => {
          setExitIntentCoupon(coupon);
          setExitModalOpen(false);
        }}
      />
    </>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}

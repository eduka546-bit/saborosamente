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


// Variável global para cache de produtos no lado do cliente
let cachedProducts: any[] = [];

const STORAGE_KEY = "saborosamente.cart.v1";
export const FREE_SHIPPING_FROM = 120;
export const SHIPPING_FEE = 14.9;

export const RULES = {
  MIN_ORDER_AMOUNT: 70,
  MIN_ORDER_QUANTITY: 5,
  SBS_DISCOUNTED_SHIPPING: 5,
};

export interface CartLine {
  productId: string;
  quantity: number;
  weight?: string;
}

export interface CartLineDetailed extends CartLine {
  product: Product;
  subtotal: number;
}

interface CartContextValue {
  lines: CartLineDetailed[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  selectedCity: string;
  selectedBairro: string;
  taxas: any[];
  setSelectedCity: (city: string) => void;
  setSelectedBairro: (bairro: string) => void;
  add: (productId: string, quantity?: number, weight?: string) => void;
  setQuantity: (productId: string, quantity: number, weight?: string) => void;
  remove: (productId: string, weight?: string) => void;
  clear: () => void;
}



const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartLine[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
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

  const MOCK_TAXAS = [
    // São Bento do Sul
    { id: 1, bairro: "Centro (SBS)", taxa: 8.90, tempo: "30-45 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 2, bairro: "Progresso (SBS)", taxa: 8.90, tempo: "30-45 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 3, bairro: "25 de Julho (SBS)", taxa: 10.50, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 4, bairro: "Alpino (SBS)", taxa: 17.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 5, bairro: "Boehmerwald (SBS)", taxa: 10.50, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 6, bairro: "Brasília (SBS)", taxa: 12.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 7, bairro: "Centenário (SBS)", taxa: 10.50, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 8, bairro: "Colonial (SBS)", taxa: 10.50, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 9, bairro: "Cruzeiro (SBS)", taxa: 10.50, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 10, bairro: "Industrial Sudoeste (SBS)", taxa: 11.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 11, bairro: "Loteamento Itália (SBS)", taxa: 9.50, tempo: "30-45 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 12, bairro: "Mato Preto (SBS)", taxa: 12.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 13, bairro: "Oxford (SBS)", taxa: 11.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 14, bairro: "Parque Mariani (SBS)", taxa: 9.50, tempo: "30-45 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 15, bairro: "Residencial Santa Fé (SBS)", taxa: 12.50, tempo: "45-70 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 16, bairro: "Rio Negro (SBS)", taxa: 10.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 17, bairro: "Schramm (SBS)", taxa: 9.00, tempo: "30-45 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 18, bairro: "Serra Alta (SBS)", taxa: 13.00, tempo: "45-70 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 19, bairro: "Dona Francisca (SBS)", taxa: 15.00, tempo: "50-80 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 20, bairro: "Bela Aliança (SBS)", taxa: 10.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 21, bairro: "Campo do Meio (SBS)", taxa: 10.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 22, bairro: "Castelo Branco (SBS)", taxa: 10.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 23, bairro: "Estrada das Neves (SBS)", taxa: 10.00, tempo: "45-70 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 24, bairro: "Estrada dos Bugres (SBS)", taxa: 10.00, tempo: "45-70 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 25, bairro: "Lençol (SBS)", taxa: 10.00, tempo: "40-60 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 26, bairro: "Rio Natal (SBS)", taxa: 10.00, tempo: "50-80 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 27, bairro: "Rio Represo (SBS)", taxa: 10.00, tempo: "50-80 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 28, bairro: "Rio Vermelho Estação (SBS)", taxa: 10.00, tempo: "50-80 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 29, bairro: "Rio Vermelho Povoado (SBS)", taxa: 10.00, tempo: "50-80 min", ativo: true, cidade: "São Bento do Sul" },
    { id: 30, bairro: "Sertãozinho (SBS)", taxa: 10.00, tempo: "45-70 min", ativo: true, cidade: "São Bento do Sul" },
    // Rio Negrinho
    { id: 31, bairro: "Centro (RN)", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 32, bairro: "Vila Nova (RN)", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    { id: 33, bairro: "Quitandinha (RN)", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Rio Negrinho" },
    // Campo Alegre
    { id: 54, bairro: "Centro (CA)", taxa: 10.00, tempo: "45-60 min", ativo: true, cidade: "Campo Alegre" },
    // ... simplificado por agora para não sobrecarregar
  ];

  const { data: serverTaxas } = useQuery({
    queryKey: ["taxas"],
    queryFn: () => getTaxas(),
  });

  const taxas = serverTaxas || MOCK_TAXAS;


  
  const { data: serverProducts = [] } = useQuery({
    queryKey: ["public-products-cart"],
    queryFn: () => getPublicProducts(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  useEffect(() => {
    if (serverProducts.length > 0) {
      cachedProducts = serverProducts.map(p => ({
        ...p,
        categoria: p.categorias?.nome || "Marmita",
        imagem: p.imagem_url
      }));
    }
  }, [serverProducts]);

  useEffect(() => {
    setLines(readStorage());
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
      }
    } catch {}
  }, [lines]);

  const findProduct = useCallback((id: string) => {
    return cachedProducts.find(p => p.id === id);
  }, []);

  const add = useCallback((productId: string, quantity = 1, weight?: string) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId && l.weight === weight);
      if (existing) {
        return prev.map((l) =>
          l.productId === productId && l.weight === weight ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }
      return [...prev, { productId, quantity, weight }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number, weight?: string) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => !(l.productId === productId && l.weight === weight))
        : prev.map((l) => (l.productId === productId && l.weight === weight ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((productId: string, weight?: string) => {
    setLines((prev) => prev.filter((l) => !(l.productId === productId && l.weight === weight)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const detailed = lines.flatMap<CartLineDetailed>((line) => {
      const product = cachedProducts.find((p) => p.id === line.productId);
      if (!product) return [];
      return [{ ...line, product, subtotal: product.preco * line.quantity }];
    });

    const subtotal = detailed.reduce((acc, l) => acc + l.subtotal, 0);
    const count = detailed.reduce((acc, l) => acc + l.quantity, 0);

    // Lógica de Frete e Regras de Negócio
    let shipping = SHIPPING_FEE;

    // Se tiver bairro selecionado, pegar a taxa específica
    if (selectedBairro) {
      const taxaItem = taxas.find(t => t.bairro === selectedBairro && t.cidade === selectedCity);
      if (taxaItem) {
        shipping = taxaItem.taxa;
      }
    }

    if (subtotal === 0 || subtotal >= FREE_SHIPPING_FROM) {
      shipping = 0;
    }

    // Se tiver cidade selecionada, podemos aplicar regras específicas
    if (selectedCity) {
      const isSBS = selectedCity.toLowerCase().includes("são bento do sul");
      const meetsMinRules = subtotal >= RULES.MIN_ORDER_AMOUNT || count >= RULES.MIN_ORDER_QUANTITY;

      if (isSBS && meetsMinRules) {
        shipping = RULES.SBS_DISCOUNTED_SHIPPING;
      }
    }


    return {
      lines: detailed,
      count,
      subtotal,
      shipping,
      total: subtotal + shipping,
      selectedCity,
      selectedBairro,
      taxas,
      setSelectedCity,
      setSelectedBairro,

      add,
      setQuantity,
      remove,
      clear,
    };
  }, [lines, serverProducts, selectedCity, selectedBairro, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
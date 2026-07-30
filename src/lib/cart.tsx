import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProduct, type Product } from "@/lib/products";

const STORAGE_KEY = "saborosamente.cart.v1";
export const FREE_SHIPPING_FROM = 120;
export const SHIPPING_FEE = 14.9;

export interface CartLine {
  productId: string;
  quantity: number;
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
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
      .filter((l) => l.quantity > 0 && Boolean(getProduct(l.productId)));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  // Hidratação apenas no cliente: evita divergência entre SSR e browser.
  useEffect(() => {
    setLines(readStorage());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage indisponível (modo privado): carrinho segue em memória */
    }
  }, [lines]);

  const add = useCallback((productId: string, quantity = 1) => {
    if (!getProduct(productId) || quantity <= 0) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }
      return [...prev, { productId, quantity }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const detailed = lines.flatMap<CartLineDetailed>((line) => {
      const product = getProduct(line.productId);
      if (!product) return [];
      return [{ ...line, product, subtotal: product.preco * line.quantity }];
    });
    const subtotal = detailed.reduce((acc, l) => acc + l.subtotal, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
    return {
      lines: detailed,
      count: detailed.reduce((acc, l) => acc + l.quantity, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [lines, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
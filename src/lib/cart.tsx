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
  PROGRESSIVE_DISCOUNT: [
    { minItems: 5, discountPercent: 3 },
    { minItems: 10, discountPercent: 5 },
    { minItems: 20, discountPercent: 7 },
  ],
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
  discount: number;
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
        { neighborhood: "Centro", rate: 8.90 }, { neighborhood: "Progresso", rate: 8.90 },
        { neighborhood: "25 de Julho", rate: 10.50 }, { neighborhood: "Alpino", rate: 17.00 },
        { neighborhood: "Boehmerwald", rate: 10.50 }, { neighborhood: "Brasília", rate: 12.00 },
        { neighborhood: "Centenário", rate: 10.50 }, { neighborhood: "Colonial", rate: 10.50 },
        { neighborhood: "Cruzeiro", rate: 10.50 }, { neighborhood: "Industrial Sudoeste", rate: 11.00 },
        { neighborhood: "Loteamento Itália", rate: 9.50 }, { neighborhood: "Mato Preto", rate: 12.00 },
        { neighborhood: "Oxford", rate: 11.00 }, { neighborhood: "Parque Mariani", rate: 9.50 },
        { neighborhood: "Residencial Santa Fé", rate: 12.50 }, { neighborhood: "Rio Negro", rate: 10.00 },
        { neighborhood: "Schramm", rate: 9.00 }, { neighborhood: "Serra Alta", rate: 13.00 },
        { neighborhood: "Dona Francisca", rate: 15.00 }, { neighborhood: "Bela Aliança", rate: 10.00 },
        { neighborhood: "Campo do Meio", rate: 10.00 }, { neighborhood: "Castelo Branco", rate: 10.00 },
        { neighborhood: "Estrada das Neves", rate: 10.00 }, { neighborhood: "Estrada dos Bugres", rate: 10.00 },
        { neighborhood: "Lençol", rate: 10.00 }, { neighborhood: "Rio Natal", rate: 10.00 },
        { neighborhood: "Rio Represo", rate: 10.00 }, { neighborhood: "Rio Vermelho Estação", rate: 10.00 },
        { neighborhood: "Rio Vermelho Povoado", rate: 10.00 }, { neighborhood: "Sertãozinho", rate: 10.00 }
      ],
      "Rio Negrinho": [
        "Ceramarte", "Alegre", "Bairro Preto", "Barro Preto", "Bela Vista", "Campo Lençol", "Centro", "Colônia Olsen", "Cruzeiro", "Industrial Norte", "Industrial Sul", "Jardim Hantschel", "Pinheirinho", "Quitandinha", "Rio Casa de Pedra", "Rio Preto", "Rio dos Bugres", "Serro Azul", "São Pedro", "São Rafael", "Vila Nova", "Vista Alegre", "Volta Grande"
      ],
      "Campo Alegre": [
        "Avenquinha", "Bateias de Baixo", "Bateias de Cima", "Belo Horizonte", "Cascata", "Cascatas", "Centro", "Corredeiras", "Fragosos", "Lajeado", "Mato Limpo", "Pinhais", "Povoado de Fragosos", "Ribeirão do Meio", "Rio Represo", "Rio do Bugre", "Saltinho", "Santo Antônio", "São Miguel", "Vila Novo Mundo"
      ],
      "Corupá": [
        "Ano Bom", "Bomplandt", "Caminho Pequeno", "Centro", "Faxinal", "Itapocu", "Izabel", "João Tozini", "Pedra de Amolar", "Poço D'Anta", "Putinga", "Rio Correa", "Rio Feio", "Rio Novo", "Rio Paulo", "Rio da Veada", "Seminário", "XV de Novembro"
      ],
      "Mafra": [
        "Augusta Vitória", "Autódromo", "Avencal São Sebastião", "Avencal de Cima", "Avencal do Meio", "Bairro do Autódromo", "Bela Vista do Sul", "Bituvinha", "Butiá dos Tabordas", "Campina Konkel", "Campo da Lança", "Caçador", "Centro I - Baixada", "Centro II - Alto de Mafra", "Centro III Monte Alegre", "Espigão do Bugre", "Faxinal", "Fazenda Potreiro", "General Brito", "Imbuial", "Jardim América", "Jardim Novo Horizonte", "Jardim do Moinho", "Maurício Caillet", "Nossa Senhora Aparecida", "Passo", "Restinga", "Rio Preto", "Rio da Areia", "Rio da Areia de Baixo", "Rio da Areia de Cima", "Rio do Cedro", "Saltinho do Canivete", "São Lourenço", "Vila Argentina", "Vila Buenos Aires", "Vila Clementina", "Vila Edson Luis", "Vila Ferroviária", "Vila Formosa", "Vila Industrial", "Vila Ivete", "Vila Nova", "Vila Ruthes", "Vila Solidariedade", "Vila Velha", "Vila das Flores", "Vilinha", "Vista Alegre"
      ],
      "Piên": [
        "Aterrado Alto", "Avencal", "Boa Vista", "Cachoeirinha", "Campina dos Crespins", "Campina dos Maia", "Campo Novo", "Centro", "Cerro Verde", "Gramados", "Lageado", "Letreiro", "Mosquito", "Palmito", "Palmito de Cima", "Picacinho", "Pocinho", "Poço Frio", "Poço Frio dos Moreiras", "Quicé", "Trigolândia", "Vermelhinho"
      ],
      "Rio Negro": [
        "Bairro Alto", "Bairro do Seminário", "Bom Jesus", "Bom Jesus do Rio Negro", "Campina dos Andrades", "Campo do Gado", "Centro", "Estação Nova", "Fazendinha", "Jardim Zelinda", "Lageado dos Vieiras", "Maitaca", "Passa Três", "Passo do Valo", "Retiro", "Roseira", "Seminário", "Sítio dos Rauen", "Tijuco Preto", "Vila Militar", "Vila Paraná", "Vila Paraíso", "Volta Grande"
      ]
    };

    const flat: any[] = [];
    let id = 1000;
    Object.entries(dataMap).forEach(([city, neighborhoods]) => {
      neighborhoods.forEach(n => {
        const name = typeof n === 'string' ? n : n.neighborhood;
        const rate = typeof n === 'string' ? 10.00 : n.rate;
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
    try {
      if (typeof window !== 'undefined') {
        const stored = readStorage();
        // Só salva se o estado atual for diferente do que está no storage
        // para evitar sobrescrever com array vazio durante a hidratação inicial
        const isInitialLoad = lines.length === 0 && stored.length > 0;
        if (!isInitialLoad) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
        }
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
      
      // Fallback para quando o produto ainda não carregou do servidor mas está no cache local/storage
      if (!product) {
        return [];
      }
      
      const isSopa = product.categoria?.toLowerCase().includes("sopa");
      const price = isSopa ? 18.00 : (line.weight === "300g" && product.preco_300g 
        ? product.preco_300g 
        : line.weight === "400g" && product.preco_400g
          ? product.preco_400g
          : product.preco);
          
      return [{ ...line, product, subtotal: price * line.quantity }];
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

    // Lógica de Desconto Progressivo
    let discount = 0;
    const applicableDiscount = [...RULES.PROGRESSIVE_DISCOUNT]
      .reverse()
      .find(d => count >= d.minItems);
    
    if (applicableDiscount) {
      // Sopas contam na quantidade mas o valor é fixo (não recebem desconto)
      const discountableSubtotal = detailed.reduce((acc, l) => {
        const isSopa = l.product.categoria?.toLowerCase().includes("sopa");
        if (isSopa) return acc;
        return acc + l.subtotal;
      }, 0);

      discount = discountableSubtotal * (applicableDiscount.discountPercent / 100);
    }

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
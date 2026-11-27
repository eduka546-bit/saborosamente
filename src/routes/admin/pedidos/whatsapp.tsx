import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  MapPin,
  ArrowLeft,
  Plus,
  Save,
  Smartphone,
  Trash2,
  UserRoundCheck,
  X,
  WandSparkles,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarmitaPersonalizadaModal } from "@/components/marmita-personalizada-modal";
import { normalizarMarmitaConfig, type MarmitaGrupo } from "@/lib/marmita-personalizada-config";
import { type CartCustomMarmita } from "@/lib/cart";
import { extrairMontagemPersonalizadaPedido, formatarMontagemPersonalizadaPedido, ehPersonalizadaPedido } from "@/lib/marmita-personalizada-pedido";
import { supabase } from "@/integrations/supabase/client";
import { createWhatsappAdminOrder } from "@/lib/admin-whatsapp-order.functions";
import { interpretarResumoWhatsapp } from "@/lib/whatsapp-order-parser";
import { interpretarListaSaboresPorNome } from "@/lib/whatsapp-named-item-parser";
import { codigoComboPronto } from "@/lib/combo-pronto-codigo";
import { completarSaboresSemCodigoP10 } from "@/lib/pedidos10-whatsapp-parser";
import { recoverFromStaleServerFunction } from "@/lib/server-function-recovery";
import { whatsappDraftKey, lerRascunhoWhatsapp, salvarRascunhoWhatsapp, limparRascunhoWhatsapp, enderecoAoSelecionarCliente, type OrigemEndereco } from "@/lib/whatsapp-order-draft";
import { toast } from "sonner";
import { orderWhatsappMessage, phoneForWhatsapp } from "@/lib/order-whatsapp";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { configEntregaParaCidade } from "@/lib/entrega-config";
import { defaultCardFlags, defaultMealFlags, enabledOrDefault } from "@/lib/payment-options";
import { normalizarPrecosMarmita, precoMarmitaPorFaixa, unidadesDoItem } from "@/lib/combo-rules";
import { useBlackFridayActive, blackFridayPrice } from "@/lib/black-friday";
import type { CatalogOrderItem } from "@/lib/whatsapp-catalog";

export const Route = createFileRoute("/admin/pedidos/whatsapp")({
  component: WhatsappAdminOrderPage,
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    cliente: typeof search.cliente === "string" ? search.cliente : undefined,
    historico: typeof search.historico === "string" ? search.historico : undefined,
    carrinho: typeof search.carrinho === "string" ? search.carrinho : undefined,
  }),
});

type Product = {
  id: string;
  nome: string;
  tipo_produto?: string | null;
  preco?: number | string | null;
  preco_300g?: number | string | null;
  preco_400g?: number | string | null;
  estoque_200g?: number | null;
  estoque_300g?: number | null;
  estoque_400g?: number | null;
};

type RegisteredCustomer = {
  id: string;
  nome: string | null;
  telefone: string | null;
  cidade: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  cep: string | null;
};

type DraftItem = {
  key: string;
  productId: string;
  nomeItem?: string;
  quantity: number;
  weight: "200g" | "300g" | "400g";
  unitPrice: number;
  observacao: string;
};

type RecoveredCart = {
  id: string;
  status: string;
  user_id: string | null;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  itens: unknown;
  valor_total: number | string | null;
};

type WhatsappAdminDraft = {
  pasteText: string;
  nome: string;
  telefone: string;
  email: string;
  customerSearch: string;
  selectedCustomer: RegisteredCustomer | null;
  salvarEnderecoCadastro: boolean;
  metodoEntrega: "entrega" | "retirada";
  cidade: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento: string;
  cep: string;
  horario: string;
  pagamento: string;
  tipoCartao: string;
  taxaEntrega: number;
  observacao: string;
  referencia?: string;
  origemPedido?: "manual" | "whatsapp" | "pedidos10";
  comprovanteP10?: { valorPago: number; valorAPagar: number; forma: string } | null;
  declaredTotal: number | null;
  saldoAnterior: number | null;
  totalAcumulado: number | null;
  descontoAplicado: number;
  cashbackUsado: number;
  percentualDesconto: number | null;
  avisosInterpretacao: string[];
  items: DraftItem[];
  totalConfirmado: number | null;
  enderecoOrigem: OrigemEndereco;
};

const armazenamentoDaAba = (): Storage | null => {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
};

const compararEndereco = (value: unknown) =>
  String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
const compararCep = (value: unknown) => String(value ?? "").replace(/\D/g, "");

const money = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const parseMoney = (value: string | undefined | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  const parsed = Number(normalized.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const codeOf = (name: string) => (name.match(/^([A-Z]{2}\d{2})\b/i)?.[1] ?? "").toUpperCase();
const itemManualPorCodigo = (code: string, weight = "300g") =>
  code === "__SORTIDA" ? `Refeições sortidas (${weight})` :
  code === "__PERSONALIZADA" ? `Marmitas personalizadas (${weight})` : null;

const priceFor = (product: Product | undefined, weight: DraftItem["weight"]) => {
  if (!product) return 0;
  if (weight === "300g") return Number(product.preco_300g ?? product.preco ?? 0);
  if (weight === "400g") return Number(product.preco_400g ?? product.preco ?? 0);
  return Number(product.preco ?? 0);
};

const stockFor = (product: Product | undefined, weight: DraftItem["weight"]) => {
  if (!product) return 0;
  const tipo = String(product.tipo_produto ?? "marmita").toLowerCase();
  if (tipo === "sopa") return Number(product.estoque_400g ?? 0);
  if (tipo === "complemento" || tipo === "bebida") return Number(product.estoque_200g ?? 0);
  if (weight === "200g") return Number(product.estoque_200g ?? 0);
  if (weight === "400g") return Number(product.estoque_400g ?? 0);
  return Number(product.estoque_300g ?? 0);
};

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

function WhatsappAdminOrderPage() {
  const { cliente: initialCustomerId, historico: initialHistoryId, carrinho: initialCartId } = Route.useSearch();
  return <WhatsappAdminOrderForm initialCustomerId={initialCustomerId} initialHistoryId={initialHistoryId} initialCartId={initialCartId} />;
}

export type OrderConversation = { id: string; nome: string; telefone: string };

export function WhatsappAdminOrderForm({ initialCustomerId, initialHistoryId, initialCartId, conversation, catalogItem, catalogItems, onSaved, onSavingChange }: {
  initialCustomerId?: string; initialHistoryId?: string; initialCartId?: string;
  conversation?: OrderConversation; catalogItem?: CatalogOrderItem; catalogItems?: CatalogOrderItem[]; onSaved?: (confirmation?: { text: string; phone: string }) => void; onSavingChange?: (value: boolean) => void;
}) {
  const navigate = useNavigate();
  const draftKey = whatsappDraftKey(initialCustomerId, initialHistoryId, initialCartId, conversation?.id);
  const draftRestauradoRef = useRef(false);
  const dadosEditadosRef = useRef(false);
  const pedidoSalvoRef = useRef(false);
  const [draftReadyKey, setDraftReadyKey] = useState<string | null>(null);
  const createOrderFn = useServerFn(createWhatsappAdminOrder);
  const queryClient = useQueryClient();

  const [pasteText, setPasteText] = useState("");
  const [nome, setNome] = useState(conversation?.nome || "");
  const [telefone, setTelefone] = useState(conversation?.telefone || "");
  const [email, setEmail] = useState("");
  const [customerSearch, setCustomerSearch] = useState(conversation?.telefone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "") || "");
  const [selectedCustomer, setSelectedCustomer] = useState<RegisteredCustomer | null>(null);
  const [salvarEnderecoCadastro, setSalvarEnderecoCadastro] = useState(false);
  const [metodoEntrega, setMetodoEntrega] = useState<"entrega" | "retirada">("entrega");
  const [cidade, setCidade] = useState("São Bento do Sul");
  const [bairro, setBairro] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [cep, setCep] = useState("");
  const [horario, setHorario] = useState("");
  const [pagamento, setPagamento] = useState("cartao");
  const [tipoCartao, setTipoCartao] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState(0);
  const [observacao, setObservacao] = useState("");
  const [referencia, setReferencia] = useState("");
  const [origemPedido, setOrigemPedido] = useState<"manual" | "whatsapp" | "pedidos10">(conversation ? "whatsapp" : "manual");
  const [comprovanteP10, setComprovanteP10] = useState<{ valorPago: number; valorAPagar: number; forma: string } | null>(null);
  const [declaredTotal, setDeclaredTotal] = useState<number | null>(null);
  const [saldoAnterior, setSaldoAnterior] = useState<number | null>(null);
  const [totalAcumulado, setTotalAcumulado] = useState<number | null>(null);
  const [descontoAplicado, setDescontoAplicado] = useState(0);
  const [cashbackUsado, setCashbackUsado] = useState(0);
  const [percentualDesconto, setPercentualDesconto] = useState<number | null>(null);
  const [avisosInterpretacao, setAvisosInterpretacao] = useState<string[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [produtoRapido, setProdutoRapido] = useState("");
  const [buscaProdutoRapido, setBuscaProdutoRapido] = useState("");
  const [buscaProdutoAberta, setBuscaProdutoAberta] = useState(false);
  const [pesoRapido, setPesoRapido] = useState<DraftItem["weight"]>("300g");
  const [qtdRapida, setQtdRapida] = useState(1);
  const [personalizadaOpen, setPersonalizadaOpen] = useState(false);
  const [personalizadaKey, setPersonalizadaKey] = useState<string | null>(null);
  const { data: personalizadaData, isLoading: personalizadaLoading, isError: personalizadaError, refetch: recarregarPersonalizadas } = useQuery({
    queryKey: ["whatsapp-admin-personalizadas"],
    queryFn: async () => {
      const [settings, grupos, ingredientes] = await Promise.all([
        supabase.from("site_settings").select("parametros_loja").maybeSingle(),
        supabase.from("marmita_grupos").select("*").eq("ativo", true).order("ordem"),
        supabase.from("marmita_ingredientes").select("*").eq("ativo", true).order("ordem"),
      ]);
      if (settings.error || grupos.error || ingredientes.error) throw new Error("Não foi possível carregar as personalizadas.");
      return {
        config: normalizarMarmitaConfig((settings.data?.parametros_loja as any)?.marmita_personalizada),
        grupos: (grupos.data ?? []).map(g => ({
          ...g, ingredientes: (ingredientes.data ?? []).filter(i => i.grupo_id === g.id),
        })) as MarmitaGrupo[],
      };
    },
    staleTime: 30_000,
  });
  const abrirPersonalizada = (key: string | null = null) => {
    setPersonalizadaKey(key);
    setPersonalizadaOpen(true);
  };
  const adicionarPersonalizada = (custom: CartCustomMarmita, quantity: number) => {
    dadosEditadosRef.current = true;
    const linha: DraftItem = {
      key: personalizadaKey ?? newKey(),
      productId: "",
      nomeItem: custom.label,
      quantity,
      // Campo legado do RPC, ignorado para itens sem produto de catálogo.
      weight: "300g",
      unitPrice: Math.round(custom.precoUnitario * 100) / 100,
      observacao: formatarMontagemPersonalizadaPedido(custom),
    };
    setItems(current => personalizadaKey
      ? current.map(item => item.key === personalizadaKey ? linha : item)
      : [...current, linha]);
  };
  // Se o valor do pedido mudou, só liberar o envio após conferir o novo total.
  const [totalConfirmado, setTotalConfirmado] = useState<number | null>(null);
  const [enderecoOrigem, setEnderecoOrigem] = useState<OrigemEndereco>(null);
  const [recoveredCart, setRecoveredCart] = useState<RecoveredCart | null>(null);
  const enderecoDiferente = Boolean(
    selectedCustomer && metodoEntrega === "entrega" &&
    ([
      [cidade, selectedCustomer.cidade],
      [bairro, selectedCustomer.bairro],
      [rua, selectedCustomer.endereco],
      [numero, selectedCustomer.numero],
      [complemento, selectedCustomer.complemento],
    ].some(([novo, cadastro]) => compararEndereco(novo) !== compararEndereco(cadastro)) ||
    compararCep(cep) !== compararCep(selectedCustomer.cep))
  );

  // A lista de clientes é protegida pelas políticas RLS de administradores.
  // Busca apenas quando o operador digita; não baixa a base inteira.
  const searchTerm = customerSearch.trim().replace(/[%_,()]/g, "");
  const { data: registeredCustomers = [], isFetching: customersLoading } = useQuery({
    queryKey: ["whatsapp-customer-search", searchTerm],
    queryFn: async () => {
      const columns = "id,nome,telefone,cidade,bairro,endereco,numero,complemento,cep";
      const nameQuery = supabase.from("profiles").select(columns).ilike("nome", `%${searchTerm}%`).limit(12);
      const digits = searchTerm.replace(/\D/g, "");
      const result = await Promise.all([
        nameQuery,
        ...(digits.length >= 4
          ? [supabase.from("profiles").select(columns).ilike("telefone", `%${digits.slice(-4)}%`).limit(30)]
          : []),
      ]);
      const profiles = new Map<string, RegisteredCustomer>();
      for (const response of result) {
        if (response.error) throw response.error;
        for (const profile of (response.data ?? []) as unknown as RegisteredCustomer[]) {
          profiles.set(profile.id, profile);
        }
      }
      const lower = searchTerm.toLocaleLowerCase("pt-BR");
      const filtered = [...profiles.values()].filter((profile) =>
        String(profile.nome ?? "").toLocaleLowerCase("pt-BR").includes(lower) ||
        (digits.length >= 4 && String(profile.telefone ?? "").replace(/\D/g, "").includes(digits)),
      );
      return filtered.slice(0, 15);
    },
    enabled: searchTerm.length >= 2,
    staleTime: 20_000,
  });

  // Salvar na sessão desta aba protege o pedido contra remounts, refresh e
  // navegações involuntárias. Cada cliente/histórico tem seu próprio rascunho.
  useEffect(() => {
    draftRestauradoRef.current = false;
    setDraftReadyKey(null);
    const salvo = lerRascunhoWhatsapp<WhatsappAdminDraft>(armazenamentoDaAba(), draftKey);
    if (salvo && Array.isArray(salvo.items)) {
      draftRestauradoRef.current = true;
      setPasteText(salvo.pasteText || "");
      setNome(salvo.nome || "");
      setTelefone(salvo.telefone || "");
      setEmail(salvo.email || "");
      setCustomerSearch(salvo.customerSearch || "");
      setSelectedCustomer(salvo.selectedCustomer || null);
      setSalvarEnderecoCadastro(Boolean(salvo.salvarEnderecoCadastro));
      setMetodoEntrega(salvo.metodoEntrega === "retirada" ? "retirada" : "entrega");
      setCidade(salvo.cidade || "São Bento do Sul");
      setBairro(salvo.bairro || "");
      setRua(salvo.rua || "");
      setNumero(salvo.numero || "");
      setComplemento(salvo.complemento || "");
      setCep(salvo.cep || "");
      setHorario(salvo.horario || "");
      setPagamento(salvo.pagamento || "nao_informado");
      setTipoCartao(salvo.tipoCartao || "");
      setTaxaEntrega(Number(salvo.taxaEntrega || 0));
      setObservacao(salvo.observacao || "");
      setReferencia(salvo.referencia || "");
      setOrigemPedido(salvo.origemPedido || (salvo.pasteText?.includes("TOTAL PEDIDO:") ? "pedidos10" : salvo.pasteText?.trim() ? "whatsapp" : "manual"));
      setComprovanteP10(salvo.comprovanteP10 ?? null);
      setDeclaredTotal(salvo.declaredTotal ?? null);
      setSaldoAnterior(salvo.saldoAnterior ?? null);
      setTotalAcumulado(salvo.totalAcumulado ?? null);
      setDescontoAplicado(Number(salvo.descontoAplicado || 0));
      setCashbackUsado(Number(salvo.cashbackUsado || 0));
      setPercentualDesconto(salvo.percentualDesconto ?? null);
      setAvisosInterpretacao(Array.isArray(salvo.avisosInterpretacao) ? salvo.avisosInterpretacao : []);
      setItems(salvo.items.filter((item) => item && typeof item.productId === "string"));
      setTotalConfirmado(salvo.totalConfirmado ?? null);
      setEnderecoOrigem(salvo.enderecoOrigem === "pedido" || salvo.enderecoOrigem === "cadastro" ? salvo.enderecoOrigem : null);
      toast.info("Rascunho do WhatsApp recuperado: itens e edições preservados.");
    }
    const novosCatalogo = catalogItems ?? (catalogItem ? [catalogItem] : []);
    if (novosCatalogo.length) {
      // O item só é acrescentado por uma ação explícita no catálogo. O mesmo
      // rascunho contém as demais edições do pedido, sem sobrescrevê-las.
      dadosEditadosRef.current = true;
      const anteriores = Array.isArray(salvo?.items) ? salvo.items.filter(item => item && typeof item.productId === "string") : [];
      setItems([...anteriores, ...novosCatalogo.map(item=>({ ...item, key: newKey(), observacao: "" }))]);
      setTotalConfirmado(null);
    }
    setDraftReadyKey(draftKey);
  }, [draftKey]);

  useEffect(() => {
    if (draftReadyKey !== draftKey || pedidoSalvoRef.current) return;
    // Não criar rascunhos vazios durante a busca inicial por uma conta:
    // isso impediria o carregamento automático do cliente numa nova visita.
    if (!dadosEditadosRef.current && !draftRestauradoRef.current &&
        !selectedCustomer && !items.length && !pasteText.trim() &&
        !nome.trim() && !telefone.trim()) return;
    const dados: WhatsappAdminDraft = {
      pasteText, nome, telefone, email, customerSearch, selectedCustomer,
      salvarEnderecoCadastro, metodoEntrega, cidade, bairro, rua, numero,
      complemento, cep, horario, pagamento, tipoCartao, taxaEntrega,
      observacao, referencia, origemPedido, comprovanteP10, declaredTotal, saldoAnterior, totalAcumulado,
      descontoAplicado, cashbackUsado, percentualDesconto, avisosInterpretacao,
      items, totalConfirmado, enderecoOrigem,
    };
    salvarRascunhoWhatsapp(armazenamentoDaAba(), draftKey, dados);
  }, [
    draftKey, draftReadyKey, pasteText, nome, telefone, email, customerSearch,
    selectedCustomer, salvarEnderecoCadastro, metodoEntrega, cidade, bairro,
    rua, numero, complemento, cep, horario, pagamento, tipoCartao,
    taxaEntrega, observacao, referencia, origemPedido, comprovanteP10, declaredTotal, saldoAnterior, totalAcumulado,
    descontoAplicado, cashbackUsado, percentualDesconto, avisosInterpretacao,
    items, totalConfirmado, enderecoOrigem,
  ]);

  const selecionarConta = (profile: RegisteredCustomer, carregamentoAutomatico = false) => {
    if (!carregamentoAutomatico) dadosEditadosRef.current = true;
    setSelectedCustomer(profile);
    setSalvarEnderecoCadastro(false);
    setCustomerSearch("");
    setNome(profile.nome || nome);
    setTelefone(profile.telefone || telefone);
    // O endereço do WhatsApp/digitado vence o cadastro. Endereço proveniente
    // de outra conta NÃO é carregado indevidamente ao trocar de cliente.
    const enderecoNovo = enderecoAoSelecionarCliente(
      { cidade, bairro, rua, numero, complemento, cep },
      { cidade: profile.cidade, bairro: profile.bairro, rua: profile.endereco,
        numero: profile.numero, complemento: profile.complemento, cep: profile.cep },
      enderecoOrigem,
    );
    setCidade(enderecoNovo.cidade);
    setBairro(enderecoNovo.bairro);
    setRua(enderecoNovo.rua);
    setNumero(enderecoNovo.numero);
    setComplemento(enderecoNovo.complemento);
    setCep(enderecoNovo.cep);
    if (enderecoOrigem !== "pedido") setEnderecoOrigem("cadastro");
  };

  const usarEnderecoDaConta = () => {
    if (!selectedCustomer) return;
    dadosEditadosRef.current = true;
    setCidade(selectedCustomer.cidade || "São Bento do Sul");
    setBairro(selectedCustomer.bairro || "");
    setRua(selectedCustomer.endereco || "");
    setNumero(selectedCustomer.numero || "");
    setComplemento(selectedCustomer.complemento || "");
    setCep(selectedCustomer.cep || "");
    setSalvarEnderecoCadastro(false);
    setEnderecoOrigem("cadastro");
  };

  useEffect(() => {
    if (!initialCustomerId || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(initialCustomerId)) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("id,nome,telefone,cidade,bairro,endereco,numero,complemento,cep")
      .eq("id", initialCustomerId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled && !error && data &&
            !draftRestauradoRef.current && !dadosEditadosRef.current)
          selecionarConta(data as RegisteredCustomer, true);
        if (!cancelled && (error || !data)) toast.error("Não foi possível carregar a conta selecionada.");
      });
    return () => { cancelled = true; };
  }, [initialCustomerId]);

  // Um carrinho já marcado como recuperado pode ser lançado manualmente sem
  // redigitar cliente e itens. Os dados continuam editáveis para que o
  // atendente só complete entrega, horário e pagamento quando necessário.
  useEffect(() => {
    if (!initialCartId || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(initialCartId)) return;
    let cancelled = false;
    const carregarCarrinhoRecuperado = async () => {
      try {
        const { data: carrinho, error: cartError } = await supabase
          .from("carrinhos_abandonados")
          .select("id,status,user_id,nome,telefone,email,itens,valor_total")
          .eq("id", initialCartId)
          .maybeSingle();
        if (cartError || !carrinho) throw new Error("Carrinho recuperado não encontrado.");
        if (carrinho.status !== "recuperado") {
          throw new Error("Este carrinho precisa estar marcado como recuperado antes de lançar o pedido.");
        }
        if (cancelled) return;
        // Mantém o vínculo mesmo quando há um rascunho da mesma recuperação:
        // ao salvar, o carrinho ainda deve passar para convertido.
        setRecoveredCart(carrinho as RecoveredCart);
        if (draftRestauradoRef.current || dadosEditadosRef.current) return;

        const cartItems = Array.isArray(carrinho.itens) ? carrinho.itens : [];
        const recoveredItems: DraftItem[] = cartItems
          .filter((item: any) => typeof item?.productId === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(item.productId))
          .map((item: any) => {
            const quantity = Math.max(1, Math.min(200, Math.floor(Number(item.quantity) || 1)));
            const snapshotSubtotal = Number(item.subtotal);
            const snapshotPrice = Number(item.preco);
            const unitPrice = Number.isFinite(snapshotSubtotal) && snapshotSubtotal >= 0
              ? snapshotSubtotal / quantity
              : Number.isFinite(snapshotPrice) && snapshotPrice >= 0 ? snapshotPrice : 0;
            const rawWeight = String(item.weight ?? "");
            const weight = rawWeight === "200g" || rawWeight === "400g" ? rawWeight : "300g";
            return {
              key: newKey(),
              productId: item.productId,
              quantity,
              weight,
              unitPrice: Math.round(unitPrice * 100) / 100,
              observacao: "",
            };
          });
        if (!recoveredItems.length) throw new Error("Este carrinho não possui itens válidos para lançar.");

        setNome(carrinho.nome || "");
        setTelefone(carrinho.telefone || "");
        setEmail(carrinho.email || "");
        setItems(recoveredItems);
        setDeclaredTotal(Number(carrinho.valor_total ?? 0) || null);
        setTotalConfirmado(null);
        setDescontoAplicado(0);
        setCashbackUsado(0);
        setPercentualDesconto(null);
        setAvisosInterpretacao([]);
        setObservacao("Pedido recuperado de carrinho abandonado.");

        if (carrinho.user_id) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id,nome,telefone,cidade,bairro,endereco,numero,complemento,cep")
            .eq("id", carrinho.user_id)
            .maybeSingle();
          if (!profileError && profile && !cancelled) selecionarConta(profile as RegisteredCustomer, true);
        }
        if (!cancelled) toast.success("Carrinho recuperado carregado. Complete entrega, horário e pagamento antes de salvar.");
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Falha ao carregar o carrinho recuperado.");
      }
    };
    void carregarCarrinhoRecuperado();
    return () => { cancelled = true; };
  }, [initialCartId]);


  // Ficha comercial sem login: permite repetir o último pedido sem criar
  // outra conta e sem efetuar a venda automaticamente.
  useEffect(() => {
    if (!initialHistoryId || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(initialHistoryId)) return;
    let cancelled = false;
    const carregarHistorico = async () => {
      try {
        const { data: ficha, error: fichaError } = await (supabase as any)
          .from("clientes_whatsapp_historico")
          .select("nome,telefone_normalizado,email,cidade,bairro,rua,numero,complemento,cep,ultimo_pedido_id")
          .eq("id", initialHistoryId).maybeSingle();
        if (fichaError || !ficha) throw new Error("Ficha comercial não encontrada.");

        const { data: ultimo, error: pedidoError } = await supabase
          .from("pedidos")
          .select("origem,nome_cliente,telefone_cliente,metodo_entrega,horario_recebimento,metodo_pagamento,tipo_cartao,taxa_entrega,desconto_aplicado,endereco_cidade,endereco_bairro,endereco_rua,endereco_numero,endereco_complemento,endereco_cep")
          .eq("id", ficha.ultimo_pedido_id).maybeSingle();
        if (pedidoError || !ultimo || ultimo.origem !== "whatsapp")
          throw new Error("Último pedido do WhatsApp indisponível.");

        const { data: linhas, error: itensError } = await supabase
          .from("pedido_itens")
          .select("produto_id,quantidade,preco_unitario,observacao")
          .eq("pedido_id", ficha.ultimo_pedido_id)
          .order("created_at", { ascending: true });
        if (itensError) throw new Error("Não foi possível carregar os produtos do pedido anterior.");
        if (cancelled || draftRestauradoRef.current || dadosEditadosRef.current) return;

        setNome(ficha.nome || ultimo.nome_cliente || "");
        setTelefone(ficha.telefone_normalizado || ultimo.telefone_cliente || "");
        setEmail(ficha.email || "");
        setCidade(ficha.cidade || ultimo.endereco_cidade || "São Bento do Sul");
        setBairro(ficha.bairro || ultimo.endereco_bairro || "");
        setRua(ficha.rua || ultimo.endereco_rua || "");
        setNumero(ficha.numero || ultimo.endereco_numero || "");
        setComplemento(ficha.complemento || ultimo.endereco_complemento || "");
        setCep(ficha.cep || ultimo.endereco_cep || "");
        setEnderecoOrigem("pedido");
        setMetodoEntrega(ultimo.metodo_entrega === "retirada" ? "retirada" : "entrega");
        setHorario(ultimo.horario_recebimento || "");
        setPagamento(ultimo.metodo_pagamento || "nao_informado");
        setTipoCartao(ultimo.tipo_cartao || "");
        setTaxaEntrega(Number(ultimo.taxa_entrega || 0));
        // O novo atendimento não herda descontos, cashback ou observações antigas.
        setDescontoAplicado(0);
        setCashbackUsado(0);
        setDeclaredTotal(null);
        setAvisosInterpretacao([]);
        setObservacao("");
        setReferencia("");
        setOrigemPedido("whatsapp");
        setComprovanteP10(null);

        const repetir: DraftItem[] = (linhas ?? [])
          .filter((row: any) => row.produto_id && Number(row.quantidade) > 0)
          .map((row: any) => {
            const tamanho = String(row.observacao || "").match(/Peso:\s*(200|300|400)g/i)?.[1];
            return {
              key: newKey(),
              productId: String(row.produto_id),
              quantity: Number(row.quantidade),
              weight: (tamanho ? tamanho + "g" : "300g") as DraftItem["weight"],
              unitPrice: Number(row.preco_unitario || 0),
              observacao: "",
            };
          });
        setItems(repetir);
        toast.success("Cliente e último pedido recuperados. Confira itens, preços e entrega antes de salvar.");
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Falha ao recuperar o histórico.");
      }
    };
    void carregarHistorico();
    return () => { cancelled = true; };
  }, [initialHistoryId]);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["whatsapp-admin-products"],
    queryFn: async () => {
      // Admin pode registrar produtos sem saldo ou ocultos no e-commerce.
      // A consulta pública não inclui todos esses itens.
      const { data, error } = await supabase
        .from("produtos")
        .select("id,nome,tipo_produto,preco,preco_300g,preco_400g,estoque_200g,estoque_300g,estoque_400g")
        .eq("ativo", true);
      if (error) throw error;
      return ((data ?? []) as Product[])
        .filter((p) => String(p.tipo_produto ?? "").toLowerCase() !== "combo")
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    },
    staleTime: 30_000,
  });

  const { data: locais = [] } = useQuery({
    queryKey: ["delivery-rates-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("delivery_rates").select("cidade,bairro,valor,ativo").eq("ativo", true).order("cidade").order("bairro");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: settings } = useQuery({ queryKey: ["whatsapp-order-site-settings"], queryFn: getPublicSiteSettings });
  const blackAtiva = useBlackFridayActive();
  const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const cidadesDisponiveis = [...new Set(locais.map(l => l.cidade))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  const bairrosDisponiveis = locais.filter(l => norm(l.cidade) === norm(cidade));
  const horariosDisponiveis = configEntregaParaCidade(settings?.parametros_loja?.entrega, cidade).horarios;
  const bandeiras = enabledOrDefault(pagamento === "alimentacao" ? settings?.meal_flags : settings?.card_flags, pagamento === "alimentacao" ? defaultMealFlags : defaultCardFlags);
  const totalUnidadesPreco = items.reduce((n,item) => { const p=products.find(p=>p.id===item.productId); return n+item.quantity*unidadesDoItem(p?.nome,p?.tipo_produto ?? undefined); },0);
  const tabelaPreco = normalizarPrecosMarmita(settings?.parametros_loja?.precos_marmita);
  const aplicarPrecosSite = () => {
    dadosEditadosRef.current = true;
    if (!settings) { toast.error("Aguarde o carregamento dos preços do site."); return; }
    if (descontoAplicado > 0) { toast.error("Remova ou confira o desconto adicional antes de aplicar os preços do site."); return; }
    setItems(current=>current.map(item=>{
      const p=products.find(p=>p.id===item.productId);
      if (!p || item.nomeItem || ehPersonalizadaPedido({nome_item:item.nomeItem,observacao:item.observacao})) return item;
      const tipo=String(p.tipo_produto ?? "").toLowerCase();
      const promo=blackAtiva && totalUnidadesPreco>=5 ? blackFridayPrice(tipo,item.weight) : null;
      if (promo !== null) return {...item,unitPrice:promo};
      if (tipo==="marmita") return {...item,unitPrice:precoMarmitaPorFaixa(item.weight,blackAtiva ? 1 : totalUnidadesPreco,priceFor(p,item.weight),tabelaPreco)};
      return item;
    }));
    setTotalConfirmado(null);
    toast.success("Preços do site aplicados. Confira o total antes de salvar.");
  };

  const productsByCode = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      // Combos prontos são itens do catálogo, não sabores TD a serem inventados.
      const code = p.tipo_produto === "combo" ? codigoComboPronto(p.nome) : codeOf(p.nome);
      if (code) map.set(code, p);
    });
    return map;
  }, [products]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );
  const total = Math.round((subtotal + (metodoEntrega === "entrega" ? taxaEntrega : 0) - descontoAplicado - cashbackUsado) * 100) / 100;
  const totalMismatch =
    declaredTotal !== null && Math.abs(Math.round((declaredTotal - total) * 100) / 100) > 0.009;
  const totalDiferenteConferido = !totalMismatch || totalConfirmado === total;

  const addBlankItem = () => {
    dadosEditadosRef.current = true;
    const first = products[0];
    const weight: DraftItem["weight"] = "300g";
    setItems((current) => [
      ...current,
      {
        key: newKey(),
        productId: first?.id ?? "",
        quantity: 1,
        weight,
        unitPrice: priceFor(first, weight),
        observacao: "",
      },
    ]);
  };

  const parseWhatsappText = async () => {
    dadosEditadosRef.current = true;
    setTotalConfirmado(null);
    if (!pasteText.trim()) {
      toast.error("Cole o pedido do WhatsApp primeiro.");
      return;
    }
    if (!products.length) {
      toast.error("Aguarde o cardápio carregar.");
      return;
    }

    let interpretado = interpretarResumoWhatsapp(pasteText, { blackFridayAtiva: blackAtiva });
    const ehP10 = interpretado.valorPago !== undefined;
    // Lista informal enviada sem códigos ou blocos ("2x Sopa de canja",
    // "Todas de 400g: ..."). Resolve pelos produtos ativos e preserva todas
    // as linhas: não salva uma lista parcialmente reconhecida.
    const nomes = !ehP10 && interpretado.itens.length === 0 && interpretado.blocos.length === 0
      ? interpretarListaSaboresPorNome(pasteText, products, {blackFridayAtiva: blackAtiva})
      : null;
    if (nomes && nomes.itens.length > 0 && nomes.naoIdentificados.length > 0) {
      setItems([]);
      const erro = "Confira antes de lançar. Não identifiquei com segurança: " +
        nomes.naoIdentificados.join("; ");
      setAvisosInterpretacao([erro]);
      toast.error(erro, {duration: 12000});
      return;
    }
    const itensPorNome = nomes?.itens.length ? nomes.itens : null;
    if (ehP10) {
      try {
        interpretado = completarSaboresSemCodigoP10(pasteText, interpretado, products);
      } catch (error) {
        setItems([]);
        toast.error(error instanceof Error ? error.message : "Não foi possível identificar os sabores do P10.");
        return;
      }
    }
    setOrigemPedido(ehP10 ? "pedidos10" : "whatsapp");
    setComprovanteP10(ehP10 ? {
      valorPago: interpretado.valorPago ?? 0,
      valorAPagar: interpretado.valorAPagar ?? 0,
      forma: interpretado.pagamentoOriginal ?? "",
    } : null);
    if (interpretado.nome) {
      const limparNome = (v: string) => v.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      // Ao colar pedido de outra pessoa, nunca preservar vínculo anterior.
      const telefoneAnterior = String(selectedCustomer?.telefone ?? "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
      const telefoneNovo = String(interpretado.telefone ?? "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
      const clienteDiferente = !!selectedCustomer &&
        (limparNome(selectedCustomer.nome ?? "") !== limparNome(interpretado.nome) ||
          (!!telefoneAnterior && !!telefoneNovo && telefoneAnterior !== telefoneNovo));
      if (clienteDiferente) {
        setSelectedCustomer(null);
        toast.info("O comprovante tem outro nome. Confira o cliente antes de vincular uma conta.");
      }
      setNome(interpretado.nome);
      if (!selectedCustomer || clienteDiferente) {
        const sobrenome = interpretado.nome.split(/\s+/).at(-1) ?? "";
        const telefoneParaBusca = (interpretado.telefone ?? "").replace(/\D/g, "");
        if (telefoneParaBusca.length >= 10) {
          setCustomerSearch(telefoneParaBusca);
        } else if (sobrenome.length >= 3) setCustomerSearch(sobrenome);
      }
    }
    if (interpretado.cidadeSigla === "SBS") setCidade("São Bento do Sul");

    // Se o catálogo carregado no navegador estiver antigo/incompleto,
    // revalida combos prontos diretamente no banco antes de dizer que não existem.
    const mapaProdutos = new Map(productsByCode);
    const faltamCombos = interpretado.itens.some(item =>
      item.codigo.startsWith("__COMBO_") && !mapaProdutos.has(item.codigo));
    if (faltamCombos) {
      const { data: combosAtuais, error: comboError } = await supabase
        .from("produtos")
        .select("id,nome,tipo_produto,preco,preco_300g,preco_400g,estoque_200g,estoque_300g,estoque_400g")
        .eq("ativo", true).eq("tipo_produto", "combo").limit(100);
      if (comboError) {
        toast.error("Não foi possível atualizar o catálogo de combos. Confira a conexão e tente novamente.");
        return;
      }
      const combosEncontrados = (combosAtuais ?? []) as Product[];
      for (const product of combosEncontrados) {
        const code = codigoComboPronto(product.nome);
        if (code) mapaProdutos.set(code, product);
      }
      // Evita que o seletor de produtos perca um combo encontrado na consulta atualizada.
      queryClient.setQueryData<Product[]>(["whatsapp-admin-products"], anterior => {
        const porId = new Map((anterior ?? []).map(produto => [produto.id, produto]));
        combosEncontrados.forEach(produto => porId.set(produto.id, produto));
        return [...porId.values()];
      });
    }
    const faltantes = itensPorNome ? [] : [...new Set(interpretado.itens
      .filter(item => !mapaProdutos.has(item.codigo) && !itemManualPorCodigo(item.codigo))
      .map(item => item.codigo))];
    if (faltantes.length > 0) {
      setItems([]);
      const combos = faltantes.filter(code => code.startsWith("__COMBO_"));
      toast.error(combos.length
        ? "Combo pronto não localizado nem após atualizar o catálogo. Confira se o produto está ativo ou atualize esta página (Ctrl+F5)."
        : `Produto(s) não encontrado(s): ${faltantes.join(", ")}. Confira os códigos.`);
      return;
    }
    const quantidadeInterpretada = itensPorNome
      ? itensPorNome.reduce((total, item) => total + item.quantidade, 0)
      : interpretado.itens.reduce((total, item) => total + item.quantidade, 0);
    if (quantidadeInterpretada === 0) {
      setItems([]);
      toast.error("Não encontrei os itens do pedido. Para Combo Pronto use, por exemplo: 1 - Combo Mais Vendidos 10un (P) - 140,00.");
      return;
    }
    if (!itensPorNome && interpretado.blocos.length <= 1 &&
        interpretado.quantidadeDeclarada !== null &&
        quantidadeInterpretada !== interpretado.quantidadeDeclarada) {
      setItems([]);
      toast.error(`Foram declaradas ${interpretado.quantidadeDeclarada} refeições, mas os códigos representam ${quantidadeInterpretada}. Confira o resumo.`);
      return;
    }

    const novosItens: DraftItem[] = itensPorNome
      ? itensPorNome.map(item => ({
          key: newKey(), productId: item.productId,
          quantity: item.quantidade, weight: item.peso,
          unitPrice: item.precoUnitario, observacao: "",
        }))
      : interpretado.itensDetalhados.map((item) => {
          const product = mapaProdutos.get(item.codigo);
          const nomeItem = itemManualPorCodigo(item.codigo);
          return {
            key: newKey(),
            productId: product?.id ?? "",
            nomeItem: nomeItem ?? undefined,
            quantity: item.quantidade,
            weight: item.peso,
            unitPrice: item.precoUnitario ?? priceFor(product, item.peso),
            observacao: nomeItem ? "Item manual sem baixa de estoque" : "",
          };
        });

    setItems(novosItens);
    if (interpretado.telefone) setTelefone(interpretado.telefone);
    if (interpretado.complemento !== null) setComplemento(interpretado.complemento);
    if (interpretado.tipoCartao !== null) setTipoCartao(interpretado.tipoCartao);
    if (interpretado.metodoEntrega === "retirada") setTaxaEntrega(0);
    else if (interpretado.taxaEntrega !== null) setTaxaEntrega(interpretado.taxaEntrega);
    if (interpretado.metodoEntrega) setMetodoEntrega(interpretado.metodoEntrega);
    if (interpretado.endereco) {
      setEnderecoOrigem("pedido");
      setRua(interpretado.endereco.rua);
      setNumero(interpretado.endereco.numero);
      setBairro(interpretado.endereco.bairro);
      setCidade(interpretado.endereco.cidade);
    }
    if (interpretado.horario) setHorario(interpretado.horario);
    setReferencia(interpretado.referencia ?? "");
    setPagamento(interpretado.pagamento ?? "nao_informado");
    if (interpretado.observacoesAdicionais) {
      setObservacao((previous) => {
        const atual = previous.replace(/(?:^|\n)Referência de entrega:[^\n]*/g, "")
          .replace(/(?:^|\n)Instruções do comprovante:[^\n]*/g, "").trim();
        return [
          atual,

          interpretado.observacoesAdicionais ? "Instruções do comprovante: " + interpretado.observacoesAdicionais : "",
        ].filter(Boolean).join("\n");
      });
    }
    setDescontoAplicado(interpretado.descontoValor);
    setCashbackUsado(interpretado.cashbackUsado);
    setPercentualDesconto(interpretado.descontoPercentual);
    const avisos = itensPorNome ? nomes?.avisos ?? [] : interpretado.avisos;
    setAvisosInterpretacao(avisos);
    if (avisos.length) {
      toast.info("Confira os avisos e os valores do comprovante antes de salvar.");
    }
    setDeclaredTotal(interpretado.totalPedido);
    setSaldoAnterior(interpretado.saldoAnterior);
    setTotalAcumulado(interpretado.totalAcumulado);
    toast.success(`${quantidadeInterpretada} produto(s) interpretado(s), incluindo cliente e entrega quando informados. Confira antes de salvar.`);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada.");

      if (!totalDiferenteConferido) {
        throw new Error(
          `O total informado no WhatsApp (${money(declaredTotal ?? 0)}) não bate com o cálculo (${money(total)}). Confira e autorize o valor atualizado antes de salvar.`,
        );
      }

      if (metodoEntrega === "entrega" && !numero.trim()) {
        toast.warning("Pedido manual sem número: confirme o endereço com o cliente antes da entrega.");
      }

      return await createOrderFn({
        data: {
          accessToken,
          nome,
          telefone,
          email,
          origem: origemPedido,
          referencia,
          linkedUserId: selectedCustomer?.id ?? null,
          carrinhoRecuperadoId: recoveredCart?.id ?? null,
          atualizarEnderecoCadastro: Boolean(selectedCustomer && metodoEntrega === "entrega" && enderecoDiferente && salvarEnderecoCadastro),
          metodoEntrega,
          horarioEntrega: horario,
          pagamento,
          tipoCartao,
          taxaEntrega: metodoEntrega === "entrega" ? taxaEntrega : 0,
          descontoAplicado,
          cashbackUsado,
          cidade,
          bairro,
          rua,
          numero,
          complemento,
          cep,
          observacao: [observacao, origemPedido === "pedidos10" && comprovanteP10
            ? `Pedidos10: ${comprovanteP10.forma || "Forma não informada"} | Pago: R$ ${comprovanteP10.valorPago.toFixed(2)} | A receber: R$ ${comprovanteP10.valorAPagar.toFixed(2)}`
            : ""].filter(Boolean).join("\n").slice(0, 500),
          items: items.map((item) => ({
            ...(item.productId ? { productId: item.productId } : {}),
            ...(item.nomeItem ? { nomeItem: item.nomeItem } : {}),
            quantity: Number(item.quantity),
            weight: item.weight,
            unitPrice: Number(item.unitPrice),
            observacao: item.observacao,
          })),
        },
      });
    },
    onSuccess: (data: any) => {
      pedidoSalvoRef.current = true;
      limparRascunhoWhatsapp(armazenamentoDaAba(), draftKey);
      toast.success(
        `Pedido lançado! ${data?.linkedUserId ? "Vinculado à conta do cliente." : "Sem conta vinculada."} Total ${money(Number(data?.valor_total ?? total))}`,
      );
      if (/^\d{10,11}$/.test(telefone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, ""))) {
        toast.success("Cliente registrado no histórico comercial do WhatsApp; endereço preservado quando informado.");
      } else {
        toast.warning("Pedido salvo sem telefone válido: não será possível localizar o cadastro comercial pelo número.");
      }
      if (data?.enderecoCadastroStatus === "atualizado") {
        toast.success("Endereço atualizado também no cadastro da cliente.");
      } else if (data?.enderecoCadastroStatus === "falhou") {
        toast.error("Pedido salvo, mas não foi possível atualizar o endereço do cadastro. Atualize a ficha manualmente se necessário.", { duration: 12000 });
      }
      if (data?.emailStatus === "enviado") {
        toast.success("E-mail de confirmação enviado para processamento.");
      } else if (data?.emailStatus === "falhou") {
        toast.error("Pedido salvo, mas o e-mail não foi enviado. Confira o serviço de e-mail.", { duration: 10000 });
      } else {
        toast.info("Pedido salvo sem e-mail: a conta selecionada não possui endereço cadastrado.");
      }
      if (recoveredCart && data?.carrinhoRecuperadoStatus === "convertido") {
        toast.success("Carrinho recuperado marcado como convertido.");
      } else if (recoveredCart && data?.carrinhoRecuperadoStatus === "nao_atualizado") {
        toast.warning("Pedido lançado, mas confirme o status do carrinho recuperado na lista.");
      }
      if (onSaved) {
        const confirmation = orderWhatsappMessage({
          id: String(data.id ?? ""), nome_cliente: nome, telefone_cliente: telefone, origem: origemPedido,
          metodo_entrega: metodoEntrega, horario_recebimento: horario, metodo_pagamento: pagamento, tipo_cartao: tipoCartao,
          endereco_rua: rua, endereco_numero: numero, endereco_bairro: bairro, endereco_cidade: cidade,
          endereco_complemento: complemento, endereco_referencia: referencia, endereco_cep: cep,
          valor_total: data.valor_total ?? total,
          itens: items.map(item => ({
            nome_item: item.nomeItem || products.find(p=>p.id===item.productId)?.nome,
            quantidade: item.quantity, preco_unitario: item.unitPrice,
            tamanho: products.find(p=>p.id===item.productId)?.tipo_produto==="complemento" ? "150g" : item.weight,
            observacao: item.observacao,
          })),
        });
        onSaved({ text: confirmation, phone: phoneForWhatsapp(telefone) });
      }
      else navigate({ to: "/admin/pedidos" as any });
    },
    onError: (error: any) => {
      recoverFromStaleServerFunction(error);
      toast.error(error?.message ?? "Não foi possível lançar o pedido.");
    },
  });

  useEffect(() => { onSavingChange?.(createMutation.isPending); }, [createMutation.isPending, onSavingChange]);

  const canSubmit =
    nome.trim().length >= 2 &&
    items.length > 0 &&
    items.every((item) => (item.productId || item.nomeItem) && item.quantity > 0 && item.unitPrice >= 0) &&
    totalDiferenteConferido &&
    descontoAplicado >= 0 && cashbackUsado >= 0 &&
    descontoAplicado + cashbackUsado <= subtotal + (metodoEntrega === "entrega" ? taxaEntrega : 0) &&
    (metodoEntrega === "retirada" || (rua.trim() && bairro.trim() && cidade.trim()));

  if (conversation) {
    const produtoEscolhido = products.find(p => p.id === produtoRapido);
    const termosProduto = norm(buscaProdutoRapido).split(/\s+/).filter(Boolean);
    const resultadosProduto = products.filter(p => termosProduto.every(t => norm(p.nome).includes(t) || norm(codeOf(p.nome)).includes(t)));
    const tipoEscolhido = String(produtoEscolhido?.tipo_produto ?? "").toLowerCase();
    const pesoEscolhido = tipoEscolhido === "sopa" ? "400g" : tipoEscolhido === "complemento" ? "200g" : pesoRapido;
    const addRapido = () => {
      if (!produtoEscolhido || !Number.isInteger(qtdRapida) || qtdRapida < 1) return;
      dadosEditadosRef.current = true;
      setItems(current => [...current, {key:newKey(),productId:produtoEscolhido.id,quantity:qtdRapida,weight:pesoEscolhido,unitPrice:priceFor(produtoEscolhido,pesoEscolhido),observacao:""}]);
      setQtdRapida(1);
      setProdutoRapido("");
      setBuscaProdutoRapido("");
      setBuscaProdutoAberta(false);
    };
    const taxaDoBairro = (c:string,b:string) => locais.find(l=>norm(l.cidade)===norm(c)&&norm(l.bairro)===norm(b));
    const campo = "space-y-1 min-w-0";
    const selectClass = "w-full h-9 rounded-md border border-gray-200 px-2 text-sm bg-white";
    const sec = "rounded-lg border bg-white p-3 space-y-2";
    return <div className="p-2 space-y-2 text-sm" onChangeCapture={()=>{dadosEditadosRef.current=true;}}>
      <section className={sec}>
        <h2 className="font-bold">Cliente</h2>
        <Input aria-label="Nome do cliente" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome do cliente"/>
        <Input aria-label="Telefone" value={telefone} onChange={e=>setTelefone(e.target.value)} placeholder="Telefone"/>
        <details className="text-xs"><summary className="cursor-pointer text-green-800 font-semibold">Cadastro e e-mail {selectedCustomer ? "· vinculado" : ""}</summary>
          <div className="space-y-2 pt-2">
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail (opcional)"/>
            <Input value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} placeholder="Buscar conta"/>
            {selectedCustomer && <div className="flex justify-between gap-2"><span>{selectedCustomer.nome}</span><button type="button" onClick={()=>{setSelectedCustomer(null);setSalvarEnderecoCadastro(false);}}>Desvincular</button></div>}
            {!selectedCustomer && registeredCustomers.map(p=><button type="button" key={p.id} className="block w-full text-left border rounded p-2" onClick={()=>selecionarConta(p)}>{p.nome} · {p.telefone}</button>)}
          </div>
        </details>
      </section>
      <section className={sec}>
        <h2 className="font-bold">Produtos · {totalUnidadesPreco} un.</h2>
        <div className="space-y-1">
          <Input aria-label="Buscar produto por nome ou código" placeholder="Buscar produto (ex.: TD01, frango)" value={buscaProdutoRapido} onFocus={()=>setBuscaProdutoAberta(true)} onChange={e=>{setBuscaProdutoRapido(e.target.value);setProdutoRapido("");setBuscaProdutoAberta(true);}} onKeyDown={e=>{if(e.key==="Enter"&&buscaProdutoAberta&&resultadosProduto.length===1){e.preventDefault();setProdutoRapido(resultadosProduto[0].id);setBuscaProdutoRapido(resultadosProduto[0].nome);setBuscaProdutoAberta(false);}}}/>
          {buscaProdutoAberta&&<div className="max-h-44 overflow-y-auto rounded-md border divide-y bg-white">{resultadosProduto.length ? resultadosProduto.map(p=><button type="button" key={p.id} className="block w-full px-2 py-2 text-left text-xs hover:bg-green-50 focus:bg-green-50" onClick={()=>{setProdutoRapido(p.id);setBuscaProdutoRapido(p.nome);setBuscaProdutoAberta(false);}}>{p.nome}</button>) : <p className="p-2 text-xs text-gray-500">{productsLoading?"Carregando produtos...":"Nenhum produto encontrado."}</p>}</div>}
          {produtoEscolhido&&!buscaProdutoAberta&&<p className="text-xs text-green-700">Produto selecionado</p>}
        </div>
        <div className="grid grid-cols-[1fr_72px_1fr] gap-2">
          <select aria-label="Tamanho" className={selectClass} value={pesoEscolhido} onChange={e=>setPesoRapido(e.target.value as DraftItem["weight"])} disabled={tipoEscolhido==="sopa"||tipoEscolhido==="complemento"}>{tipoEscolhido==="complemento"?<option value="200g">150g</option>:tipoEscolhido==="sopa"?<option value="400g">400g</option>:<><option value="200g">200g</option><option value="300g">300g</option><option value="400g">400g</option></>}</select>
          <Input aria-label="Quantidade" type="number" min={1} value={qtdRapida} onChange={e=>setQtdRapida(Number(e.target.value))}/>
          <Button type="button" size="sm" onClick={addRapido} disabled={!produtoEscolhido||qtdRapida<1}>Adicionar</Button>
        </div>
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={()=>abrirPersonalizada()} disabled={!personalizadaData?.grupos.some(g=>g.ingredientes.length)}>+ Personalizada</Button>
        {items.map(item=>{const p=products.find(p=>p.id===item.productId);const personalizada=ehPersonalizadaPedido({nome_item:item.nomeItem,observacao:item.observacao});return <div key={item.key} className="border rounded p-2 space-y-1">
          <div className="flex items-start justify-between gap-1"><span className="font-medium text-xs">{item.nomeItem||p?.nome||"Produto"} · {p?.tipo_produto==="complemento"?"150g":item.weight}</span><button type="button" aria-label="Remover item" className="text-red-600" onClick={()=>{dadosEditadosRef.current=true;setItems(v=>v.filter(x=>x.key!==item.key));}}><Trash2 size={16}/></button></div>
          <div className="grid grid-cols-[65px_1fr_auto] gap-2 items-end"><label className="text-xs">Qtd.<Input type="number" min={1} value={item.quantity} onChange={e=>setItems(v=>v.map(x=>x.key===item.key?{...x,quantity:Math.max(1,Number(e.target.value))}:x))}/></label><label className="text-xs">R$/un<Input type="number" min={0} step="0.01" value={item.unitPrice} onChange={e=>setItems(v=>v.map(x=>x.key===item.key?{...x,unitPrice:Number(e.target.value)}:x))}/></label><strong className="pb-2 text-xs">{money(item.quantity*item.unitPrice)}</strong></div>
          {!personalizada&&p&&p.tipo_produto!=="combo"&&item.quantity>stockFor(p,item.weight)&&<p className="text-xs text-amber-700">Estoque insuficiente · confira antes de salvar.</p>}
          {personalizada&&<button type="button" className="text-xs text-green-800 underline" onClick={()=>abrirPersonalizada(item.key)}>Editar montagem</button>}
        </div>})}
        <Button type="button" variant="outline" className="w-full" disabled={!items.length||!settings} onClick={aplicarPrecosSite}>{blackAtiva?"Aplicar preços Black Friday":"Aplicar preços por quantidade"}</Button>
      </section>
      <section className={sec}>
        <h2 className="font-bold">Recebimento</h2>
        <div className="grid grid-cols-2 gap-2">{(["entrega","retirada"] as const).map(m=><button key={m} type="button" aria-pressed={metodoEntrega===m} className={`rounded border p-2 font-semibold ${metodoEntrega===m?"border-green-700 bg-green-50 text-green-800":"border-gray-200"}`} onClick={()=>{dadosEditadosRef.current=true;setMetodoEntrega(m);if(m==="retirada")setTaxaEntrega(0);else {const l=taxaDoBairro(cidade,bairro);if(l)setTaxaEntrega(Number(l.valor));}}}>{m==="entrega"?"Entrega":"Retirada"}</button>)}</div>
        {metodoEntrega==="entrega" && <><label className={campo}>Cidade<Input list="wa-quick-cidades" value={cidade} onChange={e=>{setCidade(e.target.value);setBairro("");setEnderecoOrigem("pedido");}}/><datalist id="wa-quick-cidades">{cidadesDisponiveis.map(c=><option key={c} value={c}/>)}</datalist></label>
        <label className={campo}>Bairro<Input list="wa-quick-bairros" value={bairro} onChange={e=>{setBairro(e.target.value);setEnderecoOrigem("pedido");const l=taxaDoBairro(cidade,e.target.value);if(l)setTaxaEntrega(Number(l.valor));}}/><datalist id="wa-quick-bairros">{bairrosDisponiveis.map(l=><option key={l.bairro} value={l.bairro}/>)}</datalist></label>
        <div className="grid grid-cols-[1fr_75px] gap-2"><label className={campo}>Rua<Input value={rua} onChange={e=>{setRua(e.target.value);setEnderecoOrigem("pedido");}}/></label><label className={campo}>Nº<Input value={numero} onChange={e=>{setNumero(e.target.value);setEnderecoOrigem("pedido");}}/></label></div>
        <Input value={complemento} onChange={e=>{setComplemento(e.target.value);setEnderecoOrigem("pedido");}} placeholder="Complemento (opcional)"/>
        <Input value={referencia} onChange={e=>setReferencia(e.target.value)} placeholder="Referência (opcional)"/>
        <label className={campo}>Frete (R$)<Input type="number" min={0} step="0.01" value={taxaEntrega} onChange={e=>setTaxaEntrega(Number(e.target.value))}/></label>
        {selectedCustomer&&<button type="button" className="text-xs text-green-800 underline" onClick={usarEnderecoDaConta}>Usar endereço cadastrado</button>}</>}
        <label className={campo}>Horário<Input list="wa-quick-horarios" value={horario} onChange={e=>setHorario(e.target.value)} placeholder="Selecione ou digite"/><datalist id="wa-quick-horarios">{horariosDisponiveis.map(h=><option key={h} value={h}/>)}</datalist></label>
      </section>
      <section className={sec}>
        <h2 className="font-bold">Pagamento</h2>
        <select aria-label="Forma de pagamento" className={selectClass} value={pagamento} onChange={e=>setPagamento(e.target.value)}>{[["nao_informado","A combinar"],["cartao","Cartão"],["pix","PIX"],["alimentacao","Alimentação/Refeição"],["dinheiro","Dinheiro"],["mercadopago","Mercado Pago"],["link","Link de pagamento"],["online_pago","Já pago"],["pagamento_parcial","Pagamento parcial"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
        {(pagamento==="cartao"||pagamento==="alimentacao")&&<><Input list="wa-quick-bandeiras" value={tipoCartao} onChange={e=>setTipoCartao(e.target.value)} placeholder="Bandeira (opcional)"/><datalist id="wa-quick-bandeiras">{bandeiras.map(b=>String(b.name??b.label??"")).filter(Boolean).map(b=><option key={b} value={b}/>)}</datalist></>}
        <label className={campo}>Desconto adicional (R$)<Input type="number" min={0} step="0.01" value={descontoAplicado} onChange={e=>{setDescontoAplicado(Number(e.target.value));setPercentualDesconto(null);}}/></label>
        <details><summary className="cursor-pointer text-xs font-semibold text-green-800">Mais opções</summary><div className="space-y-2 pt-2"><label className={campo}>Cashback já pago<Input type="number" min={0} step="0.01" value={cashbackUsado} onChange={e=>setCashbackUsado(Number(e.target.value))}/></label><Input value={cep} onChange={e=>{setCep(e.target.value);setEnderecoOrigem("pedido");}} placeholder="CEP"/><textarea className="w-full border rounded p-2 text-sm" value={observacao} onChange={e=>setObservacao(e.target.value)} placeholder="Observações"/><textarea className="w-full border rounded p-2 text-sm" value={pasteText} onChange={e=>setPasteText(e.target.value)} placeholder="Colar pedido pronto"/><Button type="button" variant="outline" size="sm" onClick={parseWhatsappText} disabled={productsLoading}>Interpretar texto</Button>{selectedCustomer&&metodoEntrega==="entrega"&&enderecoDiferente&&<label className="flex gap-2 text-xs"><input type="checkbox" checked={salvarEnderecoCadastro} onChange={e=>setSalvarEnderecoCadastro(e.target.checked)}/>Atualizar endereço no cadastro</label>}</div></details>
        {avisosInterpretacao.map((aviso,i)=><p key={i} className="text-xs text-amber-700">{aviso}</p>)}
        {totalMismatch&&<label className="flex gap-2 text-xs text-amber-800"><input type="checkbox" checked={totalConfirmado===total} onChange={e=>setTotalConfirmado(e.target.checked?total:null)}/>Conferi a diferença do comprovante ({money(declaredTotal??0)}) e autorizo o novo total.</label>}
      </section>
      <div className="sticky bottom-0 bg-white border-t p-3 space-y-1 shadow-lg"><div className="flex justify-between text-xs"><span>Produtos {money(subtotal)}</span><span>Frete {money(metodoEntrega==="entrega"?taxaEntrega:0)}</span></div><div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-green-800">{money(total)}</span></div><Button className="w-full bg-green-700 hover:bg-green-800" disabled={!canSubmit||createMutation.isPending} onClick={()=>createMutation.mutate()}>{createMutation.isPending?"Salvando...":"Salvar pedido e conferir mensagem"}</Button>{!canSubmit&&<p className="text-xs text-gray-500">Confira nome, produtos, endereço (entrega) e valores.</p>}</div>
      {personalizadaOpen&&personalizadaData&&<MarmitaPersonalizadaModal isOpen grupos={personalizadaData.grupos} config={personalizadaData.config} initialQuantity={items.find(i=>i.key===personalizadaKey)?.quantity} onAdd={adicionarPersonalizada} onClose={()=>setPersonalizadaOpen(false)}/>}
    </div>;
  }

  return (
    <div className={`max-w-[1400px] mx-auto ${conversation ? "p-3" : "p-4 md:p-6 min-h-screen"}`}
      onChangeCapture={() => { dadosEditadosRef.current = true; }}>
      <div className={`flex flex-col justify-between gap-4 mb-6 ${conversation ? "" : "md:flex-row md:items-center"}`}>
        <div>
          {!conversation && <a
            href="/admin/pedidos"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#5850ec] mb-2"
          >
            <ArrowLeft size={16} /> Voltar para pedidos
          </a>}
          <h1 className="text-2xl font-bold text-[#5850ec] flex items-center gap-2">
            <Smartphone size={24} /> Lançar Pedido
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cole o pedido do WhatsApp ou Pedidos10, ou preencha manualmente.
          </p>
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit || createMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save size={16} className="mr-2" />
          {createMutation.isPending ? "Salvando..." : "Salvar pedido"}
        </Button>
      </div>

      {recoveredCart && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <ShoppingCart size={20} className="mt-0.5 shrink-0 text-green-700" />
          <div>
            <p className="font-bold">Pedido recuperado do carrinho</p>
            <p className="mt-1 text-green-800">Cliente e itens foram preenchidos. Confira as informações e escolha somente entrega, horário e pagamento que faltarem.</p>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${conversation ? "" : "xl:grid-cols-[1fr_1.4fr]"}`}>
        <div className="space-y-6">
          <section className="bg-white border rounded-xl p-5 space-y-3">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <UserRoundCheck size={18} className="text-green-700" />
              Vincular à conta do cliente
            </h2>
            <p className="text-xs text-gray-500">
              Selecione quem já possui conta no site, se houver. Com telefone válido,
              o cliente também fica salvo no cadastro comercial do WhatsApp para repetir pedidos,
              sem criar uma conta de login.
            </p>
            {selectedCustomer ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-green-300 bg-green-50 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-green-800 truncate">
                    Conta vinculada: {selectedCustomer.nome || "Cliente cadastrado"}
                  </p>
                  <p className="text-xs text-green-700">
                    {selectedCustomer.telefone || "Telefone não informado"} · Histórico do site
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => { setSelectedCustomer(null); setSalvarEnderecoCadastro(false); }}>
                  <X size={14} className="mr-1" /> Alterar
                </Button>
              </div>
            ) : (
              <>
                <Input
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Pesquisar conta pelo nome ou telefone"
                  aria-label="Pesquisar conta do cliente"
                />
                {customersLoading && <p className="text-xs text-gray-500">Buscando contas...</p>}
                {searchTerm.length >= 2 && !customersLoading && registeredCustomers.length === 0 && (
                  <p className="text-xs text-amber-700">Nenhuma conta encontrada. Confira o nome ou registre o pedido sem vínculo.</p>
                )}
                {registeredCustomers.length > 0 && (
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 divide-y">
                    {registeredCustomers.map((profile) => (
                      <button
                        type="button"
                        key={profile.id}
                        onClick={() => selecionarConta(profile)}
                        className="w-full px-3 py-2 text-left hover:bg-green-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-800">{profile.nome || "Cliente sem nome"}</p>
                        <p className="text-xs text-gray-500">{profile.telefone || "Telefone não cadastrado"}</p>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Sem seleção, o sistema só vincula automaticamente se identificar uma única conta pelo telefone.
                  Caso contrário, o pedido fica como atendimento de convidado.
                </p>
              </>
            )}
            <div className="border-t border-gray-200 pt-4 mt-3">
              <p className="text-sm font-bold text-gray-800 mb-2">
                Como será este pedido? Escolha mesmo se o cliente já tem cadastro:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["retirada", "entrega"] as const).map((modo) => (
                  <button key={modo} type="button" aria-pressed={metodoEntrega === modo}
                    onClick={() => {
                      dadosEditadosRef.current = true;
                      setMetodoEntrega(modo);
                      if (modo === "retirada") setTaxaEntrega(0);
                    }}
                    className={`min-h-11 rounded-lg border px-3 py-2 font-semibold text-sm transition-colors
                      ${metodoEntrega === modo
                        ? "border-green-700 bg-green-50 text-green-800 ring-1 ring-green-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}>
                    {modo === "retirada" ? "Retirada na loja" : "Entrega no endereço"}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                A escolha não altera os itens ou preços. Na retirada não há taxa de entrega.
              </p>
            </div>
          </section>
          <section className="bg-white border rounded-xl p-5">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <WandSparkles size={18} className="text-[#5850ec]" />
              Importar pedido (WhatsApp ou Pedidos10)
            </h2>
            <p className="text-xs text-gray-500 mb-2">A origem é identificada automaticamente ao interpretar.</p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Pedido Cliente - SBS:\n\n12 - Refeições 300g...\n5xTD(02)\n..."}
              className="w-full min-h-[240px] rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5850ec]/30"
            />
            <p className="mt-2 text-xs font-semibold text-green-700">Origem: {origemPedido === "pedidos10" ? "Pedidos10" : origemPedido === "whatsapp" ? "WhatsApp" : "Manual"}</p>
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={parseWhatsappText}
              disabled={productsLoading}
            >
              <WandSparkles size={16} className="mr-2" />
              Interpretar pedido
            </Button>
          </section>

          <section className="bg-white border rounded-xl p-5 space-y-4">
            <h2 className="font-bold text-gray-800">Cliente e atendimento</h2>
            <div>
              <label className="text-xs font-bold text-gray-500">Nome *</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Telefone (para histórico e repetição)</label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">E-mail</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedCustomer ? "Será usado o e-mail da conta do site" : "E-mail para receber a confirmação"}
                />
                {selectedCustomer && (
                  <p className="text-xs text-green-700 mt-1">
                    Para pedidos vinculados, a confirmação é enviada automaticamente ao e-mail de login do cliente.
                  </p>
                )}
              </div>
            </div>
            {metodoEntrega === "entrega" && (
              <div>
                <label className="text-xs font-bold text-gray-500">Horário de entrega (opcional)</label>
                <Input
                  list="wa-order-horarios"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  placeholder="Selecione ou digite"
                />
                <datalist id="wa-order-horarios">{horariosDisponiveis.map(h=><option key={h} value={h}/>)}</datalist>
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-gray-500">Forma de pagamento</label>
              <select
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                value={pagamento}
                onChange={(e) => setPagamento(e.target.value)}
              >
                <option value="nao_informado">Não informado / A combinar</option>
                <option value="online_pago">Pagamento realizado (comprovante P10)</option>
                <option value="pagamento_parcial">Pagamento parcial (conferir saldo)</option>
                <option value="cartao">Cartão</option>
                <option value="pix">PIX</option>
                <option value="alimentacao">Alimentação/Refeição</option>
                <option value="mercadopago">Mercado Pago</option>
                <option value="link">Link de pagamento</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>
            {(pagamento === "cartao" || pagamento === "alimentacao") && (
              <div>
                <label className="text-xs font-bold text-gray-500">Cartão/bandeira (opcional)</label>
                <Input
                  list="wa-order-bandeiras"
                  value={tipoCartao}
                  onChange={(e) => setTipoCartao(e.target.value)}
                  placeholder="Selecione ou digite"
                />
                <datalist id="wa-order-bandeiras">{bandeiras.map(b=>String(b.name ?? b.label ?? "")).filter(Boolean).map(b=><option key={b} value={b}/>)}</datalist>
              </div>
            )}
          </section>

          <section className="bg-white border rounded-xl p-5 space-y-4">
              <h2 className="font-bold text-gray-800">
                {metodoEntrega === "entrega" ? "Entrega" : "Endereço do cliente (opcional)"}
              </h2>
              {metodoEntrega === "retirada" && (
                <p className="text-xs text-gray-600">
                  Este endereço ficará no histórico comercial para próximos pedidos. A retirada continua sem frete.
                </p>
              )}
              {selectedCustomer && (
                <Button type="button" size="sm" variant="outline" onClick={usarEnderecoDaConta}>
                  <MapPin size={14} className="mr-1" /> Usar endereço cadastrado
                </Button>
              )}
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Rua {metodoEntrega === "entrega" ? "*" : ""}</label>
                  <Input value={rua} onChange={(e) => { setRua(e.target.value); setEnderecoOrigem("pedido"); }} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Número <span className="font-normal">(opcional no lançamento manual)</span></label>
                  <Input value={numero} onChange={(e) => { setNumero(e.target.value); setEnderecoOrigem("pedido"); }} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Bairro {metodoEntrega === "entrega" ? "*" : ""}</label>
                  <Input list="wa-order-bairros" value={bairro} onChange={(e) => { setBairro(e.target.value); setEnderecoOrigem("pedido"); const local=bairrosDisponiveis.find(l=>norm(l.bairro)===norm(e.target.value)); if(local && metodoEntrega==="entrega") setTaxaEntrega(Number(local.valor)); }} placeholder="Selecione ou digite" />
                  <datalist id="wa-order-bairros">{bairrosDisponiveis.map(l=><option key={l.bairro} value={l.bairro}>{money(Number(l.valor))}</option>)}</datalist>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Cidade {metodoEntrega === "entrega" ? "*" : ""}</label>
                  <Input list="wa-order-cidades" value={cidade} onChange={(e) => { setCidade(e.target.value); setEnderecoOrigem("pedido"); }} placeholder="Selecione ou digite" />
                  <datalist id="wa-order-cidades">{cidadesDisponiveis.map(c=><option key={c} value={c}/>)}</datalist>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Complemento</label>
                  <Input value={complemento} onChange={(e) => { setComplemento(e.target.value); setEnderecoOrigem("pedido"); }} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">CEP</label>
                  <Input value={cep} onChange={(e) => { setCep(e.target.value); setEnderecoOrigem("pedido"); }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Referência de entrega</label>
                <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} />
              </div>
              {selectedCustomer && (
                <div className={`rounded-xl border p-3 text-sm ${enderecoDiferente ? "border-amber-300 bg-amber-50 text-amber-950" : "border-green-200 bg-green-50 text-green-900"}`}>
                  <p className="flex items-center gap-2 font-semibold">
                    {enderecoDiferente ? <AlertTriangle size={17} /> : <MapPin size={17} />}
                    {enderecoDiferente ? "Endereço diferente do cadastro da cliente" : "Endereço igual ao cadastrado"}
                  </p>
                  {enderecoDiferente && (
                    <>
                      <p className="mt-2 text-xs leading-relaxed text-amber-900">
                        <strong>Endereço cadastrado:</strong> {[selectedCustomer.endereco, selectedCustomer.numero, selectedCustomer.bairro, selectedCustomer.cidade, selectedCustomer.cep].filter(Boolean).join(", ") || "Não informado"}
                      </p>
                      <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-amber-200 bg-white/80 p-3">
                        <input
                          type="checkbox"
                          checked={salvarEnderecoCadastro}
                          onChange={(event) => setSalvarEnderecoCadastro(event.target.checked)}
                          className="mt-0.5 size-4 shrink-0 accent-[#086e45]"
                        />
                        <span className="text-xs font-semibold leading-relaxed">
                          Salvar este endereço também no cadastro da cliente
                        </span>
                      </label>
                      <p className="mt-2 text-xs leading-relaxed text-amber-900">
                        {salvarEnderecoCadastro
                          ? "Ao lançar o pedido, o novo endereço substituirá o cadastrado nessa conta."
                          : "O novo endereço será usado somente neste pedido e no histórico de atendimentos WhatsApp."}
                      </p>
                    </>
                  )}
                </div>
              )}
              {metodoEntrega === "entrega" && (
                <div>
                  <label className="text-xs font-bold text-gray-500">Taxa de entrega</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={taxaEntrega}
                    onChange={(e) => setTaxaEntrega(Number(e.target.value))}
                  />
                </div>
              )}
            </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white border rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold text-gray-800">Itens do pedido</h2>
                <p className="text-xs text-gray-500">
                  O estoque é baixado ao salvar. Lançamentos do admin podem gerar saldo negativo, para ajuste posterior.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={addBlankItem} disabled={!products.length}>
                  <Plus size={15} className="mr-1" /> Adicionar item
                </Button>
                <Button type="button" size="sm" className="bg-[#086e45] hover:bg-[#065a38]" onClick={() => abrirPersonalizada()} disabled={!personalizadaData?.grupos.some(g => g.ingredientes.length)}>
                  <Plus size={15} className="mr-1" /> Adicionar personalizada
                </Button>
              </div>
            </div>

            {personalizadaLoading && <p className="mb-3 text-xs text-gray-500">Carregando opções de personalizadas...</p>}
            {personalizadaError && <button type="button" className="mb-3 text-xs font-semibold text-red-700 underline" onClick={() => void recarregarPersonalizadas()}>Não foi possível carregar as personalizadas. Tentar novamente.</button>}
            <div className="space-y-3">
              {items.length === 0 && (
                <div className="border border-dashed rounded-lg p-10 text-center text-sm text-gray-400">
                  Cole e interprete um pedido ou adicione os itens manualmente.
                </div>
              )}

              {items.map((item) => {
                const montagem = extrairMontagemPersonalizadaPedido({ nome_item: item.nomeItem, observacao: item.observacao });
                const personalizada = ehPersonalizadaPedido({ nome_item: item.nomeItem, observacao: item.observacao });
                const product = products.find((p) => p.id === item.productId);
                const stock = stockFor(product, item.weight);
                const ehComboPronto = product?.tipo_produto === "combo";
                const insufficient = !ehComboPronto && item.quantity > stock;

                return (
                  <div
                    key={item.key}
                    className={`border rounded-xl p-4 grid grid-cols-1 gap-3 items-end ${conversation ? "" : "md:grid-cols-[minmax(0,1fr)_90px_90px_120px_42px]"}`}
                  >
                    <div>
                      <label className="text-xs font-bold text-gray-500">Produto</label>
                      {item.nomeItem ? (
                        <Input value={item.nomeItem} readOnly className="bg-amber-50 text-amber-950" />
                      ) : <select
                        className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                        value={item.productId}
                        onChange={(e) => {
                          const productId = e.target.value;
                          const nextProduct = products.find((p) => p.id === productId);
                          setItems((current) =>
                            current.map((row) =>
                              row.key === item.key
                                ? {
                                    ...row,
                                    productId,
                                    unitPrice: priceFor(nextProduct, row.weight),
                                  }
                                : row,
                            ),
                          );
                        }}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                      </select>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">Tamanho</label>
                      {montagem ? <Input readOnly value={`${montagem.tamanho} · ${montagem.pesoTotal}g`} /> : <select
                        className="w-full h-10 rounded-md border border-gray-200 px-2 text-sm"
                        value={item.weight}
                        onChange={(e) => {
                          const weight = e.target.value as DraftItem["weight"];
                          setItems((current) =>
                            current.map((row) =>
                              row.key === item.key
                                ? {
                                    ...row,
                                    weight,
                                    unitPrice: priceFor(product, weight),
                                  }
                                : row,
                            ),
                          );
                        }}
                      >
                        {String(product?.tipo_produto ?? "").toLowerCase() === "complemento" ? (
                          <option value="200g">150g (complemento)</option>
                        ) : String(product?.tipo_produto ?? "").toLowerCase() === "sopa" ? (
                          <option value="400g">400g (sopa)</option>
                        ) : (
                          <>
                            <option value="200g">200g</option>
                            <option value="300g">300g</option>
                            <option value="400g">400g</option>
                          </>
                        )}
                      </select>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">Qtd.</label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          setItems((current) =>
                            current.map((row) =>
                              row.key === item.key
                                ? { ...row, quantity: Math.max(1, Number(e.target.value)) }
                                : row,
                            ),
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">R$/un</label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          setItems((current) =>
                            current.map((row) =>
                              row.key === item.key
                                ? { ...row, unitPrice: Number(e.target.value) }
                                : row,
                            ),
                          )
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => { dadosEditadosRef.current = true; setItems((current) => current.filter((r) => r.key !== item.key)); }}
                    >
                      <Trash2 size={17} />
                    </Button>

                    {montagem && <div className={`${conversation ? "" : "md:col-span-5"} rounded-lg bg-green-50 p-3 text-xs text-green-900`}>
                      <strong>Montagem por unidade:</strong>
                      <p className="mt-1">{montagem.ingredientes.map(i => `${i.gramatura === null ? "" : `${i.gramatura}g `}${i.nome}${i.modoPreparo ? ` (${i.modoPreparo})` : ""}`).join(" + ")}</p>
                    </div>}
                    {personalizada && !montagem && <div className={`${conversation ? "" : "md:col-span-5"} flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900`}>
                      <span>Montagem não registrada.</span>
                      <Button type="button" size="sm" variant="outline" disabled={!personalizadaData?.grupos.some(g => g.ingredientes.length)} onClick={() => abrirPersonalizada(item.key)}>Montar personalizada</Button>
                    </div>}
                    <div className={`${conversation ? "" : "md:col-span-5"} flex justify-between gap-3 text-xs`}>
                      <span className={item.nomeItem ? "text-amber-700 font-semibold" : insufficient ? "text-red-600 font-bold" : "text-gray-500"}>
                        {item.nomeItem ? "Registro manual — não baixa estoque" : ehComboPronto
                          ? "Combo pronto — sem baixa individual de sabores"
                          : <>Estoque: {stock}{insufficient ? ` — saldo após salvar: ${stock - item.quantity} (permitido no admin)` : ""}</>}
                      </span>
                      <span className="font-bold text-gray-700">
                        {money(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white border rounded-xl p-5 space-y-3">
            <h2 className="font-bold text-gray-800">Observações</h2>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Informações extras do pedido..."
              className="w-full min-h-[90px] rounded-lg border border-gray-200 p-3 text-sm"
            />
          </section>

          <section className="bg-white border rounded-xl p-5">
            <div className="space-y-2 text-sm">
              <Button type="button" variant="outline" className="w-full" disabled={!items.length || !settings} onClick={aplicarPrecosSite}>{blackAtiva ? "Aplicar preços Black Friday / site" : "Aplicar desconto progressivo do site"}</Button>
              <p className="text-xs text-gray-500">{totalUnidadesPreco} unidades · preços por faixa, sem desconto duplicado. Valores manuais continuam editáveis.</p>
              <div className="flex justify-between">
                <span className="text-gray-500">Produtos</span>
                <span className="font-semibold">{money(subtotal)}</span>
              </div>
              {metodoEntrega === "entrega" && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Entrega</span>
                  <span className="font-semibold">{money(taxaEntrega)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-black text-green-700">{money(total)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="desconto-pedido-manual" className="text-sm text-gray-500">
                  Desconto {percentualDesconto !== null ? "(" + percentualDesconto + "%)" : ""} (R$)
                </label>
                <Input id="desconto-pedido-manual" type="number" min={0} max={subtotal + taxaEntrega}
                  step="0.01" className="w-32 text-right" value={descontoAplicado}
                  onChange={(e) => { setDescontoAplicado(Number(e.target.value)); setPercentualDesconto(null); }} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="cashback-pedido-manual" className="text-sm text-gray-500">
                  Já pago com cashback (R$)
                </label>
                <Input id="cashback-pedido-manual" type="number" min={0} max={subtotal + taxaEntrega}
                  step="0.01" className="w-32 text-right" value={cashbackUsado}
                  onChange={(e) => setCashbackUsado(Number(e.target.value))} />
              </div>
              {cashbackUsado > 0 && (
                <p className="text-xs text-amber-700">
                  Valor já pago no comprovante: será registrado no pedido, sem retirar novamente do saldo de cashback do cliente.
                </p>
              )}
              {declaredTotal !== null && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Total informado no comprovante</span>
                  <span>{money(declaredTotal)}</span>
                </div>
              )}
              {avisosInterpretacao.length > 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-bold mb-1">Conferir o resumo original</p>
                  {avisosInterpretacao.map((aviso, i) => <p key={i}>{aviso}</p>)}
                  <p className="mt-1">Edite os preços/quantidades para corrigir diferenças antes de salvar.</p>
                </div>
              )}
              {origemPedido === "pedidos10" && comprovanteP10 && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-900">
                  <strong>Pagamento do P10:</strong> recebido {money(comprovanteP10.valorPago)} · a receber {money(comprovanteP10.valorAPagar)}
                  {comprovanteP10.forma && <div className="text-xs mt-1">Comprovante: {comprovanteP10.forma}</div>}
                </div>
              )}
              {saldoAnterior !== null && (
                <div className="flex justify-between text-xs text-amber-700">
                  <span>Saldo anterior (não somado a este pedido)</span>
                  <span>{money(saldoAnterior)}</span>
                </div>
              )}
              {totalAcumulado !== null && (
                <div className="flex justify-between text-sm font-bold text-gray-700">
                  <span>Total acumulado informado para cobrança</span>
                  <span>{money(totalAcumulado)}</span>
                </div>
              )}
            </div>

            {totalMismatch && (
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 flex gap-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <strong>O total calculado difere do comprovante.</strong> O formulário calcula {money(total)},
                  mas o resumo original informa {money(declaredTotal ?? 0)}.
                  <label className="mt-3 flex items-start gap-2 cursor-pointer font-semibold">
                    <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-green-700"
                      checked={totalConfirmado === total}
                      onChange={(e) => setTotalConfirmado(e.target.checked ? total : null)} />
                    Conferi a diferença e autorizo salvar o novo total de {money(total)}.
                  </label>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      {personalizadaOpen && personalizadaData && (
        <MarmitaPersonalizadaModal
          isOpen
          grupos={personalizadaData.grupos}
          config={personalizadaData.config}
          initialQuantity={items.find(i => i.key === personalizadaKey)?.quantity}
          onAdd={adicionarPersonalizada}
          onClose={() => setPersonalizadaOpen(false)}
        />
      )}
    </div>
  );
}

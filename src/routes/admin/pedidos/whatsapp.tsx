import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { supabase } from "@/integrations/supabase/client";
import { createWhatsappAdminOrder } from "@/lib/admin-whatsapp-order.functions";
import { interpretarResumoWhatsapp } from "@/lib/whatsapp-order-parser";
import { recoverFromStaleServerFunction } from "@/lib/server-function-recovery";
import { whatsappDraftKey, lerRascunhoWhatsapp, salvarRascunhoWhatsapp, limparRascunhoWhatsapp, enderecoAoSelecionarCliente, type OrigemEndereco } from "@/lib/whatsapp-order-draft";
import { toast } from "sonner";

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
  const navigate = useNavigate();
  const { cliente: initialCustomerId, historico: initialHistoryId, carrinho: initialCartId } = Route.useSearch();
  const draftKey = whatsappDraftKey(initialCustomerId, initialHistoryId, initialCartId);
  const draftRestauradoRef = useRef(false);
  const dadosEditadosRef = useRef(false);
  const pedidoSalvoRef = useRef(false);
  const [draftReadyKey, setDraftReadyKey] = useState<string | null>(null);
  const createOrderFn = useServerFn(createWhatsappAdminOrder);

  const [pasteText, setPasteText] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
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
  const [declaredTotal, setDeclaredTotal] = useState<number | null>(null);
  const [saldoAnterior, setSaldoAnterior] = useState<number | null>(null);
  const [totalAcumulado, setTotalAcumulado] = useState<number | null>(null);
  const [descontoAplicado, setDescontoAplicado] = useState(0);
  const [cashbackUsado, setCashbackUsado] = useState(0);
  const [percentualDesconto, setPercentualDesconto] = useState<number | null>(null);
  const [avisosInterpretacao, setAvisosInterpretacao] = useState<string[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
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
      observacao, declaredTotal, saldoAnterior, totalAcumulado,
      descontoAplicado, cashbackUsado, percentualDesconto, avisosInterpretacao,
      items, totalConfirmado, enderecoOrigem,
    };
    salvarRascunhoWhatsapp(armazenamentoDaAba(), draftKey, dados);
  }, [
    draftKey, draftReadyKey, pasteText, nome, telefone, email, customerSearch,
    selectedCustomer, salvarEnderecoCadastro, metodoEntrega, cidade, bairro,
    rua, numero, complemento, cep, horario, pagamento, tipoCartao,
    taxaEntrega, observacao, declaredTotal, saldoAnterior, totalAcumulado,
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

  const productsByCode = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      const code = codeOf(p.nome);
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

  const parseWhatsappText = () => {
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

    const interpretado = interpretarResumoWhatsapp(pasteText);
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

    const faltantes = [...new Set(interpretado.itens
      .filter((item) => !productsByCode.has(item.codigo))
      .map((item) => item.codigo))];
    if (faltantes.length > 0) {
      setItems([]);
      toast.error(`Produto(s) não encontrado(s): ${faltantes.join(", ")}. Confira os códigos.`);
      return;
    }
    const quantidadeInterpretada = interpretado.itens.reduce((total, item) => total + item.quantidade, 0);
    if (quantidadeInterpretada === 0) {
      setItems([]);
      toast.error("Não encontrei os sabores. Use 1xTD01, 1xTD(1-9-11) ou 1xSO04.");
      return;
    }
    if (interpretado.blocos.length <= 1 &&
        interpretado.quantidadeDeclarada !== null &&
        quantidadeInterpretada !== interpretado.quantidadeDeclarada) {
      setItems([]);
      toast.error(`Foram declaradas ${interpretado.quantidadeDeclarada} refeições, mas os códigos representam ${quantidadeInterpretada}. Confira o resumo.`);
      return;
    }

    const novosItens: DraftItem[] = interpretado.itensDetalhados.map((item) => {
      const product = productsByCode.get(item.codigo)!;
      return {
        key: newKey(),
        productId: product.id,
        quantity: item.quantidade,
        weight: item.peso,
        unitPrice: item.precoUnitario ?? priceFor(product, item.peso),
        observacao: "",
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
    setPagamento(interpretado.pagamento ?? "nao_informado");
    if (interpretado.referencia || interpretado.observacoesAdicionais) {
      setObservacao((previous) => {
        const atual = previous.replace(/(?:^|\n)Referência de entrega:[^\n]*/g, "")
          .replace(/(?:^|\n)Instruções do comprovante:[^\n]*/g, "").trim();
        return [
          atual,
          interpretado.referencia ? "Referência de entrega: " + interpretado.referencia : "",
          interpretado.observacoesAdicionais ? "Instruções do comprovante: " + interpretado.observacoesAdicionais : "",
        ].filter(Boolean).join("\n");
      });
    }
    setDescontoAplicado(interpretado.descontoValor);
    setCashbackUsado(interpretado.cashbackUsado);
    setPercentualDesconto(interpretado.descontoPercentual);
    setAvisosInterpretacao(interpretado.avisos);
    if (interpretado.avisos.length) {
      toast.warning("O resumo possui diferenças. Confira os valores antes de salvar.");
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

      return await createOrderFn({
        data: {
          accessToken,
          nome,
          telefone,
          email,
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
          observacao,
          items: items.map((item) => ({
            productId: item.productId,
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
      navigate({ to: "/admin/pedidos" as any });
    },
    onError: (error: any) => {
      recoverFromStaleServerFunction(error);
      toast.error(error?.message ?? "Não foi possível lançar o pedido.");
    },
  });

  const canSubmit =
    nome.trim().length >= 2 &&
    items.length > 0 &&
    items.every((item) => item.productId && item.quantity > 0 && item.unitPrice >= 0) &&
    totalDiferenteConferido &&
    descontoAplicado >= 0 && cashbackUsado >= 0 &&
    descontoAplicado + cashbackUsado <= subtotal + (metodoEntrega === "entrega" ? taxaEntrega : 0) &&
    (metodoEntrega === "retirada" || (rua.trim() && bairro.trim() && cidade.trim()));

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto min-h-screen"
      onChangeCapture={() => { dadosEditadosRef.current = true; }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <a
            href="/admin/pedidos"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#5850ec] mb-2"
          >
            <ArrowLeft size={16} /> Voltar para pedidos
          </a>
          <h1 className="text-2xl font-bold text-[#5850ec] flex items-center gap-2">
            <Smartphone size={24} /> Lançar pedido do WhatsApp
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cole o resumo recebido no WhatsApp ou preencha manualmente.
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-6">
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
              Colar resumo do WhatsApp
            </h2>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Pedido Cliente - SBS:\n\n12 - Refeições 300g...\n5xTD(02)\n..."}
              className="w-full min-h-[240px] rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5850ec]/30"
            />
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
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  placeholder="Ex.: após 17h"
                />
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
                  value={tipoCartao}
                  onChange={(e) => setTipoCartao(e.target.value)}
                  placeholder="Ex.: crédito Visa, Alelo..."
                />
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
                  <label className="text-xs font-bold text-gray-500">Número</label>
                  <Input value={numero} onChange={(e) => { setNumero(e.target.value); setEnderecoOrigem("pedido"); }} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Bairro {metodoEntrega === "entrega" ? "*" : ""}</label>
                  <Input value={bairro} onChange={(e) => { setBairro(e.target.value); setEnderecoOrigem("pedido"); }} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Cidade {metodoEntrega === "entrega" ? "*" : ""}</label>
                  <Input value={cidade} onChange={(e) => { setCidade(e.target.value); setEnderecoOrigem("pedido"); }} />
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
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold text-gray-800">Itens do pedido</h2>
                <p className="text-xs text-gray-500">
                  O estoque é baixado ao salvar. Lançamentos do admin podem gerar saldo negativo, para ajuste posterior.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addBlankItem} disabled={!products.length}>
                <Plus size={15} className="mr-1" /> Adicionar item
              </Button>
            </div>

            <div className="space-y-3">
              {items.length === 0 && (
                <div className="border border-dashed rounded-lg p-10 text-center text-sm text-gray-400">
                  Cole e interprete um pedido ou adicione os itens manualmente.
                </div>
              )}

              {items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                const stock = stockFor(product, item.weight);
                const insufficient = item.quantity > stock;

                return (
                  <div
                    key={item.key}
                    className="border rounded-xl p-4 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_90px_90px_120px_42px] gap-3 items-end"
                  >
                    <div>
                      <label className="text-xs font-bold text-gray-500">Produto</label>
                      <select
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
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">Tamanho</label>
                      <select
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
                      </select>
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

                    <div className="md:col-span-5 flex justify-between gap-3 text-xs">
                      <span className={insufficient ? "text-red-600 font-bold" : "text-gray-500"}>
                        Estoque: {stock}
                        {insufficient ? ` — saldo após salvar: ${stock - item.quantity} (permitido no admin)` : ""}
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
                  <span>Total informado no WhatsApp</span>
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
                  <strong>O total foi alterado em relação ao WhatsApp.</strong> O formulário calcula {money(total)},
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
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Plus,
  Save,
  Smartphone,
  Trash2,
  UserRoundCheck,
  X,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { createWhatsappAdminOrder } from "@/lib/admin-whatsapp-order.functions";
import { recoverFromStaleServerFunction } from "@/lib/server-function-recovery";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pedidos/whatsapp")({
  component: WhatsappAdminOrderPage,
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    cliente: typeof search.cliente === "string" ? search.cliente : undefined,
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
  const { cliente: initialCustomerId } = Route.useSearch();
  const createOrderFn = useServerFn(createWhatsappAdminOrder);

  const [pasteText, setPasteText] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<RegisteredCustomer | null>(null);
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
  const [items, setItems] = useState<DraftItem[]>([]);

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

  const selecionarConta = (profile: RegisteredCustomer) => {
    setSelectedCustomer(profile);
    setCustomerSearch("");
    setNome(profile.nome || "");
    setTelefone(profile.telefone || "");
    if (profile.cidade) setCidade(profile.cidade);
    if (profile.bairro) setBairro(profile.bairro);
    if (profile.endereco) setRua(profile.endereco);
    if (profile.numero) setNumero(profile.numero);
    if (profile.complemento) setComplemento(profile.complemento);
    if (profile.cep) setCep(profile.cep);
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
        if (!cancelled && !error && data) selecionarConta(data as RegisteredCustomer);
        if (!cancelled && (error || !data)) toast.error("Não foi possível carregar a conta selecionada.");
      });
    return () => { cancelled = true; };
  }, [initialCustomerId]);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["whatsapp-admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("produtos_publicos");
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
  const total = metodoEntrega === "entrega" ? subtotal + taxaEntrega : subtotal;
  const totalMismatch =
    declaredTotal !== null && Math.abs(Math.round((declaredTotal - total) * 100) / 100) > 0.009;

  const addBlankItem = () => {
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
    if (!pasteText.trim()) {
      toast.error("Cole o pedido do WhatsApp primeiro.");
      return;
    }
    if (!products.length) {
      toast.error("Aguarde o cardápio carregar.");
      return;
    }

    const lines = pasteText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const firstLine = lines.find((line) => /^\*?Pedido\s+/i.test(line));
    if (firstLine) {
      const m = firstLine.match(/^\*?Pedido\s+(.+?)(?:\s*-\s*([A-Z]{2,5}))?\s*:??\*?$/i);
      if (m?.[1] && !selectedCustomer) setNome(m[1].replace(/\*+/g, "").trim());
      if (m?.[2]?.toUpperCase() === "SBS") setCidade("São Bento do Sul");
    }

    const weightMatch = pasteText.match(/Refei(?:ç|c)[õo]es?\s+(200|300|400)g/i);
    const parsedWeight = (`${weightMatch?.[1] ?? "300"}g`) as DraftItem["weight"];

    const unitPriceMatch =
      pasteText.match(/\b\d+\s*x\s*R?\$?\s*([\d.,]+)\s*\/\s*un/i) ??
      pasteText.match(/\b\d+\s*x\s*([\d.,]+)\s*\/\s*un/i);
    const parsedUnitPrice = unitPriceMatch ? parseMoney(unitPriceMatch[1]) : null;

    const parsedItems: DraftItem[] = [];
    const itemRegex = /(\d+)\s*x\s*([A-Z]{2})\s*\(?\s*0?(\d{1,2})\s*\)?/gi;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(pasteText)) !== null) {
      const qty = Number(match[1]);
      const code = `${match[2].toUpperCase()}${String(Number(match[3])).padStart(2, "0")}`;
      const product = productsByCode.get(code);
      if (!product) {
        toast.error(`Não encontrei ${code} no cardápio atual.`);
        continue;
      }
      parsedItems.push({
        key: newKey(),
        productId: product.id,
        quantity: qty,
        weight: parsedWeight,
        unitPrice: parsedUnitPrice ?? priceFor(product, parsedWeight),
        observacao: "",
      });
    }

    if (parsedItems.length) setItems(parsedItems);
    else toast.error("Não encontrei itens no padrão 5xTD(02), 4xTD26 etc.");

    const feeMatch = pasteText.match(/Entrega\s*\/\s*Retirada\s*:\s*R?\$?\s*([\d.,]+)/i);
    if (feeMatch) setTaxaEntrega(parseMoney(feeMatch[1]));

    const locationMatch = pasteText.match(
      /Local\s+de\s+Entrega\s*\/\s*Retirada\s*:\s*([^\n\r]+)/i,
    );
    if (locationMatch) {
      const location = locationMatch[1].replace(/\*+/g, "").trim();
      if (/retirada/i.test(location) && !/\d/.test(location)) {
        setMetodoEntrega("retirada");
      } else {
        setMetodoEntrega("entrega");
        const parts = location.split(/\s+-\s+/).map((p) => p.trim());
        const streetPart = parts[0] ?? "";
        const streetMatch = streetPart.match(/^(.*?),\s*([^,]+)$/);
        if (streetMatch) {
          setRua(streetMatch[1].trim());
          setNumero(streetMatch[2].trim());
        } else {
          setRua(streetPart);
        }
        if (parts[1]) setBairro(parts[1]);
        if (parts[2]) setCidade(parts[2]);
      }
    }

    const timeMatch = pasteText.match(/Hor[aá]rio\s+de\s+Entrega\s*:\s*([^\n\r]+)/i);
    if (timeMatch) setHorario(timeMatch[1].replace(/\*+/g, "").trim());

    const paymentMatch = pasteText.match(/Forma\s+de\s+Pagamento\s*:\s*([^\n\r]+)/i);
    if (paymentMatch) {
      const value = paymentMatch[1].replace(/\*+/g, "").trim().toLowerCase();
      if (value.includes("pix")) setPagamento("pix");
      else if (value.includes("alimenta") || value.includes("refei")) setPagamento("alimentacao");
      else if (value.includes("mercado")) setPagamento("mercadopago");
      else if (value.includes("dinheiro")) setPagamento("dinheiro");
      else setPagamento("cartao");
    }

    const totalMatches = [...pasteText.matchAll(/R\$\s*([\d.,]+)/gi)];
    if (totalMatches.length) {
      setDeclaredTotal(parseMoney(totalMatches[totalMatches.length - 1][1]));
    } else {
      const totalMatch = pasteText.match(/Total\s*:[^\n\r]*?=\s*([\d.,]+)/i);
      if (totalMatch) setDeclaredTotal(parseMoney(totalMatch[1]));
    }

    toast.success("Pedido interpretado. Confira os dados antes de salvar.");
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada.");

      if (totalMismatch) {
        throw new Error(
          `O total informado no WhatsApp (${money(declaredTotal ?? 0)}) não bate com o cálculo (${money(total)}).`,
        );
      }

      return await createOrderFn({
        data: {
          accessToken,
          nome,
          telefone,
          email,
          linkedUserId: selectedCustomer?.id ?? null,
          metodoEntrega,
          horarioEntrega: horario,
          pagamento,
          tipoCartao,
          taxaEntrega: metodoEntrega === "entrega" ? taxaEntrega : 0,
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
      toast.success(
        `Pedido lançado! ${data?.linkedUserId ? "Vinculado à conta do cliente." : "Sem conta vinculada."} Total ${money(Number(data?.valor_total ?? total))}`,
      );
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
    !totalMismatch &&
    (metodoEntrega === "retirada" || (rua.trim() && bairro.trim() && cidade.trim()));

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto min-h-screen">
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-6">
        <div className="space-y-6">
          <section className="bg-white border rounded-xl p-5 space-y-3">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <UserRoundCheck size={18} className="text-green-700" />
              Vincular à conta do cliente
            </h2>
            <p className="text-xs text-gray-500">
              Selecione quem já possui conta no site. Este pedido aparecerá em Meus Pedidos,
              junto com as compras online. Nenhum cadastro novo será criado.
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
                <Button type="button" size="sm" variant="outline" onClick={() => setSelectedCustomer(null)}>
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
                <label className="text-xs font-bold text-gray-500">Telefone</label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">E-mail</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Entrega/retirada</label>
                <select
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                  value={metodoEntrega}
                  onChange={(e) => setMetodoEntrega(e.target.value as "entrega" | "retirada")}
                >
                  <option value="entrega">Entrega</option>
                  <option value="retirada">Retirada</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Horário</label>
                <Input
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  placeholder="Ex.: após 17h"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Forma de pagamento</label>
              <select
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                value={pagamento}
                onChange={(e) => setPagamento(e.target.value)}
              >
                <option value="cartao">Cartão</option>
                <option value="pix">PIX</option>
                <option value="alimentacao">Alimentação/Refeição</option>
                <option value="mercadopago">Mercado Pago</option>
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

          {metodoEntrega === "entrega" && (
            <section className="bg-white border rounded-xl p-5 space-y-4">
              <h2 className="font-bold text-gray-800">Entrega</h2>
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Rua *</label>
                  <Input value={rua} onChange={(e) => setRua(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Número</label>
                  <Input value={numero} onChange={(e) => setNumero(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Bairro *</label>
                  <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Cidade *</label>
                  <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Complemento</label>
                  <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">CEP</label>
                  <Input value={cep} onChange={(e) => setCep(e.target.value)} />
                </div>
              </div>
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
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="bg-white border rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold text-gray-800">Itens do pedido</h2>
                <p className="text-xs text-gray-500">
                  O estoque é baixado automaticamente ao salvar.
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
                        <option value="200g">200g</option>
                        <option value="300g">300g</option>
                        <option value="400g">400g</option>
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
                      onClick={() => setItems((current) => current.filter((r) => r.key !== item.key))}
                    >
                      <Trash2 size={17} />
                    </Button>

                    <div className="md:col-span-5 flex justify-between gap-3 text-xs">
                      <span className={insufficient ? "text-red-600 font-bold" : "text-gray-500"}>
                        Estoque: {stock}
                        {insufficient ? " — insuficiente" : ""}
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
              {declaredTotal !== null && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Total informado no WhatsApp</span>
                  <span>{money(declaredTotal)}</span>
                </div>
              )}
            </div>

            {totalMismatch && (
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 flex gap-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <strong>Os totais não batem.</strong> Corrija o preço unitário ou a taxa de entrega
                  antes de salvar. O sistema calculou {money(total)}, mas o resumo do WhatsApp informa{" "}
                  {money(declaredTotal ?? 0)}.
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

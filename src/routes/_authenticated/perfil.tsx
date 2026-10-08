import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
  Trash2,
  Home,
  Briefcase,
  MapPinned,
  Pencil,
  ShoppingBag,
  Clock,
  ChevronRight,
  Truck,
  Gift,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  Heart,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ReceiptText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSaldo } from "@/lib/cashback";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { imgUrl } from "@/lib/image-proxy";
import { getProductSummaries } from "@/lib/products.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/perfil")({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth", search: { redirect: location.pathname + location.searchStr + (location.hash ? `#${location.hash}` : ""), confirmed: false } });
    }
    return { session };
  },
  component: PerfilPage,
});

import { useCart } from "@/lib/cart";


function orderItemWeight(observacao?: string | null) {
  const match = String(observacao ?? "").match(/Peso:\s*(200g|300g|400g)/i);
  return match?.[1] ?? null;
}

function orderMoney(value: unknown) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function orderStatusLabel(status: unknown) {
  const value = String(status ?? "").toLowerCase();
  if (value === "pendente") return "Pendente";
  if (value === "pagamento_confirmado") return "Confirmado";
  if (value === "preparando") return "Preparando";
  if (value === "saiu para entrega") return "Saiu para entrega";
  if (value === "pronto para retirada") return "Pronto para retirada";
  if (value === "entregue") return "Entregue";
  if (value === "cancelado") return "Cancelado";
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "—";
}

function orderStatusClass(status: unknown) {
  const value = String(status ?? "").toLowerCase();
  if (value === "entregue") return "bg-green-50 text-green-700 border-green-200";
  if (value === "cancelado") return "bg-red-50 text-red-600 border-red-200";
  if (value === "preparando") return "bg-blue-50 text-blue-700 border-blue-200";
  if (value === "saiu para entrega") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (value === "pronto para retirada") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (value === "pagamento_confirmado") return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-yellow-50 text-yellow-700 border-yellow-200";
}

function PerfilPage() {
  const { session } = Route.useRouteContext();
  const { add } = useCart();
  const { taxas } = useCart();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [cashbackSaldo, setCashbackSaldo] = useState(0);
  const [cashbackTransacoes, setCashbackTransacoes] = useState<any[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    nome: "",
    telefone: "",
    cpf: "",
  });

  // Form state for new/edit address
  const [newAddress, setNewAddress] = useState({
    label: "",
    cidade: "",
    bairro: "",
    rua: "",
    numero: "",
    complemento: "",
    cep: "",
  });

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
    fetchOrders();
    fetchFavorites();
    // Busca cashback
    getSaldo(session.user.id).then((s) => setCashbackSaldo(s));
    supabase
      .from("cashback_transacoes")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setCashbackTransacoes(data ?? []));
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: pedidos, error } = await supabase
        .from("pedidos")
        .select("*, itens:pedido_itens(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Busca nomes dos produtos separadamente (sem FK direta)
      const produtoIds = [
        ...new Set(
          (pedidos ?? []).flatMap((p: any) =>
            (p.itens ?? []).map((i: any) => i.produto_id).filter(Boolean),
          ),
        ),
      ];
      const produtosMap: Record<string, any> = {};
      if (produtoIds.length > 0) {
        const prods = await getProductSummaries(produtoIds);
        (prods ?? []).forEach((p: any) => {
          produtosMap[p.id] = p;
        });
      }

      const ordersWithNames = (pedidos ?? []).map((pedido: any) => ({
        ...pedido,
        itens: (pedido.itens ?? []).map((item: any) => ({
          ...item,
          produtos: {
            nome: produtosMap[item.produto_id]?.nome ?? item.nome_item ?? "Produto",
            imagem_url: produtosMap[item.produto_id]?.imagem_url ?? null,
          },
        })),
        historico: [],
      }));

      setOrders(ordersWithNames);
    } catch (err: any) {
      console.error("Erro ao buscar pedidos:", err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchFavorites = async () => {
    const { data: favs } = await supabase
      .from("favoritos")
      .select("produto_id, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    const ids = (favs ?? []).map((f: any) => f.produto_id);
    if (!ids.length) {
      setFavoriteProducts([]);
      return;
    }

    const products = (await getProductSummaries(ids)).filter(
      (p: any) => p.ativo === true && p.visivel_online === true,
    );

    const orderMap = new Map(ids.map((id: string, index: number) => [id, index]));
    setFavoriteProducts(
      (products ?? []).sort(
        (a: any, b: any) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999),
      ),
    );
  };

  const removeFavorite = async (produtoId: string) => {
    const { error } = await supabase
      .from("favoritos")
      .delete()
      .eq("user_id", session.user.id)
      .eq("produto_id", produtoId);
    if (error) {
      toast.error("Não foi possível remover dos favoritos.");
      return;
    }
    setFavoriteProducts((current) => current.filter((product) => product.id !== produtoId));
    toast.success("Removido dos favoritos.");
  };

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (data) {
      setProfile(data);
      setProfileForm({
        nome: data.nome || "",
        telefone: data.telefone || "",
        cpf: data.cpf || "",
      });
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          id: session.user.id,
          nome: profileForm.nome,
          telefone: profileForm.telefone,
          cpf: profileForm.cpf,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      setIsEditingProfile(false);
      fetchProfile();
    } catch (err: any) {
      toast.error("Erro ao atualizar perfil: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCepSearch = async (cep: string) => {
    const numericCep = cep.replace(/\D/g, "");
    setNewAddress((prev) => ({ ...prev, cep: numericCep }));

    if (numericCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${numericCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setNewAddress((prev) => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
          }));
          toast.success("CEP encontrado!");
        } else {
          toast.error("CEP não encontrado.");
        }
      } catch (err) {
        toast.error("Erro ao buscar CEP.");
      }
    }
  };

  const fetchAddresses = async () => {
    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", session.user.id)
      .order("is_default", { ascending: false });

    if (data) setAddresses(data);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        const { error } = await supabase
          .from("user_addresses")
          .update({
            label: newAddress.label || "Endereço",
            cidade: newAddress.cidade,
            bairro: newAddress.bairro,
            rua: newAddress.rua,
            numero: newAddress.numero,
            complemento: newAddress.complemento,
            cep: newAddress.cep,
          })
          .eq("id", editingAddressId);

        if (error) throw error;
        toast.success("Endereço atualizado!");
      } else {
        const { error } = await supabase.from("user_addresses").insert({
          user_id: session.user.id,
          label: newAddress.label || "Endereço",
          cidade: newAddress.cidade,
          bairro: newAddress.bairro,
          rua: newAddress.rua,
          numero: newAddress.numero,
          complemento: newAddress.complemento,
          cep: newAddress.cep,
          is_default: addresses.length === 0,
        });

        if (error) throw error;
        toast.success("Endereço adicionado!");
      }

      setIsAddingAddress(false);
      setEditingAddressId(null);
      setNewAddress({
        label: "",
        cidade: "",
        bairro: "",
        rua: "",
        numero: "",
        complemento: "",
        cep: "",
      });
      fetchAddresses();
    } catch (error: any) {
      toast.error("Erro ao salvar endereço: " + error.message);
    }
  };

  const handleEditAddress = (addr: any) => {
    setNewAddress({
      label: addr.label,
      cidade: addr.cidade,
      bairro: addr.bairro,
      rua: addr.rua,
      numero: addr.numero,
      complemento: addr.complemento || "",
      cep: addr.cep || "",
    });
    setEditingAddressId(addr.id);
    setIsAddingAddress(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;
    try {
      const { error } = await supabase.from("user_addresses").delete().eq("id", addressToDelete);
      if (error) throw error;
      toast.success("Endereço removido");
      setAddressToDelete(null);
      fetchAddresses();
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  const currentTaxa = useMemo(() => {
    if (!newAddress.cidade || !newAddress.bairro) return null;
    return taxas.find(
      (t) =>
        t.cidade.toLowerCase().trim() === newAddress.cidade.toLowerCase().trim() &&
        t.bairro.toLowerCase().trim() === newAddress.bairro.toLowerCase().trim(),
    );
  }, [newAddress.cidade, newAddress.bairro, taxas]);

  const topProducts = useMemo(() => {
    const counts = new Map<string, { id: string; nome: string; quantidade: number }>();

    orders
      .filter((order: any) => String(order.status || "").toLowerCase() !== "cancelado")
      .forEach((order: any) => {
        (order.itens ?? []).forEach((item: any) => {
          if (!item.produto_id) return;
          const current = counts.get(item.produto_id) ?? {
            id: item.produto_id,
            nome: item.produtos?.nome ?? "Produto",
            quantidade: 0,
          };
          current.quantidade += Number(item.quantidade || 0);
          counts.set(item.produto_id, current);
        });
      });

    return [...counts.values()]
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [orders]);

  const handleRepeatOrder = (order: any) => {
    try {
      // Adiciona cada item do pedido anterior ao carrinho.
      // O peso foi gravado em observacao como "Peso: 300g | ..." — extrai de lá.
      order.itens?.forEach((item: any) => {
        const obs = item.observacao ?? "";
        const matchPeso = obs.match(/Peso:\s*(\d+g)/i);
        const weight = matchPeso ? matchPeso[1] : undefined;
        add(item.produto_id, item.quantidade, weight);
      });
      toast.success("Pedido repetido!", {
        description: `${order.itens?.length || 0} item(ns) adicionados ao carrinho`,
      });
    } catch (error: any) {
      toast.error("Erro ao repetir pedido");
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações e pedidos.</p>
      </div>

      <nav
        aria-label="Atalhos do perfil"
        className="-mx-4 mb-8 flex snap-x gap-2 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
      >
        {[
          ["favoritos", "Favoritos"],
          ...(topProducts.length > 0 ? [["mais-pedidos", "Mais pedidos"]] : []),
          ["pedidos", "Pedidos"],
          ["cashback", "Cashback"],
          ["indicacao", "Indique e Ganhe"],
          ["enderecos", "Endereços"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 snap-start rounded-full border border-primary/15 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        {/* Informações Básicas */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{isEditingProfile ? "Editar Dados" : "Dados Pessoais"}</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={profileForm.nome}
                    onChange={(e) => setProfileForm({ ...profileForm, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                  <Input
                    id="telefone"
                    value={profileForm.telefone}
                    onChange={(e) => setProfileForm({ ...profileForm, telefone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={profileForm.cpf}
                    onChange={(e) => setProfileForm({ ...profileForm, cpf: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1" disabled={savingProfile}>
                    {savingProfile ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Nome</Label>
                  <p className="font-medium">{profile?.nome || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">E-mail</Label>
                  <p className="font-medium">{session.user.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Telefone</Label>
                  <p className="font-medium">{profile?.telefone || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">CPF</Label>
                  <p className="font-medium">{profile?.cpf || "Não informado"}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Editar Dados
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-12">
          {/* Meus Favoritos */}
          <section id="favoritos" className="scroll-mt-28 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Heart className="h-5 w-5 fill-primary text-primary" />
                Meus Favoritos
              </h2>
              <Link to="/" hash="cardapio" className="text-base font-bold text-primary hover:underline">
                Ver cardápio
              </Link>
            </div>

            {favoriteProducts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Heart className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-base text-muted-foreground">
                    Toque no coração das suas marmitas favoritas para encontrá-las aqui.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {favoriteProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="flex items-center gap-3 p-3">
                      <Link to="/produto/$id" params={{ id: product.id }} className="shrink-0">
                        <img
                          src={imgUrl(product.imagem_url)}
                          alt={product.nome}
                          className="h-16 w-16 rounded-xl object-cover"
                          loading="lazy"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/produto/$id"
                          params={{ id: product.id }}
                          className="line-clamp-2 text-base font-bold leading-snug hover:text-primary"
                        >
                          {product.nome}
                        </Link>
                        <p className="mt-1 text-base font-bold text-primary">
                          R$ {Number(product.preco_300g || product.preco || 0).toFixed(2).replace(".", ",")}
                        </p>
                        <Link
                          to="/produto/$id"
                          params={{ id: product.id }}
                          className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        >
                          Abrir produto <ExternalLink className="size-3" />
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFavorite(product.id)}
                        aria-label="Remover dos favoritos"
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                      >
                        <Heart className="size-4 fill-current" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {topProducts.length > 0 && (
            <section id="mais-pedidos" className="scroll-mt-28 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Seus mais pedidos
              </h2>
              <Card>
                <CardContent className="p-4">
                  <div className="divide-y">
                    {topProducts.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold">{item.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantidade} {item.quantidade === 1 ? "unidade pedida" : "unidades pedidas"}
                            </p>
                          </div>
                        </div>
                        <Link
                          to="/produto/$id"
                          params={{ id: item.id }}
                          className="shrink-0 rounded-full border border-primary/20 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/5"
                        >
                          Abrir
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Meus Pedidos */}
          <section id="pedidos" className="scroll-mt-28 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Meus Pedidos
            </h2>

            {loadingOrders ? (
              <div className="text-center py-8">Carregando pedidos...</div>
            ) : orders.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Você ainda não realizou nenhum pedido.</p>
                  <Button asChild variant="outline" className="mt-4 rounded-full">
                    <Link to="/">Ir para o Cardápio</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const totalUnits = (order.itens ?? []).reduce(
                    (sum: number, item: any) => sum + Number(item.quantidade || 0),
                    0,
                  );
                  const itemsSubtotal = (order.itens ?? []).reduce(
                    (sum: number, item: any) =>
                      sum + Number(item.quantidade || 0) * Number(item.preco_unitario || 0),
                    0,
                  );
                  const entrega = String(order.metodo_entrega ?? "").toLowerCase() === "entrega";
                  const endereco = [
                    [order.endereco_rua, order.endereco_numero].filter(Boolean).join(", "),
                    order.endereco_complemento,
                    order.endereco_bairro,
                    order.endereco_cidade,
                  ].filter(Boolean);

                  return (
                    <Card key={order.id} className="overflow-hidden">
                      <div className="bg-muted/30 px-4 py-4 md:px-6 flex items-center justify-between border-b gap-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground tracking-normal">
                              Pedido
                            </p>
                            <p className="font-bold text-primary">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground tracking-normal">
                              Data
                            </p>
                            <p className="text-base font-medium">
                              {new Date(order.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-semibold tracking-normal px-3 py-1 rounded-full border ${orderStatusClass(order.status)}`}
                        >
                          {orderStatusLabel(order.status)}
                        </span>
                      </div>

                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-foreground">
                              {totalUnits} {totalUnits === 1 ? "unidade" : "unidades"}
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {(order.itens ?? []).length} {(order.itens ?? []).length === 1 ? "produto" : "produtos"} diferentes
                            </p>
                            <div className="mt-3 flex -space-x-2">
                              {(order.itens ?? []).slice(0, 5).map((item: any) => (
                                item.produtos?.imagem_url ? (
                                  <img
                                    key={item.id}
                                    src={imgUrl(item.produtos.imagem_url)}
                                    alt={item.produtos?.nome ?? "Produto"}
                                    title={item.produtos?.nome}
                                    className="h-9 w-9 rounded-full border-2 border-background object-cover"
                                  />
                                ) : (
                                  <div
                                    key={item.id}
                                    className="h-9 w-9 rounded-full bg-muted border-2 border-background flex items-center justify-center text-sm font-semibold"
                                    title={item.produtos?.nome}
                                  >
                                    {item.quantidade}
                                  </div>
                                )
                              ))}
                              {(order.itens ?? []).length > 5 && (
                                <div className="h-9 min-w-9 px-2 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[11px] font-bold text-primary">
                                  +{(order.itens ?? []).length - 5}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-muted-foreground tracking-normal">
                              Total
                            </p>
                            <p className="text-lg font-bold">{orderMoney(order.valor_total)}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="mt-4 flex w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-base font-bold text-primary transition hover:bg-primary/10"
                        >
                          <span className="flex items-center gap-2">
                            <ReceiptText size={16} />
                            {isExpanded ? "Ocultar detalhes" : "Ver detalhes do pedido"}
                          </span>
                          {isExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                        </button>

                        {isExpanded && (
                          <div className="mt-4 space-y-5 border-t pt-4">
                            <div>
                              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                                Itens do pedido
                              </p>
                              <div className="space-y-3">
                                {(order.itens ?? []).map((item: any) => {
                                  const peso = orderItemWeight(item.observacao);
                                  const lineTotal =
                                    Number(item.quantidade || 0) * Number(item.preco_unitario || 0);

                                  return (
                                    <div key={item.id} className="flex items-center gap-3">
                                      {item.produtos?.imagem_url ? (
                                        <img
                                          src={imgUrl(item.produtos.imagem_url)}
                                          alt={item.produtos?.nome ?? "Produto"}
                                          className="h-12 w-12 shrink-0 rounded-xl object-cover"
                                        />
                                      ) : (
                                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
                                          {item.quantidade}x
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-base font-bold leading-snug text-foreground">
                                          {item.quantidade}x {item.produtos?.nome ?? item.nome_item ?? "Produto"}
                                        </p>
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                          {peso ? `${peso} • ` : ""}
                                          {orderMoney(item.preco_unitario)} por unidade
                                        </p>
                                      </div>
                                      <span className="shrink-0 text-base font-bold text-foreground">
                                        {orderMoney(lineTotal)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="grid gap-3 rounded-2xl bg-muted/35 p-4 sm:grid-cols-2">
                              <div className="flex gap-2">
                                <Truck size={17} className="mt-0.5 shrink-0 text-primary" />
                                <div>
                                  <p className="text-sm font-bold text-muted-foreground">
                                    {entrega ? "Entrega" : "Retirada"}
                                  </p>
                                  <p className="text-base font-semibold">
                                    {entrega
                                      ? endereco.length
                                        ? endereco.join(" - ")
                                        : "Endereço informado no pedido"
                                      : "Retirada na loja"}
                                  </p>
                                  {order.horario_recebimento && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {order.horario_recebimento}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <CreditCard size={17} className="mt-0.5 shrink-0 text-primary" />
                                <div>
                                  <p className="text-sm font-bold text-muted-foreground">
                                    Pagamento
                                  </p>
                                  <p className="text-base font-semibold capitalize">
                                    {order.metodo_pagamento || "—"}
                                    {order.tipo_cartao ? ` • ${order.tipo_cartao}` : ""}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {order.observacao && !/^Cartão:/i.test(String(order.observacao)) && (
                              <div className="rounded-xl border bg-background p-3">
                                <p className="text-sm font-bold text-muted-foreground">
                                  Observações
                                </p>
                                <p className="mt-1 text-base">{order.observacao}</p>
                              </div>
                            )}

                            <div className="space-y-2 border-t pt-4 text-base">
                              <div className="flex justify-between text-muted-foreground">
                                <span>Produtos</span>
                                <span>{orderMoney(itemsSubtotal)}</span>
                              </div>
                              {Number(order.taxa_entrega || 0) > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Taxa de entrega</span>
                                  <span>{orderMoney(order.taxa_entrega)}</span>
                                </div>
                              )}
                              {order.cupom_codigo && (
                                <div className="flex justify-between text-green-700">
                                  <span>Cupom utilizado</span>
                                  <span className="font-bold">{order.cupom_codigo}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t pt-3 text-base font-black">
                                <span>Total pago</span>
                                <span className="text-primary">{orderMoney(order.valor_total)}</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Link
                                to="/pedido"
                                search={{ p: order.id.slice(0, 8).toUpperCase() }}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-base font-bold text-primary-foreground transition hover:bg-primary/90"
                              >
                                <Truck size={16} />
                                Acompanhar pedido
                              </Link>
                              <Button
                                onClick={() => handleRepeatOrder(order)}
                                variant="outline"
                                className="flex-1 gap-2 border-primary text-primary hover:bg-primary/5"
                              >
                                <RotateCcw size={16} />
                                Repetir pedido
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Meu Cashback */}
          <section id="cashback" className="scroll-mt-28 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Gift className="h-5 w-5 text-yellow-500" />
              Meu Cashback
            </h2>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-normal text-yellow-600 mb-1">
                    Saldo disponível
                  </p>
                  <p className="text-3xl font-bold text-yellow-700">
                    R$ {cashbackSaldo.toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Use no checkout em até 30 dias. O sistema usa primeiro o crédito que vence antes.
                  </p>
                </div>
                <div className="h-16 w-16 rounded-full bg-yellow-200 flex items-center justify-center">
                  <Gift size={28} className="text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            {cashbackTransacoes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-muted-foreground tracking-normal">
                  Histórico
                </h3>
                {cashbackTransacoes.map((t: any) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between bg-white border rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {t.tipo === "recebido" ? (
                        <ArrowUpCircle size={16} className="text-green-500 shrink-0" />
                      ) : t.tipo === "usado" ? (
                        <ArrowDownCircle size={16} className="text-blue-500 shrink-0" />
                      ) : (
                        <Clock size={16} className="text-red-400 shrink-0" />
                      )}
                      <div>
                        <p className="text-base font-medium text-gray-800 capitalize">{t.tipo}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          {t.tipo === "recebido" && t.expira_em && Number(t.saldo_restante ?? 0) > 0
                            ? ` • vence em ${format(new Date(t.expira_em), "dd/MM/yyyy", { locale: ptBR })}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-bold text-base ${t.tipo === "recebido" ? "text-green-600" : "text-red-500"}`}
                    >
                      {t.tipo === "recebido" ? "+" : "−"} R$ {Math.abs(t.valor).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Indique e Ganhe */}
          <section id="indicacao" className="scroll-mt-28 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Indique e Ganhe
            </h2>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900 mb-1">Ganhe R$ 5,00 por indicação!</p>
                  <p className="text-base text-gray-500">
                    Seu amigo ganha 5% na primeira compra e você recebe R$ 5,00 após a entrega.
                  </p>
                </div>
                <Link
                  to="/indicar"
                  className="shrink-0 px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-base font-bold hover:bg-primary/90 transition-all whitespace-nowrap"
                >
                  Ver meu link
                </Link>
              </CardContent>
            </Card>
          </section>

          {/* Gerenciamento de Endereços */}
          <section id="enderecos" className="scroll-mt-28 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPinned className="h-5 w-5 text-primary" />
                Meus Endereços
              </h2>
              <Button
                onClick={() => {
                  setIsAddingAddress(!isAddingAddress);
                  if (!isAddingAddress) setEditingAddressId(null);
                }}
                size="sm"
                className="rounded-full"
              >
                {isAddingAddress ? (
                  "Cancelar"
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Novo Endereço
                  </>
                )}
              </Button>
            </div>

            {isAddingAddress && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {editingAddressId ? "Editar Endereço" : "Adicionar Novo Endereço"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          id="cep"
                          placeholder="00000-000"
                          value={newAddress.cep}
                          onChange={(e) => handleCepSearch(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="label">Apelido (ex: Casa, Trabalho)</Label>
                        <Input
                          id="label"
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                          placeholder="Ex: Casa"
                          required
                        />
                      </div>
                    </div>

                    {currentTaxa && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-2xl border border-green-100 animate-in fade-in slide-in-from-top-1">
                        <Truck size={18} />
                        <span className="text-base font-bold">
                          Taxa de entrega para este local: R${" "}
                          {currentTaxa.taxa.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input
                          id="cidade"
                          value={newAddress.cidade}
                          onChange={(e) => setNewAddress({ ...newAddress, cidade: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="bairro">Bairro</Label>
                        <Input
                          id="bairro"
                          value={newAddress.bairro}
                          onChange={(e) => setNewAddress({ ...newAddress, bairro: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rua">Rua</Label>
                        <Input
                          id="rua"
                          value={newAddress.rua}
                          onChange={(e) => setNewAddress({ ...newAddress, rua: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="numero">Número</Label>
                        <Input
                          id="numero"
                          value={newAddress.numero}
                          onChange={(e) => setNewAddress({ ...newAddress, numero: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complemento">Complemento (opcional)</Label>
                        <Input
                          id="complemento"
                          value={newAddress.complemento}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, complemento: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      {editingAddressId ? "Atualizar Endereço" : "Salvar Endereço"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {addresses.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-3xl border border-dashed">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Nenhum endereço cadastrado.</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <Card
                    key={addr.id}
                    className={addr.is_default ? "border-primary/50 shadow-sm" : ""}
                  >
                    <CardContent className="p-6 flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="mt-1 bg-primary/10 p-2 rounded-xl text-primary">
                          {addr.label?.toLowerCase().includes("casa") ? (
                            <Home size={20} />
                          ) : addr.label?.toLowerCase().includes("trabalho") ? (
                            <Briefcase size={20} />
                          ) : (
                            <MapPin size={20} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">{addr.label}</h3>
                            {addr.is_default && (
                              <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold tracking-normal">
                                Padrão
                              </span>
                            )}
                          </div>
                          <p className="text-base text-muted-foreground mt-1">
                            {addr.rua}, {addr.numero}
                            {addr.complemento ? ` - ${addr.complemento}` : ""}
                          </p>
                          <p className="text-base text-muted-foreground">
                            {addr.bairro}, {addr.cidade}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleEditAddress(addr)}
                        >
                          <Pencil size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setAddressToDelete(addr.id)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <AlertDialog
        open={!!addressToDelete}
        onOpenChange={(open) => !open && setAddressToDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Excluir endereço?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O endereço será removido permanentemente da sua
              conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-full border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAddress}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

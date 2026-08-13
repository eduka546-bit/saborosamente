import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Home, Briefcase, MapPinned, Pencil, ShoppingBag, Clock, ChevronRight, Truck, Gift, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSaldo } from "@/lib/cashback";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth", search: { redirect: "/perfil" } });
    }
    return { session };
  },
  component: PerfilPage,
});

import { useCart } from "@/lib/cart";

function PerfilPage() {
  const { session } = Route.useRouteContext();
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
  
  const [profileForm, setProfileForm] = useState({
    nome: "",
    telefone: "",
    cpf: ""
  });

  // Form state for new/edit address
  const [newAddress, setNewAddress] = useState({
    label: "",
    cidade: "",
    bairro: "",
    rua: "",
    numero: "",
    complemento: "",
    cep: ""
  });

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
    fetchOrders();
    // Busca cashback
    getSaldo(session.user.id).then(s => setCashbackSaldo(s));
    supabase.from("cashback_transacoes")
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
      const produtoIds = [...new Set(
        (pedidos ?? []).flatMap((p: any) => (p.itens ?? []).map((i: any) => i.produto_id).filter(Boolean))
      )];
      let nomesMap: Record<string, string> = {};
      if (produtoIds.length > 0) {
        const { data: prods } = await supabase
          .from("produtos")
          .select("id, nome")
          .in("id", produtoIds);
        (prods ?? []).forEach((p: any) => { nomesMap[p.id] = p.nome; });
      }

      const ordersWithNames = (pedidos ?? []).map((pedido: any) => ({
        ...pedido,
        itens: (pedido.itens ?? []).map((item: any) => ({
          ...item,
          produtos: { nome: nomesMap[item.produto_id] ?? "Produto" }
        })),
        historico: []
      }));

      setOrders(ordersWithNames);
    } catch (err: any) {
      console.error("Erro ao buscar pedidos:", err.message);
    } finally {
      setLoadingOrders(false);
    }
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
        cpf: data.cpf || ""
      });
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          nome: profileForm.nome,
          telefone: profileForm.telefone,
          cpf: profileForm.cpf,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

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
    setNewAddress(prev => ({ ...prev, cep: numericCep }));

    if (numericCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${numericCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setNewAddress(prev => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade
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
          is_default: addresses.length === 0
        });

        if (error) throw error;
        toast.success("Endereço adicionado!");
      }

      setIsAddingAddress(false);
      setEditingAddressId(null);
      setNewAddress({ label: "", cidade: "", bairro: "", rua: "", numero: "", complemento: "", cep: "" });
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
      cep: addr.cep || ""
    });
    setEditingAddressId(addr.id);
    setIsAddingAddress(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      t => t.cidade.toLowerCase().trim() === newAddress.cidade.toLowerCase().trim() && 
           t.bairro.toLowerCase().trim() === newAddress.bairro.toLowerCase().trim()
    );
  }, [newAddress.cidade, newAddress.bairro, taxas]);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações e pedidos.</p>
      </div>

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
                    onChange={e => setProfileForm({...profileForm, nome: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                  <Input 
                    id="telefone" 
                    value={profileForm.telefone} 
                    onChange={e => setProfileForm({...profileForm, telefone: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input 
                    id="cpf" 
                    value={profileForm.cpf} 
                    onChange={e => setProfileForm({...profileForm, cpf: e.target.value})}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1" disabled={savingProfile}>
                    {savingProfile ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Nome</Label>
                  <p className="font-medium">{profile?.nome || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">E-mail</Label>
                  <p className="font-medium">{session.user.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Telefone</Label>
                  <p className="font-medium">{profile?.telefone || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">CPF</Label>
                  <p className="font-medium">{profile?.cpf || "Não informado"}</p>
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => setIsEditingProfile(true)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar Dados
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-12">
          {/* Meus Pedidos */}
          <section className="space-y-6">
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
                {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <div className="bg-muted/30 px-6 py-4 flex items-center justify-between border-b">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pedido</p>
                          <p className="font-bold text-primary">#{order.id.slice(0, 8)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Data</p>
                          <p className="text-sm font-medium">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                          order.status === 'Entregue' ? 'bg-green-50 text-green-600 border-green-200' :
                          order.status === 'Cancelado' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-yellow-50 text-yellow-600 border-yellow-200'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            {order.itens?.length} {order.itens?.length === 1 ? 'item' : 'itens'}
                          </p>
                          <div className="flex -space-x-2">
                            {order.itens?.slice(0, 5).map((item: any) => (
                              <div key={item.id} className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold" title={item.produtos?.nome}>
                                {item.quantidade}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                          <p className="text-lg font-bold">R$ {order.valor_total.toFixed(2).replace('.', ',')}</p>
                        </div>
                      </div>
                      
                      {order.status && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Status</p>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                            order.status === 'entregue' ? 'bg-green-50 text-green-600 border-green-200' :
                            order.status === 'cancelado' ? 'bg-red-50 text-red-600 border-red-200' :
                            order.status === 'preparando' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                            'bg-yellow-50 text-yellow-600 border-yellow-200'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Meu Cashback */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Gift className="h-5 w-5 text-yellow-500" />
              Meu Cashback
            </h2>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-yellow-600 mb-1">Saldo disponível</p>
                  <p className="text-3xl font-black text-yellow-700">R$ {cashbackSaldo.toFixed(2).replace(".", ",")}</p>
                  <p className="text-xs text-yellow-600 mt-1">Use no checkout para descontar do próximo pedido</p>
                </div>
                <div className="h-16 w-16 rounded-full bg-yellow-200 flex items-center justify-center">
                  <Gift size={28} className="text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            {cashbackTransacoes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Histórico</h3>
                {cashbackTransacoes.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between bg-white border rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      {t.tipo === "recebido"
                        ? <ArrowUpCircle size={16} className="text-green-500 shrink-0" />
                        : t.tipo === "usado"
                        ? <ArrowDownCircle size={16} className="text-blue-500 shrink-0" />
                        : <Clock size={16} className="text-red-400 shrink-0" />
                      }
                      <div>
                        <p className="text-sm font-medium text-gray-800 capitalize">{t.tipo}</p>
                        <p className="text-xs text-gray-400">{format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${t.tipo === "recebido" ? "text-green-600" : "text-red-500"}`}>
                      {t.tipo === "recebido" ? "+" : "−"} R$ {Math.abs(t.valor).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Gerenciamento de Endereços */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPinned className="h-5 w-5 text-primary" />
                Meus Endereços
              </h2>
              <Button onClick={() => {
                setIsAddingAddress(!isAddingAddress);
                if (!isAddingAddress) setEditingAddressId(null);
              }} size="sm" className="rounded-full">
                {isAddingAddress ? "Cancelar" : <><Plus className="mr-2 h-4 w-4" /> Novo Endereço</>}
              </Button>
            </div>

            {isAddingAddress && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">{editingAddressId ? "Editar Endereço" : "Adicionar Novo Endereço"}</CardTitle>
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
                          onChange={e => handleCepSearch(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="label">Apelido (ex: Casa, Trabalho)</Label>
                        <Input 
                          id="label" 
                          value={newAddress.label} 
                          onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                          placeholder="Ex: Casa"
                          required
                        />
                      </div>
                    </div>

                    {currentTaxa && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-2xl border border-green-100 animate-in fade-in slide-in-from-top-1">
                        <Truck size={18} />
                        <span className="text-sm font-bold">
                          Taxa de entrega para este local: R$ {currentTaxa.taxa.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input 
                          id="cidade" 
                          value={newAddress.cidade} 
                          onChange={e => setNewAddress({...newAddress, cidade: e.target.value})}
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
                          onChange={e => setNewAddress({...newAddress, bairro: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rua">Rua</Label>
                        <Input 
                          id="rua" 
                          value={newAddress.rua} 
                          onChange={e => setNewAddress({...newAddress, rua: e.target.value})}
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
                          onChange={e => setNewAddress({...newAddress, numero: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complemento">Complemento (opcional)</Label>
                        <Input 
                          id="complemento" 
                          value={newAddress.complemento} 
                          onChange={e => setNewAddress({...newAddress, complemento: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">{editingAddressId ? "Atualizar Endereço" : "Salvar Endereço"}</Button>
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
                  <Card key={addr.id} className={addr.is_default ? "border-primary/50 shadow-sm" : ""}>
                    <CardContent className="p-6 flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="mt-1 bg-primary/10 p-2 rounded-xl text-primary">
                          {addr.label?.toLowerCase().includes("casa") ? <Home size={20} /> : 
                           addr.label?.toLowerCase().includes("trabalho") ? <Briefcase size={20} /> : 
                           <MapPin size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">{addr.label}</h3>
                            {addr.is_default && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Padrão</span>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {addr.rua}, {addr.numero}{addr.complemento ? ` - ${addr.complemento}` : ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
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

      <AlertDialog open={!!addressToDelete} onOpenChange={(open) => !open && setAddressToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Excluir endereço?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O endereço será removido permanentemente da sua conta.
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

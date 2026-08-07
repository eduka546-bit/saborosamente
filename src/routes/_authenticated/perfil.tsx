import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Home, Briefcase, MapPinned, Pencil, ShoppingBag, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      throw redirect({ to: "/auth" });
    }
    return { session };
  },
  component: PerfilPage,
});

function PerfilPage() {
  const { session } = Route.useRouteContext();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // Form state for new/edit address
  const [newAddress, setNewAddress] = useState({
    label: "",
    cidade: "",
    bairro: "",
    rua: "",
    numero: "",
    complemento: ""
  });

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          *,
          itens:pedido_itens(
            *,
            produtos(nome)
          ),
          historico:pedido_status_historico(*)
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
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
    
    if (data) setProfile(data);
    setLoading(false);
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
          is_default: addresses.length === 0
        });

        if (error) throw error;
        toast.success("Endereço adicionado!");
      }

      setIsAddingAddress(false);
      setEditingAddressId(null);
      setNewAddress({ label: "", cidade: "", bairro: "", rua: "", numero: "", complemento: "" });
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
      complemento: addr.complemento || ""
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

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações e endereços de entrega.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button variant="outline" className="w-full mt-4" onClick={() => toast.info("Edição de perfil em breve")}>
              Editar Dados
            </Button>
          </CardContent>
        </Card>

        {/* Gerenciamento de Endereços */}
        <div className="space-y-6">
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
                      <Label htmlFor="label">Apelido (ex: Casa, Trabalho)</Label>
                      <Input 
                        id="label" 
                        value={newAddress.label} 
                        onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                        placeholder="Ex: Casa"
                        required
                      />
                    </div>
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

import { createFileRoute } from "@tanstack/react-router";
import { Users, Search, Filter, Mail, Phone, ShoppingBag, MapPin, Eye, X, Calendar, DollarSign, Upload, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { importExistingCustomers } from "@/lib/customers.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/admin/clientes")({
  component: AdminClientesPage,
});

function AdminClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importFn = useServerFn(importExistingCustomers);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      // 1. Buscar perfis (clientes cadastrados)
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .order("nome", { ascending: true });

      if (profileError) {
        console.error("Profile error details:", profileError);
        toast.error("Erro ao carregar perfis: " + profileError.message);
        throw profileError;
      }
      
      console.log("Profiles loaded:", profiles?.length);

      // 2. Buscar pedidos para histórico
      const { data: orders, error: orderError } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });

      if (orderError) throw orderError;
      
      const clientMap = new Map();

      // Mapear perfis primeiro
      profiles?.forEach(profile => {
        clientMap.set(profile.id, {
          id: profile.id,
          nome: profile.nome,
          telefone: profile.telefone,
          email: profile.email || "Não informado",
          cpf: profile.cpf,
          bairro: profile.bairro,
          totalPedidos: 0,
          valorGasto: 0,
          ultimoPedido: null,
          pedidos: []
        });
      });

      // Vincular pedidos aos perfis ou criar clientes convidados
      orders?.forEach(order => {
        const userId = order.user_id;
        const key = userId || order.email_cliente || order.telefone_cliente;

        if (!clientMap.has(key)) {
          clientMap.set(key, {
            nome: order.nome_cliente,
            telefone: order.telefone_cliente,
            email: order.email_cliente || "Não informado",
            totalPedidos: 1,
            valorGasto: order.valor_total || 0,
            ultimoPedido: order.created_at,
            pedidos: [order]
          });
        } else {
          const existing = clientMap.get(key);
          existing.totalPedidos += 1;
          existing.valorGasto += (order.valor_total || 0);
          existing.pedidos.push(order);
          if (!existing.ultimoPedido || new Date(order.created_at) > new Date(existing.ultimoPedido)) {
            existing.ultimoPedido = order.created_at;
          }
        }
      });

      return Array.from(clientMap.values());
    },
  });

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefone?.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  const handleImport = async () => {
    try {
      setIsImporting(true);
      const result = await importFn();
      
      if (result && (result.success || result.errors)) {
        toast.success(`Importação concluída: ${result.success} sucessos, ${result.errors} erros/pulados.`, {
          duration: 5000
        });
      }
    } catch (error: any) {
      toast.error("Falha ao iniciar importação: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie sua base de clientes e histórico de compras.</p>
        </div>
        
        <Button 
          onClick={handleImport} 
          disabled={isImporting}
          className="bg-[#086e45] hover:bg-[#065a38] text-white flex items-center gap-2"
        >
          {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          Importar Clientes Antigos
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Buscar por nome ou telefone..." 
              className="pl-10 rounded-lg border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2 rounded-lg border-gray-200">
            <Filter size={18} /> Filtros
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Pedidos</th>
              <th className="px-6 py-4">Total Gasto</th>
              <th className="px-6 py-4">Última Compra</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center">Carregando clientes...</td></tr>
            ) : filteredClients.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum cliente encontrado.</td></tr>
            ) : (
              filteredClients.map((client, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#5850ec]/10 flex items-center justify-center text-[#5850ec]">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{client.nome || "Cliente Final"}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{client.totalPedidos} pedidos</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">R$ {client.valorGasto.toFixed(2).replace('.', ',')}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {client.ultimoPedido ? new Date(client.ultimoPedido).toLocaleDateString('pt-BR') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={() => setSelectedClient(client)}
                    >
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
          <div className="bg-white h-full w-full max-w-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-[#5850ec]">Detalhes do Cliente</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}>
                <X size={24} />
              </Button>
            </div>

            <div className="bg-[#5850ec]/5 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-6">
              <div className="h-20 w-20 rounded-full bg-[#5850ec] flex items-center justify-center text-white text-3xl font-bold shrink-0">
                {selectedClient.nome?.charAt(0) || "C"}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">{selectedClient.nome}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><Phone size={14} className="text-[#5850ec]" /> {selectedClient.telefone}</span>
                  <span className="flex items-center gap-1"><Mail size={14} className="text-[#5850ec]" /> {selectedClient.email}</span>
                  {selectedClient.cpf && <span className="flex items-center gap-1"><DollarSign size={14} className="text-[#5850ec]" /> CPF: {selectedClient.cpf}</span>}
                  {selectedClient.bairro && <span className="flex items-center gap-1 w-full md:w-auto"><MapPin size={14} className="text-[#5850ec]" /> Bairro: {selectedClient.bairro}</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pedidos</p>
                <p className="text-lg font-black text-gray-900">{selectedClient.totalPedidos}</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Gasto</p>
                <p className="text-lg font-black text-green-600">R$ {selectedClient.valorGasto.toFixed(2)}</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ticket Médio</p>
                <p className="text-lg font-black text-[#5850ec]">R$ {(selectedClient.valorGasto / selectedClient.totalPedidos).toFixed(2)}</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Último Pedido</p>
                <p className="text-sm font-bold text-gray-700">{new Date(selectedClient.ultimoPedido).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <h4 className="text-lg font-bold text-gray-900 mb-4">Histórico de Pedidos</h4>
            <div className="space-y-4">
              {selectedClient.pedidos.map((pedido: any) => (
                <div key={pedido.id} className="border rounded-xl p-4 hover:border-[#5850ec]/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        Pedido #{pedido.id.slice(0, 8)}
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                          {pedido.status}
                        </Badge>
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar size={12} /> {new Date(pedido.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <p className="font-bold text-[#5850ec]">R$ {pedido.valor_total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


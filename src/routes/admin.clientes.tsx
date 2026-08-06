import { createFileRoute } from "@tanstack/react-router";
import { Users, Search, Filter, Mail, Phone, ShoppingBag, MapPin, MoreVertical, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/clientes")({
  component: AdminClientesPage,
});

function AdminClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      // Como não temos uma tabela de perfis de clientes dedicada além de auth.users, 
      // vamos extrair clientes únicos da tabela de pedidos
      const { data, error } = await supabase
        .from("pedidos")
        .select("nome_cliente, telefone_cliente, created_at, valor_total")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Agrupar por telefone para simular uma lista de clientes
      const clientMap = new Map();
      data.forEach(order => {
        const key = order.telefone_cliente || order.nome_cliente;
        if (!clientMap.has(key)) {
          clientMap.set(key, {
            nome: order.nome_cliente,
            telefone: order.telefone_cliente,
            totalPedidos: 1,
            valorGasto: order.valor_total || 0,
            ultimoPedido: order.created_at
          });
        } else {
          const existing = clientMap.get(key);
          clientMap.set(key, {
            ...existing,
            totalPedidos: existing.totalPedidos + 1,
            valorGasto: existing.valorGasto + (order.valor_total || 0),
          });
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

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Clientes</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie sua base de clientes e histórico de compras.</p>
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
                        <UsersIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{client.nome || "Cliente Final"}</p>
                        <p className="text-xs text-gray-500">{client.telefone || "Sem telefone"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{client.totalPedidos} pedidos</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">R$ {client.valorGasto.toFixed(2).replace('.', ',')}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(client.ultimoPedido).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return <Users className={className} />;
}

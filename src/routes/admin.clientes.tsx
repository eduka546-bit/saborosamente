import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Search,
  Mail,
  Phone,
  ShoppingBag,
  MapPin,
  Eye,
  X,
  Calendar,
  DollarSign,
  Upload,
  Gift,
  MessageCircle,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pagination } from "@/components/pagination";
import { createQueryConfig } from "@/lib/query-config";

export const Route = createFileRoute("/admin/clientes")({
  component: AdminClientesPage,
  ssr: false,
});

function CashbackCliente({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["cashback-cliente", userId],
    ...createQueryConfig("clients"),
    queryFn: async () => {
      const { data } = await supabase
        .from("cashback_saldo")
        .select("saldo")
        .eq("user_id", userId)
        .maybeSingle();
      return Number((data as any)?.saldo ?? 0);
    },
  });
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
      <Gift size={15} className="text-yellow-600" />
      <span className="font-bold text-yellow-700">Cashback: R$ {(data ?? 0).toFixed(2)}</span>
    </div>
  );
}

function AdminClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("TODAS");
  const [cidadeEditada, setCidadeEditada] = useState("");
  const [salvandoCidade, setSalvandoCidade] = useState(false);
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin-clients"],
    ...createQueryConfig("clients"),
    queryFn: async () => {
      // 1. Buscar perfis (clientes cadastrados)
      console.log("Iniciando busca de perfis...");
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .order("nome", { ascending: true });

      if (profileError) {
        console.error("Erro ao buscar perfis:", profileError);
        toast.error("Erro ao carregar perfis: " + profileError.message);
        throw profileError;
      }

      console.log("Perfis encontrados no banco:", profiles?.length);

      // 2. Buscar pedidos para histórico
      const { data: orders, error: orderError } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });

      if (orderError) throw orderError;

      const clientMap = new Map();

      // Mapear perfis primeiro
      profiles?.forEach((profile) => {
        clientMap.set(profile.id, {
          id: profile.id,
          profileId: profile.id,
          cidade: profile.cidade || null,
          nome: profile.nome,
          telefone: profile.telefone,
          email: profile.email || "Não informado",
          cpf: profile.cpf,
          bairro: profile.bairro,
          totalPedidos: 0,
          valorGasto: 0,
          ultimoPedido: null,
          pedidos: [],
        });
      });

      // Vincular pedidos aos perfis ou criar clientes convidados
      orders?.forEach((order) => {
        const userId = order.user_id;
        const key = userId || order.email_cliente || order.telefone_cliente;

        if (!clientMap.has(key)) {
          clientMap.set(key, {
            nome: order.nome_cliente,
            cidade: order.cidade || null,
            telefone: order.telefone_cliente,
            email: order.email_cliente || "Não informado",
            totalPedidos: 1,
            valorGasto: order.valor_total || 0,
            ultimoPedido: order.created_at,
            pedidos: [order],
          });
        } else {
          const existing = clientMap.get(key);
          existing.totalPedidos += 1;
          existing.valorGasto += order.valor_total || 0;
          existing.pedidos.push(order);
          if (
            !existing.ultimoPedido ||
            new Date(order.created_at) > new Date(existing.ultimoPedido)
          ) {
            existing.ultimoPedido = order.created_at;
          }
        }
      });

      return Array.from(clientMap.values());
    },
  });

  const cidadesDisponiveis = useMemo(() => Array.from(new Set(clients.map((c: any) => String(c.cidade || "").trim()).filter(Boolean))).sort((a,b) => a.localeCompare(b,"pt-BR")), [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const texto = c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefone?.includes(searchTerm);
      const cidade = String(c.cidade || "").trim();
      return texto && (filtroCidade === "TODAS" || (filtroCidade === "SEM_CIDADE" ? !cidade : cidade === filtroCidade));
    });
  }, [clients, searchTerm, filtroCidade]);

  const salvarCidade = async () => {
    if (!selectedClient?.profileId) return toast.error("Este cliente ainda não possui perfil cadastrado para editar.");
    setSalvandoCidade(true);
    try {
      const { data, error } = await supabase.rpc("atualizar_cidade_cliente_admin", {
        p_cliente_id: selectedClient.profileId,
        p_cidade: cidadeEditada.trim(),
      });
      if (error) throw error;
      if (!data) throw new Error("Perfil não encontrado.");
      setSelectedClient((anterior: any) => ({ ...anterior, cidade: cidadeEditada.trim() || null }));
      await queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      await queryClient.invalidateQueries({ queryKey: ["campanhas-clientes-por-cidade"] });
      toast.success("Cidade salva! O filtro de campanhas será atualizado.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar a cidade.");
    } finally {
      setSalvandoCidade(false);
    }
  };

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);


  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie sua base de clientes e histórico de compras.
          </p>
        </div>

        <Button
          asChild
          className="bg-[#086e45] hover:bg-[#065a38] text-white flex items-center gap-2"
        >
          <Link to="/admin/config/importar-clientes">
            <Upload size={18} />
            Importar Clientes
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Buscar por nome ou telefone..."
              className="pl-10 rounded-lg border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={18} className="text-gray-500 shrink-0"/>
            <select aria-label="Filtrar clientes por cidade" value={filtroCidade}
              onChange={e => { setFiltroCidade(e.target.value); setCurrentPage(1); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-[185px] w-full">
              <option value="TODAS">Todas as cidades</option>
              <option value="SEM_CIDADE">Sem cidade</option>
              {cidadesDisponiveis.map(cidade => <option key={cidade} value={cidade}>{cidade}</option>)}
            </select>
          </div>
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
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  Carregando clientes...
                </td>
              </tr>
            ) : paginatedClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              paginatedClients.map((client, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#5850ec]/10 flex items-center justify-center text-[#5850ec]">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {client.nome || "Cliente Final"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">{client.email}</p>
                        <p className="text-xs text-gray-500">{client.cidade || "Cidade não informada"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{client.totalPedidos} pedidos</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">
                    R$ {client.valorGasto.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {client.ultimoPedido
                      ? new Date(client.ultimoPedido).toLocaleDateString("pt-BR")
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => { setSelectedClient(client); setCidadeEditada(client.cidade || ""); }}
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

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredClients.length}
        />
      )}

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
                  <span className="flex items-center gap-1">
                    <Phone size={14} className="text-[#5850ec]" /> {selectedClient.telefone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail size={14} className="text-[#5850ec]" /> {selectedClient.email}
                  </span>
                  {selectedClient.cpf && (
                    <span className="flex items-center gap-1">
                      <DollarSign size={14} className="text-[#5850ec]" /> CPF: {selectedClient.cpf}
                    </span>
                  )}
                  {selectedClient.bairro && (
                    <span className="flex items-center gap-1 w-full md:w-auto">
                      <MapPin size={14} className="text-[#5850ec]" /> Bairro:{" "}
                      {selectedClient.bairro}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Total Pedidos
                </p>
                <p className="text-lg font-black text-gray-900">{selectedClient.totalPedidos}</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Total Gasto
                </p>
                <p className="text-lg font-black text-green-600">
                  R$ {selectedClient.valorGasto.toFixed(2)}
                </p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Ticket Médio
                </p>
                <p className="text-lg font-black text-[#5850ec]">
                  R${" "}
                  {selectedClient.totalPedidos > 0
                    ? (selectedClient.valorGasto / selectedClient.totalPedidos).toFixed(2)
                    : "0,00"}
                </p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Último Pedido
                </p>
                <p className="text-sm font-bold text-gray-700">
                  {selectedClient.ultimoPedido
                    ? new Date(selectedClient.ultimoPedido).toLocaleDateString("pt-BR")
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="flex gap-3 mb-6">
              {selectedClient.telefone && (
                <a
                  href={`https://wa.me/${selectedClient.telefone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-all"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
              )}
              {selectedClient.id && (
                <Link
                  to="/admin/pedidos/whatsapp"
                  search={{ cliente: selectedClient.id }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#08784b] text-white rounded-xl text-sm font-bold hover:bg-[#07613d] transition-all"
                >
                  <ShoppingBag size={15} /> Lançar pedido na conta
                </Link>
              )}
              {selectedClient.id && <CashbackCliente userId={selectedClient.id} />}
            </div>

            <div className="rounded-xl border p-4 mb-6 space-y-2">
              <label htmlFor="cidade-cliente-admin" className="flex items-center gap-2 font-bold text-sm text-gray-800">
                <MapPin size={16}/> Cidade do cliente
              </label>
              <div className="flex gap-2 flex-wrap">
                <Input id="cidade-cliente-admin" value={cidadeEditada} disabled={!selectedClient.profileId}
                  onChange={e => setCidadeEditada(e.target.value)} list="cidades-sugeridas-admin"
                  placeholder="Informe a cidade" className="flex-1 min-w-[180px]"/>
                <datalist id="cidades-sugeridas-admin">
                  {Array.from(new Set([...cidadesDisponiveis, "São Bento do Sul","Rio Negrinho","Campo Alegre","Piên","Mafra","Corupá"])).map(c => <option key={c} value={c}/>)}
                </datalist>
                <Button onClick={salvarCidade} disabled={!selectedClient.profileId || salvandoCidade}>
                  {salvandoCidade ? "Salvando..." : "Salvar cidade"}
                </Button>
              </div>
              {!selectedClient.profileId && <p className="text-xs text-gray-500">Cadastro de convidado: a cidade poderá ser corrigida quando houver perfil vinculado.</p>}
              <p className="text-xs text-gray-500">Altera apenas a cidade, sem modificar o endereço do cliente.</p>
            </div>

            <h4 className="text-lg font-bold text-gray-900 mb-4">Histórico de Pedidos</h4>
            <div className="space-y-4">
              {selectedClient.pedidos.map((pedido: any) => (
                <div
                  key={pedido.id}
                  className="border rounded-xl p-4 hover:border-[#5850ec]/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        Pedido #{pedido.id.slice(0, 8)}
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                          {pedido.status}
                        </Badge>
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar size={12} /> {new Date(pedido.created_at).toLocaleString("pt-BR")}
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

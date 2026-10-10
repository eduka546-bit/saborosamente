import { montarClientesComerciais, filtrarClientesComerciais } from "@/lib/clientes-comercial";
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
import { useState, useMemo, useEffect } from "react";
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
      <span className="font-bold text-yellow-700">
        Cashback: {(data ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </span>
    </div>
  );
}

function AdminClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [segmento, setSegmento] = useState("todos");
  const [cadastro, setCadastro] = useState("todos");
  const [ordem, setOrdem] = useState("recentes");
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [filtrosAbertos, setFiltrosAbertos] = useState(true);
  const [filtroCidade, setFiltroCidade] = useState("TODAS");
  const [cidadeEditada, setCidadeEditada] = useState("");
  const [salvandoCidade, setSalvandoCidade] = useState(false);
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!selectedClient) return;
    const fecharEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedClient(null);
    };
    document.addEventListener("keydown", fecharEsc);
    return () => document.removeEventListener("keydown", fecharEsc);
  }, [selectedClient]);

  const {
    data: clients = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-clients"],
    ...createQueryConfig("clients"),
    queryFn: async () => {
      // Paginar também no banco: o limite de uma consulta não deve ocultar clientes.
      async function carregarTabela(tabela: "profiles" | "pedidos" | "sorteio_leads") {
        const rows: any[] = [];
        for (let start = 0; ; start += 500) {
          const { data, error } = await supabase
            .from(tabela)
            .select("*")
            .order("id", { ascending: true })
            .range(start, start + 499);
          if (error) throw error;
          rows.push(...(data || []));
          if (!data || data.length < 500) return rows;
        }
      }
      const [profiles, orders, raffleLeads] = await Promise.all([
        carregarTabela("profiles"),
        carregarTabela("pedidos"),
        carregarTabela("sorteio_leads"),
      ]);
      return montarClientesComerciais(profiles, orders, raffleLeads);
    },
  });

  const cidadesDisponiveis = useMemo(
    () =>
      Array.from(
        new Set(clients.map((c: any) => String(c.cidade || "").trim()).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [clients],
  );

  const filteredClients = useMemo(
    () =>
      filtrarClientesComerciais(clients, {
        busca: searchTerm,
        cidade: filtroCidade,
        segmento,
        cadastro,
        ordem,
      }),
    [clients, searchTerm, filtroCidade, segmento, cadastro, ordem],
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroCidade, segmento, cadastro, ordem, itemsPerPage]);
  const indicadores = useMemo(
    () => ({
      todos: clients.length,
      semPedidos: clients.filter((c) => c.pedidos.length === 0).length,
      recorrentes: clients.filter((c) => c.totalPedidos >= 2).length,
      inativos: filtrarClientesComerciais(clients, {
        busca: "",
        cidade: "TODAS",
        segmento: "inativos_30",
        cadastro: "todos",
        ordem: "recentes",
      }).length,
    }),
    [clients],
  );
  const limparFiltros = () => {
    setSearchTerm("");
    setFiltroCidade("TODAS");
    setSegmento("todos");
    setCadastro("todos");
    setOrdem("recentes");
    setCurrentPage(1);
  };

  const salvarCidade = async () => {
    if (!selectedClient?.profileId)
      return toast.error("Este cliente ainda não possui perfil cadastrado para editar.");
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
    const start = (Math.min(currentPage, Math.max(1, totalPages)) - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage, totalPages]);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie clientes, participantes do sorteio e histórico de compras.
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Todos os clientes", value: indicadores.todos, segment: "todos" },
          { label: "Nunca fizeram pedido", value: indicadores.semPedidos, segment: "sem_pedidos" },
          { label: "Clientes recorrentes", value: indicadores.recorrentes, segment: "recorrentes" },
          { label: "Sem comprar há 30+ dias", value: indicadores.inativos, segment: "inativos_30" },
        ].map((item) => (
          <button
            key={item.segment}
            type="button"
            aria-pressed={segmento === item.segment}
            onClick={() => {
              setSegmento(item.segment);
              setCadastro("todos");
              setCurrentPage(1);
            }}
            className={`text-left rounded-xl border p-4 transition-colors ${segmento === item.segment ? "bg-green-50 border-green-600 text-green-900" : "bg-white border-gray-200 text-gray-700 hover:border-green-500"}`}
          >
            <span className="block text-sm">{item.label}</span>
            <span className="block text-2xl font-semibold mt-1">
              {isLoading ? "—" : item.value}
            </span>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Buscar por nome, telefone ou e-mail..."
              aria-label="Buscar clientes"
              className="pl-10 rounded-lg border-gray-200 min-h-11 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              type="button"
              variant="outline"
              aria-expanded={filtrosAbertos}
              onClick={() => setFiltrosAbertos(!filtrosAbertos)}
            >
              <Filter size={18} className="mr-2" />
              Filtros
            </Button>
            <select
              aria-label="Filtrar clientes por cidade"
              value={filtroCidade}
              onChange={(e) => {
                setFiltroCidade(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-w-0 md:min-w-[185px] w-full min-h-11"
            >
              <option value="TODAS">Todas as cidades</option>
              <option value="SEM_CIDADE">Sem cidade</option>
              {cidadesDisponiveis.map((cidade) => (
                <option key={cidade} value={cidade}>
                  {cidade}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filtrosAbertos && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <label className="text-sm text-gray-700">
              Perfil de compra
              <select
                className="block w-full rounded-lg border px-3 py-2 mt-1 bg-white min-h-11 text-base"
                value={segmento}
                onChange={(e) => setSegmento(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="sem_pedidos">Nunca fizeram pedido</option>
                <option value="cancelados">Só pedidos cancelados</option>
                <option value="primeira">Uma compra</option>
                <option value="recorrentes">Recorrentes (2+ compras)</option>
                <option value="inativos_30">Sem comprar há 30+ dias</option>
                <option value="inativos_60">Sem comprar há 60+ dias</option>
                <option value="inativos_90">Sem comprar há 90+ dias</option>
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Período do cadastro
              <select
                className="block w-full rounded-lg border px-3 py-2 mt-1 bg-white min-h-11 text-base"
                value={cadastro}
                onChange={(e) => setCadastro(e.target.value)}
              >
                <option value="todos">Todo o período</option>
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Organizar por
              <select
                className="block w-full rounded-lg border px-3 py-2 mt-1 bg-white min-h-11 text-base"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
              >
                <option value="recentes">Últimos cadastrados</option>
                <option value="nome">Nome (A–Z)</option>
                <option value="ultima">Compra mais recente</option>
                <option value="inativos">Há mais tempo sem comprar</option>
                <option value="pedidos">Mais pedidos</option>
                <option value="gasto">Maior total gasto</option>
                <option value="ticket">Maior ticket médio</option>
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Clientes por página
              <select
                className="block w-full rounded-lg border px-3 py-2 mt-1 bg-white min-h-11 text-base"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
          <p className="text-sm text-gray-600">
            {isLoading ? "Carregando…" : `${filteredClients.length} de ${clients.length} clientes`}
          </p>
          <Button variant="ghost" type="button" onClick={limparFiltros}>
            Limpar filtros
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Indicadores baseados no histórico de pedidos disponível neste site. Pedidos cancelados não
          entram nas compras, no total gasto ou na última compra. O histórico permanece nos
          detalhes. Convidados sem perfil não possuem data de cadastro.
        </p>
      </div>

      {isError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          Não foi possível carregar a base de clientes.{" "}
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}
      <div className="md:hidden space-y-3" aria-label="Lista de clientes">
        {isLoading ? (
          <p className="rounded-xl border bg-white p-5 text-center">Carregando clientes...</p>
        ) : paginatedClients.length === 0 ? (
          <p className="rounded-xl border bg-white p-5 text-center text-gray-600">
            Nenhum cliente encontrado.
          </p>
        ) : (
          paginatedClients.map((client) => (
            <article
              key={client.chave}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 break-words">
                    {client.nome || "Cliente Final"}
                  </h2>
                  {client.sorteioLeadId && <Badge className="mt-1 border border-green-200 bg-green-50 text-green-800 hover:bg-green-50">Inscrito no sorteio</Badge>}
                  <p className="text-sm text-gray-600 mt-1 break-all">{client.email}</p>
                  <p className="text-sm text-gray-600 mt-1 break-words">
                    {client.telefone || "Sem telefone"} · {client.cidade || "Sem cidade"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  aria-label={`Ver detalhes de ${client.nome || "cliente"}`}
                  onClick={() => {
                    setSelectedClient(client);
                    setCidadeEditada(client.cidade || "");
                  }}
                >
                  <Eye size={20} />
                </Button>
              </div>
              <dl className="grid grid-cols-2 gap-3 border-t mt-4 pt-3 text-sm">
                <div>
                  <dt className="text-gray-600">Cadastro</dt>
                  <dd className="font-medium mt-1">
                    {client.cadastradoEm
                      ? new Date(client.cadastradoEm).toLocaleDateString("pt-BR")
                      : client.profileId
                        ? "Não informado"
                        : "Convidado"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600">Compras</dt>
                  <dd className="font-medium mt-1">{client.totalPedidos}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Total gasto</dt>
                  <dd className="font-semibold text-green-800 mt-1">
                    {client.valorGasto.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600">Ticket médio</dt>
                  <dd className="font-medium mt-1">
                    {client.totalPedidos
                      ? (client.valorGasto / client.totalPedidos).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      : "—"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-600">Última compra</dt>
                  <dd className="font-medium mt-1">
                    {client.ultimoPedido
                      ? new Date(client.ultimoPedido).toLocaleDateString("pt-BR")
                      : "Sem compras"}
                  </dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto hidden md:block">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Cadastro</th>
              <th className="px-6 py-4">Compras</th>
              <th className="px-6 py-4">Total Gasto</th>
              <th className="px-6 py-4">Ticket médio</th>
              <th className="px-6 py-4">Última Compra</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  Carregando clientes...
                </td>
              </tr>
            ) : paginatedClients.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              paginatedClients.map((client) => (
                <tr key={client.chave} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#5850ec]/10 flex items-center justify-center text-[#5850ec]">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {client.nome || "Cliente Final"}
                        </p>
                        {client.sorteioLeadId && <Badge className="mt-1 border border-green-200 bg-green-50 text-green-800 hover:bg-green-50">Inscrito no sorteio</Badge>}
                        <p className="text-sm text-gray-600">{client.email}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {client.telefone || "Sem telefone"} · {client.cidade || "Sem cidade"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {client.cadastradoEm
                      ? new Date(client.cadastradoEm).toLocaleDateString("pt-BR")
                      : client.profileId
                        ? "Não informado"
                        : "Convidado"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{client.totalPedidos} compras</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">
                    R$ {client.valorGasto.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {client.totalPedidos
                      ? (client.valorGasto / client.totalPedidos).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {client.ultimoPedido
                      ? new Date(client.ultimoPedido).toLocaleDateString("pt-BR")
                      : "Sem compras"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-full"
                      aria-label={`Ver detalhes de ${client.nome || "cliente"}`}
                      onClick={() => {
                        setSelectedClient(client);
                        setCidadeEditada(client.cidade || "");
                      }}
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
        <div>
          <div className="md:hidden mt-5 space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
              {Math.min(currentPage * itemsPerPage, filteredClients.length)} de{" "}
              {filteredClients.length} clientes
            </p>
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                className="min-h-11"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <Pagination
              currentPage={Math.min(currentPage, Math.max(1, totalPages))}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredClients.length}
            />
          </div>
        </div>
      )}

      {selectedClient && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-end z-50"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedClient(null);
          }}
        >
          <div className="bg-white h-full w-full max-w-2xl p-4 sm:p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-30 flex justify-end pointer-events-none -mb-10">
              <button
                type="button"
                aria-label="Fechar painel"
                onClick={() => setSelectedClient(null)}
                className="pointer-events-auto rounded-full bg-white border shadow-md p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-green-900 pr-10">
                Detalhes do Cliente
              </h2>
            </div>

            <div className="bg-[#5850ec]/5 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-6">
              <div className="h-20 w-20 rounded-full bg-[#5850ec] flex items-center justify-center text-white text-3xl font-bold shrink-0">
                {selectedClient.nome?.charAt(0) || "C"}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">{selectedClient.nome}</h3>
                {selectedClient.sorteioLeadId && <Badge className="border border-green-200 bg-green-50 text-green-800 hover:bg-green-50">Inscrito no sorteio</Badge>}
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
                <p className="text-sm font-medium text-gray-600 mb-1">Compras válidas</p>
                <p className="text-lg font-black text-gray-900">{selectedClient.totalPedidos}</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Gasto</p>
                <p className="text-lg font-black text-green-600">
                  {selectedClient.valorGasto.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-600 mb-1">Ticket Médio</p>
                <p className="text-lg font-black text-[#5850ec]">
                  {(selectedClient.totalPedidos > 0
                    ? selectedClient.valorGasto / selectedClient.totalPedidos
                    : 0
                  ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-600 mb-1">Último Pedido</p>
                <p className="text-sm font-bold text-gray-700">
                  {selectedClient.ultimoPedido
                    ? new Date(selectedClient.ultimoPedido).toLocaleDateString("pt-BR")
                    : "Sem compras"}
                </p>
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="flex flex-wrap gap-3 mb-6">
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
              <label
                htmlFor="cidade-cliente-admin"
                className="flex items-center gap-2 font-bold text-sm text-gray-800"
              >
                <MapPin size={16} /> Cidade do cliente
              </label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  id="cidade-cliente-admin"
                  value={cidadeEditada}
                  disabled={!selectedClient.profileId}
                  onChange={(e) => setCidadeEditada(e.target.value)}
                  list="cidades-sugeridas-admin"
                  placeholder="Informe a cidade"
                  className="flex-1 min-w-[180px]"
                />
                <datalist id="cidades-sugeridas-admin">
                  {Array.from(
                    new Set([
                      ...cidadesDisponiveis,
                      "São Bento do Sul",
                      "Rio Negrinho",
                      "Campo Alegre",
                      "Piên",
                      "Mafra",
                      "Corupá",
                    ]),
                  ).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <Button
                  onClick={salvarCidade}
                  disabled={!selectedClient.profileId || salvandoCidade}
                >
                  {salvandoCidade ? "Salvando..." : "Salvar cidade"}
                </Button>
              </div>
              {!selectedClient.profileId && (
                <p className="text-sm text-gray-600">
                  Cadastro de convidado: a cidade poderá ser corrigida quando houver perfil
                  vinculado.
                </p>
              )}
              <p className="text-sm text-gray-600">
                Altera apenas a cidade, sem modificar o endereço do cliente.
              </p>
            </div>

            <h4 className="text-lg font-bold text-gray-900 mb-4">Histórico de Pedidos</h4>
            <div className="space-y-4">
              {selectedClient.pedidos.map((pedido: any) => (
                <div
                  key={pedido.id}
                  className="border rounded-xl p-4 hover:border-[#5850ec]/30 transition-colors"
                >
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                        Pedido #{pedido.id.slice(0, 8)}
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                          {pedido.status}
                        </Badge>
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Calendar size={12} /> {new Date(pedido.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <p className="font-bold text-[#5850ec]">
                      {Number(pedido.valor_total || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
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

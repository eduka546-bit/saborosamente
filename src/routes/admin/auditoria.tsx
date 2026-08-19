import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Download,
  Search,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { buscarAuditLog, AUDIT_ACTIONS, detectarAtividadesSuspeitas } from "@/lib/audit";

export const Route = createFileRoute("/admin/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria | Saborosamente Admin" },
      {
        name: "description",
        content: "Registro de auditoria de todas as ações de admin",
      },
    ],
  }),
  component: AuditoriaPage,
});

function AuditoriaPage() {
  const [filtroAcao, setFiltroAcao] = useState<string>("");
  const [filtroUsuario, setFiltroUsuario] = useState<string>("");
  const [filtroTabela, setFiltroTabela] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [filtroDias, setFiltroDias] = useState<string>("7");

  // Busca audit log
  const { data: auditLog, isLoading } = useQuery({
    queryKey: ["audit-log", filtroAcao, filtroUsuario, filtroTabela, filtroDias],
    queryFn: async () => {
      const logs = await supabase
        .from("audit_log")
        .select("*")
        .gte("created_at", new Date(Date.now() - parseInt(filtroDias) * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      if (logs.error) throw logs.error;

      let results = (logs.data || []) as any[];

      if (filtroAcao) {
        results = results.filter(r => r.acao.includes(filtroAcao));
      }

      if (filtroUsuario) {
        results = results.filter(r => r.user_email?.includes(filtroUsuario));
      }

      if (filtroTabela) {
        results = results.filter(r => r.tabela === filtroTabela);
      }

      if (filtroStatus) {
        results = results.filter(r => r.status === filtroStatus);
      }

      return results;
    },
    staleTime: 30_000,
  });

  // Busca atividades suspeitas
  const { data: suspeitas } = useQuery({
    queryKey: ["atividades-suspeitas"],
    queryFn: detectarAtividadesSuspeitas,
    staleTime: 60_000,
  });

  const exportarCSV = () => {
    if (!auditLog || auditLog.length === 0) {
      alert("Nenhum registro para exportar");
      return;
    }

    const header = [
      "Data/Hora",
      "Usuário",
      "Ação",
      "Tabela",
      "Registro ID",
      "Status",
      "IP",
    ];
    const rows = auditLog.map(r => [
      format(new Date(r.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
      r.user_email || "-",
      r.acao,
      r.tabela || "-",
      r.registro_id?.slice(0, 8) || "-",
      r.status,
      r.ip_address || "-",
    ]);

    const csv = [header, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const estatisticas = {
    total: auditLog?.length || 0,
    sucesso: auditLog?.filter(r => r.status === "success").length || 0,
    falha: auditLog?.filter(r => r.status === "falhou").length || 0,
    usuarios: new Set(auditLog?.map(r => r.user_email) || []).size,
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🔍 Auditoria</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro de todas as ações realizadas pelos admins
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground font-semibold">Total de Ações</p>
          <p className="text-3xl font-bold mt-2">{estatisticas.total}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground font-semibold">Sucesso</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{estatisticas.sucesso}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground font-semibold">Falhas</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{estatisticas.falha}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground font-semibold">Usuários Ativos</p>
          <p className="text-3xl font-bold mt-2">{estatisticas.usuarios}</p>
        </div>
      </div>

      {/* Alertas de atividades suspeitas */}
      {suspeitas && suspeitas.length > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            ⚠️ {suspeitas.length} atividade(s) suspeita(s) detectada(s):
            {suspeitas.slice(0, 3).map((s, i) => (
              <div key={i} className="ml-4 mt-1">
                • {s.usuario}: {s.detalhes}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <h2 className="font-semibold">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1">Período</label>
            <Select value={filtroDias} onValueChange={setFiltroDias}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Hoje</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Ação</label>
            <Select value={filtroAcao} onValueChange={setFiltroAcao}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="criar">Criar</SelectItem>
                <SelectItem value="editar">Editar</SelectItem>
                <SelectItem value="deletar">Deletar</SelectItem>
                <SelectItem value="mudar_status">Mudar Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Tabela</label>
            <Select value={filtroTabela} onValueChange={setFiltroTabela}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as tabelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="produtos">Produtos</SelectItem>
                <SelectItem value="cupons">Cupons</SelectItem>
                <SelectItem value="pedidos">Pedidos</SelectItem>
                <SelectItem value="clientes">Clientes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Status</label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="falhou">Falha</SelectItem>
                <SelectItem value="negado">Negado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Usuário</label>
            <Input
              placeholder="Email..."
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={exportarCSV} variant="outline" size="sm" className="gap-2">
            <Download size={14} /> Exportar CSV
          </Button>
          <Button
            onClick={() => {
              setFiltroAcao("");
              setFiltroUsuario("");
              setFiltroTabela("");
              setFiltroStatus("");
              setFiltroDias("7");
            }}
            variant="ghost"
            size="sm"
          >
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Tabela de logs */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data/Hora</TableCell>
              <TableCell>Usuário</TableCell>
              <TableCell>Ação</TableCell>
              <TableCell>Tabela</TableCell>
              <TableCell>Registro</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : !auditLog || auditLog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              auditLog.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.user_email || "-"}</TableCell>
                  <TableCell className="text-sm">{log.acao}</TableCell>
                  <TableCell className="text-sm">{log.tabela || "-"}</TableCell>
                  <TableCell className="text-xs font-mono">{log.registro_id?.slice(0, 8) || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        log.status === "success"
                          ? "bg-green-100 text-green-700"
                          : log.status === "falhou"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.ip_address || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

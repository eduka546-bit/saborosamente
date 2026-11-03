import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Gift, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Pendente = {
  pedido_id: string;
  cliente_nome: string | null;
  telefone_normalizado: string | null;
  email_normalizado: string | null;
  valor: string | number;
  status: "pendente" | "revisao";
  criado_em: string;
};
type Conta = { id: string; nome: string | null; telefone: string | null };

const dinheiro = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function CashbackPendentesAdmin() {
  const [aberto, setAberto] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(null);
  const [buscaConta, setBuscaConta] = useState("");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string | null>(null);
  const [creditando, setCreditando] = useState(false);
  const queryClient = useQueryClient();

  const { data: pendentes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-cashback-pendentes"],
    enabled: aberto,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cashback_pendentes")
        .select("pedido_id,cliente_nome,telefone_normalizado,email_normalizado,valor,status,criado_em")
        .in("status", ["pendente", "revisao"])
        .order("criado_em", { ascending: false })
        .limit(250);
      if (error) throw error;
      return (data ?? []) as Pendente[];
    },
  });
  const { data: contas = [] } = useQuery({
    queryKey: ["admin-cashback-contas"],
    enabled: aberto && !!pedidoSelecionado,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles")
        .select("id,nome,telefone").order("nome").limit(1000);
      if (error) throw error;
      return (data ?? []) as Conta[];
    },
  });
  const candidatos = useMemo(() => {
    const termo = normalizar(buscaConta);
    if (termo.length < 2) return [];
    const digits = buscaConta.replace(/\D/g, "");
    return contas.filter((c) => normalizar(c.nome ?? "").includes(termo)
      || (digits.length >= 4 && (c.telefone ?? "").replace(/\D/g, "").includes(digits))).slice(0, 12);
  }, [buscaConta, contas]);
  const contaEscolhida = contas.find((c) => c.id === usuarioSelecionado);
  const total = pendentes.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const revisar = pendentes.filter((item) => item.status === "revisao").length;

  const iniciarVinculo = (p: Pendente) => {
    setPedidoSelecionado(p.pedido_id);
    setBuscaConta(p.cliente_nome && p.cliente_nome !== "Pedidos10" ? p.cliente_nome : "");
    setUsuarioSelecionado(null);
  };

  const vincular = async () => {
    if (!pedidoSelecionado || !contaEscolhida) return;
    const pendente = pendentes.find((p) => p.pedido_id === pedidoSelecionado);
    if (!pendente) return;
    if (!window.confirm(
      `Você conferiu a identidade do cliente?\n\nPedido: ${pendente.cliente_nome ?? pendente.pedido_id}\nValor: ${dinheiro(Number(pendente.valor))}\nConta: ${contaEscolhida.nome ?? contaEscolhida.id}\n\nEste crédito será liberado e não poderá ser concedido novamente ao mesmo pedido.`
    )) return;
    setCreditando(true);
    try {
      const { data, error } = await (supabase as any).rpc("cashback_atribuir_pendente_admin", {
        p_pedido_id: pedidoSelecionado,
        p_user_id: contaEscolhida.id,
      });
      if (error) throw error;
      if (data !== "creditado" && data !== "ja_creditado") throw new Error("Não foi possível confirmar o crédito.");
      toast.success(data === "creditado" ? "Cashback creditado na conta conferida." : "Esse pedido já estava creditado.");
      setPedidoSelecionado(null);
      setUsuarioSelecionado(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-cashback-pendentes"] }),
        queryClient.invalidateQueries({ queryKey: ["cashback-cliente"] }),
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao vincular cashback.");
    } finally {
      setCreditando(false);
    }
  };

  return (
    <section className="mb-6 rounded-xl border border-green-200 bg-white shadow-sm">
      <button type="button" onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-green-50/60">
        <span className="flex items-center gap-2 font-bold text-green-900">
          <Gift size={19} /> Cashback pendente de pedidos
        </span>
        <span className="flex items-center gap-2 text-sm text-green-800">
          {aberto ? "Ocultar" : "Conferir"} {aberto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {aberto && (
        <div className="border-t p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="text-sm text-gray-700">
              <strong>{pendentes.length}</strong> pedidos, <strong>{dinheiro(total)}</strong> ainda não liberados
              {revisar > 0 && <span className="ml-2 text-amber-800">({revisar} sem telefone/e-mail para identificar)</span>}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw size={14} className="mr-2" /> Atualizar
            </Button>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            O saldo pendente não fica disponível para compras. A liberação automática exige conta vinculada ou contato confirmado.
            Para vincular manualmente, confira a identidade do cliente; telefone digitado no cadastro não é prova suficiente.
          </p>
          {isLoading && <p className="text-sm text-gray-600">Carregando créditos pendentes…</p>}
          {isError && <p role="alert" className="text-sm text-red-700">Falha ao consultar os créditos pendentes. Clique em Atualizar.</p>}
          {!isLoading && !isError && pendentes.length === 0 && (
            <p className="rounded-lg bg-green-50 p-4 text-sm text-green-900">Nenhum cashback pendente.</p>
          )}
          <div className="space-y-3">
            {pendentes.map((p) => (
              <div key={p.pedido_id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-gray-900">{p.cliente_nome || "Cliente não identificado"}</p>
                    <p className="text-xs text-gray-600 mt-1">Pedido #{p.pedido_id.slice(0, 8)} · {p.status === "revisao" ? "Revisar identidade" : "Aguardando vínculo"}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {p.telefone_normalizado || "Sem telefone"}{p.email_normalizado ? ` · ${p.email_normalizado}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="text-green-800 whitespace-nowrap">{dinheiro(Number(p.valor))}</strong>
                    <Button size="sm" variant="outline" onClick={() => iniciarVinculo(p)}>
                      Vincular
                    </Button>
                  </div>
                </div>
                {pedidoSelecionado === p.pedido_id && (
                  <div className="mt-3 border-t pt-3 space-y-3">
                    <label className="block text-xs font-semibold text-gray-700">Buscar conta cadastrada por nome ou telefone</label>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                      <Input value={buscaConta} onChange={(e) => { setBuscaConta(e.target.value); setUsuarioSelecionado(null); }}
                        className="pl-9" placeholder="Nome ou telefone da conta..." />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {candidatos.map((c) => (
                        <button type="button" key={c.id} onClick={() => setUsuarioSelecionado(c.id)}
                          className={`block w-full rounded-md border p-2 text-left text-sm ${usuarioSelecionado === c.id ? "border-green-700 bg-green-50" : "hover:bg-gray-50"}`}>
                          {c.nome || "Sem nome"} <span className="text-gray-600">· {c.telefone || "Sem telefone"}</span>
                        </button>
                      ))}
                      {buscaConta.trim().length >= 2 && candidatos.length === 0 && <p className="text-xs text-gray-500">Nenhuma conta encontrada.</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" disabled={!usuarioSelecionado || creditando} onClick={vincular}>
                        {creditando ? "Creditando..." : "Confirmar crédito"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setPedidoSelecionado(null)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Gift, ShieldCheck, Trophy, UserRound, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pedidos/leads")({
  component: LeadsSorteioAdmin,
  ssr: false,
});

type Lead = {
  id: string;
  nome: string;
  telefone: string;
  session_id: string;
  status: "participando" | "contemplado" | "inativo";
  optin_marketing: boolean;
  optin_carrinho: boolean;
  created_at: string;
  contemplado_em: string | null;
};
type Vencedor = { lead_id: string; ano: number; mes: number; registrado_em: string };
type Config = { ativo: boolean; regulamento_url: string | null; certificado: string | null };

function LeadsSorteioAdmin() {
  const qc = useQueryClient();
  const anoAtual = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(new Date()));
  const mesAtual = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", month: "numeric" }).format(new Date()));
  const [mesSorteio, setMesSorteio] = useState(mesAtual);
  const [termo, setTermo] = useState("");
  const { data: config, isLoading: carregandoConfig } = useQuery({
    queryKey: ["sorteio-admin-config"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("sorteio_config_admin");
      if (error) throw error;
      return data as Config;
    },
  });

  const { data: leads = [], isLoading: carregandoLeads, error } = useQuery({
    queryKey: ["sorteio-admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sorteio_leads")
        .select("id,nome,telefone,session_id,status,optin_marketing,optin_carrinho,created_at,contemplado_em")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
    staleTime: 20_000,
  });

  const { data: vencedores = [] } = useQuery({
    queryKey: ["sorteio-vencedores", anoAtual],
    queryFn: async () => {
      const { data, error } = await supabase.from("sorteio_contemplados")
        .select("lead_id,ano,mes,registrado_em").eq("ano", anoAtual);
      if (error) throw error;
      return (data ?? []) as Vencedor[];
    },
  });
  const idsContemplados = useMemo(() => new Set(vencedores.map(v => v.lead_id)), [vencedores]);
  const mesesOcupados = useMemo(() => new Set(vencedores.map(v => v.mes)), [vencedores]);

  const { data: carts = [] } = useQuery({
    queryKey: ["sorteio-admin-carrinhos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carrinhos_abandonados")
        .select("id,session_id,status")
        .order("updated_at", { ascending: false }).limit(1500);
      if (error) throw error;
      return (data ?? []) as { id: string; session_id: string; status: string }[];
    },
    staleTime: 30_000,
  });
  const carrinhosPorSessao = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of carts) if (!map.has(c.session_id)) map.set(c.session_id, c.status);
    return map;
  }, [carts]);

  const ativarDesativar = useMutation({
    mutationFn: async (novoAtivo: boolean) => {
      // O banco mantém o bloqueio de publicação sem autorização e regulamento.
      const { error } = await supabase.rpc("atualizar_sorteio_config_admin", {
        p_ativo: novoAtivo,
        p_regulamento_url: config?.regulamento_url ?? "",
        p_certificado: config?.certificado ?? "",
      });
      if (error) throw error;
    },
    onSuccess: (_result, novoAtivo) => {
      void qc.invalidateQueries({ queryKey: ["sorteio-admin-config"] });
      void qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success(novoAtivo ? "Pop-up do sorteio ativado." : "Pop-up do sorteio desativado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const marcarContemplado = useMutation({
    mutationFn: async (lead: Lead) => {
      const { error } = await supabase.rpc("registrar_contemplado_sorteio", {
        p_lead_id: lead.id, p_ano: anoAtual, p_mes: mesSorteio,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sorteio-vencedores", anoAtual] });
      toast.success("Contemplado registrado! Participará novamente em janeiro do próximo ano.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtrados = leads.filter((l) =>
    (l.nome + " " + l.telefone).toLocaleLowerCase("pt-BR").includes(termo.toLocaleLowerCase("pt-BR")));
  const participantes = leads.filter(l => l.status === "participando" && !idsContemplados.has(l.id)).length;
  const contemplados = vencedores.length;
  const consentidosRecuperacao = leads.filter(l => l.optin_carrinho).length;
  const comCarrinhos = leads.filter(l => carrinhosPorSessao.has(l.session_id)).length;

  return (
    <div className="p-4 md:p-6 max-w-[1220px] mx-auto min-h-screen space-y-6">
      <div>
        <a href="/admin/pedidos" className="inline-flex items-center gap-2 text-sm text-gray-500 mb-3 hover:text-green-800">
          <ArrowLeft size={16}/> Voltar aos pedidos
        </a>
        <h1 className="flex gap-2 items-center text-2xl font-bold text-[#075d3a]"><Gift size={26}/> Leads e sorteio mensal</h1>
        <p className="text-sm text-gray-500 mt-1">Cadastro único de todos os clientes. Doze sorteios anuais: vencedores retornam à lista em janeiro do ano seguinte.</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Inscrições", leads.length], ["Elegíveis no ano", participantes],
          ["Contemplados no ano", contemplados], ["Vinculados a carrinho", comCarrinhos],
        ].map(([label, valor]) => (
          <div key={label} className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-bold text-2xl text-green-900">{valor}</p>
          </div>
        ))}
      </section>

      <section className="bg-white border rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-gray-900 flex gap-2 items-center"><ShieldCheck size={18}/> Pop-up de captação e sorteio</h2>
            <p className="text-xs text-gray-500 mt-1">Disponível para todos os visitantes, inclusive clientes antigos. Cadastro e carrinho integrados.</p>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-gray-800 cursor-pointer">
            <span>{config?.ativo ? "Ativado" : "Desativado"}</span>
            <input type="checkbox" role="switch" aria-label="Ativar ou desativar pop-up do sorteio"
              checked={Boolean(config?.ativo)}
              disabled={carregandoConfig || ativarDesativar.isPending}
              onChange={(e) => ativarDesativar.mutate(e.target.checked)}
              className="h-5 w-5 accent-green-700" />
          </label>
        </div>

      </section>

      <section className="bg-white border rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-900">Cadastros recebidos</h2>
            <p className="text-xs text-gray-500">{consentidosRecuperacao} autorizaram recuperação de carrinho. A autorização de promoções é independente.</p>
          </div>
          <a href="/admin/pedidos/carrinhos-abandonados"
            className="text-sm font-semibold text-green-800 inline-flex gap-2 items-center hover:underline">
            <ShoppingCart size={16}/> Ver carrinhos abandonados
          </a>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <label htmlFor="mes-sorteio" className="font-semibold text-gray-700">Mês da premiação ({anoAtual})</label>
          <select id="mes-sorteio" value={mesSorteio} onChange={e => setMesSorteio(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 bg-white">
            {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
              .map((mes,i) => <option key={mes} value={i+1}>{mes}{mesesOcupados.has(i+1) ? " — vencedor registrado" : ""}</option>)}
          </select>
          <span className="text-xs text-gray-500">{contemplados} de 12 contemplados neste ano</span>
        </div>
        <Input value={termo} onChange={e => setTermo(e.target.value)} placeholder="Pesquisar nome ou telefone" />
        {carregandoLeads && <p className="text-sm text-gray-500">Carregando cadastros...</p>}
        {error && <p className="text-red-600 text-sm">Não foi possível acessar a lista de leads.</p>}
        {!carregandoLeads && !error && filtrados.length === 0 && (
          <p className="text-sm text-gray-500 py-6 text-center">Nenhum lead registrado ainda.</p>
        )}
        <div className="divide-y">
          {filtrados.map(lead => (
            <div key={lead.id} className="flex flex-wrap gap-3 justify-between items-center py-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 flex gap-2 items-center">
                  <UserRound size={16} className="text-green-800"/>{lead.nome}
                </p>
                <p className="text-xs text-gray-500 mt-1">{lead.telefone} · {new Date(lead.created_at).toLocaleDateString("pt-BR")}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {idsContemplados.has(lead.id) ? `🏆 Contemplado em ${anoAtual} — volta no próximo ano` : lead.status === "participando" ? "Elegível aos próximos sorteios do ano" : "Inativo"}
                  {" · "}Marketing: {lead.optin_marketing ? "autorizado" : "não autorizado"}
                  {" · "}Recuperação: {lead.optin_carrinho ? "autorizada" : "não autorizada"}
                  {" · "}Carrinho: {carrinhosPorSessao.get(lead.session_id) ?? "não identificado"}
                </p>
              </div>
              {lead.status === "participando" && !idsContemplados.has(lead.id) && (
                <Button variant="outline" size="sm" disabled={marcarContemplado.isPending || mesesOcupados.has(mesSorteio)}
                  onClick={() => {
                    if (window.confirm("Registrar " + lead.nome + " como contemplado? Esta pessoa deixará de participar dos outros sorteios deste ano e voltará no próximo ano.")) {
                      marcarContemplado.mutate(lead);
                    }
                  }}>
                  <Trophy size={15} className="mr-1"/> Registrar contemplado
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">A lista exibe os 1.000 cadastros mais recentes; se o volume aumentar, adicionaremos paginação.</p>
      </section>
    </div>
  );
}

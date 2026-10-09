import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Gift, ShieldCheck, Trophy, UserRound, ShoppingCart, Save, AlertTriangle } from "lucide-react";
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
type Config = { ativo: boolean; regulamento_url: string | null; certificado: string | null };

function LeadsSorteioAdmin() {
  const qc = useQueryClient();
  const [termo, setTermo] = useState("");
  const [regulamento, setRegulamento] = useState("");
  const [certificado, setCertificado] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [confirmouAprovacao, setConfirmouAprovacao] = useState(false);

  const { data: config, isLoading: carregandoConfig } = useQuery({
    queryKey: ["sorteio-admin-config"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("sorteio_config_admin");
      if (error) throw error;
      return data as Config;
    },
  });
  useEffect(() => {
    if (!config) return;
    setAtivo(config.ativo);
    setRegulamento(config.regulamento_url ?? "");
    setCertificado(config.certificado ?? "");
  }, [config]);

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

  const salvarConfig = useMutation({
    mutationFn: async () => {
      if (ativo && !config?.ativo && !confirmouAprovacao) throw new Error("Confirme que a promoção já foi autorizada pela SPA/MF.");
      const { data, error } = await supabase.rpc("atualizar_sorteio_config_admin", {
        p_ativo: ativo,
        p_regulamento_url: regulamento.trim(),
        p_certificado: certificado.trim(),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sorteio-admin-config"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      setConfirmouAprovacao(false);
      toast.success("Configuração salva.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const marcarContemplado = useMutation({
    mutationFn: async (lead: Lead) => {
      const { error } = await supabase.from("sorteio_leads")
        .update({ status: "contemplado", contemplado_em: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", lead.id).eq("status", "participando");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sorteio-admin-leads"] });
      toast.success("Contemplado registrado. Este telefone não participa dos próximos meses.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtrados = leads.filter((l) =>
    (l.nome + " " + l.telefone).toLocaleLowerCase("pt-BR").includes(termo.toLocaleLowerCase("pt-BR")));
  const participantes = leads.filter(l => l.status === "participando").length;
  const contemplados = leads.filter(l => l.status === "contemplado").length;
  const consentidosRecuperacao = leads.filter(l => l.optin_carrinho).length;
  const comCarrinhos = leads.filter(l => carrinhosPorSessao.has(l.session_id)).length;

  return (
    <div className="p-4 md:p-6 max-w-[1220px] mx-auto min-h-screen space-y-6">
      <div>
        <a href="/admin/pedidos" className="inline-flex items-center gap-2 text-sm text-gray-500 mb-3 hover:text-green-800">
          <ArrowLeft size={16}/> Voltar aos pedidos
        </a>
        <h1 className="flex gap-2 items-center text-2xl font-bold text-[#075d3a]"><Gift size={26}/> Leads e sorteio mensal</h1>
        <p className="text-sm text-gray-500 mt-1">Cadastro único de novos visitantes, vínculo com carrinho abandonado e participação até contemplação.</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Inscrições", leads.length], ["Participando", participantes],
          ["Contemplados", contemplados], ["Vinculados a carrinho", comCarrinhos],
        ].map(([label, valor]) => (
          <div key={label} className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-bold text-2xl text-green-900">{valor}</p>
          </div>
        ))}
      </section>

      <section className="bg-white border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold text-gray-900 flex gap-2 items-center"><ShieldCheck size={18}/> Configuração da promoção</h2>
          <span className={"text-xs font-bold px-3 py-1 rounded-full " +
            (config?.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>
            {config?.ativo ? "Inscrições habilitadas" : "Inscrições desativadas"}
          </span>
        </div>
        <div className="rounded-xl bg-amber-50 text-amber-900 p-3 flex gap-2 text-sm">
          <AlertTriangle size={19} className="shrink-0"/>
          <span>Não publique a campanha antes da autorização da Secretaria de Prêmios e Apostas do Ministério da Fazenda e da aprovação do regulamento. Os campos abaixo ficam privados no admin.</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="url-regra-sorteio" className="block text-xs font-semibold text-gray-600 mb-1">URL HTTPS do regulamento aprovado</label>
            <Input id="url-regra-sorteio" value={regulamento} onChange={e => setRegulamento(e.target.value)}
              placeholder="https://www.saborosamente.com/..." />
          </div>
          <div>
            <label htmlFor="certificado-sorteio" className="block text-xs font-semibold text-gray-600 mb-1">Certificado de autorização SPA/MF</label>
            <Input id="certificado-sorteio" value={certificado} onChange={e => setCertificado(e.target.value)}
              placeholder="Número do certificado" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)}
            className="accent-green-800" disabled={carregandoConfig}/>
          Ativar captação com pop-up na página principal
        </label>
        {ativo && !config?.ativo && (
          <label className="flex items-start gap-2 text-xs text-amber-800">
            <input type="checkbox" checked={confirmouAprovacao} onChange={e => setConfirmouAprovacao(e.target.checked)}
              className="mt-0.5 accent-green-800"/>
            Confirmo que a promoção foi formalmente autorizada e que o regulamento publicado corresponde ao certificado apresentado.
          </label>
        )}
        <Button disabled={salvarConfig.isPending || carregandoConfig ||
          (ativo && !config?.ativo && !confirmouAprovacao)}
          onClick={() => salvarConfig.mutate()} className="bg-[#08764a] hover:bg-[#075e3c]">
          <Save size={16} className="mr-2"/> Salvar configuração
        </Button>
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
                  {lead.status === "contemplado" ? "🏆 Contemplado" : lead.status === "participando" ? "Participa nos próximos meses" : "Inativo"}
                  {" · "}Marketing: {lead.optin_marketing ? "autorizado" : "não autorizado"}
                  {" · "}Recuperação: {lead.optin_carrinho ? "autorizada" : "não autorizada"}
                  {" · "}Carrinho: {carrinhosPorSessao.get(lead.session_id) ?? "não identificado"}
                </p>
              </div>
              {lead.status === "participando" && (
                <Button variant="outline" size="sm" disabled={marcarContemplado.isPending}
                  onClick={() => {
                    if (window.confirm("Registrar " + lead.nome + " como contemplado? Esta pessoa deixará de participar dos próximos sorteios.")) {
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

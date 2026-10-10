import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, BarChart3, Clock3, Eye, MousePointerClick, RefreshCw, ShoppingCart, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";

type Etapa = { ordem: number; evento: string; eventos: number; navegadores: number };
type Pagina = { pagina: string; acessos: number; navegadores: number };
type Clique = { acao: string; cliques: number; navegadores: number };
type Dia = { dia: string; acessos: number; navegadores: number; checkouts: number; compras: number };
type Sessao = { referencia: string; ultimo_evento: string; interacoes: number; viu_produto: boolean; adicionou_carrinho: boolean; abriu_carrinho: boolean; iniciou_checkout: boolean; comprou: boolean };
type Relatorio = {
  periodo_dias: number;
  primeiro_registro: string | null;
  visualizacoes_pagina: number;
  navegadores_identificados: number;
  visitas_estimadas: number;
  clientes_autenticados: number;
  ativos_5min: number;
  eventos_total: number;
  funil: Etapa[];
  paginas: Pagina[];
  cliques: Clique[];
  diario: Dia[];
  atividade_recente: Sessao[];
};

const rotulos: Record<string, string> = {
  page_view: "Acessaram o site",
  product_view: "Visualizaram produtos",
  add_to_cart: "Adicionaram ao carrinho",
  cart_view: "Abriram o carrinho",
  checkout_start: "Iniciaram checkout",
  purchase: "Concluíram a compra",
};

const numero = (n: number) => (n ?? 0).toLocaleString("pt-BR");
const horario = (value: string) =>
  new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function AdminSiteAnalytics() {
  const [dias, setDias] = useState(30);
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["relatorio-comportamento-site", dias],
    queryFn: async () => {
      const { data: result, error } = await supabase.rpc("relatorio_comportamento_site", { p_dias: dias });
      if (error) throw error;
      return result as unknown as Relatorio;
    },
    staleTime: 20_000,
    refetchInterval: 45_000,
    refetchOnWindowFocus: true,
  });
  const funil = data?.funil ?? [];
  const paginaInicial = funil.find(x => x.evento === "page_view")?.navegadores ?? 0;
  const checkout = funil.find(x => x.evento === "checkout_start")?.navegadores ?? 0;
  const compra = funil.find(x => x.evento === "purchase")?.navegadores ?? 0;
  const taxa = paginaInicial ? (compra / paginaInicial * 100).toFixed(1).replace(".", ",") : "0";
  const maximoFunil = Math.max(1, ...funil.map(x => x.navegadores));
  const serie = (data?.diario ?? []).map(d => ({
    ...d,
    data: d.dia.slice(8, 10) + "/" + d.dia.slice(5, 7),
  }));
  return (
    <section aria-labelledby="relatorio-trafego" className="mt-8 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="relatorio-trafego" className="flex items-center gap-2 text-xl font-bold text-[#075d3a]">
            <Activity size={22} /> Comportamento dos visitantes no site
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Acessos, cliques e jornada até a compra. Dados reais registrados pela loja desde 22/09/2026.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="periodo-site" className="text-sm font-semibold text-gray-600">Período</label>
          <select id="periodo-site" value={dias} onChange={e => setDias(Number(e.target.value))}
            className="rounded-lg border border-[#d8e2d4] bg-white px-3 py-2 text-sm">
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
          </select>
          <button type="button" onClick={() => void refetch()} disabled={isFetching}
            aria-label="Atualizar métricas" className="rounded-lg border border-[#d8e2d4] bg-white p-2 text-[#075d3a] disabled:opacity-50">
            <RefreshCw size={17} className={isFetching ? "animate-spin" : ""}/>
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Não foi possível consultar as métricas agora. Tente atualizar.
        </div>
      )}
      {isLoading ? <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-600">Carregando as métricas do site...</p> : data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {[
              { label: "Visitas estimadas", val: numero(data.visitas_estimadas), icon: Activity, obs: "Nova visita após 30 minutos sem navegar" },
              { label: "Navegadores identificados", val: numero(data.navegadores_identificados), icon: Users, obs: "Um navegador pode ser usado por várias pessoas" },
              { label: "Clientes logados distintos", val: numero(data.clientes_autenticados), icon: Users, obs: "Pessoas reconhecidas por login no período" },
              { label: "Páginas visualizadas", val: numero(data.visualizacoes_pagina), icon: Eye, obs: "Total de visualizações" },
              { label: "Ativos nos últimos 5 min", val: numero(data.ativos_5min), icon: Clock3, obs: "Com interações recentes" },
              { label: "Chegaram ao checkout", val: numero(checkout), icon: ShoppingCart, obs: "Identificadores distintos" },
            ].map(item => {
              const Icon = item.icon;
              return <div key={item.label} className="rounded-2xl border border-[#dce8d5] bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-600">{item.label}</span>
                  <Icon size={17} className="shrink-0 text-[#08764a]" />
                </div>
                <p className="mt-2 text-2xl font-bold text-[#075d3a]">{item.val}</p>
                <p className="mt-1 text-xs text-gray-500">{item.obs}</p>
              </div>;
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#dce8d5] bg-white p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-[#075d3a]">Etapas da jornada de compra</h3>
                <span className="text-xs text-gray-500">Identificadores distintos</span>
              </div>
              <div className="space-y-3">
                {funil.map((etapa) => <div key={etapa.evento}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-700">{rotulos[etapa.evento] ?? etapa.evento}</span>
                    <strong className="text-[#075d3a]">{numero(etapa.navegadores)}</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#edf2e9]">
                    <div className="h-full rounded-full bg-[#08764a]" style={{ width: `${Math.min(100,etapa.navegadores / maximoFunil * 100)}%` }}/>
                  </div>
                </div>)}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-gray-500">
                As etapas são contagens independentes por identificador, não uma sequência obrigatória.
                A abertura do carrinho passou a ser medida agora, então seu histórico começa nesta atualização.
              </p>
              <p className="mt-2 text-sm font-semibold text-[#075d3a]">Compra registrada após visita: {taxa}% <span className="font-normal text-gray-500">({numero(compra)} identificadores com compra)</span></p>
            </div>

            <div className="rounded-2xl border border-[#dce8d5] bg-white p-4 sm:p-5">
              <h3 className="font-semibold text-[#075d3a]">Visitas registradas por dia</h3>
              <p className="mb-4 text-xs text-gray-500">Visualizações de páginas, não pessoas únicas.</p>
              {serie.length === 0
                ? <p className="py-12 text-center text-sm text-gray-500">Sem registros neste período.</p>
                : <div className="h-[270px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={serie}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eee2"/>
                        <XAxis dataKey="data" tick={{ fontSize: 10 }} minTickGap={18}/>
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false}/>
                        <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.dia ?? ""}
                          formatter={(v: any) => [numero(Number(v)), "Visualizações"]} />
                        <Bar dataKey="acessos" fill="#08764a" radius={[5, 5, 0, 0]} maxBarSize={24}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>}
            </div>
          </div>
          <p className="text-xs leading-relaxed text-gray-500">
            Visitas estimadas e navegadores não são contagens exatas de pessoas: trocar de aparelho, limpar dados ou compartilhar um dispositivo afeta a medição. Não coletamos IP para esse cálculo.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#dce8d5] bg-white p-4 sm:p-5">
              <h3 className="flex items-center gap-2 font-semibold text-[#075d3a]"><BarChart3 size={18}/> Páginas mais acessadas</h3>
              <div className="mt-3 space-y-2">
                {(data.paginas ?? []).length === 0 && <p className="text-sm text-gray-500">Sem visitas registradas.</p>}
                {(data.paginas ?? []).map(p => <div key={p.pagina} className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-none">
                  <span className="min-w-0 truncate text-gray-700">{p.pagina === "/" ? "Página inicial (/)" : p.pagina}</span>
                  <span className="shrink-0 font-semibold text-[#075d3a]">{numero(p.acessos)}</span>
                </div>)}
              </div>
            </div>
            <div className="rounded-2xl border border-[#dce8d5] bg-white p-4 sm:p-5">
              <h3 className="flex items-center gap-2 font-semibold text-[#075d3a]"><MousePointerClick size={18}/> Botões e ações mais clicados</h3>
              <div className="mt-3 space-y-2">
                {(data.cliques ?? []).length === 0 && <p className="text-sm text-gray-500">Sem cliques classificados.</p>}
                {(data.cliques ?? []).map(c => <div key={c.acao} className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-none">
                  <span className="text-gray-700">{c.acao}</span>
                  <span className="shrink-0 font-semibold text-[#075d3a]">{numero(c.cliques)}</span>
                </div>)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dce8d5] bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-[#075d3a]"><Activity size={18}/> Atividade recente no site</h3>
                <p className="mt-1 text-xs text-gray-500">Últimos 30 minutos. Identificadores parcialmente ocultos; atualização automática a cada 45 segundos.</p>
              </div>
              <span className="text-xs text-gray-500">{numero(data.ativos_5min)} ativos nos últimos 5 min</span>
            </div>
            {(data.atividade_recente ?? []).length === 0
              ? <p className="py-8 text-center text-sm text-gray-500">Nenhuma atividade recente.</p>
              : <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(data.atividade_recente ?? []).map((item,idx) => {
                    const estado = item.comprou ? "Comprou" : item.iniciou_checkout ? "No checkout" : item.abriu_carrinho ? "Abriu carrinho" : item.adicionou_carrinho ? "Adicionou ao carrinho" : item.viu_produto ? "Viu produto" : "Navegando";
                    return <div key={item.referencia + idx} className="flex items-center justify-between gap-2 rounded-xl bg-[#f5f9f3] p-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#075d3a]">Navegação •••{item.referencia}</p>
                        <p className="mt-0.5 text-xs text-gray-600">{estado} · {numero(item.interacoes)} eventos</p>
                      </div>
                      <span className="shrink-0 text-xs text-gray-500">{horario(item.ultimo_evento)}</span>
                    </div>;
                  })}
                </div>}
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-[#f0f7ee] p-4 text-xs leading-relaxed text-[#375244] sm:flex-row sm:items-center sm:justify-between">
            <span>O site também usa Google Analytics 4 com consentimento do visitante. Este relatório consulta eventos internos do Supabase; não mostra gravações de tela.</span>
            <a href="https://analytics.google.com/analytics/web/" target="_blank" rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#075d3a] underline">Abrir Google Analytics <ArrowRight size={14}/></a>
          </div>
        </>
      )}
    </section>
  );
}

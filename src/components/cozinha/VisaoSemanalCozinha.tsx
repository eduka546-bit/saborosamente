import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  assinaturaChecklist, chaveChecklistIngrediente, etapaEstaMarcada,
  ingredienteEstaSeparado, type MarcacaoIngrediente,
} from "@/lib/cozinha-checklist-ingredientes";
import { ChevronLeft, ChevronRight, ClipboardList, Package, ShoppingCart, AlertTriangle, CalendarDays } from "lucide-react";
import {
  MAX_DIAS_PLANEJAMENTO, alterarLimitePeriodo, deslocarPeriodo,
  listarDatasPeriodo, periodoComDuracao, selecionarDiasPeriodo,
  type PeriodoProducao,
} from "@/lib/cozinha-periodo";

type Unidade = "g" | "un" | "L";
type Necessidade = {
  id: string;
  quantidade: number;
  unidade: Unidade;
  item: any;
  pratos: string[];
  qb: boolean;
};

type Props = {
  periodo: PeriodoProducao;
  producoes: any[];
  carregando: boolean;
  erro: boolean;
  produtosPorId: Map<string, any>;
  receitasPorProduto: Map<string, any>;
  preparacoesPorId: Map<string, any>;
  montagensPorReceita: Map<string, any[]>;
  estoque: any[];
  calcularNecessidades: (linhas: any[]) => Necessidade[];
  formatarQuantidade: (quantidade: unknown, unidade: Unidade, nome?: unknown) => string;
  rotuloProduto: (produto: any) => string;
  onAlterarPeriodo: (periodo: PeriodoProducao) => void;
  onAbrirDia: (data: string) => void;
};

const fmtData = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
const fmtDia = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long", day: "2-digit", month: "2-digit" });
const fmtDiaCurto = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "short" });
const quantidade = (v: unknown) => Math.max(0, Number(v) || 0);

export function VisaoSemanalCozinha({
  periodo, producoes, carregando, erro, produtosPorId, receitasPorProduto,
  preparacoesPorId, montagensPorReceita, estoque, calcularNecessidades, formatarQuantidade, rotuloProduto,
  onAlterarPeriodo, onAbrirDia,
}: Props) {
  const [visualizacao, setVisualizacao] = useState<"producao" | "ingredientes" | "compras">("producao");
  const chavePeriodo = `${periodo.inicio}:${periodo.fim}`;
  // Exclusões vinculadas ao período: mudar datas não deixa filtros antigos escondidos.
  const [filtroDias, setFiltroDias] = useState<{ chave: string; excluidas: string[] }>({
    chave: "", excluidas: [],
  });
  const todasDatas = useMemo(
    () => listarDatasPeriodo(periodo.inicio, periodo.fim),
    [periodo.inicio, periodo.fim],
  );
  const datasExcluidas = useMemo(
    () => new Set(filtroDias.chave === chavePeriodo ? filtroDias.excluidas : []),
    [filtroDias, chavePeriodo],
  );
  const datasEscolhidas = useMemo(
    () => selecionarDiasPeriodo(todasDatas, datasExcluidas),
    [todasDatas, datasExcluidas],
  );
  const producoesPorDia = useMemo(() => {
    const mapa = new Map<string, any[]>();
    for (const p of producoes) {
      const linhas = mapa.get(p.data_producao) || [];
      linhas.push(p);
      mapa.set(p.data_producao, linhas);
    }
    return mapa;
  }, [producoes]);
  const alterarDatasEscolhidas = (selecionadas: string[]) => {
    const escolhidas = new Set(selecionadas);
    setFiltroDias({
      chave: chavePeriodo,
      excluidas: todasDatas.filter((data) => !escolhidas.has(data)),
    });
  };
  const alternarDia = (data: string) => {
    const atual = new Set(datasEscolhidas);
    if (atual.has(data)) atual.delete(data);
    else atual.add(data);
    alterarDatasEscolhidas([...atual]);
  };

  // A produção e os preparos são calculados por DIA. Nunca agrupamos ou
  // reaproveitamos preparos entre dias; somente os ingredientes brutos
  // dos dias ainda pendentes entram na lista de compras semanal.
  const dias = useMemo(() => datasEscolhidas.map((data) => {
    const linhas = producoesPorDia.get(data) || [];
    const pendentes = linhas.filter((p) => p.status !== "concluida" && quantidade(p.quantidade_planejada) > 0);
    const ingredientes = calcularNecessidades(pendentes);
    const producoesSemFicha = pendentes.filter((p) => !receitasPorProduto.has(p.produto_id));
    const porProduto = new Map<string, any[]>();
    for (const linha of linhas) {
      const rows = porProduto.get(linha.produto_id) || [];
      rows.push(linha);
      porProduto.set(linha.produto_id, rows);
    }

    const preparacoesDoDia = new Map<string, { id: string; nome: string; linhas: string[] }>();
    for (const linha of pendentes) {
      const receita = receitasPorProduto.get(linha.produto_id);
      for (const referencia of Array.isArray(receita?.preparacoes) ? receita.preparacoes : []) {
        const id = String(referencia?.id || "");
        if (!id) continue;
        const nome = preparacoesPorId.get(id)?.nome || referencia?.nome;
        if (!nome) continue;
        const atual = preparacoesDoDia.get(id) || { id, nome: String(nome), linhas: [] };
        atual.linhas.push(`${linha.produto_id}:${linha.gramatura}:${quantidade(linha.quantidade_planejada)}`);
        preparacoesDoDia.set(id, atual);
      }
    }

    return {
      data, linhas, pendentes, ingredientes, producoesSemFicha,
      preparacoes: [...preparacoesDoDia.values()]
        .map((p) => ({ id: p.id, nome: p.nome, assinatura: assinaturaChecklist(p.linhas.sort()) }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
      pratos: [...porProduto.entries()].map(([produtoId, rows]) => ({
        produtoId,
        produto: produtosPorId.get(produtoId),
        total: rows.reduce((s, p) => s + quantidade(p.quantidade_planejada), 0),
        tamanhos: [...new Set(rows.map((r) => String(r.gramatura)))].map((peso) => ({
          peso,
          quantidade: rows.filter((r) => String(r.gramatura) === peso).reduce((s, r) => s + quantidade(r.quantidade_planejada), 0),
        })).filter((r) => r.quantidade > 0),
        concluida: rows.every((r) => r.status === "concluida"),
        componentes: (montagensPorReceita.get(receitasPorProduto.get(produtoId)?.id) || [])
          .map((componente: any) => {
            const porTamanho = [...new Set(rows.map((r) => String(r.gramatura)))].sort().map((peso) => ({
              tamanho: peso,
              pratos: rows.filter((r) => String(r.gramatura) === peso).reduce((s, r) => s + quantidade(r.quantidade_planejada), 0),
              gramas: quantidade(componente[`gramas_${peso}`]),
            }));
            const gramas = porTamanho.reduce((s, v) => s + v.pratos * v.gramas, 0);
            return {
              id: String(componente.id),
              nome: String(componente.nome || "Componente"),
              gramas,
              assinatura: assinaturaChecklist(porTamanho.flatMap((v) => [v.tamanho,v.pratos,v.gramas])),
            };
          }).filter((c) => c.gramas > 0),
      })).sort((a, b) => String(a.produto?.nome || "").localeCompare(String(b.produto?.nome || ""), "pt-BR")),
    };
  }), [datasEscolhidas, producoesPorDia, produtosPorId, receitasPorProduto, preparacoesPorId, montagensPorReceita, calcularNecessidades]);

  // SOMENTE ingredientes que ainda serão necessários entram no consolidado.
  // A chave inclui a unidade para não misturar g, L ou unidades.
  const compras = useMemo(() => {
    const mapa = new Map<string, Necessidade & { dias: { data: string; quantidade: number }[] }>();
    for (const dia of dias) {
      for (const linha of dia.ingredientes) {
        const chave = `${linha.id}:${linha.unidade}`;
        const atual = mapa.get(chave) || { ...linha, quantidade: 0, qb: false, pratos: [], dias: [] };
        atual.quantidade += quantidade(linha.quantidade);
        atual.qb = atual.qb || linha.qb;
        atual.pratos = Array.from(new Set([...atual.pratos, ...linha.pratos]));
        atual.dias.push({ data: dia.data, quantidade: quantidade(linha.quantidade) });
        mapa.set(chave, atual);
      }
    }
    return [...mapa.values()].map((linha) => {
      const registro = estoque.find((e: any) => e.ingrediente_id === linha.id);
      const disponivel = quantidade(registro?.quantidade_atual);
      const comprar = linha.quantidade > 0 ? Math.max(0, linha.quantidade - disponivel) : 0;
      return { ...linha, disponivel, comprar };
    }).sort((a, b) => String(a.item?.nome || "").localeCompare(String(b.item?.nome || ""), "pt-BR"));
  }, [dias, estoque]);

  const totais = useMemo(() => ({
    unidades: dias.reduce((s, dia) => s + dia.linhas.reduce((v, p) => v + quantidade(p.quantidade_planejada), 0), 0),
    pendentes: dias.reduce((s, dia) => s + dia.pendentes.reduce((v, p) => v + quantidade(p.quantidade_planejada), 0), 0),
    semFicha: dias.reduce((s, dia) => s + dia.producoesSemFicha.length, 0),
    faltantes: compras.filter((x) => x.comprar > 0 || (x.qb && x.quantidade <= 0)).length,
  }), [dias, compras]);

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dbe7dd] bg-white p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Período anterior" title="Período anterior" onClick={() => onAlterarPeriodo(deslocarPeriodo(periodo, -1))} className="grid size-9 place-items-center rounded-full border border-[#dbe7dd] hover:bg-[#f4f8f4]"><ChevronLeft size={18}/></button>
        <div className="min-w-0 text-center">
          <p className="text-xs font-semibold uppercase text-[#62766b]">Planejamento por período</p>
          <b className="text-sm text-[#075636] sm:text-base">{fmtData(periodo.inicio)} a {fmtData(periodo.fim)}</b>
        </div>
        <button type="button" aria-label="Próximo período" title="Próximo período" onClick={() => onAlterarPeriodo(deslocarPeriodo(periodo, 1))} className="grid size-9 place-items-center rounded-full border border-[#dbe7dd] hover:bg-[#f4f8f4]"><ChevronRight size={18}/></button>
      </div>
      <div className="grid w-full grid-cols-3 gap-1 rounded-xl bg-[#eff4ec] p-1 sm:w-auto">
        {([
          ["producao", "Produções", ClipboardList],
          ["ingredientes", "Ingredientes", Package],
          ["compras", "Compras", ShoppingCart],
        ] as const).map(([id, nome, Icon]) => <button key={id} type="button" onClick={() => setVisualizacao(id)} aria-pressed={visualizacao === id} className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-bold sm:px-3 sm:text-sm ${visualizacao === id ? "bg-white text-[#087443] shadow-sm" : "text-[#52695f] hover:bg-white/50"}`}><Icon size={15}/>{nome}</button>)}
      </div>
    </div>
    <section className="rounded-2xl border border-[#dbe7dd] bg-white p-3 sm:p-4" aria-label="Filtros do período">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDays size={19} className="text-[#087443]" />
        <h3 className="font-black text-[#075636]">Escolha o período e os dias</h3>
        <span className="text-xs text-[#62766b]">Até {MAX_DIAS_PLANEJAMENTO} dias</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-lg">
        <label className="flex min-w-0 flex-col gap-1 text-xs font-bold text-[#52695f]">
          Data inicial
          <input type="date" aria-label="Início do período" value={periodo.inicio}
            onChange={(e) => onAlterarPeriodo(alterarLimitePeriodo(periodo, "inicio", e.target.value))}
            className="h-10 w-full min-w-0 rounded-lg border border-[#dbe7dd] bg-white px-2 text-sm text-[#173a2d] focus-visible:outline-[#087443]" />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs font-bold text-[#52695f]">
          Data final
          <input type="date" aria-label="Fim do período" value={periodo.fim}
            onChange={(e) => onAlterarPeriodo(alterarLimitePeriodo(periodo, "fim", e.target.value))}
            className="h-10 w-full min-w-0 rounded-lg border border-[#dbe7dd] bg-white px-2 text-sm text-[#173a2d] focus-visible:outline-[#087443]" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold text-[#52695f]">Atalhos:</span>
        {([3, 7, 14, 30, 60, 90] as const).map((n) => (
          <button type="button" key={n} aria-pressed={todasDatas.length === n}
            onClick={() => onAlterarPeriodo(periodoComDuracao(periodo.inicio, n))}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${todasDatas.length === n
              ? "border-[#087443] bg-[#e0f2e7] text-[#075636]"
              : "border-[#dbe7dd] bg-white text-[#52695f] hover:bg-[#f2f7ef]"}`}>
            {n} dias
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#e9eee8] pt-3">
        <p className="text-sm font-semibold text-[#075636]">
          {datasEscolhidas.length} de {todasDatas.length} dias selecionados
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => alterarDatasEscolhidas(todasDatas)}
            className="rounded-lg border border-[#c8dbc9] px-2.5 py-1.5 text-xs font-semibold text-[#087443] hover:bg-[#f2f7ef]">Todos</button>
          <button type="button"
            onClick={() => alterarDatasEscolhidas(todasDatas.filter((data) => (producoesPorDia.get(data) || []).some((p) => quantidade(p.quantidade_planejada) > 0)))}
            disabled={carregando || erro}
            className="rounded-lg border border-[#c8dbc9] px-2.5 py-1.5 text-xs font-semibold text-[#087443] hover:bg-[#f2f7ef] disabled:opacity-50">Com produção</button>
          <button type="button" onClick={() => alterarDatasEscolhidas([])}
            className="rounded-lg border border-[#dbe7dd] px-2.5 py-1.5 text-xs font-semibold text-[#52695f] hover:bg-[#f2f7ef]">Limpar</button>
        </div>
      </div>
      <div role="group" aria-label="Dias que entram no planejamento" className="mt-2 grid max-h-44 grid-cols-3 gap-1.5 overflow-y-auto rounded-xl bg-[#f6f9f4] p-2 sm:grid-cols-5 lg:grid-cols-7">
        {todasDatas.map((data) => {
          const ativo = !datasExcluidas.has(data);
          const numProducoes = (producoesPorDia.get(data) || []).reduce((s, p) => s + quantidade(p.quantidade_planejada), 0);
          return <button key={data} type="button" aria-pressed={ativo}
            aria-label={`${fmtDia(data)}: ${ativo ? "incluído" : "excluído"} do planejamento, ${numProducoes} marmitas`}
            onClick={() => alternarDia(data)}
            className={`min-w-0 rounded-lg border px-1.5 py-2 text-center transition-colors ${ativo
              ? "border-[#9fcab0] bg-[#e0f2e7] text-[#075636]"
              : "border-[#dbe7dd] bg-white text-[#8c9990] hover:bg-[#eef4ec]"}`}>
            <span className="block truncate text-[10px] font-semibold capitalize">{fmtDiaCurto(data)}</span>
            <span className="block font-black">{fmtData(data)}</span>
            {numProducoes > 0 && <span className="block text-[10px] font-semibold">{numProducoes} un</span>}
          </button>;
        })}
      </div>
      <p className="mt-2 text-xs text-[#62766b]">Toque nos dias para incluir ou retirar. Produções, ingredientes e compras consideram somente os dias destacados. As preparações continuam separadas por data.</p>
    </section>
    {carregando && <div role="status" className="rounded-2xl border border-[#dbe7dd] bg-white p-5 text-sm text-[#62766b]">Carregando produções e ingredientes do período escolhido…</div>}
    {erro && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 font-semibold text-red-700">Não foi possível carregar o período. Selecione outro intervalo ou tente novamente; não use a lista de compras enquanto houver esse erro.</div>}
    {!carregando && !erro && <>
    <div className="grid grid-cols-3 gap-2">
      {[
        ["Total do período", totais.unidades, "bg-[#e0f2e7] text-[#087443]"],
        ["Ainda a produzir", totais.pendentes, "bg-[#f2f6e6] text-[#315e49]"],
        ["Itens para comprar", totais.faltantes, "bg-[#fff4d9] text-[#875b19]"],
      ].map(([titulo, valor, estilo]) => <article key={String(titulo)} className={`rounded-xl p-3 ${estilo}`}><p className="text-[11px] font-semibold sm:text-xs">{titulo}</p><p className="text-xl font-black sm:text-2xl">{valor}</p></article>)}
    </div>
    {datasEscolhidas.length === 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Selecione pelo menos um dia acima para visualizar a produção e os ingredientes.</p>}
    {totais.semFicha > 0 && <p role="alert" className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900"><AlertTriangle size={18} className="shrink-0"/>Há {totais.semFicha} lançamento(s) sem ficha técnica. Os ingredientes e a lista de compras podem estar incompletos; confira os cadastros antes de comprar.</p>}
    <p className="rounded-xl bg-[#f1f7ec] p-3 text-xs leading-relaxed text-[#406050]">
      <b>Preparações sempre separadas por dia.</b> Os ingredientes brutos usam as fichas, rendimentos e perdas da produção diária. Na lista de compras, só as produções pendentes entram na soma, e o estoque é descontado uma vez. Preparos já prontos indicados apenas durante a abertura da ficha diária não são abatidos automaticamente; confira-os antes de fechar a compra.
    </p>

    {visualizacao === "producao" && <div className="grid gap-3 lg:grid-cols-2">
      {dias.map((dia) => <article key={dia.data} className="rounded-2xl border border-[#dbe7dd] bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold capitalize text-[#075636]">{fmtDia(dia.data)}</h3>
          <button type="button" onClick={() => onAbrirDia(dia.data)} className="rounded-lg border border-[#b9d0c0] px-2.5 py-1.5 text-xs font-bold text-[#087443] hover:bg-[#f3f8f4]">Abrir dia</button>
        </div>
        {dia.pratos.length === 0 ? <p className="text-sm text-[#62766b]">Nenhuma produção cadastrada.</p> : <>
          <div className="space-y-2">
            {dia.pratos.map((prato) => <div key={prato.produtoId} className="flex items-start justify-between gap-2 rounded-lg bg-[#f7f9f5] px-3 py-2">
              <div className="min-w-0"><b className="block break-words text-sm">{rotuloProduto(prato.produto)}</b><p className="text-xs text-[#62766b]">{prato.tamanhos.map((t) => `${t.quantidade}× ${t.peso}g`).join(" · ")}</p></div>
              <div className="text-right"><b className="block text-sm text-[#087443]">{prato.total} un</b>{prato.concluida && <small className="text-[#527164]">Produzido</small>}</div>
            </div>)}
          </div>
          {dia.preparacoes.length > 0 && <details className="mt-3 rounded-lg border border-[#e4ece4] px-3 py-2 text-sm"><summary className="cursor-pointer font-semibold text-[#075636]">Preparações deste dia ({dia.preparacoes.length})</summary><p className="mt-1 text-xs text-[#62766b]">Lista por dia, sem misturar ou somar preparos de outras datas. Para os pesos exatos e os já prontos, abra a ficha do dia.</p><div className="mt-2 flex flex-wrap gap-1.5">{dia.preparacoes.map((nome) => <span key={nome} className="rounded-full bg-[#edf5e6] px-2 py-1 text-xs">{nome}</span>)}</div></details>}
          <p className="mt-3 text-xs font-semibold text-[#527164]">Total do dia: {dia.pratos.reduce((v, p) => v + p.total, 0)} unidades</p>
        </>}
      </article>)}
    </div>}

    {visualizacao === "ingredientes" && <div className="grid gap-3 lg:grid-cols-2">
      {dias.map((dia) => <article key={dia.data} className="rounded-2xl border border-[#dbe7dd] bg-white p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold capitalize text-[#075636]">{fmtDia(dia.data)}</h3><button type="button" onClick={() => onAbrirDia(dia.data)} className="text-xs font-bold text-[#087443] underline underline-offset-2">Ver ficha do dia</button></div>
        <p className="mb-3 text-xs text-[#62766b]">Ingredientes das produções ainda pendentes, calculados somente para este dia.</p>
        {!dia.ingredientes.length ? <p className="text-sm text-[#62766b]">{dia.linhas.length ? "Sem ingredientes pendentes (produções concluídas ou fichas indisponíveis)." : "Sem produções planejadas."}</p> :
          <div className="max-h-80 space-y-1 overflow-y-auto">{dia.ingredientes.map((linha) => <div key={`${linha.id}:${linha.unidade}`} className="flex items-start justify-between gap-2 border-b border-[#edf1ed] py-1.5 text-sm"><span className="min-w-0 break-words">{linha.item?.nome}</span><b className="shrink-0 text-[#087443]">{linha.quantidade > 0 ? formatarQuantidade(linha.quantidade, linha.unidade, linha.item?.nome) : "QB · conferir"}</b></div>)}</div>}
      </article>)}
    </div>}

    {visualizacao === "compras" && <div className="overflow-hidden rounded-2xl border border-[#dbe7dd] bg-white">
      <div className="border-b bg-[#f6f9f4] p-4"><h3 className="text-lg font-black text-[#075636]">Lista de ingredientes do período</h3><p className="mt-1 text-sm text-[#62766b]">Total das necessidades pendentes dos dias selecionados, menos o estoque atual descontado uma única vez. Preparações não são somadas entre datas.</p></div>
      {!compras.length ? <p className="p-6 text-sm text-[#62766b]">Nenhum ingrediente pendente nos dias selecionados.</p> :
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-sm">
            <thead className="bg-[#f1f7ed] text-xs font-semibold uppercase text-[#527164]"><tr><th className="px-3 py-3">Ingrediente / dias</th><th className="px-3 py-3 text-right">Necessário</th><th className="px-3 py-3 text-right">Em estoque</th><th className="px-3 py-3 text-right">Comprar</th></tr></thead>
            <tbody>{compras.map((linha) => <tr key={`${linha.id}:${linha.unidade}`} className="border-t border-[#edf1ed] align-top">
              <td className="px-3 py-2.5"><b>{linha.item?.nome}</b><details className="mt-1 text-xs text-[#62766b]"><summary className="cursor-pointer">Ver necessidade por dia</summary><div className="mt-1 space-y-1">{linha.dias.map((d) => <p key={d.data}>{fmtData(d.data)}: {d.quantidade > 0 ? formatarQuantidade(d.quantidade, linha.unidade, linha.item?.nome) : "QB · conferir"}</p>)}</div></details></td>
              <td className="px-3 py-2.5 text-right font-semibold">{linha.quantidade > 0 ? formatarQuantidade(linha.quantidade, linha.unidade, linha.item?.nome) : "QB"}</td>
              <td className="px-3 py-2.5 text-right">{formatarQuantidade(linha.disponivel, linha.unidade, linha.item?.nome)}</td>
              <td className="px-3 py-2.5 text-right font-bold text-[#087443]">{linha.comprar > 0 ? formatarQuantidade(linha.comprar, linha.unidade, linha.item?.nome) : linha.qb && linha.quantidade <= 0 ? "Conferir QB" : "—"}</td>
            </tr>)}</tbody>
          </table>
        </div>}
    </div>}
    </>}
  </div>;
}

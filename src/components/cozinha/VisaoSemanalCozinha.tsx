import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  aplicarIngredientesManuais, EditarQuantidadeIngrediente,
  NovaAdicaoIngrediente, useIngredientesManuais,
} from "@/components/cozinha/EdicaoIngredientesCozinha";
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
  catalogoIngredientes: any[];
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

type MarcacaoEtapa = {
  data_producao: string;
  tipo: "preparacao" | "componente" | "prato";
  chave: string;
  assinatura_referencia: string;
};

function CaixaChecklist({ marcada, desabilitada, onMudar, texto, complemento }: {
  marcada: boolean;
  desabilitada: boolean;
  onMudar: (marcada: boolean) => void;
  texto: string;
  complemento?: string;
}) {
  return <label className={`flex min-w-0 cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[#edf5e6] ${desabilitada ? "cursor-wait opacity-60" : ""}`}>
    <input type="checkbox" checked={marcada} disabled={desabilitada} onChange={(e) => onMudar(e.target.checked)}
      className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-[#087443]" />
    <span className="min-w-0">
      <span className={`block break-words font-semibold ${marcada ? "text-[#527164] line-through" : "text-[#173a2d]"}`}>{texto}</span>
      {complemento && <span className="block text-xs text-[#62766b]">{complemento}</span>}
    </span>
  </label>;
}

export function VisaoSemanalCozinha({
  periodo, producoes, carregando, erro, produtosPorId, receitasPorProduto,
  preparacoesPorId, montagensPorReceita, estoque, catalogoIngredientes, calcularNecessidades, formatarQuantidade, rotuloProduto,
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

  const manuaisPeriodo = useIngredientesManuais(periodo.inicio, periodo.fim);
  // A produção e os preparos são calculados por DIA. Nunca agrupamos ou
  // reaproveitamos preparos entre dias; somente os ingredientes brutos
  // dos dias ainda pendentes entram na lista de compras semanal.
  const dias = useMemo(() => datasEscolhidas.map((data) => {
    const linhas = producoesPorDia.get(data) || [];
    const pendentes = linhas.filter((p) => p.status !== "concluida" && quantidade(p.quantidade_planejada) > 0);
    const ingredientes = aplicarIngredientesManuais(
      calcularNecessidades(pendentes), manuaisPeriodo.doDia(data), catalogoIngredientes,
    );
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
  }), [datasEscolhidas, producoesPorDia, produtosPorId, receitasPorProduto, preparacoesPorId, montagensPorReceita, calcularNecessidades, manuaisPeriodo.dados, catalogoIngredientes]);

  // SOMENTE ingredientes que ainda serão necessários entram no consolidado.
  // A chave inclui a unidade para não misturar g, L ou unidades.
  const compras = useMemo(() => {
    const mapa = new Map<string, Necessidade & { dias: { data: string; quantidade: number; manualId?: string }[] }>();
    for (const dia of dias) {
      for (const linha of dia.ingredientes) {
        const chave = `${linha.id}:${linha.unidade}`;
        const atual = mapa.get(chave) || { ...linha, quantidade: 0, qb: false, pratos: [], dias: [] };
        atual.quantidade += quantidade(linha.quantidade);
        atual.qb = atual.qb || linha.qb;
        atual.pratos = Array.from(new Set([...atual.pratos, ...linha.pratos]));
        atual.dias.push({ data: dia.data, quantidade: quantidade(linha.quantidade), manualId: linha.manualId });
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

  // Marcações compartilhadas entre celular/computador, mantidas separadamente
  // por dia. Sem alteração automática de estoque ou status da produção.
  const qc = useQueryClient();
  const [salvandoChave, setSalvandoChave] = useState<string | null>(null);
  const {
    data: checklist, isLoading: carregandoChecklist, isError: erroChecklist,
  } = useQuery({
    queryKey: ["coz-checklist-periodo", periodo.inicio, periodo.fim],
    queryFn: async () => {
      async function carregar(tabela: string, campos: string) {
        const resultado: any[] = [];
        for (let offset = 0; ; offset += 500) {
          const base = (supabase as any).from(tabela)
            .select(campos)
            .gte("data_producao", periodo.inicio)
            .lte("data_producao", periodo.fim)
            .order("data_producao");
          // Ordenação estável evita ignorar entradas na paginação de períodos longos.
          const ordenado = tabela === "cozinha_ingredientes_separados"
            ? base.order("ingrediente_id").order("unidade")
            : base.order("tipo").order("chave");
          const { data, error } = await ordenado.range(offset, offset + 499);
          if (error) throw error;
          resultado.push(...(data || []));
          if (!data || data.length < 500) return resultado;
        }
      }
      const [ingredientes, etapas] = await Promise.all([
        carregar("cozinha_ingredientes_separados", "data_producao,ingrediente_id,unidade,quantidade_referencia"),
        carregar("cozinha_etapas_marcadas", "data_producao,tipo,chave,assinatura_referencia"),
      ]);
      return { ingredientes: ingredientes as MarcacaoIngrediente[], etapas: etapas as MarcacaoEtapa[] };
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const ingredientesMarcados = useMemo(() =>
    new Map((checklist?.ingredientes || []).map((m) =>
      [chaveChecklistIngrediente(m.data_producao, m.ingrediente_id, m.unidade), m])),
    [checklist],
  );
  const etapasMarcadas = useMemo(() =>
    new Map((checklist?.etapas || []).map((m) =>
      [`${m.data_producao}:${m.tipo}:${m.chave}`, m])),
    [checklist],
  );
  const bloqueado = carregandoChecklist || erroChecklist || manuaisPeriodo.indisponivel || Boolean(salvandoChave);
  const ingredienteMarcado = (data: string, linha: { id: string; unidade: Unidade; quantidade: number; manualId?: string; manualMarcado?: boolean }) =>
    linha.id.startsWith("avulso:")
      ? Boolean(manuaisPeriodo.doDia(data).find((m) => m.id === linha.manualId)?.marcado_em)
      : ingredienteEstaSeparado(
        ingredientesMarcados.get(chaveChecklistIngrediente(data, linha.id, linha.unidade)),
        quantidade(linha.quantidade),
      );
  const etapaMarcada = (data: string, tipo: MarcacaoEtapa["tipo"], chave: string, assinatura: string) =>
    etapaEstaMarcada(etapasMarcadas.get(`${data}:${tipo}:${chave}`), assinatura);

  const recarregarChecklist = async () => {
    await qc.invalidateQueries({ queryKey: ["coz-checklist-periodo"] });
  };
  const marcarIngrediente = async (
    data: string, linha: { id: string; unidade: Unidade; quantidade: number; manualId?: string },
    marcada: boolean,
  ) => {
    if (bloqueado) return;
    if (linha.id.startsWith("avulso:") && linha.manualId) {
      await manuaisPeriodo.marcarExtra(linha.manualId, marcada);
      return;
    }
    const chave = chaveChecklistIngrediente(data, linha.id, linha.unidade);
    setSalvandoChave(chave);
    try {
      const { error } = marcada
        ? await (supabase as any).from("cozinha_ingredientes_separados")
          .upsert({
            data_producao: data, ingrediente_id: linha.id, unidade: linha.unidade,
            quantidade_referencia: quantidade(linha.quantidade), marcado_em: new Date().toISOString(),
          }, { onConflict: "data_producao,ingrediente_id,unidade" })
        : await (supabase as any).from("cozinha_ingredientes_separados")
          .delete().eq("data_producao", data).eq("ingrediente_id", linha.id).eq("unidade", linha.unidade);
      if (error) throw error;
      await recarregarChecklist();
    } catch (e: any) { toast.error(e?.message || "Não foi possível atualizar o ingrediente."); }
    finally { setSalvandoChave(null); }
  };
  const marcarIngredienteTodosDias = async (
    linha: { id: string; unidade: Unidade; dias: { data: string; quantidade: number }[] },
    marcada: boolean,
  ) => {
    if (bloqueado || !linha.dias.length) return;
    setSalvandoChave(`todos:${linha.id}:${linha.unidade}`);
    try {
      const { error } = marcada
        ? await (supabase as any).from("cozinha_ingredientes_separados")
          .upsert(linha.dias.map((d) => ({
            data_producao: d.data, ingrediente_id: linha.id, unidade: linha.unidade,
            quantidade_referencia: quantidade(d.quantidade), marcado_em: new Date().toISOString(),
          })), { onConflict: "data_producao,ingrediente_id,unidade" })
        : await (supabase as any).from("cozinha_ingredientes_separados")
          .delete().eq("ingrediente_id", linha.id).eq("unidade", linha.unidade)
          .in("data_producao", linha.dias.map((d) => d.data));
      if (error) throw error;
      await recarregarChecklist();
    } catch (e: any) { toast.error(e?.message || "Não foi possível atualizar as marcações."); }
    finally { setSalvandoChave(null); }
  };
  const marcarEtapa = async (
    data: string, tipo: MarcacaoEtapa["tipo"], chave: string, assinatura: string,
    marcada: boolean,
  ) => {
    if (bloqueado) return;
    setSalvandoChave(`${data}:${tipo}:${chave}`);
    try {
      const { error } = marcada
        ? await (supabase as any).from("cozinha_etapas_marcadas")
          .upsert({
            data_producao: data, tipo, chave, assinatura_referencia: assinatura,
            marcado_em: new Date().toISOString(),
          }, { onConflict: "data_producao,tipo,chave" })
        : await (supabase as any).from("cozinha_etapas_marcadas")
          .delete().eq("data_producao", data).eq("tipo", tipo).eq("chave", chave);
      if (error) throw error;
      await recarregarChecklist();
    } catch (e: any) { toast.error(e?.message || "Não foi possível salvar a marcação."); }
    finally { setSalvandoChave(null); }
  };

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
    {(carregando || manuaisPeriodo.isLoading) && <div role="status" className="rounded-2xl border border-[#dbe7dd] bg-white p-5 text-sm text-[#62766b]">Carregando produções e ingredientes do período escolhido…</div>}
    {(erro || manuaisPeriodo.isError) && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 font-semibold text-red-700">Não foi possível carregar o período. Selecione outro intervalo ou tente novamente; não use a lista de compras enquanto houver esse erro.</div>}
    {!carregando && !erro && !manuaisPeriodo.isLoading && !manuaisPeriodo.isError && <>
    <div className="grid grid-cols-3 gap-2">
      {[
        ["Total do período", totais.unidades, "bg-[#e0f2e7] text-[#087443]"],
        ["Ainda a produzir", totais.pendentes, "bg-[#f2f6e6] text-[#315e49]"],
        ["Itens para comprar", totais.faltantes, "bg-[#fff4d9] text-[#875b19]"],
      ].map(([titulo, valor, estilo]) => <article key={String(titulo)} className={`rounded-xl p-3 ${estilo}`}><p className="text-[11px] font-semibold sm:text-xs">{titulo}</p><p className="text-xl font-black sm:text-2xl">{valor}</p></article>)}
    </div>
    {datasEscolhidas.length === 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Selecione pelo menos um dia acima para visualizar a produção e os ingredientes.</p>}
    {totais.semFicha > 0 && <p role="alert" className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900"><AlertTriangle size={18} className="shrink-0"/>Há {totais.semFicha} lançamento(s) sem ficha técnica. Os ingredientes e a lista de compras podem estar incompletos; confira os cadastros antes de comprar.</p>}
    {carregandoChecklist && <p role="status" className="rounded-xl border border-[#dbe7dd] bg-white p-3 text-sm text-[#527164]">Carregando itens marcados como prontos…</p>}
    {erroChecklist && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">Não foi possível carregar as marcações. Os botões de confirmação ficam desativados até que a conexão seja restabelecida.</p>}
    <p className="rounded-xl bg-[#f1f7ec] p-3 text-xs leading-relaxed text-[#406050]">
      <b>Preparações sempre separadas por dia.</b> Os ingredientes brutos usam as fichas, rendimentos e perdas da produção diária. Na lista de compras, só as produções pendentes entram na soma, e o estoque é descontado uma vez. Os ✔️ de ingredientes, preparações, componentes e marmitas ficam salvos por dia, mas não alteram as quantidades, o estoque nem o status oficial. Se as quantidades mudarem, a marcação correspondente precisa ser refeita. Preparos já prontos informados apenas na ficha diária não são abatidos automaticamente.
    </p>

    {visualizacao === "producao" && <div className="grid gap-3 lg:grid-cols-2">
      {dias.map((dia) => <article key={dia.data} className="rounded-2xl border border-[#dbe7dd] bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold capitalize text-[#075636]">{fmtDia(dia.data)}</h3>
          <button type="button" onClick={() => onAbrirDia(dia.data)} className="rounded-lg border border-[#b9d0c0] px-2.5 py-1.5 text-xs font-bold text-[#087443] hover:bg-[#f3f8f4]">Abrir dia</button>
        </div>
        {dia.pratos.length === 0 ? <p className="text-sm text-[#62766b]">Nenhuma produção cadastrada.</p> : <>
          {dia.preparacoes.length > 0 && <details className="mb-3 rounded-xl border border-[#cce2d0] bg-[#f7fbf5] p-3 text-sm">
            <summary className="cursor-pointer font-bold text-[#075636]">
              Preparações do dia · {dia.preparacoes.filter((p) => etapaMarcada(dia.data, "preparacao", p.id, p.assinatura)).length}/{dia.preparacoes.length} prontas
            </summary>
            <p className="mt-2 text-xs text-[#62766b]">Marque somente o que já foi preparado neste dia. A mesma preparação de outra data continua independente.</p>
            <div className="mt-2 space-y-0.5">{dia.preparacoes.map((p) =>
              <CaixaChecklist key={p.id}
                marcada={etapaMarcada(dia.data, "preparacao", p.id, p.assinatura)}
                desabilitada={bloqueado}
                onMudar={(marcada) => { void marcarEtapa(dia.data, "preparacao", p.id, p.assinatura, marcada); }}
                texto={p.nome} />
            )}</div>
          </details>}
          <div className="space-y-2">
            {dia.pratos.map((prato) => <div key={prato.produtoId} className="rounded-xl border border-[#e4ece4] bg-[#f7f9f5] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <b className="block break-words text-sm text-[#173a2d]">{rotuloProduto(prato.produto)}</b>
                  <p className="mt-0.5 text-xs text-[#62766b]">{prato.tamanhos.map((t) => `${t.quantidade}× ${t.peso}g`).join(" · ")}</p>
                </div>
                <div className="shrink-0 text-right">
                  <b className="block text-sm text-[#087443]">{prato.total} un</b>
                  {prato.concluida && <small className="text-[#527164]">Produção concluída</small>}
                </div>
              </div>
              <details className="mt-2 rounded-lg border border-[#dbe7dd] bg-white p-2.5">
                <summary className="cursor-pointer text-xs font-bold text-[#075636]">
                  Componentes do prato · {prato.componentes.filter((c) => etapaMarcada(dia.data, "componente", `${prato.produtoId}:${c.id}`, c.assinatura)).length}/{prato.componentes.length} prontos
                </summary>
                <p className="mt-2 text-xs text-[#62766b]">Marque individualmente cada item que já está pronto para a montagem.</p>
                <div className="mt-1 space-y-0.5">{prato.componentes.map((c) =>
                  <CaixaChecklist key={c.id}
                    marcada={etapaMarcada(dia.data, "componente", `${prato.produtoId}:${c.id}`, c.assinatura)}
                    desabilitada={bloqueado}
                    onMudar={(marcada) => { void marcarEtapa(dia.data, "componente", `${prato.produtoId}:${c.id}`, c.assinatura, marcada); }}
                    texto={c.nome}
                    complemento={c.gramas > 0 ? formatarQuantidade(c.gramas, "g", c.nome) : undefined} />
                )}</div>
                {!prato.componentes.length && <p className="mt-2 text-xs text-amber-800">Montagem não cadastrada. Confira a ficha deste prato.</p>}
              </details>
              <details className="mt-2 rounded-lg border border-[#dbe7dd] bg-white p-2.5">
                <summary className="cursor-pointer text-xs font-bold text-[#075636]">
                  Marmitas montadas por tamanho · {prato.tamanhos.filter((t) =>
                    etapaMarcada(dia.data, "prato", `${prato.produtoId}:${t.peso}`, assinaturaChecklist([prato.produtoId, t.peso, t.quantidade]))
                  ).length}/{prato.tamanhos.length} tamanhos concluídos
                </summary>
                <div className="mt-2 space-y-0.5">{prato.tamanhos.map((t) =>
                  <CaixaChecklist key={t.peso}
                    marcada={etapaMarcada(dia.data, "prato", `${prato.produtoId}:${t.peso}`, assinaturaChecklist([prato.produtoId, t.peso, t.quantidade]))}
                    desabilitada={bloqueado}
                    onMudar={(marcada) => { void marcarEtapa(dia.data, "prato", `${prato.produtoId}:${t.peso}`, assinaturaChecklist([prato.produtoId, t.peso, t.quantidade]), marcada); }}
                    texto={`${t.peso} g — ${t.quantidade} marmita(s) montadas`} />
                )}</div>
                <p className="mt-2 text-xs text-[#62766b]">Esta marcação visual não muda o status oficial da produção nem movimenta o estoque.</p>
              </details>
            </div>)}
          </div>
          <p className="mt-3 text-xs font-semibold text-[#527164]">Total do dia: {dia.pratos.reduce((v, p) => v + p.total, 0)} unidades</p>
        </>}
      </article>)}
    </div>}

    {visualizacao === "ingredientes" && <div className="grid gap-3 lg:grid-cols-2">
      {dias.map((dia) => <article key={dia.data} className="rounded-2xl border border-[#dbe7dd] bg-white p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold capitalize text-[#075636]">{fmtDia(dia.data)}</h3><button type="button" onClick={() => onAbrirDia(dia.data)} className="text-xs font-bold text-[#087443] underline underline-offset-2">Ver ficha do dia</button></div>
        <p className="mb-3 text-xs text-[#62766b]">Ingredientes das produções ainda pendentes, calculados somente para este dia.</p>
        <NovaAdicaoIngrediente data={dia.data}
          calculados={calcularNecessidades(dia.pendentes)}
          catalogo={catalogoIngredientes}
          controle={manuaisPeriodo} />
        {!dia.ingredientes.length ? <p className="text-sm text-[#62766b]">{dia.linhas.length ? "Sem ingredientes pendentes (produções concluídas ou fichas indisponíveis)." : "Sem produções planejadas."}</p> :
          <div className="max-h-80 space-y-1 overflow-y-auto">{dia.ingredientes.map((linha) => <div key={`${linha.id}:${linha.unidade}`} className="flex items-start justify-between gap-2 border-b border-[#edf1ed] py-1.5 text-sm">
            <div className="min-w-0 flex-1">
              <CaixaChecklist
                marcada={ingredienteMarcado(dia.data, linha)}
                desabilitada={bloqueado}
                onMudar={(marcada) => { void marcarIngrediente(dia.data, linha, marcada); }}
                texto={String(linha.item?.nome || "Ingrediente")} />
              <div className="pl-2">
                <EditarQuantidadeIngrediente data={dia.data} linha={linha} controle={manuaisPeriodo} catalogo={catalogoIngredientes} />
              </div>
            </div>
            <b className="shrink-0 pt-1.5 text-xs text-[#087443] sm:text-sm">{linha.quantidade > 0 ? formatarQuantidade(linha.quantidade, linha.unidade, linha.item?.nome) : linha.qb ? "QB · conferir" : "0"}</b>
          </div>)}</div>}
      </article>)}
    </div>}

    {visualizacao === "compras" && <div className="overflow-hidden rounded-2xl border border-[#dbe7dd] bg-white">
      <div className="border-b bg-[#f6f9f4] p-4"><h3 className="text-lg font-black text-[#075636]">Lista de ingredientes do período</h3><p className="mt-1 text-sm text-[#62766b]">Total das necessidades pendentes dos dias selecionados, menos o estoque atual descontado uma única vez. Preparações não são somadas entre datas. Itens avulsos sem cadastro são incluídos integralmente para compra; o saldo não é presumido.</p></div>
      {!compras.length ? <p className="p-6 text-sm text-[#62766b]">Nenhum ingrediente pendente nos dias selecionados.</p> :
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-sm">
            <thead className="bg-[#f1f7ed] text-xs font-semibold uppercase text-[#527164]"><tr><th className="px-3 py-3">Ingrediente / dias</th><th className="px-3 py-3 text-right">Necessário</th><th className="px-3 py-3 text-right">Em estoque</th><th className="px-3 py-3 text-right">Comprar</th></tr></thead>
            <tbody>{compras.map((linha) => <tr key={`${linha.id}:${linha.unidade}`} className="border-t border-[#edf1ed] align-top">
              <td className="px-3 py-2.5">
                {linha.id.startsWith("avulso:") ? (
                  <p className="font-bold text-[#173a2d]">{linha.item?.nome} <span className="block text-xs font-normal text-[#62766b]">Item avulso: marque por dia abaixo</span></p>
                ) : (
                  <CaixaChecklist
                    marcada={linha.dias.length > 0 && linha.dias.every((d) => ingredienteMarcado(d.data, { id: linha.id, unidade: linha.unidade, quantidade: d.quantidade }))}
                    desabilitada={bloqueado}
                    onMudar={(marcada) => { void marcarIngredienteTodosDias(linha, marcada); }}
                    texto={String(linha.item?.nome || "Ingrediente")}
                    complemento="Marcar como separado em todos os dias selecionados" />
                )}
                <details className="mt-1 text-xs text-[#62766b]">
                  <summary className="cursor-pointer">Conferir ou marcar por dia</summary>
                  <div className="mt-1 space-y-1">{linha.dias.map((d) =>
                    <div key={d.data} className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf1ed] pt-1">
                      <CaixaChecklist marcada={ingredienteMarcado(d.data, { id: linha.id, unidade: linha.unidade, quantidade: d.quantidade, manualId: d.manualId })}
                        desabilitada={bloqueado}
                        onMudar={(marcada) => { void marcarIngrediente(d.data, { id: linha.id, unidade: linha.unidade, quantidade: d.quantidade, manualId: d.manualId }, marcada); }}
                        texto={fmtData(d.data)} />
                      <span>{d.quantidade > 0 ? formatarQuantidade(d.quantidade, linha.unidade, linha.item?.nome) : "QB · conferir"}</span>
                    </div>
                  )}</div>
                </details>
              </td>
              <td className="px-3 py-2.5 text-right font-semibold">{linha.quantidade > 0 ? formatarQuantidade(linha.quantidade, linha.unidade, linha.item?.nome) : "QB"}</td>
              <td className="px-3 py-2.5 text-right">{linha.id.startsWith("avulso:") ? <span className="text-xs text-amber-800">Sem cadastro</span> : formatarQuantidade(linha.disponivel, linha.unidade, linha.item?.nome)}</td>
              <td className="px-3 py-2.5 text-right font-bold text-[#087443]">{linha.comprar > 0 ? formatarQuantidade(linha.comprar, linha.unidade, linha.item?.nome) : linha.qb && linha.quantidade <= 0 ? "Conferir QB" : "—"}</td>
            </tr>)}</tbody>
          </table>
        </div>}
    </div>}
    </>}
  </div>;
}

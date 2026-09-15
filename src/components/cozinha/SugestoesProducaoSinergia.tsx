import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChefHat, ChevronDown, Sparkles, TrendingUp, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  dataProducao: string;
  producoes: any[];
  produtos: any[];
  receitas: any[];
  receitaItens: any[];
  ingredientes: any[];
  estoqueMarmitas: any[];
};
type Tamanho = "200" | "300" | "400";
type Sugestao = {
  produto: any;
  tamanho: Tamanho;
  nivel: "alta" | "media";
  proteina?: string;
  carboidrato?: string;
  motivo: string;
  estoque: number;
  mediaDia: number;
  sugerida: number;
};
type SugestaoAgrupada = {
  produto: any;
  nivel: "alta" | "media";
  proteina?: string;
  carboidrato?: string;
  motivo: string;
  tamanhos: Partial<Record<Tamanho, Sugestao>>;
};

const n = (v: unknown) => Number(v || 0);
const tamanhos: { id: Tamanho; label: string }[] = [
  { id: "200", label: "200 g" },
  { id: "300", label: "300 g" },
  { id: "400", label: "400 g" },
];
const normalizar = (v: unknown) =>
  String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const CHAVES_PROTEINA = ["frango", "patinho", "carne", "bovina", "bovino", "suina", "suino", "porco", "lombo", "pernil", "tilapia", "peixe", "atum", "ovo", "calabresa", "linguica", "bacon", "almondega"];
const CHAVES_CARBO = ["arroz", "batata", "batata doce", "mandioca", "aipim", "macarrao", "massa", "nhoque", "pure", "cuscuz", "polenta", "feijao", "lentilha", "grao de bico"];

export function SugestoesProducaoSinergia({ dataProducao, producoes, produtos, receitas, receitaItens, ingredientes, estoqueMarmitas }: Props) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [selecionada, setSelecionada] = useState<SugestaoAgrupada | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [quantidades, setQuantidades] = useState<Record<Tamanho, string>>({ "200": "", "300": "", "400": "" });

  const receitaPorProduto = useMemo(() => new Map(receitas.map((r) => [r.produto_id, r])), [receitas]);
  const itensPorReceita = useMemo(() => {
    const map = new Map<string, any[]>();
    receitaItens.forEach((item) => map.set(item.receita_id, [...(map.get(item.receita_id) || []), item]));
    return map;
  }, [receitaItens]);
  const ingredientePorId = useMemo(() => new Map(ingredientes.map((i) => [i.id, i])), [ingredientes]);

  const { data: preparacoes = [] } = useQuery({
    queryKey: ["coz-sinergia-preparacoes"],
    queryFn: async () => (await supabase.from("cozinha_preparacoes").select("id,nome,rendimento_final_g")).data || [],
    staleTime: 10 * 60 * 1000,
  });
  const { data: preparacaoItens = [] } = useQuery({
    queryKey: ["coz-sinergia-preparacao-itens"],
    queryFn: async () => (await supabase.from("cozinha_preparacao_itens").select("preparacao_id,ingrediente_id,quantidade,rendimento_quebra")).data || [],
    staleTime: 10 * 60 * 1000,
  });

  const prepPorId = useMemo(() => new Map((preparacoes as any[]).map((p) => [p.id, p])), [preparacoes]);
  const itensPrep = useMemo(() => {
    const m = new Map<string, any[]>();
    (preparacaoItens as any[]).forEach((x) => m.set(x.preparacao_id, [...(m.get(x.preparacao_id) || []), x]));
    return m;
  }, [preparacaoItens]);

  const ingredientesEfetivos = (produtoId: string, tamanho: Tamanho) => {
    const receita = receitaPorProduto.get(produtoId);
    if (!receita) return [] as { id: string; gramas: number }[];
    const campo = `gramas_${tamanho}`;
    const out: { id: string; gramas: number }[] = [];
    (itensPorReceita.get(receita.id) || []).forEach((item) => {
      const g = n(item[campo]);
      if (g <= 0) return;
      if (item.ingrediente_id) out.push({ id: item.ingrediente_id, gramas: g });
      if (item.preparacao_id) {
        const prep = prepPorId.get(item.preparacao_id);
        const rendimento = n(prep?.rendimento_final_g);
        if (rendimento > 0) {
          (itensPrep.get(item.preparacao_id) || []).forEach((pi) => {
            if (pi.ingrediente_id) out.push({ id: pi.ingrediente_id, gramas: g * n(pi.quantidade) / rendimento });
          });
        }
      }
    });
    return out;
  };

  const classificarIngrediente = (id: string): "proteina" | "carboidrato" | null => {
    const ing = ingredientePorId.get(id);
    if (!ing) return null;
    const nome = normalizar(ing.nome);
    if (CHAVES_PROTEINA.some((x) => nome.includes(x))) return "proteina";
    if (CHAVES_CARBO.some((x) => nome.includes(x))) return "carboidrato";
    const p = n(ing.proteinas_100g), c = n(ing.carboidratos_100g);
    if (p >= 8 && p > c * 1.25) return "proteina";
    if (c >= 12 && c > p * 1.5) return "carboidrato";
    return null;
  };

  const perfilProduto = (produtoId: string, tamanho: Tamanho) => {
    const totais = new Map<string, number>();
    ingredientesEfetivos(produtoId, tamanho).forEach((x) => totais.set(x.id, n(totais.get(x.id)) + x.gramas));
    let proteina: { id: string; nome: string; gramas: number } | null = null;
    let carboidrato: { id: string; nome: string; gramas: number } | null = null;
    totais.forEach((gramas, id) => {
      const ing = ingredientePorId.get(id);
      if (!ing) return;
      const tipo = classificarIngrediente(id);
      if (tipo === "proteina" && (!proteina || gramas > proteina.gramas)) proteina = { id, nome: ing.nome, gramas };
      if (tipo === "carboidrato" && (!carboidrato || gramas > carboidrato.gramas)) carboidrato = { id, nome: ing.nome, gramas };
    });
    return { proteina, carboidrato };
  };

  const { data: historico = [] } = useQuery({
    queryKey: ["coz-sinergia-vendas", dataProducao],
    queryFn: async () => {
      const inicio = new Date(`${dataProducao}T00:00:00`);
      inicio.setDate(inicio.getDate() - 30);
      const { data } = await supabase
        .from("pedido_itens")
        .select("produto_id,quantidade,pedido_id,pedidos!inner(status,created_at,itens)")
        .gte("pedidos.created_at", inicio.toISOString())
        .lt("pedidos.created_at", `${dataProducao}T23:59:59`)
        .not("pedidos.status", "in", "(cancelado,cancelada)");
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const vendas30 = useMemo(() => {
    const m = new Map<string, number>();
    (historico as any[]).forEach((x) => m.set(x.produto_id, n(m.get(x.produto_id)) + n(x.quantidade)));
    return m;
  }, [historico]);

  const sugestoes = useMemo<Sugestao[]>(() => {
    const planejados = (producoes || []).filter((p) => p.status !== "cancelada");
    if (!planejados.length) return [];
    const proteinasBase = new Set<string>();
    const carbosBase = new Set<string>();
    planejados.forEach((p) => {
      const perfil = perfilProduto(p.produto_id, (p.gramatura || "400") as Tamanho);
      if (perfil.proteina) proteinasBase.add(perfil.proteina.id);
      if (perfil.carboidrato) carbosBase.add(perfil.carboidrato.id);
    });

    const planejadosIds = new Set(planejados.map((p) => p.produto_id));
    const result: Sugestao[] = [];
    produtos
      .filter((p) => ["marmita", "sopa", "complemento"].includes(p.tipo_produto || "marmita") && p.ativo !== false && !planejadosIds.has(p.id))
      .forEach((p) => {
        const tamanhosDoProduto = p.tipo_produto === "sopa" ? tamanhos.filter(({ id }) => id === "400") : tamanhos;
        tamanhosDoProduto.forEach(({ id: tamanho }) => {
          const perfil = perfilProduto(p.id, tamanho);
          const mesmaProteina = !!perfil.proteina && proteinasBase.has(perfil.proteina.id);
          const mesmoCarbo = !!perfil.carboidrato && carbosBase.has(perfil.carboidrato.id);
          if (!mesmaProteina && !mesmoCarbo) return;
          const nivel: "alta" | "media" = mesmaProteina && mesmoCarbo ? "alta" : "media";
          const estoqueRow = (estoqueMarmitas || []).find((e) => e.produto_id === p.id);
          const estoque = n(estoqueRow?.[`estoque_${tamanho}g`]);
          const mediaDia = n(vendas30.get(p.id)) / 30;
          const sugerida = Math.max(1, Math.ceil(mediaDia * 2 - estoque));
          const partes: string[] = [];
          if (mesmaProteina && perfil.proteina) partes.push(`mesma proteína: ${perfil.proteina.nome}`);
          if (mesmoCarbo && perfil.carboidrato) partes.push(`mesmo carboidrato: ${perfil.carboidrato.nome}`);
          result.push({ produto: p, tamanho, nivel, proteina: mesmaProteina ? perfil.proteina?.nome : undefined, carboidrato: mesmoCarbo ? perfil.carboidrato?.nome : undefined, motivo: `Aproveita ${partes.join(" e ")}.`, estoque, mediaDia, sugerida });
        });
      });
    return result;
  }, [producoes, produtos, receitas, receitaItens, ingredientes, estoqueMarmitas, vendas30, preparacoes, preparacaoItens]);

  const sugestoesAgrupadas = useMemo<SugestaoAgrupada[]>(() => {
    const mapa = new Map<string, SugestaoAgrupada>();
    sugestoes.forEach((s) => {
      const atual = mapa.get(s.produto.id) || { produto: s.produto, nivel: s.nivel, proteina: s.proteina, carboidrato: s.carboidrato, motivo: s.motivo, tamanhos: {} };
      atual.tamanhos[s.tamanho] = s;
      if (s.nivel === "alta") atual.nivel = "alta";
      if (!atual.proteina && s.proteina) atual.proteina = s.proteina;
      if (!atual.carboidrato && s.carboidrato) atual.carboidrato = s.carboidrato;
      const partes: string[] = [];
      if (atual.proteina) partes.push(`mesma proteína: ${atual.proteina}`);
      if (atual.carboidrato) partes.push(`mesmo carboidrato: ${atual.carboidrato}`);
      atual.motivo = `Aproveita ${partes.join(" e ")}.`;
      mapa.set(s.produto.id, atual);
    });
    return [...mapa.values()].sort((a, b) => {
      if (a.nivel !== b.nivel) return a.nivel === "alta" ? -1 : 1;
      const mediaA = Math.max(...Object.values(a.tamanhos).map((x) => n(x?.mediaDia)), 0);
      const mediaB = Math.max(...Object.values(b.tamanhos).map((x) => n(x?.mediaDia)), 0);
      return mediaB - mediaA;
    });
  }, [sugestoes]);

  async function adicionarSelecionada() {
    if (!selecionada) return;
    const tamanhosPermitidos = selecionada.produto?.tipo_produto === "sopa" ? tamanhos.filter(({ id }) => id === "400") : tamanhos;
    const escolhas = tamanhosPermitidos.map(({ id }) => ({ tamanho: id, quantidade: Math.max(0, Math.floor(n(quantidades[id]))) })).filter((x) => x.quantidade > 0);
    if (!escolhas.length) return toast.error("Informe ao menos uma quantidade.");
    setAdicionando(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      for (const escolha of escolhas) {
        const { data: existente } = await supabase
          .from("cozinha_producoes")
          .select("id,quantidade_planejada,status")
          .eq("data_producao", dataProducao)
          .eq("produto_id", selecionada.produto.id)
          .eq("gramatura", escolha.tamanho)
          .in("status", ["planejada", "em_preparo"])
          .maybeSingle();
        if (existente) {
          const { error } = await supabase.from("cozinha_producoes").update({ quantidade_planejada: n(existente.quantidade_planejada) + escolha.quantidade, updated_at: new Date().toISOString() }).eq("id", existente.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("cozinha_producoes").insert({ data_producao: dataProducao, produto_id: selecionada.produto.id, gramatura: escolha.tamanho, quantidade_planejada: escolha.quantidade, observacao: `Adicionada por sinergia ${selecionada.nivel}: ${selecionada.motivo}`, created_by: user.user?.id ?? null });
          if (error) throw error;
        }
      }
      await qc.invalidateQueries({ queryKey: ["coz-prod-dia", dataProducao] });
      toast.success(`${selecionada.produto.nome} adicionada à produção.`);
      setSelecionada(null);
      setQuantidades({ "200": "", "300": "", "400": "" });
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível adicionar à produção.");
    } finally {
      setAdicionando(false);
    }
  }

  if (!sugestoesAgrupadas.length) return null;

  return <>
    <div className="mb-5 overflow-hidden rounded-2xl border border-[#cfe3d5] bg-[#f2faf5]">
      <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} className="flex w-full items-center justify-between gap-4 p-4 text-left md:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#087443] text-white"><Sparkles size={20} /></div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-[#173a2d]">Sinergias de produção</h2><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#087443]">{sugestoesAgrupadas.length} sabor{sugestoesAgrupadas.length === 1 ? "" : "es"}</span></div>
            <p className="mt-1 text-sm text-[#62766b]">Alta = mesma proteína e mesmo carboidrato. Média = apenas um dos dois.</p>
          </div>
        </div>
        <ChevronDown size={22} className={`shrink-0 text-[#087443] transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>
      {aberto && <div className="border-t border-[#dbe7dd] p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{sugestoesAgrupadas.map((s) => <article key={s.produto.id} className="rounded-xl border border-[#dbe7dd] bg-white p-4">
          <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{s.produto.nome}</h3><div className="mt-1"><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${s.nivel === "alta" ? "bg-[#e0f2e7] text-[#087443]" : "bg-[#fff4d9] text-[#8b5a00]"}`}>Sinergia {s.nivel}</span></div></div><TrendingUp size={17} className="text-[#087443]" /></div>
          <p className="mt-3 text-sm text-[#52695f]">{s.motivo}</p>
          <div className="mt-4 flex justify-end"><button onClick={() => { setSelecionada(s); setQuantidades({ "200": "", "300": "", "400": "" }); }} className="inline-flex items-center gap-1.5 rounded-lg bg-[#087443] px-3 py-2 text-xs font-bold text-white"><ChefHat size={14}/>Adicionar</button></div>
        </article>)}</div>
      </div>}
    </div>

    {selecionada && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4" onClick={() => setSelecionada(null)}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#087443]">Adicionar por sinergia</p><h3 className="mt-1 text-xl font-black text-[#173a2d]">{selecionada.produto.nome}</h3><p className="mt-1 text-sm text-[#62766b]">Escolha quantas unidades produzir de cada tamanho.</p></div><button onClick={() => setSelecionada(null)} className="rounded-lg p-2 text-[#62766b] hover:bg-[#f3f6f3]"><X size={20}/></button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{(selecionada?.produto?.tipo_produto === "sopa" ? tamanhos.filter(({ id }) => id === "400") : tamanhos).map((t) => {
          const detalhe = selecionada.tamanhos[t.id];
          return <label key={t.id} className="rounded-xl border border-[#dbe7dd] bg-[#f7f9f6] p-3"><span className="text-sm font-black text-[#173a2d]">{t.label}</span><input type="number" min="0" step="1" value={quantidades[t.id]} onChange={(e) => setQuantidades((q) => ({ ...q, [t.id]: e.target.value }))} placeholder="0" className="mt-2 w-full rounded-lg border border-[#cbd8ce] bg-white p-2.5 text-sm outline-none focus:border-[#087443]"/><span className="mt-2 block text-[11px] text-[#62766b]">{detalhe ? `Estoque ${detalhe.estoque} un · média ${detalhe.mediaDia.toFixed(1)}/dia` : "Sem sugestão específica para este tamanho"}</span></label>;
        })}</div>
        <div className="mt-5 flex justify-end gap-2"><button onClick={() => setSelecionada(null)} className="rounded-xl border border-[#cbd8ce] bg-white px-4 py-2.5 text-sm font-bold text-[#52695f]">Cancelar</button><button onClick={adicionarSelecionada} disabled={adicionando} className="inline-flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{adicionando ? <Check size={16}/> : <ChefHat size={16}/>} {adicionando ? "Adicionando..." : "Adicionar à produção"}</button></div>
      </div>
    </div>}
  </>;
}

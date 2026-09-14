import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ChefHat, ChevronDown, ChevronUp, ClipboardList, LogOut, Package, Search, Utensils } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cozinha/fichas")({ component: FichasTecnicasPage, ssr: false });

type Tamanho = "200" | "300" | "400";
type Preparacao = { id?: string; nome: string; ingredientes?: string[]; passos?: string[]; codigo?: string };
type ReceitaItem = { ingrediente_id: string; preparacao_id?: string | null; gramas_200: number; gramas_300: number; gramas_400: number; ordem?: number; observacao?: string };
type MontagemItem = { nome: string; gramas_200?: number; gramas_300?: number; gramas_400?: number; observacao?: string; ordem?: number };
type PrepRow = { id: string; nome: string; modo_preparo?: string | null; rendimento_final_g?: number | null };
type PrepItem = { id: string; preparacao_id: string; ingrediente_id: string; quantidade?: number | null; quantidade_texto?: string | null; ordem?: number };

const input = "w-full rounded-xl border border-[#cbd8ce] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#087443]";
const n = (v: unknown) => Number(v || 0);
const fmt = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} g`;
const sizeField = (size: Tamanho) => `gramas_${size}` as const;

function FichasTecnicasPage() {
  const navigate = useNavigate();
  const [autorizado, setAutorizado] = useState(false);
  const [busca, setBusca] = useState("");
  const [tamanho, setTamanho] = useState<Tamanho>("300");
  const [selecionada, setSelecionada] = useState<any>(null);

  const [produtos, setProdutos] = useState<any[]>([]);
  const [receitas, setReceitas] = useState<any[]>([]);
  const [receitaItens, setReceitaItens] = useState<ReceitaItem[]>([]);
  const [montagens, setMontagens] = useState<MontagemItem[]>([]);
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [preparacoes, setPreparacoes] = useState<PrepRow[]>([]);
  const [prepItens, setPrepItens] = useState<PrepItem[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return navigate({ to: "/cozinha-login" as any, replace: true });
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).in("role", ["admin", "cozinha"]);
      if (!roles?.length) {
        await supabase.auth.signOut();
        return navigate({ to: "/cozinha-login" as any, replace: true });
      }
      setAutorizado(true);
      const [p, r, ri, m, i, pr, pi] = await Promise.all([
        supabase.from("produtos").select("id,nome,imagem_url,imagens,tipo_produto,ativo").order("nome"),
        supabase.from("cozinha_receitas").select("*"),
        supabase.from("cozinha_receita_itens").select("*", { count: "exact" }).order("ordem"),
        supabase.from("cozinha_receita_montagem_itens").select("*", { count: "exact" }).order("ordem"),
        supabase.from("cozinha_ingredientes").select("id,nome,unidade_medida,ativo").order("nome"),
        supabase.from("cozinha_preparacoes").select("id,nome,modo_preparo,rendimento_final_g").order("nome"),
        supabase.from("cozinha_preparacao_itens").select("*").order("ordem"),
      ]);
      const errors = [p.error, r.error, ri.error, m.error, i.error, pr.error, pi.error].filter(Boolean);
      if (errors.length) toast.error("Não foi possível carregar todas as fichas técnicas.");
      setProdutos(p.data || []);
      setReceitas(r.data || []);
      setReceitaItens(ri.data || []);
      setMontagens(m.data || []);
      setIngredientes(i.data || []);
      setPreparacoes(pr.data || []);
      setPrepItens(pi.data || []);
      setCarregando(false);
    })();
  }, [navigate]);

  const produtoPorId = useMemo(() => new Map(produtos.map((x) => [x.id, x])), [produtos]);
  const ingredientePorId = useMemo(() => new Map(ingredientes.map((x) => [x.id, x])), [ingredientes]);
  const preparacaoPorId = useMemo(() => new Map(preparacoes.map((x) => [x.id, x])), [preparacoes]);
  const itensPorReceita = useMemo(() => {
    const map = new Map<string, ReceitaItem[]>();
    receitaItens.forEach((x: any) => map.set(x.receita_id, [...(map.get(x.receita_id) || []), x]));
    return map;
  }, [receitaItens]);
  const montagemPorReceita = useMemo(() => {
    const map = new Map<string, MontagemItem[]>();
    montagens.forEach((x: any) => map.set(x.receita_id, [...(map.get(x.receita_id) || []), x]));
    return map;
  }, [montagens]);
  const prepItensPorPrep = useMemo(() => {
    const map = new Map<string, PrepItem[]>();
    prepItens.forEach((x: PrepItem) => map.set(x.preparacao_id, [...(map.get(x.preparacao_id) || []), x]));
    return map;
  }, [prepItens]);

  const fichas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return receitas
      .map((r: any) => ({ receita: r, produto: produtoPorId.get(r.produto_id) }))
      .filter((x) => x.produto && (!q || String(x.produto.nome).toLowerCase().includes(q) || String(x.produto.nome).toLowerCase().startsWith(q)))
      .sort((a, b) => String(a.produto.nome).localeCompare(String(b.produto.nome), "pt-BR"));
  }, [receitas, produtoPorId, busca]);

  if (!autorizado || carregando) return <div className="grid min-h-screen place-items-center bg-[#f7f6f0] text-[#173a2d]">Carregando fichas técnicas…</div>;

  return (
    <div className="min-h-screen bg-[#f7f6f0] text-[#173a2d]">
      <header className="sticky top-0 z-20 border-b border-[#dbe7dd] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#087443] text-white"><ChefHat size={21} /></div>
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6a8074]">Cozinha</p><h1 className="text-lg font-black">Fichas técnicas</h1></div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-[#cbd8ce] bg-white px-3 py-2 text-sm font-bold" onClick={() => navigate({ to: "/cozinha" as any })}>Voltar para cozinha</button>
            <button className="rounded-xl border border-[#cbd8ce] bg-white p-2" title="Sair" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/cozinha-login" as any }); }}><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-8">
        <section className="rounded-3xl border border-[#dbe7dd] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><div className="mb-1 flex items-center gap-2 text-[#087443]"><BookOpen size={18} /><span className="text-sm font-black">Receitas normalizadas</span></div><h2 className="text-2xl font-black">Ingrediente → preparação → montagem</h2><p className="mt-1 text-sm text-[#62766b]">Cada ficha mostra a separação por gramatura, as preparações e o passo a passo estruturado.</p></div>
            <div className="flex gap-2">{(["200", "300", "400"] as Tamanho[]).map((s) => <button key={s} onClick={() => setTamanho(s)} className={`rounded-xl px-4 py-2 text-sm font-black ${tamanho === s ? "bg-[#087443] text-white" : "border border-[#cbd8ce] bg-white"}`}>{s} g</button>)}</div>
          </div>
          <div className="relative mt-5 max-w-xl"><Search className="absolute left-3 top-3 text-[#799085]" size={18} /><input className={`${input} pl-10`} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou código…" /></div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {fichas.map(({ receita, produto }) => {
            const itens = itensPorReceita.get(receita.id) || [];
            const jsonPreps: Preparacao[] = Array.isArray(receita.preparacoes) ? receita.preparacoes : [];
            const ids = [...new Set([...jsonPreps.map(x => x.id).filter(Boolean) as string[], ...itens.map(x => x.preparacao_id).filter(Boolean) as string[]])];
            const preps = ids.map(id => preparacaoPorId.get(id)).filter(Boolean) as PrepRow[];
            const montagem = montagemPorReceita.get(receita.id) || [];
            const aberto = selecionada?.id === receita.id;
            return <article key={receita.id} className="overflow-hidden rounded-3xl border border-[#dbe7dd] bg-white shadow-sm">
              <button className="flex w-full items-start justify-between gap-4 p-5 text-left" onClick={() => setSelecionada(aberto ? null : receita)}>
                <div><div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#087443]"><ClipboardList size={15} />{String(produto.nome).split(" - ")[0]}</div><h3 className="text-lg font-black leading-tight">{produto.nome}</h3><p className="mt-1 text-xs text-[#708278]">{itens.length} ingredientes · {preps.length} preparações · {montagem.length} itens de montagem</p></div>
                {aberto ? <ChevronUp /> : <ChevronDown />}
              </button>
              {aberto && <FichaAberta receita={receita} itens={itens} preps={preps} montagem={montagem} ingredientePorId={ingredientePorId} prepItensPorPrep={prepItensPorPrep} tamanho={tamanho} jsonPreps={jsonPreps} />}
            </article>;
          })}
        </section>
        {!fichas.length && <div className="rounded-3xl border border-dashed border-[#b9cabe] bg-white p-10 text-center text-sm text-[#62766b]">Nenhuma ficha encontrada.</div>}
      </main>
    </div>
  );
}

function FichaAberta({ receita, itens, preps, montagem, ingredientePorId, prepItensPorPrep, tamanho, jsonPreps }: { receita: any; itens: ReceitaItem[]; preps: PrepRow[]; montagem: MontagemItem[]; ingredientePorId: Map<string, any>; prepItensPorPrep: Map<string, PrepItem[]>; tamanho: Tamanho; jsonPreps: Preparacao[] }) {
  const campo = sizeField(tamanho);
  return <div className="space-y-5 border-t border-[#e2ebe4] bg-[#fbfcfa] p-5">
    <section>
      <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-[#087443]">1. Ingredientes / separação — {tamanho} g</h4>
      <div className="overflow-hidden rounded-2xl border border-[#dbe7dd] bg-white">
        {itens.length ? itens.map((item, index) => {
          const nome = item.ingrediente_id ? ingredientePorId.get(item.ingrediente_id)?.nome : item.preparacao_id ? `Preparação: ${item.preparacao_id}` : "Ingrediente";
          return <div key={item.id || item.ingrediente_id + index} className="flex items-center justify-between gap-3 border-b border-[#edf2ee] px-4 py-3 last:border-0"><div><p className="font-bold">{nome}</p>{item.preparacao_id && <p className="text-xs font-semibold text-[#087443]">Entra como preparação pronta</p>}{item.observacao && <p className="text-xs text-[#708278]">{item.observacao}</p>}</div><strong className="whitespace-nowrap">{fmt(n((item as any)[campo]))}</strong></div>;
        }) : <div className="p-4 text-sm text-[#708278]">Os componentes desta ficha estão registrados nas preparações.</div>}
      </div>
    </section>

    <section>
      <div className="mb-3 flex items-center gap-2"><Utensils size={19} className="text-[#087443]"/><h4 className="text-sm font-black uppercase tracking-wider text-[#087443]">2. Preparações e passo a passo</h4></div>
      <div className="space-y-3">
        {preps.length ? preps.map((prep, index) => {
          const structuredItems = prepItensPorPrep.get(prep.id) || [];
          const json = jsonPreps.find(x => x.id === prep.id);
          const passos = String(prep.modo_preparo || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
          const ingredientesTexto = json?.ingredientes || [];
          return <div key={prep.id} className="rounded-2xl border border-[#dbe7dd] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><span className="mr-2 text-xs font-black text-[#087443]">{String(index + 1).padStart(2, "0")}</span><span className="font-black">{prep.nome.replace(/ • [A-Z]{2}\d{2}$/, "")}</span></div>{prep.rendimento_final_g ? <span className="rounded-full bg-[#edf7ef] px-2.5 py-1 text-xs font-bold text-[#087443]">Rende {q(prep.rendimento_final_g)} g</span> : null}</div>
            {(structuredItems.length || ingredientesTexto.length) > 0 && <div className="mt-3 rounded-xl bg-[#f4f8f4] p-3"><p className="mb-1 text-xs font-black uppercase tracking-wider text-[#6a8074]">Ingredientes da preparação</p>{structuredItems.length ? <div className="grid gap-1.5 sm:grid-cols-2">{structuredItems.map(x => <div key={x.id} className="flex justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"><span>{ingredientePorId.get(x.ingrediente_id)?.nome || "Ingrediente"}</span><b>{x.quantidade_texto || `${q(n(x.quantidade))} g`}</b></div>)}</div> : <ul className="list-disc space-y-1 pl-5 text-sm">{ingredientesTexto.map((x, i) => <li key={i}>{x}</li>)}</ul>}</div>}
            <div className="mt-3"><p className="mb-2 text-xs font-black uppercase tracking-wider text-[#6a8074]">Passo a passo</p>{passos.length ? <ol className="space-y-2">{passos.map((x, i) => <li key={i} className="flex gap-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e3f1e7] text-xs font-black text-[#087443]">{i + 1}</span><span className="pt-0.5">{x}</span></li>)}</ol> : <p className="text-sm text-[#708278]">Sem passo a passo cadastrado.</p>}</div>
          </div>;
        }) : <div className="rounded-2xl border border-dashed border-[#cbd8ce] p-4 text-sm text-[#708278]">Esta ficha ainda não possui uma preparação estruturada.</div>}
      </div>
    </section>

    <section>
      <div className="mb-3 flex items-center gap-2"><ClipboardList size={19} className="text-[#087443]"/><h4 className="text-sm font-black uppercase tracking-wider text-[#087443]">3. Montagem — {tamanho} g</h4></div>
      <div className="grid gap-2 sm:grid-cols-2">{montagem.map((x: any, index) => <div key={x.id || index} className="flex items-center justify-between rounded-2xl border border-[#dbe7dd] bg-white px-4 py-3"><div><span className="text-sm font-bold">{x.nome}</span>{x.observacao&&<p className="mt-1 text-xs text-[#708278]">{x.observacao}</p>}</div><span className="text-sm font-black">{n(x[`gramas_${tamanho}`]) ? fmt(n(x[`gramas_${tamanho}`])) : "QB"}</span></div>)}</div>
      {!montagem.length && <p className="rounded-xl bg-[#f4f7f4] p-4 text-sm text-[#62766b]">Nenhum componente de montagem cadastrado.</p>}
    </section>

    <section className="rounded-2xl border border-[#cfe1d3] bg-[#edf7ef] p-4 text-sm"><strong>Regra de produção:</strong> a gramatura selecionada representa uma unidade. Para um lote, multiplique cada quantidade pelo número de marmitas planejadas. Preparações são calculadas pelo rendimento da própria preparação quando a ficha estiver vinculada por `preparacao_id`.</section>
  </div>;
}

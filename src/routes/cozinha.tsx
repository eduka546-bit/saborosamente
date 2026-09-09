import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BookOpen,
  BarChart3,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  CookingPot,
  LogOut,
  Package,
  Pencil,
  Plus,
  Salad,
  Store,
  Trash2,
  X,
} from "lucide-react";

export const Route = createFileRoute("/cozinha")({ component: CozinhaPage, ssr: false });
type Aba = "producao" | "separar" | "ingredientes" | "marmitas" | "estoque" | "relatorio";
type Tamanho = "200" | "300" | "400" | "personalizada";
type ReceitaLinha = {
  ingrediente_id: string | null;
  preparacao_id: string | null;
  gramas_200: number;
  gramas_300: number;
  gramas_400: number;
  gramas_personalizada: number;
  rendimento_quebra: number;
  operacao_producao: "direto" | "acrescentar" | "dividir";
  fator_producao: number;
  observacao: string;
};
const TAMANHOS: { id: Tamanho; label: string }[] = [
  { id: "300", label: "300 g" },
  { id: "400", label: "400 g" },
  { id: "200", label: "200 g" },
];
const labelGramatura = (gramatura: string) =>
  gramatura === "personalizada"
    ? "Personalizada"
    : TAMANHOS.find((t) => t.id === gramatura)?.label || "400 g";
const hoje = () => new Date().toISOString().slice(0, 10);
const n = (v: unknown) => Number(v || 0);
const valor = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const input =
  "w-full rounded-lg border border-[#cbd8ce] bg-white p-2.5 text-sm outline-none focus:border-[#087443]";
const receitaVazia = (): ReceitaLinha => ({
  ingrediente_id: null,
  preparacao_id: null,
  gramas_200: 0,
  gramas_300: 0,
  gramas_400: 0,
  gramas_personalizada: 0,
  rendimento_quebra: 1,
  operacao_producao: "direto",
  fator_producao: 1,
  observacao: "",
});

function CozinhaPage() {
  const navigate = useNavigate(),
    qc = useQueryClient();
  const [ok, setOk] = useState(false),
    [aba, setAba] = useState<Aba>("producao"),
    [dataProducao, setDataProducao] = useState(hoje()),
    [filtroProducao, setFiltroProducao] = useState<"todos" | "planejada" | "em_preparo" | "concluida">("todos"),
    [buscaProducao, setBuscaProducao] = useState(""),
    [modal, setModal] = useState<null | "producao" | "ingrediente" | "receita" | "transferencia" | "ajuste-estoque">(
      null,
    );
  const [edit, setEdit] = useState<any>(null),
    [estoqueAba, setEstoqueAba] = useState<"loja" | "cozinha">("loja");
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return navigate({ to: "/cozinha-login" as any, replace: true });
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["admin", "cozinha"]);
      if (!data?.length) {
        await supabase.auth.signOut();
        return navigate({ to: "/cozinha-login" as any, replace: true });
      }
      setOk(true);
    })();
  }, [navigate]);
  const useTableQuery = (key: string, table: string, select = "*", order?: string) =>
    useQuery({
      queryKey: [key],
      enabled: ok,
      queryFn: async () => {
        let q: any = supabase.from(table).select(select);
        if (order) q = q.order(order);
        const { data, error } = await q;
        if (error) throw error;
        return data ?? [];
      },
    });
  const { data: produtos = [] } = useTableQuery(
    "coz-prod",
    "produtos",
    "id,nome,imagem_url,imagens,estoque_200g,estoque_300g,estoque_400g,ativo,tipo_produto",
    "nome",
  );
  const { data: ingredientes = [] } = useTableQuery("coz-ing", "cozinha_ingredientes", "*", "nome");
  const { data: preparacoes = [] } = useTableQuery("coz-prep", "cozinha_preparacoes", "*", "nome");
  const { data: preparacaoItens = [] } = useTableQuery(
    "coz-prep-itens",
    "cozinha_preparacao_itens",
    "*",
    "ordem",
  );
  const { data: receitas = [] } = useTableQuery("coz-rec", "cozinha_receitas", "*");
  const { data: receitaItens = [] } = useTableQuery(
    "coz-rec-itens",
    "cozinha_receita_itens",
    "*",
    "ordem",
  );
  const { data: estoque = [] } = useTableQuery(
    "coz-estoque",
    "cozinha_estoque",
    "*",
    "ingrediente",
  );
  const { data: estoqueMarmitas = [] } = useTableQuery(
    "coz-estoque-marmitas",
    "cozinha_estoque_marmitas",
    "*",
  );
  const { data: transferencias = [] } = useTableQuery("coz-transferencias", "cozinha_transferencias_estoque", "*", "created_at");
  const { data: movimentosIngredientes = [] } = useTableQuery("coz-movimentos-ingredientes", "cozinha_movimentacoes_ingredientes", "*", "created_at");
  const { data: producoes = [] } = useQuery({
    queryKey: ["coz-prod-dia", dataProducao],
    enabled: ok,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cozinha_producoes")
        .select("*")
        .eq("data_producao", dataProducao)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const marmitas = useMemo(
    () => (produtos as any[]).filter((p) => p.tipo_produto === "marmita" || !p.tipo_produto),
    [produtos],
  );
  const porId = (lista: any[]) => new Map(lista.map((x) => [x.id, x]));
  const produto = useMemo(() => porId(produtos as any[]), [produtos]),
    ing = useMemo(() => porId(ingredientes as any[]), [ingredientes]),
    prep = useMemo(() => porId(preparacoes as any[]), [preparacoes]),
    rec = useMemo(() => new Map((receitas as any[]).map((x) => [x.produto_id, x])), [receitas]);
  const agrupar = (linhas: any[], campo: string) => {
    const m = new Map<string, any[]>();
    linhas.forEach((x) => m.set(x[campo], [...(m.get(x[campo]) || []), x]));
    return m;
  };
  const itensPrep = useMemo(
      () => agrupar(preparacaoItens as any[], "preparacao_id"),
      [preparacaoItens],
    ),
    itensRec = useMemo(() => agrupar(receitaItens as any[], "receita_id"), [receitaItens]);
  const custoIng = (x: any) =>
    x?.unidade_medida === "un" ? n(x.custo_por_unidade) : n(x?.custo_por_kg) / 1000;
  const quantidadeCorreta = (gramas: number, linha: any) => {
    const fator = n(linha?.fator_producao || 1);
    if (linha?.operacao_producao === "acrescentar") return gramas * (1 + fator);
    if (linha?.operacao_producao === "dividir") return gramas / fator;
    return gramas;
  };
  const quantidadeComRendimento = (gramas: number, ingrediente: any) => {
    if (ingrediente?.tipo_rendimento === "perda")
      return gramas * (1 + n(ingrediente.quebra_percentual) / 100);
    if (ingrediente?.tipo_rendimento === "ganho")
      return gramas / n(ingrediente.fator_rendimento || 1);
    return gramas;
  };
  const custoPrep = (id: string) => {
    const p = prep.get(id);
    if (!p || !n(p.rendimento_final_g)) return 0;
    return (
      (itensPrep.get(id) || []).reduce(
        (s, l) =>
          s + n(l.quantidade) * n(ing.get(l.ingrediente_id)?.rendimento_padrao || 1) * custoIng(ing.get(l.ingrediente_id)),
        0,
      ) / n(p.rendimento_final_g)
    );
  };
  const separar = useMemo(() => {
    const mapa = new Map<string, { quantidade: number; pratos: string[] }>();
    const add = (id: string, q: number, nome: string) => {
      if (!ing.get(id)) return;
      const atual = mapa.get(id) || { quantidade: 0, pratos: [] };
      atual.quantidade += q;
      if (!atual.pratos.includes(nome)) atual.pratos.push(nome);
      mapa.set(id, atual);
    };
    (producoes as any[]).forEach((p) => {
      const prato = produto.get(p.produto_id),
        r = rec.get(p.produto_id);
      if (!prato || !r) return;
      const campo = `gramas_${p.gramatura || "400"}`;
      (itensRec.get(r.id) || []).forEach((l) => {
        const qtd = quantidadeCorreta(n(l[campo]), l) * n(p.quantidade_planejada);
        if (l.ingrediente_id) add(l.ingrediente_id, quantidadeComRendimento(qtd, ing.get(l.ingrediente_id)), prato.nome);
        if (l.preparacao_id) {
          const base = prep.get(l.preparacao_id);
          (itensPrep.get(l.preparacao_id) || []).forEach((x) =>
            add(
              x.ingrediente_id,
              quantidadeComRendimento((qtd / n(base?.rendimento_final_g)) * n(x.quantidade), ing.get(x.ingrediente_id)),
              prato.nome,
            ),
          );
        }
      });
    });
    return [...mapa]
      .map(([id, x]) => ({ id, ...x, item: ing.get(id) }))
      .sort((a, b) => a.item.nome.localeCompare(b.item.nome));
  }, [producoes, produto, rec, itensRec, prep, itensPrep, ing]);
  const alertasEstoquePlanejado = useMemo(
    () =>
      separar
        .filter((x) => {
          const saldo = (estoque as any[]).find((e) => e.ingrediente_id === x.id);
          return n(saldo?.quantidade_atual) < n(x.quantidade);
        })
        .map((x) => x.item.nome),
    [separar, estoque],
  );
  const producoesVisiveis = useMemo(
    () =>
      (producoes as any[]).filter((p) => {
        const nome = String(produto.get(p.produto_id)?.nome || "").toLowerCase();
        return (filtroProducao === "todos" || p.status === filtroProducao) &&
          (!buscaProducao.trim() || nome.includes(buscaProducao.trim().toLowerCase()));
      }),
    [producoes, produto, filtroProducao, buscaProducao],
  );
  const estoqueMarmitasPorProduto = useMemo(
    () => porId(estoqueMarmitas as any[]),
    [estoqueMarmitas],
  );
  const invalidar = (...keys: string[]) =>
    Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey: [queryKey] })));
  if (!ok)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f6f0]">Verificando acesso…</div>
    );
  const abas: { id: Aba; label: string; icon: any }[] = [
    { id: "producao", label: "Produção", icon: ClipboardList },
    { id: "separar", label: "Separar hoje", icon: Salad },
    { id: "ingredientes", label: "Ingredientes", icon: Package },
    { id: "marmitas", label: "Marmitas", icon: BookOpen },
    { id: "estoque", label: "Estoque", icon: Store },
    { id: "relatorio", label: "Relatórios", icon: BarChart3 },
  ];
  const abrir = (tipo: any, item?: any) => {
    setEdit(item || null);
    setModal(tipo);
  };
  return (
    <div className="min-h-screen bg-[#f7f6f0] text-[#173a2d]">
      <header className="sticky top-0 z-10 border-b border-[#dbe7dd] bg-white/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#087443] text-white">
              <ChefHat size={22} />
            </div>
            <div>
              <h1 className="font-black">Cozinha Saborosa</h1>
              <p className="text-xs text-[#62766b]">Produção e fichas técnicas</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/cozinha-login" as any });
            }}
            className="flex items-center gap-2 text-sm font-semibold text-[#587066]"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl md:grid-cols-[220px_1fr]">
        <aside className="border-b bg-white p-3 md:min-h-[calc(100vh-65px)] md:border-b-0 md:border-r">
          {abas.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${aba === id ? "bg-[#e0f2e7] text-[#087443]" : "text-[#52695f] hover:bg-[#f3f6f3]"}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </aside>
        <main className="p-4 md:p-8">
          {aba === "producao" && (
            <section>
              <Titulo
                titulo="Produção"
                texto="Planeje, acompanhe e corrija a produção de qualquer dia."
                acao={
                  <Botao onClick={() => abrir("producao")}>
                    <Plus size={18} />
                    Adicionar produção
                  </Botao>
                }
              />
              <div className="mb-5 grid gap-3 rounded-2xl border border-[#dbe7dd] bg-white p-4 lg:grid-cols-[185px_1fr_auto]">
                <Campo label="Dia da produção"><input className={input} type="date" value={dataProducao} onChange={(e) => setDataProducao(e.target.value)} /></Campo>
                <Campo label="Buscar marmita"><input className={input} value={buscaProducao} onChange={(e) => setBuscaProducao(e.target.value)} placeholder="Ex.: frango, lasanha..." /></Campo>
                <Campo label="Status"><select className={input} value={filtroProducao} onChange={(e) => setFiltroProducao(e.target.value as typeof filtroProducao)}><option value="todos">Todos os status</option><option value="planejada">Planejadas</option><option value="em_preparo">Em preparo</option><option value="concluida">Produzidas</option></select></Campo>
              </div>
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                {[["Planejadas", (producoes as any[]).filter((p) => p.status === "planejada").length, "bg-[#fff4d9] text-[#8b5a00]"], ["Em preparo", (producoes as any[]).filter((p) => p.status === "em_preparo").length, "bg-[#e8f1ff] text-[#175da8]"], ["Produzidas", (producoes as any[]).filter((p) => p.status === "concluida").length, "bg-[#e0f2e7] text-[#087443]"]].map(([label, quantidade, cor]) => <article key={String(label)} className={`rounded-xl p-3 ${cor}`}><p className="text-xs font-bold">{label}</p><p className="text-2xl font-black">{quantidade}</p></article>)}
              </div>
              {!(producoesVisiveis as any[]).length ? (
                <Vazio texto="Nenhuma produção encontrada para estes filtros." />
              ) : (
                <div className="grid gap-3">
                  {(producoesVisiveis as any[]).map((p) => {
                    const pr = produto.get(p.produto_id);
                    return (
                      <article
                        key={p.id}
                        className="flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-4"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold">{pr?.nome}</h3>
                          <p className="text-sm text-[#62766b]">
                            {p.quantidade_planejada} unidades ·{" "}
                            {labelGramatura(p.gramatura)}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#e0f2e7] px-3 py-1 text-xs font-bold text-[#087443]">
                          {p.status === "concluida"
                            ? "Concluída"
                            : p.status === "em_preparo"
                              ? "Em preparo"
                              : "Planejada"}
                        </span>
                        {p.status === "planejada" && (
                          <Botao
                            leve
                            onClick={async () => {
                              const { error } = await supabase
                                .from("cozinha_producoes")
                                .update({
                                  status: "em_preparo",
                                  updated_at: new Date().toISOString(),
                                })
                                .eq("id", p.id);
                              if (error) toast.error(error.message);
                              else invalidar("coz-prod-dia");
                            }}
                          >
                            Começar preparo
                          </Botao>
                        )}
                        {p.status !== "concluida" && (
                          <Botao
                            onClick={async () => {
                              if (alertasEstoquePlanejado.length) {
                                toast.warning(
                                  `Atenção: estoque insuficiente para ${alertasEstoquePlanejado.join(", ")}. A produção será registrada mesmo assim.`,
                                );
                              }
                              const { error } = await supabase.rpc("concluir_producao_cozinha", {
                                p_producao_id: p.id,
                              } as any);
                              if (error) toast.error(error.message);
                              else {
                                invalidar("coz-prod-dia", "coz-estoque-marmitas");
                                toast.success("Produção concluída e adicionada ao estoque da cozinha.");
                              }
                            }}
                          >
                            <CheckCircle2 size={16} />
                            Marcar como produzida
                          </Botao>
                        )}
                        {p.status === "concluida" && <Botao leve onClick={async () => {
                          const { error } = await supabase.rpc("reverter_conclusao_producao_cozinha", { p_producao_id: p.id } as any);
                          if (error) toast.error(error.message); else { invalidar("coz-prod-dia", "coz-estoque-marmitas"); toast.success("Produção voltou para planejada e o saldo da cozinha foi corrigido."); }
                        }}>Marcar como pendente</Botao>}
                        <button aria-label={`Excluir ${pr?.nome || "produção"}`} onClick={async () => {
                          if (!window.confirm(`Excluir o lançamento de ${pr?.nome || "produção"}?`)) return;
                          if (p.status === "concluida") return toast.error("Antes de excluir, marque esta produção como pendente para corrigir o estoque.");
                          const { error } = await supabase.from("cozinha_producoes").delete().eq("id", p.id);
                          if (error) toast.error(error.message); else { invalidar("coz-prod-dia"); toast.success("Lançamento excluído."); }
                        }} className="rounded-xl p-2.5 text-red-600 hover:bg-red-50"><Trash2 size={18} /></button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
          {aba === "separar" && (
            <section>
              <Titulo
                titulo="Separar e preparar hoje"
                texto="Totais calculados conforme as fichas técnicas e a produção planejada."
              />
              <div className="grid gap-3 md:grid-cols-2">
                {!separar.length ? (
                  <Vazio texto="Adicione produção e cadastre fichas técnicas para gerar a lista." />
                ) : (
                  separar.map((x) => (
                    <article key={x.id} className="rounded-2xl border bg-white p-4">
                      <h3 className="font-bold">{x.item.nome}</h3>
                      <p className="mt-2 text-2xl font-black text-[#087443]">
                        {x.item.unidade_medida === "un"
                          ? `${x.quantidade.toLocaleString("pt-BR")} un`
                          : `${(x.quantidade / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg`}
                      </p>
                      <p className="mt-2 text-xs text-[#62766b]">
                        Usado em: {x.pratos.join(" · ")}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
          {aba === "ingredientes" && (
            <section>
              <Titulo
                titulo="Ingredientes"
                texto="Cadastre cada item uma vez, com último valor pago, custo e rendimento."
                acao={
                  <Botao onClick={() => abrir("ingrediente")}>
                    <Plus size={18} />
                    Novo ingrediente
                  </Botao>
                }
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {!(ingredientes as any[]).length ? (
                  <Vazio texto="Cadastre o primeiro ingrediente para começar." />
                ) : (
                  (ingredientes as any[]).map((x) => (
                    <article key={x.id} className="rounded-2xl border bg-white p-4">
                      <div className="flex justify-between">
                        <h3 className="font-bold">{x.nome}</h3>
                        <button onClick={() => abrir("ingrediente", x)} className="text-[#087443]">
                          <Pencil size={17} />
                        </button>
                      </div>
                      <p className="mt-3 font-bold text-[#087443]">
                        {x.unidade_medida === "un"
                          ? `${valor(n(x.custo_por_unidade))}/un`
                          : `${valor(n(x.custo_por_kg))}/kg`}
                      </p>
                      <p className="mt-1 text-xs text-[#62766b]">
                        Último pago:{" "}
                        {x.ultimo_valor_pago == null ? "—" : valor(n(x.ultimo_valor_pago))} ·
                        {x.tipo_rendimento === "perda"
                          ? `Perda: ${n(x.quebra_percentual)}%`
                          : x.tipo_rendimento === "ganho"
                            ? `Ganho: ×${n(x.fator_rendimento)}`
                            : "Sem perda ou ganho"}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
          {aba === "preparacoes" && (
            <section>
              <Titulo
                titulo="Preparações"
                texto="Molhos, purês e bases prontas. A marmita usa somente a quantidade pronta."
                acao={
                  <Botao onClick={() => abrir("preparacao")}>
                    <Plus size={18} />
                    Nova preparação
                  </Botao>
                }
              />
              <div className="grid gap-4 lg:grid-cols-2">
                {!(preparacoes as any[]).length ? (
                  <Vazio texto="Cadastre um molho ou outra preparação pronta." />
                ) : (
                  (preparacoes as any[]).map((x) => (
                    <article key={x.id} className="rounded-2xl border bg-white p-5">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-bold">{x.nome}</h3>
                          <p className="mt-1 text-sm text-[#087443]">
                            Rendimento: {n(x.rendimento_final_g)} g ·{" "}
                            {valor(custoPrep(x.id) * 1000)}/kg
                          </p>
                        </div>
                        <button onClick={() => abrir("preparacao", x)} className="text-[#087443]">
                          <Pencil size={17} />
                        </button>
                      </div>
                      <p className="mt-3 text-xs text-[#62766b]">
                        {(itensPrep.get(x.id) || [])
                          .map((l) => ing.get(l.ingrediente_id)?.nome)
                          .filter(Boolean)
                          .join(" · ") || "Sem ingredientes cadastrados"}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
          {aba === "marmitas" && (
            <section>
              <Titulo
                titulo="Marmitas e fichas técnicas"
                texto="Escolha o sabor, veja a foto e informe as gramas de cada componente por tamanho."
              />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {marmitas.map((x: any) => {
                  const r = rec.get(x.id),
                    quantidade = (itensRec.get(r?.id) || []).length;
                  return (
                    <article key={x.id} className="overflow-hidden rounded-2xl border bg-white">
                      <div className="h-36 bg-[#e9f1e8]">
                        {x.imagem_url || x.imagens?.[0] ? (
                          <img
                            src={x.imagem_url || x.imagens?.[0]}
                            className="size-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="grid size-full place-items-center text-[#087443]">
                            <ChefHat />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold">{x.nome}</h3>
                        <p className="mt-1 text-xs text-[#62766b]">
                          {quantidade
                            ? `${quantidade} componente(s) cadastrado(s)`
                            : "Ficha técnica ainda não cadastrada"}
                        </p>
                        <div className="mt-3">
                          <Botao leve onClick={() => abrir("receita", x)}>
                            <Pencil size={16} />
                            {quantidade ? "Editar ficha" : "Cadastrar ficha"}
                          </Botao>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          {aba === "estoque" && (
            <section>
              <Titulo
                titulo="Estoque geral"
                texto="Saldo de marmitas prontas e ingredientes da cozinha."
              />
              <div className="mb-5 inline-flex rounded-xl bg-[#e7eee8] p-1">
                <button
                  onClick={() => setEstoqueAba("loja")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${estoqueAba === "loja" ? "bg-white text-[#087443]" : "text-[#62766b]"}`}
                >
                  Loja
                </button>
                <button
                  onClick={() => setEstoqueAba("cozinha")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${estoqueAba === "cozinha" ? "bg-white text-[#087443]" : "text-[#62766b]"}`}
                >
                  Cozinha
                </button>
              </div>
              {estoqueAba === "loja" ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {marmitas.map((x: any) => (
                    <article key={x.id} className="rounded-2xl border bg-white p-4">
                      <h3 className="font-bold">{x.nome}</h3>
                      <p className="mt-3 text-sm">
                        {x.estoque_200g || 0} · 200g &nbsp; {x.estoque_300g || 0} · 300g &nbsp;{" "}
                        {x.estoque_400g || 0} · 400g
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6">
                  <div>
                    <h3 className="mb-1 text-lg font-black">Marmitas prontas na cozinha</h3>
                    <p className="mb-3 text-sm text-[#62766b]">Transfira daqui para somar automaticamente no estoque da loja.</p>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {marmitas.map((x: any) => {
                        const saldo = estoqueMarmitasPorProduto.get(x.id);
                        return <article key={x.id} className="rounded-2xl border bg-white p-4">
                          <h4 className="font-bold">{x.nome}</h4>
                          <p className="mt-2 text-sm text-[#62766b]">{saldo?.estoque_200g || 0} · 200 g &nbsp; {saldo?.estoque_300g || 0} · 300 g &nbsp; {saldo?.estoque_400g || 0} · 400 g</p>
                          <div className="mt-3"><Botao leve onClick={() => abrir("transferencia", x)}>Transferir para loja</Botao></div>
                        </article>;
                      })}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-black">Ingredientes da cozinha</h3>
                    {(estoque as any[]).filter((x) => n(x.quantidade_atual) <= n(x.quantidade_minima)).length > 0 && <p className="mb-3 rounded-xl bg-[#fff4d9] px-3 py-2 text-sm font-bold text-[#8b5a00]">{(estoque as any[]).filter((x) => n(x.quantidade_atual) <= n(x.quantidade_minima)).length} ingrediente(s) no estoque mínimo ou abaixo.</p>}
                    <div className="grid gap-3 md:grid-cols-2">
                      {(estoque as any[]).map((x) => (
                        <article key={x.id} className="rounded-2xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-bold">{x.ingrediente}</h4><p className={`mt-2 font-black ${n(x.quantidade_atual) <= n(x.quantidade_minima) ? "text-[#b45309]" : "text-[#087443]"}`}>{x.quantidade_atual} {x.unidade}</p><p className="text-xs text-[#62766b]">Mínimo: {x.quantidade_minima} {x.unidade}</p></div><Botao leve onClick={() => abrir("ajuste-estoque", x)}>Ajustar</Botao></div></article>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
          {aba === "relatorio" && (
            <section>
              <Titulo titulo="Relatório diário" texto="Acompanhe a produção, transferências e consumo do dia selecionado." />
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <article className="rounded-2xl bg-[#e0f2e7] p-4"><p className="text-xs font-bold">Produzidas</p><p className="mt-1 text-2xl font-black">{(producoes as any[]).filter((p) => p.status === "concluida").reduce((s, p) => s + n(p.quantidade_produzida), 0)}</p></article>
                <article className="rounded-2xl bg-[#e8f1ff] p-4"><p className="text-xs font-bold">Transferidas para a loja</p><p className="mt-1 text-2xl font-black">{(transferencias as any[]).filter((t) => String(t.created_at).slice(0,10) === dataProducao).reduce((s, t) => s + n(t.quantidade), 0)}</p></article>
                <article className="rounded-2xl bg-[#fff4d9] p-4"><p className="text-xs font-bold">Alertas de ingrediente</p><p className="mt-1 text-2xl font-black">{(estoque as any[]).filter((x) => n(x.quantidade_atual) <= n(x.quantidade_minima)).length}</p></article>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border bg-white p-4"><h3 className="font-black">Transferências para a loja</h3><div className="mt-3 grid gap-2">{(transferencias as any[]).filter((t) => String(t.created_at).slice(0,10) === dataProducao).length ? (transferencias as any[]).filter((t) => String(t.created_at).slice(0,10) === dataProducao).map((t) => <div key={t.id} className="flex justify-between rounded-xl bg-[#f4f7f4] p-3 text-sm"><span>{produto.get(t.produto_id)?.nome || "Marmita"} · {labelGramatura(t.tamanho)}</span><b>{t.quantidade} un</b></div>) : <p className="text-sm text-[#62766b]">Nenhuma transferência neste dia.</p>}</div></div>
                <div className="rounded-2xl border bg-white p-4"><h3 className="font-black">Últimos consumos de ingredientes</h3><div className="mt-3 grid gap-2">{(movimentosIngredientes as any[]).filter((m) => m.tipo === "consumo_producao" && String(m.created_at).slice(0,10) === dataProducao).length ? (movimentosIngredientes as any[]).filter((m) => m.tipo === "consumo_producao" && String(m.created_at).slice(0,10) === dataProducao).map((m) => <div key={m.id} className="flex justify-between rounded-xl bg-[#f4f7f4] p-3 text-sm"><span>{ing.get(m.ingrediente_id)?.nome || "Ingrediente"}</span><b>{Math.abs(n(m.quantidade)).toLocaleString("pt-BR")} g</b></div>) : <p className="text-sm text-[#62766b]">Nenhum consumo registrado neste dia.</p>}</div></div>
              </div>
            </section>
          )}
        </main>
      </div>
      {modal === "producao" && (
        <ProducaoModal
          marmitas={marmitas}
          dataInicial={dataProducao}
          fechar={() => setModal(null)}
          salvar={async (produtoId: string, data: string, qs: any, observacao: string) => {
            if (!produtoId) return toast.error("Escolha a marmita.");
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const linhas = TAMANHOS.filter((t) => n(qs[t.id]) > 0).map((t) => ({
              data_producao: data,
              produto_id: produtoId,
              gramatura: t.id,
              quantidade_planejada: n(qs[t.id]),
              observacao: observacao || null,
              created_by: user?.id,
            }));
            if (!linhas.length) return toast.error("Informe ao menos uma quantidade.");
            const { error } = await supabase.from("cozinha_producoes").insert(linhas);
            if (error) toast.error(error.message);
            else {
              invalidar("coz-prod-dia");
              setModal(null);
              toast.success("Produção adicionada.");
            }
          }}
        />
      )}
      {modal === "transferencia" && (
        <TransferenciaEstoqueModal
          produto={edit}
          saldo={estoqueMarmitasPorProduto.get(edit?.id)}
          fechar={() => setModal(null)}
          salvar={async (tamanho: string, quantidade: number) => {
            const { error } = await supabase.rpc("transferir_cozinha_para_loja", {
              p_produto_id: edit.id,
              p_tamanho: tamanho,
              p_quantidade: quantidade,
            } as any);
            if (error) return toast.error(error.message);
            invalidar("coz-estoque-marmitas", "coz-prod");
            setModal(null);
            toast.success("Transferência concluída. Estoque da loja atualizado.");
          }}
        />
      )}
      {modal === "ajuste-estoque" && <AjusteEstoqueModal item={edit} fechar={() => setModal(null)} salvar={async (quantidade: number, minimo: number, observacao: string) => {
        const { error } = await supabase.rpc("ajustar_estoque_ingrediente", { p_ingrediente_id: edit.ingrediente_id, p_quantidade: quantidade, p_minimo: minimo, p_observacao: observacao || null } as any);
        if (error) return toast.error(error.message);
        invalidar("coz-estoque", "coz-movimentos-ingredientes"); setModal(null); toast.success("Estoque do ingrediente atualizado.");
      }} />}
      {modal === "ingrediente" && (
        <IngredienteModal
          item={edit}
          fechar={() => setModal(null)}
          salvar={async (d: any) => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const payload = { ...d, updated_by: user?.id, updated_at: new Date().toISOString() };
            const { error } = edit?.id
              ? await supabase.from("cozinha_ingredientes").update(payload).eq("id", edit.id)
              : await supabase.from("cozinha_ingredientes").insert(payload);
            if (error) toast.error(error.message);
            else {
              invalidar("coz-ing");
              setModal(null);
              toast.success("Ingrediente salvo.");
            }
          }}
        />
      )}
      {modal === "preparacao" && (
        <PreparacaoModal
          item={edit}
          ingredientes={ingredientes as any[]}
          linhasIniciais={itensPrep.get(edit?.id) || []}
          fechar={() => setModal(null)}
          salvar={async (d: any, linhas: any[]) => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const payload = { ...d, updated_by: user?.id, updated_at: new Date().toISOString() };
            const { data, error } = edit?.id
              ? await supabase
                  .from("cozinha_preparacoes")
                  .update(payload)
                  .eq("id", edit.id)
                  .select()
                  .single()
              : await supabase.from("cozinha_preparacoes").insert(payload).select().single();
            if (error || !data) return toast.error(error?.message || "Erro ao salvar.");
            await supabase.from("cozinha_preparacao_itens").delete().eq("preparacao_id", data.id);
            const validas = linhas.filter((x) => x.ingrediente_id);
            if (validas.length) {
              const { error: e } = await supabase
                .from("cozinha_preparacao_itens")
                .insert(validas.map((x, i) => ({ ...x, preparacao_id: data.id, ordem: i })));
              if (e) return toast.error(e.message);
            }
            invalidar("coz-prep", "coz-prep-itens");
            setModal(null);
            toast.success("Preparação salva.");
          }}
        />
      )}
      {modal === "receita" && (
        <ReceitaModal
          produto={edit}
          receita={rec.get(edit?.id)}
          linhasIniciais={itensRec.get(rec.get(edit?.id)?.id) || []}
          ingredientes={ingredientes as any[]}
          preparacoes={preparacoes as any[]}
          custoIng={custoIng}
          custoPrep={custoPrep}
          criarIngrediente={async (nome: string, custoPorKg: number, rendimento: number) => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const { data, error } = await supabase
              .from("cozinha_ingredientes")
              .insert({
                nome: nome.trim(),
                unidade_medida: "g",
                custo_por_kg: custoPorKg,
                rendimento_padrao: rendimento,
                updated_by: user?.id,
              })
              .select()
              .single();
            if (error || !data) {
              toast.error(error?.message || "Não foi possível criar o ingrediente.");
              return null;
            }
            await invalidar("coz-ing");
            return data;
          }}
          fechar={() => setModal(null)}
          salvar={async (modo: string, linhas: any[]) => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const { data, error } = await supabase
              .from("cozinha_receitas")
              .upsert(
                {
                  produto_id: edit.id,
                  ingredientes: [],
                  modo_preparo: modo || null,
                  updated_by: user?.id,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "produto_id" },
              )
              .select()
              .single();
            if (error || !data) return toast.error(error?.message || "Erro ao salvar.");
            await supabase.from("cozinha_receita_itens").delete().eq("receita_id", data.id);
            const validas = linhas.filter((x) => x.ingrediente_id || x.preparacao_id);
            if (validas.length) {
              const { error: e } = await supabase
                .from("cozinha_receita_itens")
                .insert(validas.map((x, i) => ({ ...x, receita_id: data.id, ordem: i })));
              if (e) return toast.error(e.message);
            }
            invalidar("coz-rec", "coz-rec-itens");
            setModal(null);
            toast.success("Ficha técnica salva.");
          }}
        />
      )}
    </div>
  );
}
function Titulo({ titulo, texto, acao }: any) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-3xl font-black">{titulo}</h2>
        <p className="mt-1 text-sm text-[#62766b]">{texto}</p>
      </div>
      {acao}
    </div>
  );
}
function Vazio({ texto }: any) {
  return (
    <div className="rounded-2xl border border-dashed border-[#bed2c4] bg-white p-10 text-center text-sm text-[#62766b]">
      {texto}
    </div>
  );
}
function Botao({ children, onClick, leve = false }: any) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${leve ? "border border-[#bcd8c5] bg-white text-[#087443]" : "bg-[#087443] text-white"}`}
    >
      {children}
    </button>
  );
}
function Janela({ titulo, fechar, children }: any) {
  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-black/45 p-4">
      <div className="mx-auto my-4 w-full max-w-6xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex justify-between">
          <h3 className="text-xl font-black">{titulo}</h3>
          <button onClick={fechar}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Campo({ label, children }: any) {
  return (
    <label className="block text-sm font-bold text-[#355445]">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
function ProducaoModal({ marmitas, dataInicial, fechar, salvar }: any) {
  const [produto, setProduto] = useState(""),
    [data, setData] = useState(dataInicial || hoje()),
    [q, setQ] = useState<any>({}),
    [obs, setObs] = useState("");
  return (
    <Janela titulo="Adicionar à produção" fechar={fechar}>
      <div className="grid gap-4">
        <Campo label="Dia da produção">
          <input className={input} type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>
        <Campo label="Marmita">
          <select className={input} value={produto} onChange={(e) => setProduto(e.target.value)}>
            <option value="">Selecione o sabor</option>
            {marmitas.map((x: any) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid gap-3 sm:grid-cols-4">
          {TAMANHOS.map((t) => (
            <Campo key={t.id} label={t.label}>
              <input
                className={input}
                min="0"
                type="number"
                value={q[t.id] || ""}
                onChange={(e) => setQ({ ...q, [t.id]: e.target.value })}
              />
            </Campo>
          ))}
        </div>
        <Campo label="Observação">
          <input
            className={input}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Opcional"
          />
        </Campo>
        <Botao onClick={() => salvar(produto, data, q, obs)}>Adicionar produção</Botao>
      </div>
    </Janela>
  );
}
function TransferenciaEstoqueModal({ produto, saldo, fechar, salvar }: any) {
  const [tamanho, setTamanho] = useState<"200" | "300" | "400">("300");
  const [quantidade, setQuantidade] = useState("");
  const disponivel = n(saldo?.[`estoque_${tamanho}g`]);
  return (
    <Janela titulo={`Transferir para loja — ${produto?.nome || "Marmita"}`} fechar={fechar}>
      <div className="grid gap-4">
        <p className="text-sm text-[#62766b]">A quantidade sairá da cozinha e será adicionada automaticamente ao estoque da loja.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Tamanho"><select className={input} value={tamanho} onChange={(e) => setTamanho(e.target.value as typeof tamanho)}><option value="200">200 g</option><option value="300">300 g</option><option value="400">400 g</option></select></Campo>
          <Campo label={`Quantidade disponível: ${disponivel}`}><input className={input} type="number" min="1" max={disponivel} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="0" /></Campo>
        </div>
        <Botao onClick={() => {
          const qtd = n(quantidade);
          if (!qtd || qtd > disponivel) return toast.error("Informe uma quantidade disponível na cozinha.");
          salvar(tamanho, qtd);
        }}>Transferir para loja</Botao>
      </div>
    </Janela>
  );
}
function AjusteEstoqueModal({ item, fechar, salvar }: any) {
  const [quantidade, setQuantidade] = useState(String(item?.quantidade_atual ?? 0));
  const [minimo, setMinimo] = useState(String(item?.quantidade_minima ?? 0));
  const [observacao, setObservacao] = useState("");
  return <Janela titulo={`Ajustar estoque — ${item?.ingrediente || "Ingrediente"}`} fechar={fechar}>
    <div className="grid gap-4">
      <p className="text-sm text-[#62766b]">Informe o saldo atual contado e o mínimo para receber alerta.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label={`Saldo atual (${item?.unidade || "g"})`}><input className={input} type="number" min="0" step="0.001" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} /></Campo>
        <Campo label={`Estoque mínimo (${item?.unidade || "g"})`}><input className={input} type="number" min="0" step="0.001" value={minimo} onChange={(e) => setMinimo(e.target.value)} /></Campo>
      </div>
      <Campo label="Observação"><input className={input} value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: conferência de estoque" /></Campo>
      <Botao onClick={() => salvar(n(quantidade), n(minimo), observacao)}>Salvar ajuste</Botao>
    </div>
  </Janela>;
}
function IngredienteModal({ item, fechar, salvar }: any) {
  const [d, setD] = useState<any>({
    nome: item?.nome || "",
    unidade_medida: item?.unidade_medida || "g",
    rendimento_padrao: String(item?.rendimento_padrao ?? 1),
    tipo_rendimento: item?.tipo_rendimento || "nenhum",
    quebra_percentual: String(item?.quebra_percentual ?? 0),
    fator_rendimento: String(item?.fator_rendimento ?? 1),
    custo_por_kg: String(item?.custo_por_kg ?? 0),
    custo_por_unidade: String(item?.custo_por_unidade ?? 0),
    ultimo_valor_pago: item?.ultimo_valor_pago == null ? "" : String(item.ultimo_valor_pago),
    observacao: item?.observacao || "",
  });
  const set = (k: string, v: string) => setD({ ...d, [k]: v });
  return (
    <Janela titulo={item ? "Editar ingrediente" : "Novo ingrediente"} fechar={fechar}>
      <div className="grid gap-4 md:grid-cols-2">
        <Campo label="Nome">
          <input
            autoFocus
            className={input}
            value={d.nome}
            onChange={(e) => set("nome", e.target.value)}
          />
        </Campo>
        <Campo label="Medida">
          <select
            className={input}
            value={d.unidade_medida}
            onChange={(e) => set("unidade_medida", e.target.value)}
          >
            <option value="g">Gramas</option>
            <option value="un">Unidade</option>
          </select>
        </Campo>
        <Campo label="Perda ou ganho">
          <select className={input} value={d.tipo_rendimento} onChange={(e) => set("tipo_rendimento", e.target.value)}>
            <option value="nenhum">Sem perda ou ganho</option>
            <option value="perda">Perda percentual</option>
            <option value="ganho">Ganho por multiplicador</option>
          </select>
        </Campo>
        {d.tipo_rendimento === "perda" && <Campo label="Perda (%)">
          <input className={input} type="number" min="0" step="0.01" value={d.quebra_percentual} onChange={(e) => set("quebra_percentual", e.target.value)} />
        </Campo>}
        {d.tipo_rendimento === "ganho" && <Campo label="Ganho (×)">
          <input className={input} type="number" min="0.01" step="0.01" value={d.fator_rendimento} onChange={(e) => set("fator_rendimento", e.target.value)} />
        </Campo>}
        <Campo label="Último valor pago">
          <input
            className={input}
            type="number"
            step="0.01"
            value={d.ultimo_valor_pago}
            onChange={(e) => set("ultimo_valor_pago", e.target.value)}
          />
        </Campo>
        <Campo label={d.unidade_medida === "g" ? "Custo por kg" : "Custo por unidade"}>
          <input
            className={input}
            type="number"
            step="0.01"
            value={d.unidade_medida === "g" ? d.custo_por_kg : d.custo_por_unidade}
            onChange={(e) =>
              set(d.unidade_medida === "g" ? "custo_por_kg" : "custo_por_unidade", e.target.value)
            }
          />
        </Campo>
        <Campo label="Observação">
          <input
            className={input}
            value={d.observacao}
            onChange={(e) => set("observacao", e.target.value)}
          />
        </Campo>
      </div>
      <div className="mt-5">
        <Botao
          onClick={() => {
            if (!d.nome.trim()) return toast.error("Informe o nome.");
            salvar({
              ...d,
              rendimento_padrao: n(d.rendimento_padrao),
              tipo_rendimento: d.tipo_rendimento,
              quebra_percentual: d.tipo_rendimento === "perda" ? n(d.quebra_percentual) : 0,
              fator_rendimento: d.tipo_rendimento === "ganho" ? n(d.fator_rendimento) || 1 : 1,
              custo_por_kg: n(d.custo_por_kg),
              custo_por_unidade: n(d.custo_por_unidade),
              ultimo_valor_pago: d.ultimo_valor_pago === "" ? null : n(d.ultimo_valor_pago),
            });
          }}
        >
          Salvar ingrediente
        </Botao>
      </div>
    </Janela>
  );
}
function PreparacaoModal({ item, ingredientes, linhasIniciais, fechar, salvar }: any) {
  const [d, setD] = useState<any>({
      nome: item?.nome || "",
      rendimento_final_g: String(item?.rendimento_final_g || ""),
      modo_preparo: item?.modo_preparo || "",
      observacao: item?.observacao || "",
    }),
    [linhas, setLinhas] = useState<any[]>(
      linhasIniciais.length
        ? linhasIniciais.map((x: any) => ({
            ingrediente_id: x.ingrediente_id,
            quantidade: n(x.quantidade),
            rendimento_quebra: n(x.rendimento_quebra || 1),
          }))
        : [{ ingrediente_id: "", quantidade: 0, rendimento_quebra: 1 }],
    );
  const edit = (i: number, k: string, v: any) =>
    setLinhas(linhas.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <Janela titulo={item ? "Editar preparação" : "Nova preparação"} fechar={fechar}>
      <div className="grid gap-4 md:grid-cols-2">
        <Campo label="Nome">
          <input
            className={input}
            value={d.nome}
            onChange={(e) => setD({ ...d, nome: e.target.value })}
          />
        </Campo>
        <Campo label="Rendimento final (g)">
          <input
            className={input}
            type="number"
            value={d.rendimento_final_g}
            onChange={(e) => setD({ ...d, rendimento_final_g: e.target.value })}
          />
        </Campo>
      </div>
      <p className="mb-2 mt-5 text-sm font-bold">Ingredientes da preparação</p>
      {linhas.map((x, i) => (
        <div
          key={i}
          className="mb-2 grid gap-2 rounded-xl bg-[#f4f7f4] p-3 md:grid-cols-[1fr_110px_110px_auto]"
        >
          <select
            className={input}
            value={x.ingrediente_id}
            onChange={(e) => edit(i, "ingrediente_id", e.target.value)}
          >
            <option value="">Ingrediente</option>
            {ingredientes.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <input
            className={input}
            type="number"
            value={x.quantidade || ""}
            placeholder="Qtd."
            onChange={(e) => edit(i, "quantidade", n(e.target.value))}
          />
          <input
            className={input}
            type="number"
            step="0.01"
            value={x.rendimento_quebra}
            placeholder="Rend."
            onChange={(e) => edit(i, "rendimento_quebra", n(e.target.value))}
          />
          <button
            onClick={() => setLinhas(linhas.filter((_, j) => j !== i))}
            className="font-bold text-red-500"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() =>
          setLinhas([...linhas, { ingrediente_id: "", quantidade: 0, rendimento_quebra: 1 }])
        }
        className="mt-2 text-sm font-bold text-[#087443]"
      >
        + Adicionar ingrediente
      </button>
      <div className="mt-4">
        <Campo label="Modo de preparo">
          <textarea
            className={`${input} min-h-24`}
            value={d.modo_preparo}
            onChange={(e) => setD({ ...d, modo_preparo: e.target.value })}
          />
        </Campo>
      </div>
      <div className="mt-5">
        <Botao
          onClick={() => {
            if (!d.nome || !n(d.rendimento_final_g))
              return toast.error("Informe nome e rendimento.");
            salvar({ ...d, rendimento_final_g: n(d.rendimento_final_g) }, linhas);
          }}
        >
          Salvar preparação
        </Botao>
      </div>
    </Janela>
  );
}
function ReceitaModal({
  produto,
  receita,
  linhasIniciais,
  ingredientes,
  preparacoes,
  custoIng,
  custoPrep,
  criarIngrediente,
  fechar,
  salvar,
}: any) {
  const [modo, setModo] = useState(receita?.modo_preparo || ""),
    [abaFicha, setAbaFicha] = useState<"ingredientes" | "montagem" | "resumo">("ingredientes"),
    [linhas, setLinhas] = useState<ReceitaLinha[]>(
      linhasIniciais.length
        ? linhasIniciais.map((x: any) => ({ ...receitaVazia(), ...x }))
        : [],
    ),
    [novoComponente, setNovoComponente] = useState(""),
    [mostrarNovoIngrediente, setMostrarNovoIngrediente] = useState(false),
    [novoIngrediente, setNovoIngrediente] = useState({ nome: "", custo: "", rendimento: "1" }),
    [salvandoIngrediente, setSalvandoIngrediente] = useState(false);
  const edit = (i: number, k: string, v: any) =>
    setLinhas(linhas.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const nomeComponente = (x: ReceitaLinha) =>
    x.ingrediente_id
      ? ingredientes.find((a: any) => a.id === x.ingrediente_id)?.nome
      : x.preparacao_id
        ? preparacoes.find((a: any) => a.id === x.preparacao_id)?.nome
        : "Componente";
  const adicionarComponente = () => {
    if (!novoComponente) return toast.error("Selecione um ingrediente ou preparação.");
    const [tipo, id] = novoComponente.split(":");
    if (linhas.some((x) => (tipo === "i" ? x.ingrediente_id === id : x.preparacao_id === id))) {
      return toast.error("Esse componente já está na lista.");
    }
    setLinhas([
      ...linhas,
      { ...receitaVazia(), ingrediente_id: tipo === "i" ? id : null, preparacao_id: tipo === "p" ? id : null },
    ]);
    setNovoComponente("");
  };
  const salvarNovoIngrediente = async () => {
    if (!novoIngrediente.nome.trim()) return toast.error("Informe o nome do ingrediente.");
    setSalvandoIngrediente(true);
    const criado = await criarIngrediente(
      novoIngrediente.nome,
      n(novoIngrediente.custo),
      n(novoIngrediente.rendimento) || 1,
    );
    setSalvandoIngrediente(false);
    if (!criado) return;
    setLinhas([...linhas, { ...receitaVazia(), ingrediente_id: criado.id }]);
    setNovoIngrediente({ nome: "", custo: "", rendimento: "1" });
    setMostrarNovoIngrediente(false);
    toast.success("Ingrediente criado e incluído nesta marmita.");
  };
  const quantidadeCorretaFicha = (gramas: number, linha: ReceitaLinha) => {
    const fator = n(linha.fator_producao || 1);
    if (linha.operacao_producao === "acrescentar") return gramas * (1 + fator);
    if (linha.operacao_producao === "dividir") return gramas / fator;
    return gramas;
  };
  const quantidadeComRendimentoFicha = (gramas: number, ingrediente: any) => {
    if (ingrediente?.tipo_rendimento === "perda")
      return gramas * (1 + n(ingrediente.quebra_percentual) / 100);
    if (ingrediente?.tipo_rendimento === "ganho")
      return gramas / n(ingrediente.fator_rendimento || 1);
    return gramas;
  };
  const custo = (t: Tamanho) =>
    linhas.reduce(
      (s, x) =>
        s +
        quantidadeComRendimentoFicha(
          quantidadeCorretaFicha(n(x[`gramas_${t}` as keyof ReceitaLinha]), x),
          x.ingrediente_id ? ingredientes.find((a: any) => a.id === x.ingrediente_id) : null,
        ) *
          (x.ingrediente_id
            ? custoIng(ingredientes.find((a: any) => a.id === x.ingrediente_id))
            : x.preparacao_id
              ? custoPrep(x.preparacao_id)
              : 0),
      0,
    );
  const peso = (t: Tamanho) =>
    linhas.reduce((s, x) => s + n(x[`gramas_${t}` as keyof ReceitaLinha]), 0);
  const custoLinha = (x: ReceitaLinha, t: Tamanho) =>
    quantidadeComRendimentoFicha(
      quantidadeCorretaFicha(n(x[`gramas_${t}` as keyof ReceitaLinha]), x),
      x.ingrediente_id ? ingredientes.find((a: any) => a.id === x.ingrediente_id) : null,
    ) *
    (x.ingrediente_id
      ? custoIng(ingredientes.find((a: any) => a.id === x.ingrediente_id))
      : x.preparacao_id
        ? custoPrep(x.preparacao_id)
        : 0);
  return (
    <Janela titulo={`Ficha técnica — ${produto.nome}`} fechar={fechar}>
      <div className="mb-6 grid gap-4 rounded-2xl bg-[#edf5e6] p-4 md:grid-cols-[180px_1fr]">
        <div className="h-32 overflow-hidden rounded-xl bg-white">
          {produto.imagem_url || produto.imagens?.[0] ? (
            <img
              src={produto.imagem_url || produto.imagens?.[0]}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center text-[#087443]">
              <ChefHat />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#087443]">
            Monte a ficha técnica
          </p>
          <h4 className="mt-1 text-xl font-black">{produto.nome}</h4>
          <p className="mt-2 text-sm text-[#527164]">
            Adicione cada item da montagem e informe o peso final que entra em cada tamanho de
            marmita.
          </p>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-3 rounded-xl bg-[#e7eee8] p-1">
        {[
          ["ingredientes", "1. Ingredientes"],
          ["montagem", "2. Montagem"],
          ["resumo", "3. Custos e preparo"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAbaFicha(id as typeof abaFicha)}
            className={`rounded-lg px-2 py-2.5 text-sm font-bold ${abaFicha === id ? "bg-white text-[#087443] shadow-sm" : "text-[#62766b]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {abaFicha === "ingredientes" && <section className="rounded-2xl border border-[#dbe7dd] bg-[#fbfdfb] p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#087443]">1. Lista de ingredientes</p>
        <p className="mb-3 mt-1 text-sm text-[#62766b]">Escolha tudo que faz parte da receita. Molhos e purês prontos entram como preparação.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select className={input} value={novoComponente} onChange={(e) => setNovoComponente(e.target.value)}>
            <option value="">Escolha um ingrediente ou preparação</option>
            <optgroup label="Ingredientes">{ingredientes.map((a: any) => <option key={a.id} value={`i:${a.id}`}>{a.nome}</option>)}</optgroup>
            <optgroup label="Preparações prontas">{preparacoes.map((a: any) => <option key={a.id} value={`p:${a.id}`}>{a.nome}</option>)}</optgroup>
          </select>
          <Botao onClick={adicionarComponente}><Plus size={17} />Adicionar</Botao>
        </div>
        <button
          type="button"
          onClick={() => setMostrarNovoIngrediente(!mostrarNovoIngrediente)}
          className="mt-3 text-sm font-bold text-[#087443]"
        >
          {mostrarNovoIngrediente ? "− Fechar cadastro" : "+ Cadastrar ingrediente novo"}
        </button>
        {mostrarNovoIngrediente && (
          <div className="mt-3 rounded-xl border border-[#cfe1d3] bg-white p-3">
            <p className="mb-3 text-sm font-bold text-[#173a2d]">Novo ingrediente</p>
            <div className="grid gap-2 md:grid-cols-[minmax(180px,1fr)_150px_150px_auto]">
              <input
                className={input}
                autoFocus
                value={novoIngrediente.nome}
                placeholder="Nome do ingrediente"
                onChange={(e) => setNovoIngrediente({ ...novoIngrediente, nome: e.target.value })}
              />
              <input
                className={input}
                type="number"
                min="0"
                step="0.01"
                value={novoIngrediente.custo}
                placeholder="Custo por kg"
                onChange={(e) => setNovoIngrediente({ ...novoIngrediente, custo: e.target.value })}
              />
              <input
                className={input}
                type="number"
                min="0.01"
                step="0.01"
                value={novoIngrediente.rendimento}
                placeholder="Rendimento"
                onChange={(e) => setNovoIngrediente({ ...novoIngrediente, rendimento: e.target.value })}
              />
              <Botao onClick={salvarNovoIngrediente}>{salvandoIngrediente ? "Salvando..." : "Salvar e usar"}</Botao>
            </div>
            <p className="mt-2 text-xs text-[#62766b]">Rendimento 1 = sem quebra. O ingrediente ficará salvo para todas as próximas marmitas.</p>
          </div>
        )}
        {!linhas.length ? (
          <p className="mt-4 rounded-xl border border-dashed border-[#bed2c4] p-3 text-sm text-[#62766b]">Nenhum componente adicionado ainda.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {linhas.map((x, i) => <span key={i} className="inline-flex items-center gap-2 rounded-full bg-[#e0f2e7] px-3 py-1.5 text-sm font-bold text-[#075d37]">
              {nomeComponente(x)}
              <button aria-label={`Remover ${nomeComponente(x)}`} onClick={() => setLinhas(linhas.filter((_, j) => j !== i))} className="text-[#087443] hover:text-red-600">×</button>
            </span>)}
          </div>
        )}
      </section>}
      {abaFicha === "montagem" && <section>
        <p className="text-xs font-bold uppercase tracking-wide text-[#087443]">2. Lista de montagem</p>
        <p className="mb-3 mt-1 text-sm text-[#62766b]">Informe a quantidade pronta que entra em cada tamanho de marmita.</p>
        {!linhas.length ? <Vazio texto="Adicione os ingredientes acima para criar a lista de montagem." /> : (
          <div className="overflow-x-auto rounded-2xl border border-[#dbe7dd]">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[minmax(210px,1fr)_120px_120px_120px] gap-2 bg-[#edf5e6] px-3 py-3 text-xs font-bold uppercase tracking-wide text-[#527164]">
                <span>Componente</span><span>300 g</span><span>400 g</span><span>200 g</span>
              </div>
              {linhas.map((x, i) => <div key={i} className="grid grid-cols-[minmax(210px,1fr)_120px_120px_120px] items-center gap-2 border-t border-[#e2ebe3] bg-white px-3 py-3">
                <div><p className="font-bold">{nomeComponente(x)}</p><div className="mt-1 flex gap-1"><select aria-label={`Regra de produção de ${nomeComponente(x)}`} className="w-2/3 rounded border border-[#dbe7dd] px-2 py-1 text-xs" value={x.operacao_producao} onChange={(e) => edit(i, "operacao_producao", e.target.value)}><option value="direto">P/G: direto</option><option value="acrescentar">P/G: + perda</option><option value="dividir">P/G: ÷ rendimento</option></select>{x.operacao_producao !== "direto" && <input aria-label={`Fator de produção de ${nomeComponente(x)}`} className="w-1/3 rounded border border-[#dbe7dd] px-2 py-1 text-xs" type="number" min="0.01" step="0.01" value={x.fator_producao || ""} onChange={(e) => edit(i, "fator_producao", n(e.target.value))} />}</div><input className="mt-1 w-full rounded border border-[#dbe7dd] px-2 py-1 text-xs" value={x.observacao || ""} placeholder="Observação (opcional)" onChange={(e) => edit(i, "observacao", e.target.value)} /></div>
                {TAMANHOS.map((t) => <input key={t.id} className={input} type="number" min="0" placeholder="0 g" value={n(x[`gramas_${t.id}` as keyof ReceitaLinha]) || ""} onChange={(e) => edit(i, `gramas_${t.id}`, n(e.target.value))} />)}
              </div>)}
            </div>
          </div>
        )}
      </section>}
      {abaFicha === "resumo" && <section>
        <div className="mb-5 rounded-2xl bg-[#edf5e6] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#087443]">Resumo da ficha técnica</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {TAMANHOS.map((t) => (
              <div key={t.id} className="rounded-xl bg-white p-3">
                <p className="text-xs font-bold text-[#62766b]">{t.label}</p>
                <p className="mt-1 text-lg font-black text-[#087443]">{peso(t.id)} g</p>
                <p className="text-sm font-bold text-[#355445]">{valor(custo(t.id))} em ingredientes</p>
              </div>
            ))}
          </div>
        </div>
        {!linhas.length ? <Vazio texto="Adicione ingredientes e informe a montagem para ver os custos." /> : (
          <div className="mb-5 overflow-x-auto rounded-2xl border border-[#dbe7dd]">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[minmax(220px,1fr)_110px_130px_130px_130px] gap-2 bg-[#edf5e6] px-3 py-3 text-xs font-bold uppercase tracking-wide text-[#527164]">
                <span>Ingrediente</span><span>Custo/kg</span><span>300 g</span><span>400 g</span><span>200 g</span>
              </div>
              {linhas.map((x, i) => {
                const item = x.ingrediente_id ? ingredientes.find((a: any) => a.id === x.ingrediente_id) : null;
                return <div key={i} className="grid grid-cols-[minmax(220px,1fr)_110px_130px_130px_130px] items-center gap-2 border-t border-[#e2ebe3] bg-white px-3 py-3 text-sm">
                  <span className="font-bold">{nomeComponente(x)}</span>
                  <span>{item ? valor(n(item.custo_por_kg)) : "Calculado"}</span>
                  {TAMANHOS.map((t) => <span key={t.id}>{n(x[`gramas_${t.id}` as keyof ReceitaLinha])} g · <b>{valor(custoLinha(x, t.id))}</b></span>)}
                </div>;
              })}
            </div>
          </div>
        )}
        <Campo label="Modo de montagem / preparo">
          <textarea
            className={`${input} min-h-24`}
            value={modo}
            onChange={(e) => setModo(e.target.value)}
            placeholder="Ex.: colocar arroz, feijão, frango e finalizar com 50 g de molho pronto."
          />
        </Campo>
      </section>}
      <div className="mt-5">
        <Botao onClick={() => salvar(modo, linhas)}>Salvar ficha técnica</Botao>
      </div>
    </Janela>
  );
}

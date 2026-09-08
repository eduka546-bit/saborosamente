import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BookOpen,
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
  X,
} from "lucide-react";

export const Route = createFileRoute("/cozinha")({ component: CozinhaPage, ssr: false });
type Aba = "producao" | "separar" | "ingredientes" | "preparacoes" | "marmitas" | "estoque";
type Tamanho = "200" | "300" | "400" | "personalizada";
type ReceitaLinha = {
  ingrediente_id: string | null;
  preparacao_id: string | null;
  gramas_200: number;
  gramas_300: number;
  gramas_400: number;
  gramas_personalizada: number;
  rendimento_quebra: number;
  observacao: string;
};
const TAMANHOS: { id: Tamanho; label: string }[] = [
  { id: "200", label: "200 g" },
  { id: "300", label: "300 g" },
  { id: "400", label: "400 g" },
  { id: "personalizada", label: "Personalizada" },
];
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
  observacao: "",
});

function CozinhaPage() {
  const navigate = useNavigate(),
    qc = useQueryClient();
  const [ok, setOk] = useState(false),
    [aba, setAba] = useState<Aba>("producao"),
    [modal, setModal] = useState<null | "producao" | "ingrediente" | "preparacao" | "receita">(
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
  const { data: producoes = [] } = useQuery({
    queryKey: ["coz-prod-dia"],
    enabled: ok,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cozinha_producoes")
        .select("*")
        .eq("data_producao", hoje())
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
  const custoPrep = (id: string) => {
    const p = prep.get(id);
    if (!p || !n(p.rendimento_final_g)) return 0;
    return (
      (itensPrep.get(id) || []).reduce(
        (s, l) =>
          s + (n(l.quantidade) / n(l.rendimento_quebra || 1)) * custoIng(ing.get(l.ingrediente_id)),
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
        const qtd = (n(l[campo]) * n(p.quantidade_planejada)) / n(l.rendimento_quebra || 1);
        if (l.ingrediente_id) add(l.ingrediente_id, qtd, prato.nome);
        if (l.preparacao_id) {
          const base = prep.get(l.preparacao_id);
          (itensPrep.get(l.preparacao_id) || []).forEach((x) =>
            add(
              x.ingrediente_id,
              ((qtd / n(base?.rendimento_final_g)) * n(x.quantidade)) / n(x.rendimento_quebra || 1),
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
    { id: "preparacoes", label: "Preparações", icon: CookingPot },
    { id: "marmitas", label: "Marmitas", icon: BookOpen },
    { id: "estoque", label: "Estoque", icon: Store },
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
                titulo="Lista de produção"
                texto="Planeje quantidades por tamanho e acompanhe o preparo do dia."
                acao={
                  <Botao onClick={() => abrir("producao")}>
                    <Plus size={18} />
                    Adicionar produção
                  </Botao>
                }
              />
              {!(producoes as any[]).length ? (
                <Vazio texto="Nenhuma marmita programada para hoje." />
              ) : (
                <div className="grid gap-3">
                  {(producoes as any[]).map((p) => {
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
                            {TAMANHOS.find((t) => t.id === p.gramatura)?.label || "400 g"}
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
                              const dados: any = {
                                status: "concluida",
                                quantidade_produzida: p.quantidade_planejada,
                                updated_at: new Date().toISOString(),
                              };
                              const { error } = await supabase
                                .from("cozinha_producoes")
                                .update(dados)
                                .eq("id", p.id);
                              if (error) toast.error(error.message);
                              else invalidar("coz-prod-dia");
                            }}
                          >
                            <CheckCircle2 size={16} />
                            Concluir
                          </Botao>
                        )}
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
                        rendimento {Math.round(n(x.rendimento_padrao) * 100)}%
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
                <div className="grid gap-3 md:grid-cols-2">
                  {(estoque as any[]).map((x) => (
                    <article key={x.id} className="rounded-2xl border bg-white p-4">
                      <h3 className="font-bold">{x.ingrediente}</h3>
                      <p className="mt-2 font-black text-[#087443]">
                        {x.quantidade_atual} {x.unidade}
                      </p>
                      <p className="text-xs text-[#62766b]">
                        Mínimo: {x.quantidade_minima} {x.unidade}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
      {modal === "producao" && (
        <ProducaoModal
          marmitas={marmitas}
          fechar={() => setModal(null)}
          salvar={async (produtoId: string, qs: any, observacao: string) => {
            if (!produtoId) return toast.error("Escolha a marmita.");
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const linhas = TAMANHOS.filter((t) => n(qs[t.id]) > 0).map((t) => ({
              data_producao: hoje(),
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
function ProducaoModal({ marmitas, fechar, salvar }: any) {
  const [produto, setProduto] = useState(""),
    [q, setQ] = useState<any>({}),
    [obs, setObs] = useState("");
  return (
    <Janela titulo="Adicionar à produção" fechar={fechar}>
      <div className="grid gap-4">
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
        <Botao onClick={() => salvar(produto, q, obs)}>Adicionar produção</Botao>
      </div>
    </Janela>
  );
}
function IngredienteModal({ item, fechar, salvar }: any) {
  const [d, setD] = useState<any>({
    nome: item?.nome || "",
    unidade_medida: item?.unidade_medida || "g",
    rendimento_padrao: String(item?.rendimento_padrao ?? 1),
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
        <Campo label="Rendimento padrão">
          <input
            className={input}
            type="number"
            step="0.01"
            value={d.rendimento_padrao}
            onChange={(e) => set("rendimento_padrao", e.target.value)}
          />
        </Campo>
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
  fechar,
  salvar,
}: any) {
  const [modo, setModo] = useState(receita?.modo_preparo || ""),
    [linhas, setLinhas] = useState<ReceitaLinha[]>(
      linhasIniciais.length
        ? linhasIniciais.map((x: any) => ({ ...receitaVazia(), ...x }))
        : [receitaVazia()],
    );
  const edit = (i: number, k: string, v: any) =>
    setLinhas(linhas.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const custo = (t: Tamanho) =>
    linhas.reduce(
      (s, x) =>
        s +
        (n(x[`gramas_${t}` as keyof ReceitaLinha]) / n(x.rendimento_quebra || 1)) *
          (x.ingrediente_id
            ? custoIng(ingredientes.find((a: any) => a.id === x.ingrediente_id))
            : x.preparacao_id
              ? custoPrep(x.preparacao_id)
              : 0),
      0,
    );
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
          <div className="mt-3 flex flex-wrap gap-2">
            {TAMANHOS.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-[#edf5e6] px-3 py-1 text-xs font-bold text-[#087443]"
              >
                {t.label}: {valor(custo(t.id))}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mb-2 grid gap-2 px-3 text-xs font-bold uppercase tracking-wide text-[#62766b] md:grid-cols-[minmax(220px,1fr)_110px_110px_110px_140px_36px]">
        <span>Ingrediente ou preparação</span>
        <span>200 g</span>
        <span>300 g</span>
        <span>400 g</span>
        <span>Personalizada</span>
        <span />
      </div>
      {linhas.map((x, i) => (
        <div key={i} className="mb-3 rounded-xl border border-[#dbe7dd] bg-white p-3">
          <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_110px_110px_110px_140px_36px]">
            <select
              className={input}
              value={
                x.ingrediente_id
                  ? `i:${x.ingrediente_id}`
                  : x.preparacao_id
                    ? `p:${x.preparacao_id}`
                    : ""
              }
              onChange={(e) => {
                const [tipo, id] = e.target.value.split(":");
                edit(i, "ingrediente_id", tipo === "i" ? id : null);
                edit(i, "preparacao_id", tipo === "p" ? id : null);
              }}
            >
              <option value="">Componente</option>
              <optgroup label="Ingredientes">
                {ingredientes.map((a: any) => (
                  <option key={a.id} value={`i:${a.id}`}>
                    {a.nome}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Preparações prontas">
                {preparacoes.map((a: any) => (
                  <option key={a.id} value={`p:${a.id}`}>
                    {a.nome}
                  </option>
                ))}
              </optgroup>
            </select>
            {TAMANHOS.map((t) => (
              <div key={t.id}>
                <input
                  className={input}
                  type="number"
                  placeholder="0 g"
                  value={n(x[`gramas_${t.id}` as keyof ReceitaLinha]) || ""}
                  onChange={(e) => edit(i, `gramas_${t.id}`, n(e.target.value))}
                />
              </div>
            ))}
            <button
              onClick={() => setLinhas(linhas.filter((_, j) => j !== i))}
              className="font-bold text-red-500"
            >
              ×
            </button>
          </div>
          <div className="mt-2 text-xs text-[#62766b]">
            Rendimento/quebra:{" "}
            <input
              className="ml-1 w-20 rounded border px-1 py-0.5"
              type="number"
              step="0.01"
              value={x.rendimento_quebra}
              onChange={(e) => edit(i, "rendimento_quebra", n(e.target.value))}
            />{" "}
            <span className="ml-1">(1 = sem quebra)</span>
          </div>
        </div>
      ))}
      <button
        onClick={() => setLinhas([...linhas, receitaVazia()])}
        className="text-sm font-bold text-[#087443]"
      >
        + Adicionar componente
      </button>
      <div className="mt-4">
        <Campo label="Modo de preparo">
          <textarea
            className={`${input} min-h-24`}
            value={modo}
            onChange={(e) => setModo(e.target.value)}
            placeholder="Ex.: colocar arroz, feijão, frango e finalizar com 50 g de molho pronto."
          />
        </Campo>
      </div>
      <div className="mt-5">
        <Botao onClick={() => salvar(modo, linhas)}>Salvar ficha técnica</Botao>
      </div>
    </Janela>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChefHat, ClipboardList, Package, Salad, BookOpen, LogOut, Plus, CheckCircle2, PlayCircle, Store, X } from "lucide-react";

export const Route = createFileRoute("/cozinha")({ component: CozinhaPage, ssr: false });

type Aba = "producao" | "ingredientes" | "receitas" | "estoque" | "loja";
const hoje = () => new Date().toISOString().slice(0, 10);
const normalizarIngredientes = (valor: unknown): string[] => Array.isArray(valor) ? valor.map(String).filter(Boolean) : [];

function CozinhaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [autorizado, setAutorizado] = useState(false);
  const [aba, setAba] = useState<Aba>("producao");
  const [mostrarNova, setMostrarNova] = useState(false);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const validar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return navigate({ to: "/cozinha-login" as any, replace: true });
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).in("role", ["admin", "cozinha"]);
      if (!data?.length) {
        await supabase.auth.signOut();
        navigate({ to: "/cozinha-login" as any, replace: true });
        return;
      }
      setAutorizado(true);
    };
    validar();
  }, [navigate]);

  const { data: produtos = [] } = useQuery({
    queryKey: ["cozinha-produtos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("id,nome,ingredientes,estoque_atual,estoque_200g,estoque_300g,estoque_400g,ativo,tipo_produto").eq("ativo", true).order("nome");
      if (error) throw error;
      return data ?? [];
    }, enabled: autorizado,
  });
  const { data: producoes = [] } = useQuery({
    queryKey: ["cozinha-producoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cozinha_producoes").select("*").eq("data_producao", hoje()).order("created_at");
      if (error) throw error;
      return data ?? [];
    }, enabled: autorizado, refetchInterval: 15_000,
  });
  const { data: receitas = [] } = useQuery({
    queryKey: ["cozinha-receitas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cozinha_receitas").select("*");
      if (error) throw error;
      return data ?? [];
    }, enabled: autorizado,
  });
  const { data: estoque = [] } = useQuery({
    queryKey: ["cozinha-estoque"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cozinha_estoque").select("*").order("ingrediente");
      if (error) throw error;
      return data ?? [];
    }, enabled: autorizado,
  });

  const produtoPorId = useMemo(() => new Map((produtos as any[]).map((produto) => [produto.id, produto])), [produtos]);
  const receitaPorProduto = useMemo(() => new Map((receitas as any[]).map((receita) => [receita.produto_id, receita])), [receitas]);
  const ingredientesDoDia = useMemo(() => {
    const agrupados = new Map<string, { quantidade: number; pratos: string[] }>();
    (producoes as any[]).forEach((producao) => {
      const produto = produtoPorId.get(producao.produto_id);
      if (!produto) return;
      const receita = receitaPorProduto.get(producao.produto_id);
      const itens = normalizarIngredientes(receita?.ingredientes).length ? normalizarIngredientes(receita?.ingredientes) : normalizarIngredientes(produto.ingredientes);
      itens.forEach((ingrediente) => {
        const chave = ingrediente.trim();
        if (!chave) return;
        const atual = agrupados.get(chave) || { quantidade: 0, pratos: [] };
        atual.quantidade += producao.quantidade_planejada;
        if (!atual.pratos.includes(produto.nome)) atual.pratos.push(produto.nome);
        agrupados.set(chave, atual);
      });
    });
    return [...agrupados.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [producoes, produtoPorId, receitaPorProduto]);

  const criarProducao = async () => {
    if (!produtoId || Number(quantidade) < 1) return toast.error("Escolha a marmita e a quantidade.");
    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("cozinha_producoes").insert({ data_producao: hoje(), produto_id: produtoId, quantidade_planejada: Number(quantidade), observacao: observacao.trim() || null, created_by: user?.id });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["cozinha-producoes"] });
      setMostrarNova(false); setProdutoId(""); setQuantidade("1"); setObservacao("");
      toast.success("Item incluído na produção de hoje.");
    } catch (error: any) { toast.error(error.message || "Não foi possível incluir a produção."); }
    finally { setSalvando(false); }
  };

  const mudarStatus = async (id: string, status: string, planejada: number) => {
    const values: any = { status, updated_at: new Date().toISOString() };
    if (status === "concluida") values.quantidade_produzida = planejada;
    const { error } = await supabase.from("cozinha_producoes").update(values).eq("id", id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["cozinha-producoes"] });
  };

  const salvarReceita = async (produto: any, ingredientesTexto: string, preparo: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const ingredientes = ingredientesTexto.split(",").map((item) => item.trim()).filter(Boolean);
    const { error } = await supabase.from("cozinha_receitas").upsert({ produto_id: produto.id, ingredientes, modo_preparo: preparo.trim() || null, updated_by: user?.id, updated_at: new Date().toISOString() }, { onConflict: "produto_id" });
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["cozinha-receitas"] });
    toast.success("Receita salva.");
  };

  const adicionarEstoque = async (ingrediente: string, unidade: string, atual: string, minimo: string) => {
    if (!ingrediente.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("cozinha_estoque").upsert({ ingrediente: ingrediente.trim(), unidade: unidade || "kg", quantidade_atual: Number(atual) || 0, quantidade_minima: Number(minimo) || 0, updated_by: user?.id, updated_at: new Date().toISOString() }, { onConflict: "ingrediente" });
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["cozinha-estoque"] });
  };

  if (!autorizado) return <div className="min-h-screen grid place-items-center bg-[#f7f6f0] text-[#164a37]">Verificando acesso…</div>;
  const abas: { id: Aba; label: string; icon: any }[] = [
    { id: "producao", label: "Produção", icon: ClipboardList }, { id: "ingredientes", label: "Hoje vamos usar", icon: Salad }, { id: "receitas", label: "Receitas", icon: BookOpen }, { id: "estoque", label: "Estoque Cozinha", icon: Package }, { id: "loja", label: "Estoque Loja", icon: Store },
  ];
  const marmitas = (produtos as any[]).filter((produto) => produto.tipo_produto === "marmita" || !produto.tipo_produto);

  return <div className="min-h-screen bg-[#f7f6f0] text-[#173a2d]">
    <header className="sticky top-0 z-10 border-b border-[#dbe7dd] bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#087443] text-white"><ChefHat size={22} /></div><div><h1 className="font-black">Cozinha Saborosa</h1><p className="text-xs text-[#62766b]">Operação de produção</p></div></div><button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/cozinha-login" as any }); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#587066] hover:bg-[#eff5ef]"><LogOut size={16} /> Sair</button></div></header>
    <div className="mx-auto grid max-w-7xl md:grid-cols-[220px_1fr]">
      <aside className="border-b border-[#dbe7dd] bg-white p-3 md:min-h-[calc(100vh-65px)] md:border-b-0 md:border-r">{abas.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setAba(id)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${aba === id ? "bg-[#e0f2e7] text-[#087443]" : "text-[#52695f] hover:bg-[#f3f6f3]"}`}><Icon size={18} />{label}</button>)}</aside>
      <main className="p-4 md:p-8">
        {aba === "producao" && <section><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-[#087443]">{new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date())}</p><h2 className="text-3xl font-black">Lista de produção</h2><p className="mt-1 text-sm text-[#62766b]">Planeje, prepare e dê baixa nas marmitas do dia.</p></div><button onClick={() => setMostrarNova(true)} className="flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-3 text-sm font-bold text-white hover:bg-[#075e38]"><Plus size={18} /> Adicionar produção</button></div><div className="grid gap-3">{(producoes as any[]).length === 0 ? <EstadoVazio texto="Nenhuma marmita programada para hoje." /> : (producoes as any[]).map((item) => { const produto = produtoPorId.get(item.produto_id); return <article key={item.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#dbe7dd] bg-white p-4 shadow-sm"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e0f2e7] text-[#087443]"><ChefHat size={21}/></div><div className="min-w-[200px] flex-1"><h3 className="font-bold">{produto?.nome || "Marmita"}</h3><p className="text-sm text-[#62766b]">{item.quantidade_planejada} unidade(s){item.observacao ? ` · ${item.observacao}` : ""}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === "concluida" ? "bg-green-100 text-green-700" : item.status === "em_preparo" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{item.status === "planejada" ? "Planejada" : item.status === "em_preparo" ? "Em preparo" : "Concluída"}</span><div className="flex gap-2">{item.status === "planejada" && <button onClick={() => mudarStatus(item.id, "em_preparo", item.quantidade_planejada)} className="rounded-lg border border-[#bcd8c5] px-3 py-2 text-xs font-bold text-[#087443]"><PlayCircle size={15} className="mr-1 inline"/>Começar</button>}{item.status !== "concluida" && <button onClick={() => mudarStatus(item.id, "concluida", item.quantidade_planejada)} className="rounded-lg bg-[#087443] px-3 py-2 text-xs font-bold text-white"><CheckCircle2 size={15} className="mr-1 inline"/>Concluir</button>}</div></article>})}</div></section>}
        {aba === "ingredientes" && <section><Titulo titulo="Hoje vamos usar" texto="Ingredientes agrupados automaticamente pelas marmitas programadas para hoje."/><div className="grid gap-3 md:grid-cols-2">{ingredientesDoDia.length === 0 ? <EstadoVazio texto="Inclua itens na produção para montar a lista de ingredientes." /> : ingredientesDoDia.map(([ingrediente, info]) => <article key={ingrediente} className="rounded-2xl border border-[#dbe7dd] bg-white p-4"><h3 className="font-bold">{ingrediente}</h3><p className="mt-1 text-sm font-semibold text-[#087443]">Usado em {info.quantidade} marmita(s)</p><p className="mt-2 text-xs text-[#62766b]">{info.pratos.join(" · ")}</p></article>)}</div></section>}
        {aba === "receitas" && <section><Titulo titulo="Receitas e modo de preparo" texto="Cadastre ingredientes e o preparo de cada marmita. Eles alimentam o planejamento do dia."/><div className="grid gap-4 lg:grid-cols-2">{marmitas.map((produto) => <CartaoReceita key={produto.id} produto={produto} receita={receitaPorProduto.get(produto.id)} salvar={salvarReceita} />)}</div></section>}
        {aba === "estoque" && <section><Titulo titulo="Estoque da cozinha" texto="Controle ingredientes e marque rapidamente o que precisa ser reposto."/><FormularioEstoque salvar={adicionarEstoque}/><div className="mt-5 grid gap-3 md:grid-cols-2">{(estoque as any[]).map((item) => <article key={item.id} className={`rounded-2xl border p-4 ${Number(item.quantidade_atual) <= Number(item.quantidade_minima) ? "border-amber-300 bg-amber-50" : "border-[#dbe7dd] bg-white"}`}><div className="flex justify-between gap-3"><h3 className="font-bold">{item.ingrediente}</h3><span className="text-sm font-black text-[#087443]">{item.quantidade_atual} {item.unidade}</span></div><p className="mt-2 text-xs text-[#62766b]">Mínimo: {item.quantidade_minima} {item.unidade}</p></article>)}{(estoque as any[]).length === 0 && <EstadoVazio texto="Ainda não há ingredientes cadastrados."/>}</div></section>}
        {aba === "loja" && <section><Titulo titulo="Estoque da loja" texto="Visualização do saldo de marmitas prontas para venda. A produção não altera este saldo automaticamente."/><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{marmitas.map((produto) => <article key={produto.id} className="rounded-2xl border border-[#dbe7dd] bg-white p-4"><h3 className="font-bold">{produto.nome}</h3><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-[#f3f6f3] p-2"><b>{produto.estoque_200g ?? 0}</b><br/>200g</div><div className="rounded-lg bg-[#f3f6f3] p-2"><b>{produto.estoque_300g ?? 0}</b><br/>300g</div><div className="rounded-lg bg-[#f3f6f3] p-2"><b>{produto.estoque_400g ?? 0}</b><br/>400g</div></div></article>)}</div></section>}
      </main>
    </div>
    {mostrarNova && <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black">Adicionar à produção</h3><button onClick={() => setMostrarNova(false)}><X size={20}/></button></div><label className="text-sm font-bold">Marmita</label><select value={produtoId} onChange={(e)=>setProdutoId(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5"><option value="">Selecione</option>{marmitas.map((p)=> <option value={p.id} key={p.id}>{p.nome}</option>)}</select><label className="mt-3 block text-sm font-bold">Quantidade</label><input type="number" min="1" value={quantidade} onChange={(e)=>setQuantidade(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5"/><label className="mt-3 block text-sm font-bold">Observação (opcional)</label><input value={observacao} onChange={(e)=>setObservacao(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5"/><button onClick={criarProducao} disabled={salvando} className="mt-5 w-full rounded-lg bg-[#087443] py-3 font-bold text-white disabled:opacity-60">{salvando ? "Salvando..." : "Adicionar"}</button></div></div>}
  </div>;
}

function Titulo({ titulo, texto }: { titulo: string; texto: string }) { return <div className="mb-6"><h2 className="text-3xl font-black">{titulo}</h2><p className="mt-1 text-sm text-[#62766b]">{texto}</p></div>; }
function EstadoVazio({ texto }: { texto: string }) { return <div className="rounded-2xl border border-dashed border-[#bed2c4] bg-white p-10 text-center text-sm text-[#62766b]">{texto}</div>; }
function CartaoReceita({ produto, receita, salvar }: any) { const [ingredientes, setIngredientes] = useState(normalizarIngredientes(receita?.ingredientes).length ? normalizarIngredientes(receita.ingredientes).join(", ") : normalizarIngredientes(produto.ingredientes).join(", ")); const [preparo, setPreparo] = useState(receita?.modo_preparo || ""); return <article className="rounded-2xl border border-[#dbe7dd] bg-white p-4"><h3 className="font-bold">{produto.nome}</h3><label className="mt-4 block text-xs font-bold uppercase text-[#62766b]">Ingredientes</label><textarea value={ingredientes} onChange={(e)=>setIngredientes(e.target.value)} className="mt-1 min-h-20 w-full rounded-lg border p-2 text-sm" placeholder="Separe os ingredientes por vírgula"/><label className="mt-3 block text-xs font-bold uppercase text-[#62766b]">Modo de preparo</label><textarea value={preparo} onChange={(e)=>setPreparo(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border p-2 text-sm" placeholder="Passo a passo de preparo"/><button onClick={()=>salvar(produto, ingredientes, preparo)} className="mt-3 rounded-lg bg-[#e0f2e7] px-3 py-2 text-xs font-bold text-[#087443]">Salvar receita</button></article>; }
function FormularioEstoque({ salvar }: any) { const [ingrediente,setIngrediente]=useState(""); const [unidade,setUnidade]=useState("kg"); const [atual,setAtual]=useState(""); const [minimo,setMinimo]=useState(""); return <div className="grid gap-2 rounded-2xl border border-[#dbe7dd] bg-white p-4 md:grid-cols-[1fr_90px_110px_110px_auto]"><input value={ingrediente} onChange={(e)=>setIngrediente(e.target.value)} placeholder="Ingrediente" className="rounded-lg border p-2 text-sm"/><input value={unidade} onChange={(e)=>setUnidade(e.target.value)} placeholder="Unidade" className="rounded-lg border p-2 text-sm"/><input value={atual} onChange={(e)=>setAtual(e.target.value)} type="number" step="0.01" placeholder="Atual" className="rounded-lg border p-2 text-sm"/><input value={minimo} onChange={(e)=>setMinimo(e.target.value)} type="number" step="0.01" placeholder="Mínimo" className="rounded-lg border p-2 text-sm"/><button onClick={async()=>{await salvar(ingrediente,unidade,atual,minimo);setIngrediente("");setAtual("");setMinimo("")}} className="rounded-lg bg-[#087443] px-4 py-2 text-sm font-bold text-white">Salvar</button></div>; }

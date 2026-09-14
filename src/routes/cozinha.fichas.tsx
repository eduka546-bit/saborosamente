import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ChefHat, ClipboardList, LogOut, Search, Utensils, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cozinha/fichas")({ component: FichasTecnicasPage, ssr: false });

type Tamanho = "200" | "300" | "400";
type ReceitaItem = { id?: string; ingrediente_id?: string | null; preparacao_id?: string | null; gramas_200?: number; gramas_300?: number; gramas_400?: number; ordem?: number; observacao?: string | null };
type MontagemItem = { id?: string; nome: string; gramas_200?: number; gramas_300?: number; gramas_400?: number; observacao?: string | null; ordem?: number };
type PrepRow = { id: string; nome: string; modo_preparo?: string | null; rendimento_final_g?: number | null };
type PrepItem = { id: string; preparacao_id: string; ingrediente_id: string; quantidade?: number | null; quantidade_texto?: string | null; ordem?: number };
type PreparacaoJson = { id?: string; nome: string; ingredientes?: string[]; passos?: string[] };

const input = "w-full rounded-xl border border-[#cbd8ce] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#087443]";
const num = (v: unknown) => Number(v || 0);
const grams = (v: unknown) => `${num(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} g`;

function FichasTecnicasPage() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [size, setSize] = useState<Tamanho>("300");
  const [selected, setSelected] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [recipeItems, setRecipeItems] = useState<ReceitaItem[]>([]);
  const [mountItems, setMountItems] = useState<MontagemItem[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [preparations, setPreparations] = useState<PrepRow[]>([]);
  const [prepItems, setPrepItems] = useState<PrepItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return navigate({ to: "/cozinha-login" as any, replace: true });
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).in("role", ["admin", "cozinha"]);
      if (!roles?.length) return navigate({ to: "/cozinha-login" as any, replace: true });
      setAuthorized(true);
      const [p, r, ri, m, i, pr, pi] = await Promise.all([
        supabase.from("produtos").select("id,nome,imagem_url,imagens,tipo_produto,ativo").order("nome"),
        supabase.from("cozinha_receitas").select("*"),
        supabase.from("cozinha_receita_itens").select("*").order("ordem"),
        supabase.from("cozinha_receita_montagem_itens").select("*").order("ordem"),
        supabase.from("cozinha_ingredientes").select("id,nome,unidade_medida,ativo").order("nome"),
        supabase.from("cozinha_preparacoes").select("id,nome,modo_preparo,rendimento_final_g").order("nome"),
        supabase.from("cozinha_preparacao_itens").select("*").order("ordem"),
      ]);
      if ([p,r,ri,m,i,pr,pi].some(x => x.error)) toast.error("Não foi possível carregar todas as fichas técnicas.");
      setProducts(p.data || []); setRecipes(r.data || []); setRecipeItems(ri.data || []); setMountItems(m.data || []); setIngredients(i.data || []); setPreparations(pr.data || []); setPrepItems(pi.data || []); setLoading(false);
    })();
  }, [navigate]);

  const productMap = useMemo(() => new Map(products.map(x => [x.id, x])), [products]);
  const ingredientMap = useMemo(() => new Map(ingredients.map(x => [x.id, x])), [ingredients]);
  const preparationMap = useMemo(() => new Map(preparations.map(x => [x.id, x])), [preparations]);
  const recipeItemMap = useMemo(() => groupBy<ReceitaItem>(recipeItems, "receita_id"), [recipeItems]);
  const mountMap = useMemo(() => groupBy<MontagemItem>(mountItems, "receita_id"), [mountItems]);
  const prepItemMap = useMemo(() => groupBy<PrepItem>(prepItems, "preparacao_id"), [prepItems]);

  const sheets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipes.map(r => ({ recipe: r, product: productMap.get(r.produto_id) })).filter(x => x.product && (!q || String(x.product.nome).toLowerCase().includes(q))).sort((a,b) => String(a.product.nome).localeCompare(String(b.product.nome), "pt-BR"));
  }, [recipes, productMap, search]);

  if (!authorized || loading) return <div className="grid min-h-screen place-items-center bg-[#f7f6f0] text-[#173a2d]">Carregando fichas técnicas…</div>;

  return <div className="min-h-screen bg-[#f7f6f0] text-[#173a2d]">
    <header className="sticky top-0 z-20 border-b border-[#dbe7dd] bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#087443] text-white"><ChefHat size={21}/></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6a8074]">Marmitas</p><h1 className="text-lg font-black">Ficha Técnica</h1></div></div><div className="flex gap-2"><button className="rounded-xl border border-[#cbd8ce] bg-white px-3 py-2 text-sm font-bold" onClick={()=>navigate({to:"/cozinha" as any})}>Voltar</button><button className="rounded-xl border border-[#cbd8ce] bg-white p-2" title="Sair" onClick={async()=>{await supabase.auth.signOut();navigate({to:"/cozinha-login" as any})}}><LogOut size={18}/></button></div></div></header>
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-8">
      <section className="rounded-3xl border border-[#dbe7dd] bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="mb-1 flex items-center gap-2 text-[#087443]"><BookOpen size={18}/><span className="text-sm font-black">Ficha técnica das marmitas</span></div><h2 className="text-2xl font-black">Marmitas → Ficha Técnica</h2><p className="mt-1 text-sm text-[#62766b]">Clique em uma marmita para abrir a ficha completa no modal.</p></div><div className="flex gap-2">{(["200","300","400"] as Tamanho[]).map(s=><button key={s} onClick={()=>setSize(s)} className={`rounded-xl px-4 py-2 text-sm font-black ${size===s?"bg-[#087443] text-white":"border border-[#cbd8ce] bg-white"}`}>{s} g</button>)}</div></div><div className="relative mt-5 max-w-xl"><Search className="absolute left-3 top-3 text-[#799085]" size={18}/><input className={`${input} pl-10`} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar marmita…"/></div></section>
      <section className="grid gap-4 lg:grid-cols-3">{sheets.map(({recipe,product})=><button key={recipe.id} onClick={()=>setSelected(recipe)} className="group overflow-hidden rounded-3xl border border-[#dbe7dd] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#087443]"><ClipboardList size={15}/>Ficha Técnica</div><h3 className="text-lg font-black leading-tight">{product.nome}</h3><p className="mt-2 text-xs text-[#708278]">Abrir ingredientes, preparações, montagem e modo de preparo</p><div className="mt-4 text-sm font-black text-[#087443]">Ver ficha →</div></button>)}</section>
      {!sheets.length&&<div className="rounded-3xl border border-dashed border-[#b9cabe] bg-white p-10 text-center text-sm text-[#62766b]">Nenhuma ficha encontrada.</div>}
    </main>
    {selected&&<FichaModal recipe={selected} product={productMap.get(selected.produto_id)} items={recipeItemMap.get(selected.id)||[]} mounts={mountMap.get(selected.id)||[]} preparations={preparations} preparationMap={preparationMap} prepItemMap={prepItemMap} ingredientMap={ingredientMap} size={size} onClose={()=>setSelected(null)}/>} 
  </div>;
}

function FichaModal({recipe,product,items,mounts,preparations,preparationMap,prepItemMap,ingredientMap,size,onClose}:{recipe:any;product:any;items:ReceitaItem[];mounts:MontagemItem[];preparations:PrepRow[];preparationMap:Map<string,PrepRow>;prepItemMap:Map<string,PrepItem[]>;ingredientMap:Map<string,any>;size:Tamanho;onClose:()=>void}){
  const jsonPreps:PreparacaoJson[] = Array.isArray(recipe.preparacoes)?recipe.preparacoes:[];
  const prepIds=[...new Set([...jsonPreps.map(x=>x.id).filter(Boolean) as string[],...items.map(x=>x.preparacao_id).filter(Boolean) as string[]])];
  const selectedPreps=prepIds.map(id=>preparationMap.get(id)).filter(Boolean) as PrepRow[];
  const field=`gramas_${size}`;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 md:p-6" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-[#e2ebe4] px-5 py-4 md:px-6"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#087443]">Ficha Técnica</p><h2 className="mt-1 text-xl font-black md:text-2xl">{product?.nome||"Marmita"}</h2><p className="mt-1 text-sm text-[#708278]">Produção para unidade de {size} g</p></div><button className="rounded-xl border border-[#d5dfd7] p-2" onClick={onClose} aria-label="Fechar"><X size={20}/></button></div><div className="overflow-y-auto p-5 md:p-6"><div className="mb-5 flex gap-2">{(["200","300","400"] as Tamanho[]).map(s=><span key={s} className={`rounded-full px-3 py-1.5 text-xs font-black ${s===size?"bg-[#087443] text-white":"bg-[#edf3ee] text-[#61756a]"}`}>{s} g</span>)}</div><div className="space-y-6"><section><SectionTitle n="1" title={`Ingredientes / separação — ${size} g`}/><div className="overflow-hidden rounded-2xl border border-[#dbe7dd]">{items.length?items.map((item,i)=><div key={item.id||i} className="flex items-center justify-between gap-4 border-b border-[#edf2ee] bg-white px-4 py-3 last:border-0"><div><p className="font-bold">{item.ingrediente_id?ingredientMap.get(item.ingrediente_id)?.nome||"Ingrediente":"Preparação"}</p>{item.preparacao_id&&<p className="text-xs font-semibold text-[#087443]">Preparação utilizada na produção</p>}{item.observacao&&<p className="text-xs text-[#708278]">{item.observacao}</p>}</div><b className="whitespace-nowrap">{grams((item as any)[field])}</b></div>):<p className="bg-white p-4 text-sm text-[#708278]">Os componentes desta ficha estão registrados nas preparações.</p>}</div></section>
<section><SectionTitle n="2" title="Preparações e modo de preparo" icon={<Utensils size={17}/>}/><div className="space-y-3">{selectedPreps.length?selectedPreps.map((prep,i)=><PreparationCard key={prep.id} prep={prep} index={i} json={jsonPreps.find(x=>x.id===prep.id)} prepItems={prepItemMap.get(prep.id)||[]} ingredientMap={ingredientMap}/>):<p className="rounded-2xl border border-dashed border-[#cbd8ce] p-4 text-sm text-[#708278]">Nenhuma preparação vinculada.</p>}</div></section>
<section><SectionTitle n="3" title={`Montagem — ${size} g`}/><div className="grid gap-2 sm:grid-cols-2">{mounts.map((m,i)=><div key={m.id||i} className="flex items-center justify-between gap-3 rounded-2xl border border-[#dbe7dd] bg-white px-4 py-3"><div><p className="font-bold">{m.nome}</p>{m.observacao&&<p className="text-xs text-[#708278]">{m.observacao}</p>}</div><b className="whitespace-nowrap">{num((m as any)[field])?grams((m as any)[field]):"QB"}</b></div>)}</div>{!mounts.length&&<p className="rounded-xl bg-[#f4f7f4] p-4 text-sm text-[#62766b]">Montagem não cadastrada.</p>}</section>
<section className="rounded-2xl border border-[#cfe1d3] bg-[#edf7ef] p-4 text-sm"><b>Regra de produção:</b> as quantidades acima representam uma unidade de {size} g. Para um lote, multiplique pela quantidade planejada.</section></div></div></div></div>;
}

function PreparationCard({prep,index,json,prepItems,ingredientMap}:{prep:PrepRow;index:number;json?:PreparacaoJson;prepItems:PrepItem[];ingredientMap:Map<string,any>}){const steps=String(prep.modo_preparo||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);return <div className="rounded-2xl border border-[#dbe7dd] bg-white p-4"><div className="flex items-center justify-between gap-3"><h5 className="font-black"><span className="mr-2 text-xs text-[#087443]">{String(index+1).padStart(2,"0")}</span>{prep.nome.replace(/ • [A-Z]{2}\d{2}$/i,"")}</h5>{prep.rendimento_final_g&&<span className="rounded-full bg-[#edf7ef] px-2.5 py-1 text-xs font-bold text-[#087443]">Rende {prep.rendimento_final_g} g</span>}</div>{(prepItems.length||(json?.ingredientes||[]).length)>0&&<div className="mt-3 rounded-xl bg-[#f4f8f4] p-3"><p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#6a8074]">Ingredientes da preparação</p>{prepItems.length?<div className="grid gap-2 sm:grid-cols-2">{prepItems.map(x=><div key={x.id} className="flex justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"><span>{ingredientMap.get(x.ingrediente_id)?.nome||"Ingrediente"}</span><b>{x.quantidade_texto||`${num(x.quantidade)} g`}</b></div>)}</div>:<ul className="list-disc space-y-1 pl-5 text-sm">{json?.ingredientes?.map((x,i)=><li key={i}>{x}</li>)}</ul>}</div>}<div className="mt-3"><p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#6a8074]">Modo de preparo</p>{steps.length?<ol className="space-y-2">{steps.map((x,i)=><li key={i} className="flex gap-3 text-sm leading-relaxed"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e3f1e7] text-xs font-black text-[#087443]">{i+1}</span><span>{x.replace(/^•\s*/,"")}</span></li>)}</ol>:<p className="text-sm text-[#708278]">Sem modo de preparo cadastrado.</p>}</div></div>}
function SectionTitle({n,title,icon}:{n:string;title:string;icon?:React.ReactNode}){return <div className="mb-3 flex items-center gap-2 text-[#087443]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e3f1e7] text-xs font-black">{n}</span>{icon||<ClipboardList size={17}/>}<h3 className="text-sm font-black uppercase tracking-wider">{title}</h3></div>}
function groupBy<T>(rows:T[],key:string){const m=new Map<string,T[]>();rows.forEach((row:any)=>{const k=row[key];if(!k)return;m.set(k,[...(m.get(k)||[]),row])});return m}
export default FichasTecnicasPage;

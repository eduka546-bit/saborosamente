import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Barcode, Edit3, Plus, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cozinha/etiquetas")({ component: EtiquetasManager, ssr: false });

type Etiqueta = {
  id: string;
  produto_id: string;
  tamanho_g: 200 | 300 | 400;
  codigo_barras: string;
  nome_exibicao: string | null;
  ingredientes: string | null;
  informacao_nutricional: Record<string, string | number>;
  instrucoes_preparo: string | null;
  conservacao: string | null;
  validade_dias: number | null;
  imagem_url: string | null;
  ativo: boolean;
};
type Produto = { id: string; nome: string; imagem_url?: string | null; imagens?: string[] | null; ingredientes?: string[] | string | null };

const field = "w-full rounded-lg border border-[#cbd8ce] bg-white px-3 py-2 text-sm outline-none focus:border-[#087443]";
const nutritionKeys = [
  ["kcal", "Valor energético (kcal)"], ["carb", "Carboidratos (g)"], ["prot", "Proteínas (g)"],
  ["gorduras", "Gorduras totais (g)"], ["fibra", "Fibra alimentar (g)"], ["sodio", "Sódio (mg)"],
] as const;

export function EtiquetasManager() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [authorized, setAuthorized] = useState(false);
  const [editor, setEditor] = useState<Etiqueta | null>(null);
  const [printing, setPrinting] = useState<Etiqueta | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return navigate({ to: "/cozinha-login" as any, replace: true });
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).in("role", ["admin", "cozinha"]);
      if (!data?.length) return navigate({ to: "/cozinha-login" as any, replace: true });
      setAuthorized(true);
    })();
  }, [navigate]);

  const { data: produtos = [] } = useQuery({
    queryKey: ["etiquetas-produtos"], enabled: authorized,
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("id,nome,imagem_url,imagens,ingredientes").eq("ativo", true).order("nome");
      if (error) throw error;
      return (data || []) as Produto[];
    },
  });
  const { data: etiquetas = [], isLoading } = useQuery({
    queryKey: ["cozinha-etiquetas"], enabled: authorized,
    queryFn: async () => {
      const { data, error } = await supabase.from("cozinha_etiquetas").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Etiqueta[];
    },
  });
  const produtoPorId = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["cozinha-etiquetas"] });

  const novo = (produtoId: string, tamanho: 200 | 300 | 400) => {
    const p = produtoPorId.get(produtoId);
    setEditor({
      id: "", produto_id: produtoId, tamanho_g: tamanho, codigo_barras: "",
      nome_exibicao: p?.nome || "", ingredientes: Array.isArray(p?.ingredientes) ? p.ingredientes.join(", ") : p?.ingredientes || "",
      informacao_nutricional: {}, instrucoes_preparo: "Mantenha congelado. Aquecer antes de consumir.",
      conservacao: "Conservar congelado a -18 °C.", validade_dias: null,
      imagem_url: p?.imagem_url || p?.imagens?.[0] || null, ativo: true,
    });
  };

  if (!authorized) return <div className="grid min-h-screen place-items-center bg-[#f7f6f0]">Verificando acesso…</div>;

  return <main className="min-h-screen bg-[#f7f6f0] p-4 text-[#173a2d] md:p-8">
    <style>{`@media print { body > *:not(#label-print-root) { display:none !important; } #label-print-root { display:block !important; } } #label-print-root { display:none; }`}</style>
    <div id="label-print-root">{printing && <EtiquetaImpressa etiqueta={printing} produto={produtoPorId.get(printing.produto_id)} />}</div>
    <div className="mx-auto max-w-7xl">
      <Link to="/cozinha" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#087443]"><ArrowLeft size={17} />Voltar à cozinha</Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-wide text-[#087443]">Operação da cozinha</p><h1 className="text-3xl font-black">Etiquetas</h1><p className="mt-1 text-sm text-[#62766b]">Modelo unificado de 262 × 55 mm, com código de barras único por produto e tamanho.</p></div>
        <button onClick={() => { const p = produtos[0]; if (p) novo(p.id, 200); }} className="inline-flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-2.5 font-bold text-white"><Plus size={18}/>Nova etiqueta</button>
      </div>

      {isLoading ? <p>Carregando etiquetas…</p> : !etiquetas.length ? <section className="rounded-2xl border border-dashed border-[#b9cebd] bg-white p-8 text-center"><Barcode className="mx-auto mb-3 text-[#087443]" size={34}/><h2 className="font-black">Ainda não há etiquetas cadastradas</h2><p className="mt-2 text-sm text-[#62766b]">Crie a primeira etiqueta e o sistema atribuirá um código de barras EAN-13 exclusivo.</p></section> :
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{etiquetas.map((e) => {
          const p = produtoPorId.get(e.produto_id);
          return <article key={e.id} className="rounded-2xl border border-[#dbe7dd] bg-white p-4 shadow-sm">
            <div className="flex gap-3"><div className="size-16 overflow-hidden rounded-xl bg-[#edf5e6]">{e.imagem_url ? <img src={e.imagem_url} alt="" className="size-full object-cover"/> : null}</div><div className="min-w-0 flex-1"><h2 className="truncate font-black">{e.nome_exibicao || p?.nome}</h2><p className="text-sm text-[#62766b]">{e.tamanho_g} g · EAN-13 {e.codigo_barras}</p><span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${e.ativo ? "bg-[#e0f2e7] text-[#087443]" : "bg-slate-100 text-slate-500"}`}>{e.ativo ? "Ativa" : "Inativa"}</span></div></div>
            <div className="mt-4 flex gap-2"><button onClick={() => setEditor(e)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#bfd0c2] px-3 py-2 text-sm font-bold"><Edit3 size={16}/>Editar</button><button onClick={() => { setPrinting(e); setTimeout(() => window.print(), 50); }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#087443] px-3 py-2 text-sm font-bold text-white"><Printer size={16}/>Imprimir</button></div>
          </article>;
        })}</div>}
    </div>
    {editor && <Editor etiqueta={editor} produtos={produtos} onClose={() => setEditor(null)} onSave={async (value) => {
      const payload = { produto_id: value.produto_id, tamanho_g: value.tamanho_g, nome_exibicao: value.nome_exibicao || null, ingredientes: value.ingredientes || null, informacao_nutricional: value.informacao_nutricional || {}, instrucoes_preparo: value.instrucoes_preparo || null, conservacao: value.conservacao || null, validade_dias: value.validade_dias || null, imagem_url: value.imagem_url || null, ativo: value.ativo };
      const { data, error } = value.id ? await supabase.from("cozinha_etiquetas").update(payload).eq("id", value.id).select().single() : await supabase.from("cozinha_etiquetas").insert(payload).select().single();
      if (error) return toast.error(error.message);
      toast.success(value.id ? "Etiqueta atualizada." : "Etiqueta criada com código de barras único.");
      setEditor(null); await invalidate();
      if (!value.id && data) setPrinting(data as Etiqueta);
    }} />}
  </main>;
}

function Editor({ etiqueta, produtos, onClose, onSave }: { etiqueta: Etiqueta; produtos: Produto[]; onClose: () => void; onSave: (e: Etiqueta) => void }) {
  const [d, setD] = useState(etiqueta);
  const set = (k: keyof Etiqueta, v: any) => setD((x) => ({ ...x, [k]: v }));
  const setNutri = (k: string, v: string) => set("informacao_nutricional", { ...(d.informacao_nutricional || {}), [k]: v });
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-3 md:p-8"><div className="mx-auto max-w-4xl rounded-2xl bg-white p-5 shadow-xl">
    <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">{d.id ? "Editar etiqueta" : "Nova etiqueta"}</h2><p className="text-sm text-[#62766b]">{d.id ? `Código EAN-13: ${d.codigo_barras}` : "O código de barras será gerado ao salvar."}</p></div><button onClick={onClose} className="text-2xl">×</button></div>
    <div className="grid gap-3 md:grid-cols-3"><label className="text-sm font-bold">Produto<select className={field} value={d.produto_id} onChange={(e) => set("produto_id", e.target.value)}>{produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label><label className="text-sm font-bold">Peso<select className={field} value={d.tamanho_g} onChange={(e) => set("tamanho_g", Number(e.target.value) as 200 | 300 | 400)}><option value={200}>200 g</option><option value={300}>300 g</option><option value={400}>400 g</option></select></label><label className="text-sm font-bold">Validade (dias)<input className={field} type="number" min="0" value={d.validade_dias ?? ""} onChange={(e) => set("validade_dias", e.target.value === "" ? null : Number(e.target.value))}/></label></div>
    <div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-sm font-bold">Nome na etiqueta<input className={field} value={d.nome_exibicao || ""} onChange={(e) => set("nome_exibicao", e.target.value)}/></label><label className="text-sm font-bold">Foto (URL)<input className={field} value={d.imagem_url || ""} onChange={(e) => set("imagem_url", e.target.value)}/></label></div>
    <label className="mt-3 block text-sm font-bold">Ingredientes<textarea className={field + " mt-1 min-h-20"} value={d.ingredientes || ""} onChange={(e) => set("ingredientes", e.target.value)}/></label>
    <div className="mt-4 rounded-xl bg-[#f5faf5] p-4"><h3 className="font-black">Informação nutricional por porção</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">{nutritionKeys.map(([key, label]) => <label key={key} className="text-sm font-bold">{label}<input className={field} value={d.informacao_nutricional?.[key] ?? ""} onChange={(e) => setNutri(key, e.target.value)}/></label>)}</div></div>
    <div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-sm font-bold">Instruções de preparo<textarea className={field + " mt-1 min-h-20"} value={d.instrucoes_preparo || ""} onChange={(e) => set("instrucoes_preparo", e.target.value)}/></label><label className="text-sm font-bold">Conservação<textarea className={field + " mt-1 min-h-20"} value={d.conservacao || ""} onChange={(e) => set("conservacao", e.target.value)}/></label></div>
    <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl border px-4 py-2 font-bold">Cancelar</button><button onClick={() => { if (!d.produto_id) return toast.error("Selecione o produto."); onSave(d); }} className="inline-flex items-center gap-2 rounded-xl bg-[#087443] px-4 py-2 font-bold text-white"><Save size={17}/>Salvar etiqueta</button></div>
  </div></div>;
}

function EtiquetaImpressa({ etiqueta, produto }: { etiqueta: Etiqueta; produto?: Produto }) {
  const n = etiqueta.informacao_nutricional || {};
  return <div style={{ width: "262mm", height: "55mm", boxSizing: "border-box", padding: "3mm", display: "grid", gridTemplateColumns: "49mm 1fr 55mm", gap: "3mm", color: "#142b20", fontFamily: "Arial, sans-serif", background: "white" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: "2mm" }}>{etiqueta.imagem_url && <img src={etiqueta.imagem_url} alt="" style={{ width: "100%", height: "32mm", objectFit: "cover", borderRadius: "2mm" }}/>}<strong style={{ fontSize: "10pt" }}>SaborosaMente</strong><small>Porção: {etiqueta.tamanho_g} g</small></div>
    <div style={{ border: "0.6mm solid #b6202a", padding: "2mm", display: "grid", gridTemplateRows: "auto 1fr auto" }}><div><strong style={{ fontSize: "14pt" }}>{etiqueta.nome_exibicao || produto?.nome}</strong><div style={{ fontSize: "7.5pt", marginTop: "1mm" }}>{etiqueta.ingredientes || "Ingredientes a informar."}</div></div><div style={{ alignSelf: "end", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1mm", fontSize: "7.5pt" }}>{nutritionKeys.map(([key,label]) => <div key={key}><b>{n[key] || "—"}</b><br/><span>{label.replace(/ \(.+\)/,"")}</span></div>)}</div><div style={{ borderTop: "0.2mm solid #777", paddingTop: "1mm", fontSize: "7pt" }}><b>Preparo:</b> {etiqueta.instrucoes_preparo || "Conforme orientação."} <b>Conservação:</b> {etiqueta.conservacao || ""}</div></div>
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: "7.5pt" }}><div><b>FAB:</b> ____/____/______<br/><b>VAL:</b> ____/____/______{etiqueta.validade_dias ? <><br/>Validade: {etiqueta.validade_dias} dias</> : null}</div><CodigoEAN value={etiqueta.codigo_barras}/></div>
  </div>;
}

function CodigoEAN({ value }: { value: string }) {
  const L = ["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"];
  const G = ["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"];
  const R = ["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"];
  const parity = ["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"];
  if (!/^\d{13}$/.test(value)) return <div style={{ fontSize: "8pt" }}>Código será gerado ao salvar</div>;
  const bits = "101" + value.slice(1,7).split("").map((d,i) => (parity[Number(value[0])][i] === "L" ? L : G)[Number(d)]).join("") + "01010" + value.slice(7).split("").map((d) => R[Number(d)]).join("") + "101";
  return <svg viewBox="0 0 113 34" style={{ width: "50mm", height: "18mm" }} aria-label={value}>{bits.split("").map((bit,i) => bit === "1" ? <rect key={i} x={i+5} y="0" width="1" height={i < 3 || i > 91 || (i >= 45 && i <= 49) ? "28" : "24"} fill="black"/> : null)}<text x="9" y="33" fontSize="6">{value[0]} {value.slice(1,7)} {value.slice(7)}</text></svg>;
}